---
sidebar_position: 1
---

# `defineStore()`

```ts
function defineStore<Id, S, G, A>(
    options: DefineStoreOptions<Id, S, G, A>
): StoreDefinition<Id, S, G, A>;

function defineStore<Id, SetupReturn>(
    id: Id,
    setup: () => SetupReturn
): StoreDefinition;
```

Declares a store. Two overloads — see [Defining Stores](../core-concepts/defining-stores.md) for the difference in practice.

## Options form

```ts
defineStore({
    id: 'counter',
    state: () => ({ count: 0 }),
    getters: {/* ... */},
    actions: {/* ... */}
});
```

`DefineStoreOptions`:

| Field     | Type                                                               | Required |
| --------- | ------------------------------------------------------------------ | -------- |
| `id`      | `string`                                                           | yes      |
| `state`   | `() => S`                                                          | no       |
| `getters` | `Record<string, (state: S) => unknown>` (or a method using `this`) | no       |
| `actions` | `Record<string, (this: Store, ...args) => unknown>`                | no       |

## Setup form

```ts
defineStore('counter', () => {
    const count = ref(0);
    return { count };
});
```

## Return value — `StoreDefinition`

Either form returns the same shape: a callable function (conventionally named `useXStore`) plus a `$id` property.

```ts
type StoreDefinition<Id, S, G, A> = {
    (nekuta?: NekutaInstance): Store<Id, S, G, A>;
    $id: Id;
};
```

Calling it resolves (creating on first call) the store against a `Nekuta` instance:

- **`useCounterStore(nekuta)`** — explicit instance.
- **`useCounterStore()`** — resolves against the module-level active instance (see [`setActiveNekuta`](./create-nekuta.md#setactivenekuta--getactivenekuta)); throws if there isn't one.

In a React component, you generally don't call it directly at all — pass it to [`useStore()`](./use-store.md) (functional components) or [`connectStore()`](./connect-store.md) (class components) instead, both of which resolve the right instance via Context automatically.

A store is a **singleton per `Nekuta` instance** — the same `defineStore()` result called twice against the same instance returns the identical store object both times.
