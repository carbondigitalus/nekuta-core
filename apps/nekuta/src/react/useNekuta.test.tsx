/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { createNekuta, setActiveNekuta, type Nekuta } from '../store';
import { NekutaProvider } from './context';
import { useNekuta } from './useNekuta';

function Probe() {
    const nekuta = useNekuta();
    return <div data-testid="probe">{nekuta ? 'resolved' : 'missing'}</div>;
}

describe('useNekuta()', () => {
    afterEach(() => {
        setActiveNekuta(undefined);
    });

    it('resolves the instance from a <NekutaProvider> above it', () => {
        const nekuta = createNekuta();
        render(
            <NekutaProvider nekuta={nekuta}>
                <Probe />
            </NekutaProvider>
        );

        expect(screen.getByTestId('probe')).toHaveTextContent('resolved');
    });

    it('falls back to the active singleton when there is no Provider', () => {
        const nekuta: Nekuta = createNekuta();
        setActiveNekuta(nekuta);

        render(<Probe />);

        expect(screen.getByTestId('probe')).toHaveTextContent('resolved');
    });

    it('throws when neither a Provider nor an active instance is present', () => {
        const consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        expect(() => render(<Probe />)).toThrow(/no <NekutaProvider>/);

        consoleError.mockRestore();
    });

    it('prefers the Provider over the singleton when both are present', () => {
        const providerNekuta = createNekuta();
        const singletonNekuta = createNekuta();
        setActiveNekuta(singletonNekuta);

        let seen: Nekuta | undefined;
        function CaptureProbe() {
            seen = useNekuta();
            return null;
        }

        render(
            <NekutaProvider nekuta={providerNekuta}>
                <CaptureProbe />
            </NekutaProvider>
        );

        expect(seen).toBe(providerNekuta);
        expect(seen).not.toBe(singletonNekuta);
    });
});
