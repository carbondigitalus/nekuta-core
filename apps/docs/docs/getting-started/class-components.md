---
sidebar_position: 3
---

# Class Components

Pinia doesn't need a separate story for this — Vue's Options API and Composition API are just two ways of writing a component, and Pinia works the same from either. React's split between function and class components is a bigger structural difference, so class-component support gets its own page here.

`useStore()` is a hook, and hooks can't be called inside class components. Instead, Nekuta provides `connectStore()` — a higher-order component that injects one or more stores as props, in the same spirit as `react-redux`'s `connect()`.

## Basic usage

Using the same `useCounterStore` from the [Quick Start](./quick-start.md):

```tsx title="Counter.tsx"
import { Component } from 'react';
import { connectStore, type MappedStoreProps } from '@nekuta/core';
import { useCounterStore } from './stores/counterStore';

type Props = MappedStoreProps<{ counter: typeof useCounterStore }>;

class CounterComponent extends Component<Props> {
    render() {
        const { counter } = this.props;
        return (
            <div>
                <p>{counter.count}</p>
                <button onClick={() => counter.increment()}>+1</button>
            </div>
        );
    }
}

export const Counter = connectStore(
    { counter: useCounterStore },
    CounterComponent
);
```

`connectStore()` takes a map of prop-name → store-definition, and the wrapped component (`CounterComponent`) never has to know it's connected to anything — it just receives `counter` as a normal prop, fully reactive, re-rendering the same way `useStore()`-based components do.

## Your own props too

`MappedStoreProps<M>` describes only the _injected_ props. If your component also takes its own props, combine them in the class's own prop type — `connectStore()` infers the rest and passes everything through:

```tsx
class LabeledCounter extends Component<{ label: string } & Props> {
    render() {
        const { label, counter } = this.props;
        return (
            <p>
                {label}: {counter.count}
            </p>
        );
    }
}

const ConnectedLabeledCounter = connectStore(
    { counter: useCounterStore },
    LabeledCounter
);

// used as: <ConnectedLabeledCounter label="Count" />
```

## Multiple stores

Map as many stores as you need — `connectStore()` sets up exactly one combined subscription across all of them, not one per store:

```tsx
const Dashboard = connectStore(
    { counter: useCounterStore, user: useUserStore },
    DashboardComponent
);
```

## Under the hood

`connectStore()` is itself a _function_ component internally — it uses hooks, resolves the mapped stores, and passes the results down as props. Your class component never touches a hook directly; it just receives props like any other. This is why it works inside a class component at all — and it's built on the same fine-grained tracking `useStore()` uses (see [Reactivity Model](../core-concepts/reactivity-model.md)): mapping a store as a prop your `render()` never actually reads doesn't cause re-renders for that store either.
