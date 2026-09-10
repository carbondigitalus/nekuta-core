---
sidebar_position: 3
---

# Hooks Stores

A hooks store is a function you write the same way you'd write a custom React hook: compose `ref()`/`computed()`/plain functions as normal, sequential code, then return an object with whatever should be public. Nekuta inspects what comes back and classifies each key automatically — there's no `state`/`getters`/`actions` buckets to place things into up front.

## Full example

```ts title="stores/counterStore.ts"
import { defineStore, ref, computed } from '@nekuta/core';

export const useCounterStore = defineStore('counter', () => {
    const count = ref(0);
    const step = ref(1);

    const doubleCount = computed(() => count.value * 2);
    const description = computed(
        () => `count is ${count.value}, doubled is ${doubleCount.value}`
    );

    function increment(by = step.value) {
        count.value += by;
    }

    return { count, step, doubleCount, description, increment };
});
```

The first argument is the `id` (a plain string, not part of an options object); the second is the hooks function.

## How the return value is classified

Nekuta inspects each key the function returns:

| Returned value          | Classified as        |
| ----------------------- | -------------------- |
| `computed()`            | a **getter**         |
| `ref()` or `reactive()` | **state**            |
| a plain function        | an **action**        |
| anything else           | passed through as-is |

There's no need to separate these into different objects the way a [schema store](./schema-stores.md) does — a hooks store's `return { ... }` is a single flat object, and Nekuta sorts out each key's role from its runtime type.

## Private (untracked) local state

Anything the function doesn't return stays a normal local variable, invisible to the rest of the store engine entirely — not part of `$state`, not visited by `$patch()`, not shown to a `$subscribe()` callback or a devtools-style inspector. This is something a schema store's `state` object can't do, since every key in `state()`'s return value is automatically public:

```ts
export const useSearchStore = defineStore('search', () => {
    // Public — becomes state.
    const results = ref<string[]>([]);

    // Private — a plain closure variable, never returned. Useful for
    // implementation details a consumer has no business reading or patching.
    let lastRequestId = 0;

    async function search(query: string) {
        const requestId = ++lastRequestId;
        const response = await fetch(`/api/search?q=${query}`);
        const data = await response.json();

        // Guard against an out-of-order response from a stale request.
        if (requestId === lastRequestId) {
            results.value = data;
        }
    }

    return { results, search };
});
```

## Composing helpers

Because a hooks store's body is just a function, you can factor shared logic out into a plain helper function and call it from more than one store — the same pattern as sharing logic between custom React hooks:

```ts
function useDebouncedRef<T>(initial: T, delay: number) {
    const current = ref(initial);
    let timeout: ReturnType<typeof setTimeout>;

    function set(next: T) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            current.value = next;
        }, delay);
    }

    return { current, set };
}

export const useSearchStore = defineStore('search', () => {
    const query = useDebouncedRef('', 300);
    // `query.current` is itself the ref — returning it directly (not
    // `query.current.value`) keeps it classified as state.
    return { query: query.current, setQuery: query.set };
});
```

A helper like `useDebouncedRef` isn't itself a store — it's just a function returning refs/functions, called from inside a store's hooks function. It's a normal function, not `defineStore()`-wrapped.

## Resetting a hooks store

Calling `$reset()` on a hooks store throws — there's no single `state()` factory for Nekuta to re-run the way there is for a [schema store](./schema-stores.md#resetting-a-schema-store). Write your own action that puts each ref back to its initial value instead:

```ts
export const useCounterStore = defineStore('counter', () => {
    const count = ref(0);

    function reset() {
        count.value = 0;
    }

    return { count, reset };
});
```

If a store has several refs to reset, assigning each one in turn is enough — Nekuta has no automatic microtask batching, so this fires one `$subscribe()` notification per assignment (same as it would for a schema store's individual property writes outside of `$patch()`):

```ts
export const useFormStore = defineStore('form', () => {
    const name = ref('');
    const email = ref('');

    function reset() {
        name.value = '';
        email.value = '';
    }

    return { name, email, reset };
});
```

If you want that as a single notification instead, call the store's own `$patch()` from outside the reset action — its function form receives the store's underlying state object, where each field is a plain (auto-unwrapped) property rather than a `.value`-accessed ref:

```ts
formStore.$patch((state) => {
    state.name = '';
    state.email = '';
});
```
