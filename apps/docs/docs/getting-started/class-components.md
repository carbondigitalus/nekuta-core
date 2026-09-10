---
sidebar_position: 3
---

# Class Components

Pinia doesn't need a separate story for this — Vue's Options API and Composition API are just two ways of writing a component, and Pinia works the same from either. React's split between function and class components is a bigger structural difference, so class-component support gets its own page here.

`useStore()` is a hook, and hooks can't be called inside class components. Instead, Nekuta provides `connectStore()` — it patches your class's own prototype in place, adding a `store` property and wiring up subscription/cleanup, and hands back the exact same class. Your component still `extends React.Component` directly; nothing about its base class changes, and no wrapper component gets added to the tree. Applied once at the bottom of the file, the same way you'd use `react-router`'s `withRouter(Component)`.

## Basic usage

Using the same `useCounterStore` from the [Quick Start](./quick-start.md). There are two equivalent ways to tell `connectStore()` which stores to mount — pick whichever reads better for a given component:

### Option 1: `static stores` on the class

```tsx title="Counter.tsx"
import { Component } from 'react';
import { connectStore, type MappedStores } from '@nekuta/core';
import { useCounterStore } from './stores/counterStore';

class CounterComponent extends Component {
    static stores = { counter: useCounterStore };
    declare store: MappedStores<typeof CounterComponent.stores>;

    render() {
        const { counter } = this.store;
        return (
            <div>
                <p>{counter.count}</p>
                <button onClick={() => counter.increment()}>+1</button>
            </div>
        );
    }
}

export default connectStore(CounterComponent);
```

Everything lives on the class itself — `connectStore(CounterComponent)` reads the map straight off `static stores`. `declare store: MappedStores<typeof CounterComponent.stores>` references that static property by `typeof` rather than re-listing which stores are mapped, so the list exists in exactly one place.

### Option 2: a free-standing `const` above the class

```tsx title="Counter.tsx"
import { Component } from 'react';
import { connectStore, type MappedStores } from '@nekuta/core';
import { useCounterStore } from './stores/counterStore';

const storeMap = { counter: useCounterStore };

class CounterComponent extends Component {
    declare store: MappedStores<typeof storeMap>;

    render() {
        const { counter } = this.store;
        return (
            <div>
                <p>{counter.count}</p>
                <button onClick={() => counter.increment()}>+1</button>
            </div>
        );
    }
}

export default connectStore(storeMap, CounterComponent);
```

Same shape, just with the map named separately instead of living on the class — useful if you'd rather keep the class body free of anything but `render()`/lifecycle methods, or if you're sharing one map across more than one component. `connectStore()` picks between the two forms based on whether it's called with one argument (reads `Component.stores`) or two (uses the map you pass explicitly) — there's no other difference between them, and nothing stops you from using either form per-component, based on preference.

### Why it can't all live in the constructor

It's tempting to want this to be a single line inside the constructor — `this.store = connectStore(this, storeMap)` — since the store accessors aren't hooks and can genuinely be called anywhere, including a constructor. That specific shape doesn't work correctly under Next.js SSR, though, and not as a style tradeoff: resolving the _correct_ `Nekuta` instance when a server has more than one request's render in flight depends on `static contextType` being set on the class **before React ever constructs the first instance of it, for the life of the process** — and a constructor only runs once React has already decided to construct an instance, which is too late. `connectStore()` runs at module-evaluation time, right after the class is declared, well before any instance ever exists — that's what makes it correct from the very first render, under concurrent SSR, with no edge cases, regardless of which of the two forms above you use.

### Why `declare store: ...`

`connectStore()` adds `store` to your class at runtime, by patching its prototype — something TypeScript can't see just from reading the class body. `declare` tells TypeScript "trust me, this field exists" without emitting any actual runtime code for it (it's erased entirely at compile time), so `this.store` type-checks inside `render()`. Leaving it off doesn't break anything at runtime — `this.store` still works — but `render()` won't type-check without it.

## Your own props too

`this.store` and `this.props` are separate — mapping stores doesn't touch your component's own props at all, so there's nothing to combine or subtract:

```tsx
class LabeledCounter extends Component<{ label: string }> {
    static stores = { counter: useCounterStore };
    declare store: MappedStores<typeof LabeledCounter.stores>;

    render() {
        const { label } = this.props;
        const { counter } = this.store;
        return (
            <p>
                {label}: {counter.count}
            </p>
        );
    }
}

export default connectStore(LabeledCounter);

// used as: <LabeledCounter label="Count" />
```

## Multiple stores

Add as many keys to the map as you need — `connectStore()` sets up exactly one combined subscription across all of them, not one per store:

```tsx
class Dashboard extends Component {
    static stores = { counter: useCounterStore, user: useUserStore };
    declare store: MappedStores<typeof Dashboard.stores>;
    render() {
        /* ... */
    }
}

export default connectStore(Dashboard);
```

## Under the hood

`connectStore()` never calls a hook and never wraps your class in another component — everything it needs (resolving the active `Nekuta` instance, tracking which properties your `render()` actually reads, cleaning up on unmount) is done through plain, pre-hooks class-component mechanisms: `static contextType` for Context (set on your class automatically), and `componentDidMount`/`componentDidUpdate`/`componentWillUnmount` for the subscription lifecycle (wrapped, not replaced — if your class defines any of these itself, both your code and Nekuta's run). It's built on the same fine-grained tracking `useStore()` uses (see [Reactivity Model](../core-concepts/reactivity-model.md)): mapping a store your `render()` never actually reads doesn't cause re-renders for that store either.

One real limitation of this approach: a class component can only have one `static contextType`, so if your class already consumes a _different_ Context that way, `connectStore()` will overwrite it (Nekuta warns about this in development) — read that other Context via a `<Context.Consumer>` inside `render()` instead.
