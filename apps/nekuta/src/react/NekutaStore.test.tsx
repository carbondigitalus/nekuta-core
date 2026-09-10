/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { createNekuta, defineStore, type Nekuta } from '../store/index.js';
import { NekutaStore } from './NekutaStore.js';
import { useNekuta } from './useNekuta.js';
import { useStore } from './useStore.js';

function Probe() {
    const nekuta = useNekuta();
    return <div data-testid="probe">{nekuta ? 'resolved' : 'missing'}</div>;
}

const useCounterStore = defineStore({
    id: 'counter',
    state: () => ({ count: 0 })
});

describe('<NekutaStore>', () => {
    it('creates its own instance and makes it available below', () => {
        render(
            <NekutaStore>
                <Probe />
            </NekutaStore>
        );

        expect(screen.getByTestId('probe')).toHaveTextContent('resolved');
    });

    it('creates a fresh instance per mount, so state does not leak across separate apps', () => {
        let firstSeen: Nekuta | undefined;
        let secondSeen: Nekuta | undefined;

        function CaptureProbe({
            onSeen
        }: {
            onSeen: (nekuta: Nekuta) => void;
        }) {
            onSeen(useNekuta());
            return null;
        }

        render(
            <NekutaStore>
                <CaptureProbe onSeen={(n) => (firstSeen = n)} />
            </NekutaStore>
        );
        render(
            <NekutaStore>
                <CaptureProbe onSeen={(n) => (secondSeen = n)} />
            </NekutaStore>
        );

        expect(firstSeen).toBeDefined();
        expect(secondSeen).toBeDefined();
        expect(firstSeen).not.toBe(secondSeen);
    });

    it('installs the given plugins on the instance it creates', () => {
        const seenIds: string[] = [];
        const plugin = jest.fn(({ store }: { store: { $id: string } }) => {
            seenIds.push(store.$id);
        });

        function Reader() {
            useStore(useCounterStore);
            return null;
        }

        render(
            <NekutaStore plugins={[plugin]}>
                <Reader />
            </NekutaStore>
        );

        expect(plugin).toHaveBeenCalledTimes(1);
        expect(seenIds).toEqual(['counter']);
    });

    it('uses an externally-provided instance instead of creating its own', () => {
        const nekuta = createNekuta();

        let seen: Nekuta | undefined;
        function CaptureProbe() {
            seen = useNekuta();
            return null;
        }

        render(
            <NekutaStore nekuta={nekuta}>
                <CaptureProbe />
            </NekutaStore>
        );

        expect(seen).toBe(nekuta);
    });
});
