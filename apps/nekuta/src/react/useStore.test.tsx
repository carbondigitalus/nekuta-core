/**
 * @jest-environment jsdom
 */
import { act, render, screen } from '@testing-library/react';
import { createNekuta, defineStore, type Nekuta } from '../store/index.js';
import { ReactiveEffect } from '../reactivity/index.js';
import { NekutaStore } from './NekutaStore.js';
import { useStore } from './useStore.js';

const useCounterStore = defineStore({
    id: 'counter',
    state: () => ({ count: 0 }),
    actions: {
        increment(this: { count: number }) {
            this.count++;
        }
    }
});

function Counter() {
    const store = useStore(useCounterStore);
    return (
        <div>
            <span data-testid="count">{store.count}</span>
            <button onClick={() => store.increment()}>increment</button>
        </div>
    );
}

function renderWithNekuta(nekuta: Nekuta, ui: React.ReactElement) {
    return render(<NekutaStore nekuta={nekuta}>{ui}</NekutaStore>);
}

describe('useStore()', () => {
    it('renders the initial store state', () => {
        renderWithNekuta(createNekuta(), <Counter />);
        expect(screen.getByTestId('count')).toHaveTextContent('0');
    });

    it('re-renders when the store mutates via an action', () => {
        renderWithNekuta(createNekuta(), <Counter />);

        act(() => {
            screen.getByText('increment').click();
        });

        expect(screen.getByTestId('count')).toHaveTextContent('1');
    });

    it('re-renders when the store mutates from OUTSIDE the component', () => {
        const nekuta = createNekuta();
        renderWithNekuta(nekuta, <Counter />);

        act(() => {
            useCounterStore(nekuta).count = 42;
        });

        expect(screen.getByTestId('count')).toHaveTextContent('42');
    });

    it('two components under the same NekutaStore share and both reflect store state', () => {
        const nekuta = createNekuta();
        render(
            <NekutaStore nekuta={nekuta}>
                <Counter />
                <Counter />
            </NekutaStore>
        );

        act(() => {
            screen.getAllByText('increment')[0].click();
        });

        const counts = screen.getAllByTestId('count');
        expect(counts[0]).toHaveTextContent('1');
        expect(counts[1]).toHaveTextContent('1');
    });

    it('two separate Nekuta instances stay independent', () => {
        const nekutaA = createNekuta();
        const nekutaB = createNekuta();

        const { container: containerA } = renderWithNekuta(
            nekutaA,
            <Counter />
        );
        const { container: containerB } = renderWithNekuta(
            nekutaB,
            <Counter />
        );

        act(() => {
            (containerA.querySelector('button') as HTMLButtonElement).click();
        });

        expect(
            containerA.querySelector('[data-testid="count"]')
        ).toHaveTextContent('1');
        expect(
            containerB.querySelector('[data-testid="count"]')
        ).toHaveTextContent('0');
    });

    it('stops its tracking effect on unmount, so a later mutation no longer notifies it', () => {
        const nekuta = createNekuta();
        const stopSpy = jest.spyOn(ReactiveEffect.prototype, 'stop');

        const { unmount } = renderWithNekuta(nekuta, <Counter />);
        expect(stopSpy).not.toHaveBeenCalled();

        unmount();
        expect(stopSpy).toHaveBeenCalledTimes(1);

        stopSpy.mockRestore();

        // A mutation after unmount must not throw, even though nothing is listening anymore.
        expect(() => {
            act(() => {
                useCounterStore(nekuta).count++;
            });
        }).not.toThrow();
    });

    it('only re-renders for properties actually read — an unrelated property change does not', () => {
        const useMultiStore = defineStore({
            id: 'multi',
            state: () => ({ tracked: 0, untracked: 0 })
        });

        let renderCount = 0;
        function TrackedOnly() {
            renderCount++;
            const store = useStore(useMultiStore);
            return <span data-testid="tracked">{store.tracked}</span>;
        }

        const nekuta = createNekuta();
        renderWithNekuta(nekuta, <TrackedOnly />);
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

    it('tracks NESTED property reads too, not just top-level ones', () => {
        const useNestedStore = defineStore({
            id: 'nested',
            state: () => ({ user: { name: 'Ada', other: 0 } })
        });

        let renderCount = 0;
        function NameOnly() {
            renderCount++;
            const store = useStore(useNestedStore);
            return <span data-testid="name">{store.user.name}</span>;
        }

        const nekuta = createNekuta();
        renderWithNekuta(nekuta, <NameOnly />);
        expect(renderCount).toBe(1);

        // A sibling property on the SAME nested object, never read — must not re-render.
        act(() => {
            useNestedStore(nekuta).user.other++;
        });
        expect(renderCount).toBe(1);

        act(() => {
            useNestedStore(nekuta).user.name = 'Grace';
        });
        expect(renderCount).toBe(2);
        expect(screen.getByTestId('name')).toHaveTextContent('Grace');
    });
});
