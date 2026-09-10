---
sidebar_position: 4
---

# `connectStore()`

```ts
function connectStore<M extends MapStoresToProps, C extends ComponentType<any>>(
    mapStoresToProps: M,
    WrappedComponent: C
): ComponentType<Omit<ComponentProps<C>, keyof M>>;
```

The class-component equivalent of [`useStore()`](./use-store.md) — see [Class Components](../getting-started/class-components.md) for full usage.

```tsx
const Connected = connectStore({ counter: useCounterStore }, CounterComponent);
```

`mapStoresToProps` is a `Record<string, StoreDefinition>` — each key becomes a prop name on the wrapped component, injected as the resolved store. `connectStore()` sets up exactly one combined subscription across all mapped stores, not one per store.

## `MapStoresToProps`

```ts
type MapStoresToProps = Record<
    string,
    (nekuta?: NekutaInstance) => StoreGeneric
>;
```

## `MappedStoreProps<M>`

The prop type a component wrapped by `connectStore({ ...M }, Component)` receives for the mapped stores — useful for typing the class component itself:

```ts
type MappedStoreProps<M extends MapStoresToProps> = {
    [K in keyof M]: ReturnType<M[K]>;
};

class CounterComponent extends Component<
    MappedStoreProps<{ counter: typeof useCounterStore }>
> {
    /* this.props.counter is the resolved store */
}
```
