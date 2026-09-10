/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { createNekuta, setActiveNekuta, type Nekuta } from '../store/index.js';
import { NekutaStore } from './NekutaStore.js';
import { useNekuta } from './useNekuta.js';

function Probe() {
    const nekuta = useNekuta();
    return <div data-testid="probe">{nekuta ? 'resolved' : 'missing'}</div>;
}

describe('useNekuta()', () => {
    afterEach(() => {
        setActiveNekuta(undefined);
    });

    it('resolves the instance from a <NekutaStore> above it', () => {
        const nekuta = createNekuta();
        render(
            <NekutaStore nekuta={nekuta}>
                <Probe />
            </NekutaStore>
        );

        expect(screen.getByTestId('probe')).toHaveTextContent('resolved');
    });

    it('falls back to the active singleton when there is no NekutaStore', () => {
        const nekuta: Nekuta = createNekuta();
        setActiveNekuta(nekuta);

        render(<Probe />);

        expect(screen.getByTestId('probe')).toHaveTextContent('resolved');
    });

    it('throws when neither a NekutaStore nor an active instance is present', () => {
        const consoleError = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        expect(() => render(<Probe />)).toThrow(/no <NekutaStore>/);

        consoleError.mockRestore();
    });

    it('prefers the NekutaStore instance over the singleton when both are present', () => {
        const providedNekuta = createNekuta();
        const singletonNekuta = createNekuta();
        setActiveNekuta(singletonNekuta);

        let seen: Nekuta | undefined;
        function CaptureProbe() {
            seen = useNekuta();
            return null;
        }

        render(
            <NekutaStore nekuta={providedNekuta}>
                <CaptureProbe />
            </NekutaStore>
        );

        expect(seen).toBe(providedNekuta);
        expect(seen).not.toBe(singletonNekuta);
    });
});
