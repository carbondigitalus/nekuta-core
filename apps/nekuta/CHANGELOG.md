# 0.1.0 (2026-09-11)

First public release. `@nekuta/core` is a from-scratch React port of [Pinia](https://pinia.vuejs.org) — Vue's official state management library — aiming for the same API shape (`defineStore()`, state, getters, actions, `$patch`/`$subscribe`/`$onAction`, plugins) adapted to React instead of Vue, not a wrapper around either.

## Reactivity engine

A Proxy-based reactivity system ported from `@vue/reactivity`, built from scratch with no runtime dependency on Vue:

- **`reactive()`** — deep, lazy Proxy wrapping for plain objects, arrays, `Map`, and `Set`. Nested objects are wrapped on read, not eagerly; `Map`/`Set` support full reactivity including `forEach()`, iteration, and size tracking; arrays track both index mutation and `length`, without the infinite-loop trap naive implementations hit when `push()` reads and writes `length` internally.
- **`ref()`** — a boxed reactive primitive. Refs stored as properties on a `reactive()` object auto-unwrap on read/write (matching Vue's own behavior), with one documented exception: a ref stored as an array _element_ is not auto-unwrapped.
- **`computed()`** — lazy and memoized, recomputing only when a tracked dependency actually changes, with a dirty-flag chain that propagates correctly through a chain of computeds. Supports both the getter-only shorthand and a writable `{ get, set }` form.
- **`effect()`** — the underlying reactive-effect runner, with scheduler support for adapting it to different execution contexts (used internally to drive both the store engine's watchers and the React bindings' fine-grained tracking).
- **`effectScope()`** — groups effects for bulk disposal, with nested-scope cascading, detached scopes, and `onScopeDispose()` — no direct React equivalent, needed one-to-one per store so `$dispose()` can cleanly stop every internal watcher a store owns.
- `markRaw()`, `toRaw()`, `isReactive()`, `isRef()`, `unref()`, `toRef()`, `toRefs()`.

## Store engine

- **`defineStore()`** — two equivalent, fully interchangeable authoring styles converging on one underlying engine:
    - **Schema stores** — an object literal: `defineStore({ id, state, getters, actions })`, mirroring Pinia's Options-style stores.
    - **Hooks stores** — a function you write like a custom React hook: `defineStore(id, () => { ...; return {...}; })`, composing `ref()`/`computed()`/plain functions and returning whatever should be public. Nekuta classifies each returned key automatically (`computed()` → getter, `ref()`/`reactive()` → state, function → action).
- **`$patch()`** — object-merge and mutator-function forms, batched into exactly one `$subscribe()` notification per call regardless of how many fields change.
- **`$subscribe()`** / **`$onAction()`** — the same event-bus shape Pinia's own DevTools consume, including `$onAction`'s `after()`/`onError()` hooks for both sync and async actions.
- **`$reset()`** — works for schema stores (re-runs `state()`); throws for hooks stores, which have no single `state()` factory to re-run — write your own reset action instead.
- **`$dispose()`** — stops the store's internal reactivity and removes it from the instance registry.
- **`storeToRefs()`** — ref/computed wrappers for state and getters, skipping actions and `$`-prefixed methods.
- **Plugins** — `nekuta.use(plugin)`, receiving `{ store, nekuta, options }`.
- **`createNekuta()`** / **`disposeNekuta()`** — root instance management.
- **`setActiveNekuta()`** / **`getActiveNekuta()`** — a module-level singleton fallback for resolving a store outside of React (tests, plugin code, non-component code); the React bindings check Context first and only fall back to this.

## React bindings (React 19)

- **`<NekutaStore>`** — the root component for a Nekuta-powered app, whether client-only or SSR. Omit the `nekuta` prop and it creates and owns an instance itself (with optional `plugins`); pass an existing instance and it uses that instead — this is how `@nekuta/next` wires up its own per-request SSR instance underneath.
- **`useStore()`** — the functional-component hook, built on `useSyncExternalStore` for tearing-safety, with **fine-grained tracking**: a component only re-renders for the exact — even deeply nested — properties it actually read on its last render, matching Pinia's DX exactly rather than the more common manual-selector approach other React state libraries use.
- **`connectStore()`** — full class-component support, and not via a wrapper component: it patches the target class's own prototype in place (adding a `store` property, wiring `componentDidMount`/`componentDidUpdate`/`componentWillUnmount`) and returns the exact same class. `extends React.Component` stays untouched, and no extra component is added to the render tree. Two equivalent ways to tell it which stores to mount, mix and match per component:
    ```tsx
    // static stores on the class
    class Counter extends Component {
        static stores = { counter: useCounterStore };
        declare store: MappedStores<typeof Counter.stores>;
    }
    connectStore(Counter);

    // a free-standing const
    const storeMap = { counter: useCounterStore };
    class Counter extends Component {
        declare store: MappedStores<typeof storeMap>;
    }
    connectStore(storeMap, Counter);
    ```
    Built on the same fine-grained tracking as `useStore()` — mapping a store a class's `render()` never reads doesn't cause re-renders for that store either.
- **`useNekuta()`** — the lower-level hook both bindings use to resolve the active instance (Context first, singleton fallback).

## SSR primitives

- **`serializeNekutaState()`** / **`deserializeNekutaState()`** / **`hydrateNekutaState()`** — dehydration/rehydration across a server → client boundary, encoding nested `Map`/`Set` state so it round-trips correctly.
- **`skipHydrate()`** / **`shouldHydrate()`** — mark non-JSON-safe state so it's excluded from the serialization payload instead of breaking it.

These are consumed directly by `@nekuta/next`, but are framework-router-agnostic — usable for any SSR setup, not just Next.js.

## Notes

- Full TypeScript support, published as `NodeNext`-resolvable ESM (explicit `.js` extensions throughout, verified against plain `node --experimental-*`-free ESM execution, not just bundler-mediated consumption).
- A `size` script enforces a 20KB gzip budget on the built output, checked as its own step after `build`.
- No DevTools browser extension yet — Vue DevTools' Pinia integration doesn't have a React equivalent; planned as a separate project. The `$subscribe`/`$onAction` event bus this release ships is the same stable surface such an extension would attach to.
