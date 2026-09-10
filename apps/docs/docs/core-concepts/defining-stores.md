---
sidebar_position: 1
---

# Defining Stores

`defineStore()` supports two styles — the same two Pinia offers. Both converge on the same underlying engine, so there's no functional difference between them; pick whichever reads better for a given store.

## Options stores

The style used throughout the [Quick Start](../getting-started/quick-start.md): an object with `state`, `getters`, and `actions`.

```ts
export const useCounterStore = defineStore({
    id: 'counter',
    state: () => ({ count: 0 }),
    getters: {
        doubleCount: (state) => state.count * 2
    },
    actions: {
        increment(this: { count: number }, by = 1) {
            this.count += by;
        }
    }
});
```

- `id` is required and must be unique per `Nekuta` instance.
- `state` is a factory function, called once when the store is first created on a given instance — never share a state object between calls or between stores.
- Inside `getters` and `actions`, `this` is the full store — state, other getters, and other actions are all reachable through it. TypeScript needs an explicit `this` type on actions (as above) to type-check that access; getters written as `(state) => ...` don't need one since `state` is passed directly, but a getter that needs `this` (to call another getter) should be written as a regular method instead of an arrow function — see [Getters](./getters.md).

## Setup stores

The style Pinia's `<script setup>` stores use: a function that builds and returns refs, computed values, and plain functions.

```ts
import { ref, computed } from 'nekuta';
import { defineStore } from 'nekuta';

export const useCounterStore = defineStore('counter', () => {
    const count = ref(0);
    const doubleCount = computed(() => count.value * 2);

    function increment(by = 1) {
        count.value += by;
    }

    return { count, doubleCount, increment };
});
```

The first argument is the `id` (a plain string this time, not part of an options object); the second is the setup function. Nekuta inspects what the function returns and classifies each key automatically:

- a `computed()` value → a **getter**
- a `ref()` or `reactive()` value → **state**
- a plain function → an **action**
- anything else → passed through as-is

This style is more verbose for a simple store like this one, but it's useful when a store's internal logic genuinely benefits from being written as normal, sequential code rather than three separate option buckets — private helper refs that never get returned, `watch`-like composition, etc.

## Using a store

Either style produces the same thing: a store _definition_ — a plain function, conventionally named `useXStore`, that resolves (creating it on first call) the actual store instance against a `Nekuta` instance.

- In a functional component: `useStore(useCounterStore)` — see [Quick Start](../getting-started/quick-start.md).
- In a class component: `connectStore({ counter: useCounterStore }, MyComponent)` — see [Class Components](../getting-started/class-components.md).
- Outside React entirely (tests, plugin code, SSR data-fetching): call it directly, either with an explicit instance (`useCounterStore(nekuta)`) or with none, in which case it resolves against whichever instance is currently active — see [`setActiveNekuta`](../api/create-nekuta.md#setactivenekuta--getactivenekuta).

A store is a **singleton per `Nekuta` instance** — calling `useCounterStore(nekuta)` twice against the same instance returns the exact same store object both times.
