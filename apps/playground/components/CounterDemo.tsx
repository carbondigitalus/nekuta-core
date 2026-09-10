'use client';

import { connectStore, useStore, type MappedStores } from '@nekuta/core';
import { Component } from 'react';
import { useCounterStore } from '../stores/counterStore';

function CounterFunctional() {
    const counter = useStore(useCounterStore);

    return (
        <div className="card">
            <h3>Functional component — useStore()</h3>
            <p>
                count:{' '}
                <strong data-testid="functional-count">{counter.count}</strong>{' '}
                · doubleCount: <strong>{counter.doubleCount}</strong>
            </p>
            <div className="buttons">
                <button onClick={() => counter.increment()}>+1</button>
                <button onClick={() => counter.decrement()}>-1</button>
                <button onClick={() => counter.reset()}>reset</button>
            </div>
        </div>
    );
}

const counterStoreMap = { counter: useCounterStore };

class CounterClassComponent extends Component {
    declare store: MappedStores<typeof counterStoreMap>;

    override render() {
        const { counter } = this.store;
        return (
            <div className="card">
                <h3>Class component — connectStore()</h3>
                <p>
                    count:{' '}
                    <strong data-testid="class-count">{counter.count}</strong> ·
                    doubleCount: <strong>{counter.doubleCount}</strong>
                </p>
                <div className="buttons">
                    <button onClick={() => counter.increment(5)}>+5</button>
                    <button onClick={() => counter.decrement(5)}>-5</button>
                </div>
            </div>
        );
    }
}

const ConnectedCounter = connectStore(counterStoreMap, CounterClassComponent);

/** Both bindings share the SAME `counter` store — mutating one updates the other. */
export function CounterDemo() {
    return (
        <section>
            <h2>Counter store</h2>
            <div className="demo-grid">
                <CounterFunctional />
                <ConnectedCounter />
            </div>
        </section>
    );
}
