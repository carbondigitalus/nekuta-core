---
sidebar_position: 3
---

# `useStore()`

```ts
function useStore<S extends StoreGeneric>(
    useStoreDefinition: (nekuta?: Nekuta) => S
): S;
```

The hook for functional components. Takes a store _definition_ (what [`defineStore()`](./define-store.md) returned) and returns the live store, subscribed so the calling component re-renders when it changes.

```tsx
import { useStore } from '@nekuta/core';
import { useCounterStore } from './stores/counterStore';

function Counter() {
    const counter = useStore(useCounterStore);
    return <p>{counter.count}</p>;
}
```

Internally, `useStore()`:

1. Resolves the active [`Nekuta`](./create-nekuta.md) instance via [`useNekuta()`](#usenekuta) (Context, or the module-level singleton fallback).
2. Calls `useStoreDefinition(nekuta)` to get the store.
3. Subscribes to it (via `$subscribe`) and re-renders on any change — see [Reactivity Model](../core-concepts/reactivity-model.md) for the "any change," not fine-grained yet, caveat.

Must be called inside a component wrapped in [`<NekutaProvider>`](./nekuta-provider.md) (or with an active instance set via `setActiveNekuta()`) — otherwise it throws.

## `useNekuta()`

```ts
function useNekuta(): Nekuta;
```

The lower-level hook `useStore()` itself uses to resolve the active instance: a `<NekutaProvider>` above it in the tree first, falling back to the module-level singleton. You generally won't call this directly unless you're building your own store-consuming hook.
