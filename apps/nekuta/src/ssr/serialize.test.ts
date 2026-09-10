import { createNekuta, defineStore, type Nekuta } from '../store/index.js';
import {
    deserializeNekutaState,
    hydrateNekutaState,
    serializeNekutaState
} from './serialize.js';
import { skipHydrate } from './skipHydrate.js';

let nekuta: Nekuta;

beforeEach(() => {
    nekuta = createNekuta();
});

describe('serializeNekutaState()', () => {
    it('produces a JSON.stringify-safe snapshot of every store', () => {
        const useCounter = defineStore({
            id: 'counter',
            state: () => ({ count: 5, label: 'a' })
        });
        useCounter(nekuta);

        const serialized = serializeNekutaState(nekuta);
        expect(JSON.parse(JSON.stringify(serialized))).toEqual({
            counter: { count: 5, label: 'a' }
        });
    });

    it('encodes nested Map/Set state so it round-trips through deserializeNekutaState()', () => {
        const useMapStore = defineStore({
            id: 'mapstore',
            state: () => ({
                tags: new Map<string, number>([['a', 1]]),
                flags: new Set<string>(['x', 'y'])
            })
        });
        useMapStore(nekuta);

        const serialized = serializeNekutaState(nekuta);
        const roundTripped = JSON.parse(JSON.stringify(serialized));
        const deserialized = deserializeNekutaState(roundTripped);

        expect(deserialized.mapstore.tags).toEqual(new Map([['a', 1]]));
        expect(deserialized.mapstore.flags).toEqual(new Set(['x', 'y']));
    });

    it('omits values marked with skipHydrate(), including nested ones', () => {
        const useStore = defineStore({
            id: 'skippable',
            state: () => ({
                keep: 1,
                drop: skipHydrate({ live: true }) as unknown as number,
                nested: {
                    keep: 2,
                    drop: skipHydrate({ live: true }) as unknown as number
                }
            })
        });
        useStore(nekuta);

        const serialized = serializeNekutaState(nekuta) as {
            skippable: {
                keep: number;
                drop?: unknown;
                nested: { keep: number; drop?: unknown };
            };
        };

        expect(serialized.skippable.keep).toBe(1);
        expect('drop' in serialized.skippable).toBe(false);
        expect(serialized.skippable.nested.keep).toBe(2);
        expect('drop' in serialized.skippable.nested).toBe(false);
    });
});

describe('hydrateNekutaState()', () => {
    it('populates state.value BEFORE a store is first resolved, so it sees the hydrated values', () => {
        const server = createNekuta();
        const useStore = defineStore({
            id: 'hydratable',
            state: () => ({ count: 0 })
        });
        useStore(server).count = 42;

        const serialized = serializeNekutaState(server);

        const client = createNekuta();
        hydrateNekutaState(client, serialized);

        const clientStore = useStore(client);
        expect(clientStore.count).toBe(42);
    });
});
