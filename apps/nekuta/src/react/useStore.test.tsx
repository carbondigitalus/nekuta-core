/**
 * @jest-environment jsdom
 */
import { act, render, screen } from '@testing-library/react';
import { createNekuta, defineStore, type Nekuta } from '../store/index.js';
import { NekutaProvider } from './context.js';
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
    return render(<NekutaProvider nekuta={nekuta}>{ui}</NekutaProvider>);
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

    it('two components under the same Provider share and both reflect store state', () => {
        const nekuta = createNekuta();
        render(
            <NekutaProvider nekuta={nekuta}>
                <Counter />
                <Counter />
            </NekutaProvider>
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

    it('unsubscribes from the store on unmount', () => {
        const nekuta = createNekuta();
        const store = useCounterStore(nekuta);
        const unsubscribeSpy = jest.fn();
        jest.spyOn(store, '$subscribe').mockReturnValue(unsubscribeSpy);

        const { unmount } = renderWithNekuta(nekuta, <Counter />);
        expect(unsubscribeSpy).not.toHaveBeenCalled();

        unmount();
        expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    });
});
