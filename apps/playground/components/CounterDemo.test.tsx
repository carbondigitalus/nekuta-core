import { createNekuta, NekutaStore } from '@nekuta/core';
import { act, render, screen } from '@testing-library/react';
import { CounterDemo } from './CounterDemo';

function renderDemo() {
    const nekuta = createNekuta();
    return render(
        <NekutaStore nekuta={nekuta}>
            <CounterDemo />
        </NekutaStore>
    );
}

describe('CounterDemo', () => {
    it('renders both the functional and class-component bindings, sharing one store', () => {
        renderDemo();

        expect(
            screen.getByText('Functional component — useStore()')
        ).toBeInTheDocument();
        expect(
            screen.getByText('Class component — connectStore()')
        ).toBeInTheDocument();
        expect(screen.getByTestId('functional-count')).toHaveTextContent('0');
        expect(screen.getByTestId('class-count')).toHaveTextContent('0');
    });

    it('a click on the functional binding updates the class binding too (same store)', () => {
        renderDemo();

        act(() => {
            screen.getByText('+1').click();
        });

        expect(screen.getByTestId('functional-count')).toHaveTextContent('1');
        expect(screen.getByTestId('class-count')).toHaveTextContent('1');
    });
});
