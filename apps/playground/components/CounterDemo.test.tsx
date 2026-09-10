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
    it('renders all three bindings, sharing one store', () => {
        renderDemo();

        expect(
            screen.getByText('Functional component — useStore()')
        ).toBeInTheDocument();
        expect(
            screen.getByText('Class component — connectStore()')
        ).toBeInTheDocument();
        expect(
            screen.getByText('Class component — static stores')
        ).toBeInTheDocument();
        expect(screen.getByTestId('functional-count')).toHaveTextContent('0');
        expect(screen.getByTestId('class-count')).toHaveTextContent('0');
        expect(screen.getByTestId('static-class-count')).toHaveTextContent('0');
    });

    it('a click on the functional binding updates both class bindings too (same store)', () => {
        renderDemo();

        act(() => {
            screen.getByText('+1').click();
        });

        expect(screen.getByTestId('functional-count')).toHaveTextContent('1');
        expect(screen.getByTestId('class-count')).toHaveTextContent('1');
        expect(screen.getByTestId('static-class-count')).toHaveTextContent('1');
    });

    it('a click on the static-stores class binding updates the other two too', () => {
        renderDemo();

        act(() => {
            screen.getByText('+10').click();
        });

        expect(screen.getByTestId('functional-count')).toHaveTextContent('10');
        expect(screen.getByTestId('class-count')).toHaveTextContent('10');
        expect(screen.getByTestId('static-class-count')).toHaveTextContent(
            '10'
        );
    });
});
