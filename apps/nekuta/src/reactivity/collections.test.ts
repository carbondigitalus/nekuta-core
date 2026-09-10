import { effect } from './effect';
import { isReactive, reactive, toRaw } from './reactive';

describe('reactive() — Map', () => {
    it('tracks get/has/size and triggers on set/delete', () => {
        const map = reactive(new Map<string, number>());
        const fn = jest.fn(() => map.get('a'));

        effect(fn);
        expect(fn).toHaveBeenCalledTimes(1);

        map.set('a', 1);
        expect(fn).toHaveBeenCalledTimes(2);
        expect(map.get('a')).toBe(1);

        map.set('a', 1); // unchanged value — no re-run
        expect(fn).toHaveBeenCalledTimes(2);

        map.delete('a');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('tracks size', () => {
        const map = reactive(new Map<string, number>());
        const fn = jest.fn(() => map.size);

        effect(fn);
        map.set('a', 1);

        expect(fn).toHaveBeenCalledTimes(2);
        expect(map.size).toBe(1);
    });

    it('wraps object values as reactive on get()', () => {
        const map = reactive(new Map<string, { count: number }>());
        map.set('a', { count: 0 });

        expect(isReactive(map.get('a'))).toBe(true);
    });

    it('re-runs forEach()-based effects when a key is added or a value changes', () => {
        const map = reactive(new Map<string, number>([['a', 1]]));
        const seen: number[] = [];
        const fn = jest.fn(() => {
            seen.length = 0;
            map.forEach((value) => seen.push(value));
        });

        effect(fn);
        expect(seen).toEqual([1]);

        map.set('a', 2);
        expect(fn).toHaveBeenCalledTimes(2);
        expect(seen).toEqual([2]);

        map.set('b', 3);
        expect(fn).toHaveBeenCalledTimes(3);
        expect(seen.sort()).toEqual([2, 3]);
    });

    it('clear() invalidates every effect that read from the map', () => {
        const map = reactive(new Map([['a', 1]]));
        const fn = jest.fn(() => map.get('a'));

        effect(fn);
        map.clear();

        expect(fn).toHaveBeenCalledTimes(2);
        expect(map.size).toBe(0);
    });

    it('for..of over entries() yields reactive-wrapped, correctly paired values', () => {
        const map = reactive(new Map<string, { n: number }>([['a', { n: 1 }]]));
        const pairs = [...map.entries()];

        expect(pairs).toEqual([['a', { n: 1 }]]);
        expect(isReactive(pairs[0][1])).toBe(true);
    });

    it('accepts a raw object as a key and looks it up consistently', () => {
        const key = { id: 1 };
        const map = reactive(new Map());
        map.set(key, 'value');

        expect(map.get(key)).toBe('value');
        expect(map.has(key)).toBe(true);
    });
});

describe('reactive() — Set', () => {
    it('tracks has()/size and triggers on add/delete', () => {
        const set = reactive(new Set<number>());
        const fn = jest.fn(() => set.has(1));

        effect(fn);
        set.add(1);

        expect(fn).toHaveBeenCalledTimes(2);
        expect(set.has(1)).toBe(true);

        set.add(1); // already present — no re-run
        expect(fn).toHaveBeenCalledTimes(2);

        set.delete(1);
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('deep-merges through toRaw() when reading back out', () => {
        const raw = new Set([1, 2, 3]);
        const set = reactive(raw);

        expect(toRaw(set)).toBe(raw);
        expect([...set]).toEqual([1, 2, 3]);
    });
});
