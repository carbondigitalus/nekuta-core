import { computed, ref } from '../reactivity/index.js';
import { createNekuta, type Nekuta } from './createNekuta.js';
import { defineStore } from './defineStore.js';
import { getActiveNekuta, setActiveNekuta } from './rootInstance.js';
import { storeToRefs } from './storeToRefs.js';
import type { ActionListenerContext } from './types.js';

let nekuta: Nekuta;

beforeEach(() => {
    nekuta = createNekuta();
    setActiveNekuta(nekuta);
});

afterEach(() => {
    setActiveNekuta(undefined);
});

describe('defineStore() — options store', () => {
    const useCounterStore = defineStore({
        id: 'counter',
        state: () => ({ count: 0, name: 'counter' }),
        getters: {
            double: (state) => state.count * 2,
            // getters can call other getters / actions via `this`
            doublePlusOne(): number {
                return (this as unknown as { double: number }).double + 1;
            }
        },
        actions: {
            increment(this: { count: number }, by = 1) {
                this.count += by;
            }
        }
    });

    it('exposes state directly on the store and reacts to mutation', () => {
        const store = useCounterStore();
        expect(store.$id).toBe('counter');
        expect(store.count).toBe(0);

        store.count++;
        expect(store.count).toBe(1);
    });

    it('resolves getters, including getters that reference other getters via `this`', () => {
        const store = useCounterStore();
        store.count = 5;

        expect(store.double).toBe(10);
        expect(store.doublePlusOne).toBe(11);
    });

    it('actions mutate state through `this` and are called as store methods', () => {
        const store = useCounterStore();
        store.increment();
        expect(store.count).toBe(1);

        store.increment(4);
        expect(store.count).toBe(5);
    });

    it('returns the SAME store instance on repeated calls (singleton per active instance)', () => {
        expect(useCounterStore()).toBe(useCounterStore());
    });

    it('$reset() restores the initial state() shape', () => {
        const store = useCounterStore();
        store.count = 99;
        store.name = 'changed';

        store.$reset();

        expect(store.count).toBe(0);
        expect(store.name).toBe('counter');
    });

    it('throws with no active instance and none passed explicitly', () => {
        setActiveNekuta(undefined);
        expect(() => useCounterStore()).toThrow(/no active Nekuta instance/);
    });

    it('two separate Nekuta instances get independent store state', () => {
        const storeA = useCounterStore();
        storeA.count = 1;

        const otherNekuta = createNekuta();
        const storeB = useCounterStore(otherNekuta);
        storeB.count = 100;

        expect(storeA.count).toBe(1);
        expect(storeB.count).toBe(100);
    });
});

describe('defineStore() — setup store', () => {
    const useSetupCounterStore = defineStore('setupCounter', () => {
        const count = ref(0);
        const double = computed(() => count.value * 2);
        function increment(by = 1) {
            count.value += by;
        }
        return { count, double, increment };
    });

    it('classifies refs as state, computed as getters, and functions as actions', () => {
        const store = useSetupCounterStore();

        expect(store.count).toBe(0);
        store.increment(3);
        expect(store.count).toBe(3);
        expect(store.double).toBe(6);
    });

    it('centralizes setup-store state into the root state tree, like an options store', () => {
        useSetupCounterStore();
        expect(getActiveNekuta()!.state.value.setupCounter).toEqual({
            count: 0
        });
    });

    it('$reset() throws for a setup store', () => {
        const store = useSetupCounterStore();
        expect(() => store.$reset()).toThrow(/does not implement \$reset/);
    });
});

describe('$patch()', () => {
    const useStore = defineStore({
        id: 'patchable',
        state: () => ({ count: 0, nested: { a: 1, b: 1 } })
    });

    it('merges a partial object patch, leaving untouched keys alone', () => {
        const store = useStore();
        store.$patch({ nested: { a: 5 } });

        expect(store.nested).toEqual({ a: 5, b: 1 });
        expect(store.count).toBe(0);
    });

    it('applies a mutator function patch', () => {
        const store = useStore();
        store.$patch((state) => {
            state.count = 42;
        });

        expect(store.count).toBe(42);
    });

    it('fires exactly one subscription event per $patch call, not one per field', () => {
        const store = useStore();
        const listener = jest.fn();
        store.$subscribe(listener);

        store.$patch({ count: 1, nested: { a: 2, b: 3 } });

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener.mock.calls[0][0]).toMatchObject({
            type: 'patch object',
            storeId: 'patchable'
        });
    });
});

describe('$subscribe()', () => {
    const useStore = defineStore({
        id: 'subscribable',
        state: () => ({ count: 0 })
    });

    it('fires on a direct mutation with mutation type "direct"', () => {
        const store = useStore();
        const listener = jest.fn();
        store.$subscribe(listener);

        store.count++;

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener.mock.calls[0][0]).toMatchObject({
            type: 'direct',
            storeId: 'subscribable'
        });
        expect(listener.mock.calls[0][1]).toEqual({ count: 1 });
    });

    it('the returned unsubscribe function stops further notifications', () => {
        const store = useStore();
        const listener = jest.fn();
        const unsubscribe = store.$subscribe(listener);

        unsubscribe();
        store.count++;

        expect(listener).not.toHaveBeenCalled();
    });

    it('continues reacting to further mutations after the first one', () => {
        const store = useStore();
        const listener = jest.fn();
        store.$subscribe(listener);

        store.count++;
        store.count++;

        expect(listener).toHaveBeenCalledTimes(2);
    });
});

describe('$onAction()', () => {
    const useStore = defineStore({
        id: 'actionable',
        state: () => ({ count: 0 }),
        actions: {
            increment(this: { count: number }) {
                this.count++;
                return this.count;
            },
            async incrementAsync(this: { count: number }) {
                this.count++;
                return this.count;
            },
            boom() {
                throw new Error('boom');
            }
        }
    });

    it('fires before the action runs, and after() fires with its return value', () => {
        const store = useStore();
        const events: string[] = [];

        store.$onAction((ctx: ActionListenerContext) => {
            events.push(`before:${String(ctx.name)}`);
            ctx.after((result) => events.push(`after:${result}`));
        });

        store.increment();

        expect(events).toEqual(['before:increment', 'after:1']);
    });

    it('after() fires once an async action resolves', async () => {
        const store = useStore();
        const events: string[] = [];

        store.$onAction((ctx: ActionListenerContext) => {
            ctx.after((result) => events.push(`after:${result}`));
        });

        await store.incrementAsync();

        expect(events).toEqual(['after:1']);
    });

    it('onError() fires when the action throws, and the error still propagates', () => {
        const store = useStore();
        const errors: unknown[] = [];

        store.$onAction((ctx: ActionListenerContext) => {
            ctx.onError((error) => errors.push(error));
        });

        expect(() => store.boom()).toThrow('boom');
        expect(errors).toHaveLength(1);
    });
});

describe('$dispose()', () => {
    it('removes the store from the registry so a later call rebuilds it fresh', () => {
        const useStore = defineStore({
            id: 'disposable',
            state: () => ({ count: 0 })
        });
        const store = useStore();
        store.count = 5;

        store.$dispose();

        expect(nekuta._s.has('disposable')).toBe(false);
        const rebuilt = useStore();
        expect(rebuilt).not.toBe(store);
    });

    it('stops reacting to state mutation after disposal', () => {
        const useStore = defineStore({
            id: 'disposable2',
            state: () => ({ count: 0 })
        });
        const store = useStore();
        const listener = jest.fn();
        store.$subscribe(listener);

        store.$dispose();
        store.count++;

        expect(listener).not.toHaveBeenCalled();
    });
});

describe('storeToRefs()', () => {
    const useStore = defineStore({
        id: 'refable',
        state: () => ({ count: 0 }),
        getters: { double: (state) => state.count * 2 },
        actions: {
            increment(this: { count: number }) {
                this.count++;
            }
        }
    });

    it('produces refs for state and getters that stay in sync with the store', () => {
        const store = useStore();
        const { count, double } = storeToRefs(store);

        expect(count.value).toBe(0);
        expect(double.value).toBe(0);

        store.count = 5;
        expect(count.value).toBe(5);
        expect(double.value).toBe(10);
    });

    it('does not include actions or `$`-prefixed store methods', () => {
        const store = useStore();
        const refs = storeToRefs(store);

        expect('increment' in refs).toBe(false);
        expect('$patch' in refs).toBe(false);
    });
});

describe('plugins', () => {
    it('receives {store, nekuta, options} and can extend the store', () => {
        const seen: unknown[] = [];
        nekuta.use(({ store, nekuta: instance, options }) => {
            seen.push({
                id: store.$id,
                hasInstance: instance === nekuta,
                options
            });
            return { injected: 'value' };
        });

        const useStore = defineStore({
            id: 'plugged',
            state: () => ({ count: 0 })
        });
        const store = useStore();

        expect((store as unknown as { injected: string }).injected).toBe(
            'value'
        );
        expect(seen).toEqual([
            {
                id: 'plugged',
                hasInstance: true,
                options: expect.objectContaining({ id: 'plugged' })
            }
        ]);
    });
});
