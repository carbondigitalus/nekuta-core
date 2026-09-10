---
sidebar_position: 4
---

# `connectStore()`

```ts
function connectStore<
    C extends ComponentType<any> & { stores: MapStoresToProps }
>(TargetComponent: C): C;
function connectStore<M extends MapStoresToProps, C extends ComponentType<any>>(
    mapStoresToProps: M,
    TargetComponent: C
): C;
```

The class-component equivalent of [`useStore()`](./use-store.md) — see [Class Components](../getting-started/class-components.md) for full usage. Two equivalent call shapes, depending on where the store map lives:

```tsx
// Reads TargetComponent.stores (a `static stores = {...}` on the class).
connectStore(CounterComponent);

// Uses the map passed explicitly instead.
const storeMap = { counter: useCounterStore };
connectStore(storeMap, CounterComponent);
```

Each key in the map becomes a property name mounted at `this.store` on the target component, injected as the resolved store. `connectStore()` sets up exactly one combined subscription across all mapped stores, not one per store. Calling the one-argument form on a class with no `static stores` and no explicit map throws.

Unlike a typical higher-order component, `connectStore()` doesn't wrap `TargetComponent` in anything — it patches its prototype in place (adding a `store` property, wiring `componentDidMount`/`componentDidUpdate`/`componentWillUnmount`) and **returns the same `C` it was given**. `TargetComponent` still extends `React.Component` directly, and no wrapper component is added to the render tree.

## `MapStoresToProps`

```ts
type MapStoresToProps = Record<
    string,
    (nekuta?: NekutaInstance) => StoreGeneric
>;
```

## `MappedStores<M>`

The shape mounted at `this.store` on a component passed through `connectStore()` — since `connectStore()` can't retroactively teach a class's own body what `this.store` looks like (it's a runtime patch, applied after the class is already type-checked), declare it yourself with a `declare` field. Reference the map via `typeof` rather than re-listing its keys, so the actual list of stores exists in exactly one place, however you chose to write it:

```ts
type MappedStores<M extends MapStoresToProps> = {
    [K in keyof M]: ReturnType<M[K]>;
};

// static stores on the class
class CounterComponent extends Component {
    static stores = { counter: useCounterStore };
    declare store: MappedStores<typeof CounterComponent.stores>;
    /* this.store.counter is the resolved store */
}
connectStore(CounterComponent);

// or a free-standing const
const storeMap = { counter: useCounterStore };
class CounterComponent extends Component {
    declare store: MappedStores<typeof storeMap>;
}
connectStore(storeMap, CounterComponent);
```
