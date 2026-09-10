---
sidebar_position: 1
---

# Defining Stores

`defineStore()` supports two styles — the same two Pinia offers, named here without Vue's own vocabulary:

- **[Schema stores](./schema-stores.md)** — an object literal with `state`, `getters`, and `actions` fields. The style used throughout the [Quick Start](../getting-started/quick-start.md).
- **[Hooks stores](./hooks-stores.md)** — a function you write like a custom React hook: compose `ref()`/`computed()`/plain functions, then return whatever should be public.

Both converge on the same underlying engine (a schema store is built by converting its options into the same shape a hooks store returns — see [Reactivity Model](./reactivity-model.md)), so there's no functional difference between them beyond what's called out on each page below. Pick whichever reads better for a given store, or see [Enforcing a Store Style](../cookbook/enforcing-a-store-style.md) if you'd rather every store in a project agree on one.

## At a glance

| &nbsp;                          | Schema store                                               | Hooks store                                                            |
| ------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| Shape                           | `defineStore({ id, state, getters, actions })`             | `defineStore(id, () => {...})`                                         |
| State                           | `state` factory function                                   | `ref()`/`reactive()` values you return                                 |
| Getters                         | `getters` object, `(state) => ...` or method with `this`   | `computed()` values you return                                         |
| Actions                         | `actions` object, methods with `this`                      | plain functions you return                                             |
| Private (untracked) local state | not possible — every `state` key is public                 | a `ref()`/local variable you don't return stays fully private          |
| `$reset()`                      | works — re-runs `state()`                                  | throws — see [Hooks Stores](./hooks-stores.md#resetting-a-hooks-store) |
| Best fit                        | most stores — reads declaratively, matches the Quick Start | a store whose setup logic is easier to write as sequential code        |

## Using a store

Either style produces the same thing: a store _definition_ — a plain function, conventionally named `useXStore`, that resolves (creating it on first call) the actual store instance against a `Nekuta` instance.

- In a functional component: `useStore(useCounterStore)` — see [Quick Start](../getting-started/quick-start.md).
- In a class component: `connectStore({ counter: useCounterStore }, MyComponent)` — see [Class Components](../getting-started/class-components.md).
- Outside React entirely (tests, plugin code, SSR data-fetching): call it directly, either with an explicit instance (`useCounterStore(nekuta)`) or with none, in which case it resolves against whichever instance is currently active — see [`setActiveNekuta`](../api/create-nekuta.md#setactivenekuta--getactivenekuta).

A store is a **singleton per `Nekuta` instance** — calling `useCounterStore(nekuta)` twice against the same instance returns the exact same store object both times.
