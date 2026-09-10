---
sidebar_position: 3
---

# Migrating from Zustand / Redux

Coming from Zustand or Redux, the biggest mental shift is that Nekuta stores aren't read with a **selector function** — you don't write `useStore((state) => state.count)`. You call the store's own hook and read properties directly off what it returns:

```ts
// Zustand
const count = useCounterStore((state) => state.count);

// Nekuta
const counter = useStore(useCounterStore);
counter.count;
```

This is possible because Nekuta's state is reactive (Proxy-based, tracking reads/writes automatically — see [Reactivity Model](../core-concepts/reactivity-model.md)), not a plain object a selector has to pick apart. The tradeoff today: Nekuta doesn't yet track _which_ properties a given component's render actually used, so — unlike a well-written Zustand selector — `useStore()` re-renders on any change to the store, not just the parts a component reads. If you're migrating a component that relies heavily on narrow selectors for render-performance reasons, that's the one place behavior genuinely differs; see the same Reactivity Model page for status.

## Mutation, not reducers

Redux's whole model is built around pure reducers and immutable updates. Nekuta (like Pinia, like Zustand's own `set()`) is fine with direct mutation:

```ts
// Redux (roughly)
dispatch({ type: 'increment', payload: 1 });
// reducer: (state, action) => ({ ...state, count: state.count + action.payload })

// Nekuta
counter.increment(); // an action that does `this.count++` internally
// or, from anywhere:
counter.count++;
```

There's no dispatch, no action-type strings, no reducer switch statement. An "action" in Nekuta is just a method on the store.

## Getters instead of `reselect`/derived selectors

Where Redux commonly reaches for `reselect` (or a hand-rolled memoized selector) to derive computed values, Nekuta's `getters` do the same job as a first-class part of `defineStore()` — see [Getters](../core-concepts/getters.md).

## Middleware / plugins

Redux middleware and Zustand's `persist`/`devtools` wrappers map roughly onto Nekuta [plugins](../core-concepts/plugins.md) — a function that runs once per store and can extend it. The shape is different (Nekuta plugins extend a store's _object_, not intercept a dispatch pipeline), but the intent — cross-cutting behavior applied to every store without each one opting in — is the same.

## No provider in Zustand, one in Nekuta

Zustand stores are typically module-level singletons with no provider needed. Nekuta stores live on an explicit `Nekuta` instance, and components need a `<NekutaProvider>` above them to find it (see [Quick Start](../getting-started/quick-start.md)) — this is what makes SSR request-isolation possible (see [SSR & Next.js](../ssr/nextjs-pages-router.md)), which a bare module-level singleton can't safely give you on a server handling more than one request.
