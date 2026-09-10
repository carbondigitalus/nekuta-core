---
sidebar_position: 2
---

# Schema Stores

A schema store is an object literal with `state`, `getters`, and `actions` fields — Nekuta reads it as a declared shape (a "schema") for the store, rather than code you write imperatively. It's the style used throughout the [Quick Start](../getting-started/quick-start.md), and generally the best default: it reads declaratively, and every field's role is obvious from which bucket it's in.

## Full example

```ts title="stores/counterStore.ts"
import { defineStore } from '@nekuta/core';

interface CounterState {
    count: number;
    step: number;
}

export const useCounterStore = defineStore({
    id: 'counter',
    state: (): CounterState => ({
        count: 0,
        step: 1
    }),
    getters: {
        doubleCount: (state) => state.count * 2,
        // A getter that reads ANOTHER getter needs `this`, so it can't be
        // written as a `(state) => ...` arrow function — see below.
        description(): string {
            return `count is ${this.count}, doubled is ${this.doubleCount}`;
        }
    },
    actions: {
        increment(this: CounterState, by = this.step) {
            this.count += by;
        }
    }
});
```

## `id`

Required, and must be unique across a given `Nekuta` instance — it's the key Nekuta uses to store this store's state on the instance (`nekuta.state.value[id]`).

## `state`

A factory function, called once when the store is first created **on a given `Nekuta` instance**. Because it's a factory rather than a plain object, each instance gets its own fresh copy — never share a state object between calls or between stores:

```ts
// Wrong — every instance of this store shares the same array.
state: () => ({ items: sharedArray });

// Right — a fresh array per instance.
state: () => ({ items: [] });
```

## `getters`

Each getter can be written two ways:

- **`(state) => ...`** — the plain-object form. `state` is passed directly, so no `this` typing is needed. Use this when a getter only needs the store's own state.
- **A regular method** — needed as soon as a getter has to read another getter (or call an action) through `this`. Arrow functions don't have their own `this`, so `doubleCount: () => this.count * 2` would not work here — write it as `doubleCount() { return this.count * 2; }` instead.

```ts
getters: {
    // Only needs state — arrow form is fine.
    doubleCount: (state) => state.count * 2,

    // Needs another getter — must be a method, not an arrow function.
    quadrupleCount(): number {
        return this.doubleCount * 2;
    }
}
```

See [Getters](./getters.md) for more on caching and cross-store getters.

## `actions`

Plain methods with `this` bound to the full store — state, getters, other actions, and the `$patch`/`$subscribe`/etc. store methods are all reachable through it. TypeScript needs an explicit `this` type on an action that reads state through `this` (as `increment` does above) to type-check that access.

Actions can be async; `$onAction()`'s `after`/`onError` hooks work the same as Pinia's — see [Actions](./actions.md).

## Resetting a schema store

Schema stores get [`$reset()`](../api/store-instance.md) for free — it re-runs `state()` and applies the result as a patch:

```ts
counter.$reset(); // count and step are back to state()'s fresh output
```

This only works because there's a single `state()` factory to re-run. A [hooks store](./hooks-stores.md#resetting-a-hooks-store) has no equivalent — calling `$reset()` on one throws.

## Under the hood

A schema store isn't a separate code path from a hooks store — `defineStore()` converts the options object into the same shape a hooks store's function would return (state fields become refs via `toRefs()`, each getter becomes a `computed()`, each action is passed through as-is) and hands that to the same internal store-construction function. See [Reactivity Model](./reactivity-model.md) if you want the full mechanics.
