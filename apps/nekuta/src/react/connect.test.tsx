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
import { NekutaProvider } from './context.js';
import { connectStore, type MappedStoreProps } from './connect.js';

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

class CounterClassComponent extends Component<
    MappedStoreProps<{ counter: typeof useCounterStore }>
> {
    override render() {
        const { counter } = this.props;
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

const ConnectedCounter = connectStore(
    { counter: useCounterStore },
    CounterClassComponent
);

function renderWithNekuta(nekuta: Nekuta, ui: React.ReactElement) {
    return render(<NekutaProvider nekuta={nekuta}>{ui}</NekutaProvider>);
}

describe('connectStore()', () => {
    it('injects the mapped store as a prop on the wrapped class component', () => {
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

    it("passes through the component's own props alongside the injected store", () => {
        class Labeled extends Component<
            { prefix: string } & MappedStoreProps<{
                counter: typeof useCounterStore;
            }>
        > {
            override render() {
                return (
                    <span data-testid="labeled">
                        {this.props.prefix}: {this.props.counter.count}
                    </span>
                );
            }
        }
        const Connected = connectStore({ counter: useCounterStore }, Labeled);

        renderWithNekuta(createNekuta(), <Connected prefix="Count" />);
        expect(screen.getByTestId('labeled')).toHaveTextContent('Count: 0');
    });

    it('supports mapping multiple stores at once', () => {
        class MultiStore extends Component<
            MappedStoreProps<{
                counter: typeof useCounterStore;
                label: typeof useLabelStore;
            }>
        > {
            override render() {
                return (
                    <span data-testid="multi">
                        {this.props.counter.count} {this.props.label.label}
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
        class TrackedOnly extends Component<
            MappedStoreProps<{ multi: typeof useMultiStore }>
        > {
            override render() {
                renderCount++;
                return (
                    <span data-testid="tracked">
                        {this.props.multi.tracked}
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
        // `label` is mapped (injected as a prop) but never read in render() — mutating it should
        // not re-render this component, even though it's one of the mapped stores.
        class CounterOnly extends Component<
            MappedStoreProps<{
                counter: typeof useCounterStore;
                label: typeof useLabelStore;
            }>
        > {
            override render() {
                renderCount++;
                return (
                    <span data-testid="counter-only">
                        {this.props.counter.count}
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
});
