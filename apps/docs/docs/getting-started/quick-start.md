---
sidebar_position: 2
---

# Quick Start

This page builds a counter store and reads it from a functional component. For class components, see [Class Components](./class-components.md).

## 1. Create a Nekuta instance and provide it

Every store lives on a `Nekuta` instance — the equivalent of a Pinia instance. Create one near the root of your app and make it available via `<NekutaProvider>`:

```tsx title="App.tsx"
import { createNekuta, NekutaProvider } from '@nekuta/core';

const nekuta = createNekuta();

export function App() {
    return (
        <NekutaProvider nekuta={nekuta}>
            <Counter />
        </NekutaProvider>
    );
}
```

## 2. Define a store

```ts title="stores/counterStore.ts"
import { defineStore } from '@nekuta/core';

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

`id` must be unique across your app — it's the key Nekuta uses to store this store's state on the `Nekuta` instance. `state` is a factory function (called once per `Nekuta` instance) so each instance gets its own fresh copy, never a shared reference.

## 3. Read and write it from a component

```tsx title="Counter.tsx"
import { useStore } from '@nekuta/core';
import { useCounterStore } from './stores/counterStore';

export function Counter() {
    const counter = useStore(useCounterStore);

    return (
        <div>
            <p>
                {counter.count} (double: {counter.doubleCount})
            </p>
            <button onClick={() => counter.increment()}>+1</button>
        </div>
    );
}
```

`useStore()` is the hook — it takes the store _definition_ (`useCounterStore`, what `defineStore()` returned) and gives you back the live store, subscribed for re-renders. State, getters, and actions are all accessed directly off the object it returns: `counter.count`, `counter.doubleCount`, `counter.increment()`.

Mutating state directly also works, the same as Pinia:

```tsx
<button onClick={() => counter.count++}>+1 (direct mutation)</button>
```

## Next steps

- [Class Components](./class-components.md) — the same store, read via `connectStore()` instead.
- [Defining Stores](../core-concepts/defining-stores.md) — the setup-style alternative to the options object above.
- [State](../core-concepts/state.md), [Getters](../core-concepts/getters.md), [Actions](../core-concepts/actions.md) — one page each on the three pieces used above.
