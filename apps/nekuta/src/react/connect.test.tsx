/**
 * @jest-environment jsdom
 */
import { Component } from 'react';
import { act, render, screen } from '@testing-library/react';
import {
    createNekuta,
    defineStore,
    type Nekuta,
    type Store
} from '../store/index.js';
import { NekutaContext } from './context.js';
import { NekutaStore } from './NekutaStore.js';
import { connectStore, type MappedStores } from './connect.js';

const useCounterStore = defineStore({
    id: 'counter',
    state: () => ({ count: 0 }),
    actions: {
        increment(this: { count: number }) {
            this.count++;
        }
    }
});

const useLabelStore = defineStore({
    id: 'label',
    state: () => ({ label: 'items' })
});

type CounterStore = Store<
    'counter',
    { count: number },
    Record<string, never>,
    { increment(): void }
>;

const counterStoreMap = { counter: useCounterStore };

class CounterClassComponent extends Component {
    declare store: MappedStores<typeof counterStoreMap>;

    override render() {
        const { counter } = this.store;
        return (
            <div>
                <span data-testid="count">{counter.count}</span>
                <button onClick={() => (counter as CounterStore).increment()}>
                    increment
                </button>
            </div>
        );
    }
}

const ConnectedCounter = connectStore(counterStoreMap, CounterClassComponent);

function renderWithNekuta(nekuta: Nekuta, ui: React.ReactElement) {
    return render(<NekutaStore nekuta={nekuta}>{ui}</NekutaStore>);
}

describe('connectStore()', () => {
    it('mounts the mapped store on this.store, keeping the same class reference', () => {
        expect(ConnectedCounter).toBe(CounterClassComponent);
        renderWithNekuta(createNekuta(), <ConnectedCounter />);
        expect(screen.getByTestId('count')).toHaveTextContent('0');
    });

    it('re-renders the class component when the store mutates', () => {
        renderWithNekuta(createNekuta(), <ConnectedCounter />);

        act(() => {
            screen.getByText('increment').click();
        });

        expect(screen.getByTestId('count')).toHaveTextContent('1');
    });

    it("leaves the component's own props alone — they stay on this.props, separate from this.store", () => {
        class Labeled extends Component<{ prefix: string }> {
            declare store: MappedStores<{ counter: typeof useCounterStore }>;

            override render() {
                return (
                    <span data-testid="labeled">
                        {this.props.prefix}: {this.store.counter.count}
                    </span>
                );
            }
        }
        const Connected = connectStore({ counter: useCounterStore }, Labeled);

        renderWithNekuta(createNekuta(), <Connected prefix="Count" />);
        expect(screen.getByTestId('labeled')).toHaveTextContent('Count: 0');
    });

    it('supports mapping multiple stores at once', () => {
        class MultiStore extends Component {
            declare store: MappedStores<{
                counter: typeof useCounterStore;
                label: typeof useLabelStore;
            }>;

            override render() {
                return (
                    <span data-testid="multi">
                        {this.store.counter.count} {this.store.label.label}
                    </span>
                );
            }
        }
        const Connected = connectStore(
            { counter: useCounterStore, label: useLabelStore },
            MultiStore
        );

        const nekuta = createNekuta();
        renderWithNekuta(nekuta, <Connected />);

        expect(screen.getByTestId('multi')).toHaveTextContent('0 items');

        act(() => {
            useLabelStore(nekuta).label = 'things';
        });

        expect(screen.getByTestId('multi')).toHaveTextContent('0 things');
    });

    it('only re-renders for properties actually read — an unrelated property on the same store does not', () => {
        const useMultiStore = defineStore({
            id: 'multiProp',
            state: () => ({ tracked: 0, untracked: 0 })
        });

        let renderCount = 0;
        class TrackedOnly extends Component {
            declare store: MappedStores<{ multi: typeof useMultiStore }>;

            override render() {
                renderCount++;
                return (
                    <span data-testid="tracked">
                        {this.store.multi.tracked}
                    </span>
                );
            }
        }
        const Connected = connectStore({ multi: useMultiStore }, TrackedOnly);

        const nekuta = createNekuta();
        renderWithNekuta(nekuta, <Connected />);
        expect(renderCount).toBe(1);

        act(() => {
            useMultiStore(nekuta).untracked++;
        });
        expect(renderCount).toBe(1);

        act(() => {
            useMultiStore(nekuta).tracked++;
        });
        expect(renderCount).toBe(2);
        expect(screen.getByTestId('tracked')).toHaveTextContent('1');
    });

    it('mapping a store does not force a re-render if render() never actually reads it', () => {
        let renderCount = 0;
        // `label` is mapped (available on this.store) but never read in render() — mutating it
        // should not re-render this component, even though it's one of the mapped stores.
        class CounterOnly extends Component {
            declare store: MappedStores<{
                counter: typeof useCounterStore;
                label: typeof useLabelStore;
            }>;

            override render() {
                renderCount++;
                return (
                    <span data-testid="counter-only">
                        {this.store.counter.count}
                    </span>
                );
            }
        }
        const Connected = connectStore(
            { counter: useCounterStore, label: useLabelStore },
            CounterOnly
        );

        const nekuta = createNekuta();
        renderWithNekuta(nekuta, <Connected />);
        expect(renderCount).toBe(1);

        act(() => {
            useLabelStore(nekuta).label = 'things';
        });
        expect(renderCount).toBe(1);

        act(() => {
            useCounterStore(nekuta).count++;
        });
        expect(renderCount).toBe(2);
    });

    it('stops its tracking effect on unmount, so a later mutation no longer re-renders it', () => {
        let renderCount = 0;
        class Counter extends Component {
            declare store: MappedStores<{ counter: typeof useCounterStore }>;

            override render() {
                renderCount++;
                return <span>{this.store.counter.count}</span>;
            }
        }
        const Connected = connectStore({ counter: useCounterStore }, Counter);

        const nekuta = createNekuta();
        const { unmount } = renderWithNekuta(nekuta, <Connected />);
        expect(renderCount).toBe(1);

        unmount();

        act(() => {
            useCounterStore(nekuta).count++;
        });
        expect(renderCount).toBe(1);
    });

    it('still calls a user-defined componentWillUnmount', () => {
        const onUnmount = jest.fn();
        class Counter extends Component {
            declare store: MappedStores<{ counter: typeof useCounterStore }>;

            override componentWillUnmount() {
                onUnmount();
            }

            override render() {
                return <span>{this.store.counter.count}</span>;
            }
        }
        const Connected = connectStore({ counter: useCounterStore }, Counter);

        const { unmount } = renderWithNekuta(createNekuta(), <Connected />);
        unmount();

        expect(onUnmount).toHaveBeenCalledTimes(1);
    });

    it('sets contextType at call time, before any instance is ever constructed — required for correct per-request resolution under concurrent SSR', () => {
        class Counter extends Component {
            declare store: MappedStores<{ counter: typeof useCounterStore }>;
            override render() {
                return <span>{this.store.counter.count}</span>;
            }
        }

        expect(
            (Counter as unknown as { contextType?: unknown }).contextType
        ).toBeUndefined();

        const Connected = connectStore({ counter: useCounterStore }, Counter);

        // Set synchronously by connectStore() itself — not deferred to construction or render —
        // so React resolves it correctly even for the very first instance ever mounted.
        expect(
            (Connected as unknown as { contextType?: unknown }).contextType
        ).toBe(NekutaContext);
    });

    describe('connectStore(Component) — reading a `static stores` on the class', () => {
        it('mounts the store declared as a static on the class', () => {
            class StaticCounter extends Component {
                static stores = { counter: useCounterStore };
                declare store: MappedStores<typeof StaticCounter.stores>;

                override render() {
                    return (
                        <span data-testid="static-count">
                            {this.store.counter.count}
                        </span>
                    );
                }
            }
            const Connected = connectStore(StaticCounter);

            expect(Connected).toBe(StaticCounter);
            renderWithNekuta(createNekuta(), <Connected />);
            expect(screen.getByTestId('static-count')).toHaveTextContent('0');
        });

        it('re-renders on mutation and tracks per-property, same as the explicit-map form', () => {
            let renderCount = 0;
            class StaticCounter extends Component {
                static stores = {
                    counter: useCounterStore,
                    label: useLabelStore
                };
                declare store: MappedStores<typeof StaticCounter.stores>;

                override render() {
                    renderCount++;
                    return (
                        <span data-testid="static-tracked">
                            {this.store.counter.count}
                        </span>
                    );
                }
            }
            const Connected = connectStore(StaticCounter);

            const nekuta = createNekuta();
            renderWithNekuta(nekuta, <Connected />);
            expect(renderCount).toBe(1);

            act(() => {
                useLabelStore(nekuta).label = 'things';
            });
            expect(renderCount).toBe(1);

            act(() => {
                useCounterStore(nekuta).count++;
            });
            expect(renderCount).toBe(2);
            expect(screen.getByTestId('static-tracked')).toHaveTextContent('1');
        });

        it('throws when called with no static stores and no explicit map', () => {
            class Bare extends Component {
                override render() {
                    return null;
                }
            }

            expect(() => connectStore(Bare as never)).toThrow(
                /no store map and no "static stores"/
            );
        });
    });
});
