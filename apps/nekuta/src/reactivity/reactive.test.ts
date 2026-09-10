import { effect } from './effect';
import { isReactive, markRaw, reactive, toRaw } from './reactive';
import { isRef, ref } from './ref';

describe('reactive()', () => {
    it('returns the same proxy for the same target (identity stability)', () => {
        const target = {};
        expect(reactive(target)).toBe(reactive(target));
    });

    it('returns the argument unchanged when it is already reactive', () => {
        const proxy = reactive({});
        expect(reactive(proxy)).toBe(proxy);
    });

    it('leaves primitives and non-plain-object values untouched', () => {
        expect(reactive(1 as unknown as object)).toBe(1);
        const frozen = Object.freeze({ a: 1 });
        expect(reactive(frozen)).toBe(frozen);
    });

    it('wraps nested objects lazily and deeply', () => {
        const state = reactive({ nested: { count: 0 } });
        expect(isReactive(state.nested)).toBe(true);

        const fn = jest.fn(() => state.nested.count);
        effect(fn);

        state.nested.count++;
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('isReactive() / toRaw() / markRaw() round-trip correctly', () => {
        const raw = { a: 1 };
        const proxy = reactive(raw);

        expect(isReactive(proxy)).toBe(true);
        expect(isReactive(raw)).toBe(false);
        expect(toRaw(proxy)).toBe(raw);

        const skipped = markRaw({ a: 1 });
        expect(reactive(skipped)).toBe(skipped);
        expect(isReactive(reactive(skipped))).toBe(false);
    });

    it('triggers on property add and delete (for-in / Object.keys style tracking)', () => {
        const state = reactive<Record<string, number>>({ a: 1 });
        const fn = jest.fn(() => Object.keys(state).join(','));

        effect(fn);
        expect(fn).toHaveBeenCalledTimes(1);

        state.b = 2;
        expect(fn).toHaveBeenCalledTimes(2);

        delete state.a;
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('triggers effects that track membership via the `in` operator', () => {
        const state = reactive<Record<string, number>>({});
        const fn = jest.fn(() => 'a' in state);

        effect(fn);
        state.a = 1;

        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not trigger when a property is set to the same value', () => {
        const state = reactive({ count: 0 });
        const fn = jest.fn(() => state.count);

        effect(fn);
        state.count = 0;

        expect(fn).toHaveBeenCalledTimes(1);
    });

    describe('ref unwrapping', () => {
        it('auto-unwraps a ref stored as a plain object property', () => {
            const state = reactive({ count: ref(0) });
            expect(state.count).toBe(0);

            state.count = 5;
            expect(state.count).toBe(5);
        });

        it('setting a ref-backed property updates the underlying ref rather than replacing it', () => {
            const count = ref(0);
            const state = reactive({ count });

            state.count = 5;
            expect(count.value).toBe(5);
        });

        it('does NOT auto-unwrap a ref stored as an array element', () => {
            const list = reactive([ref(0)]);
            expect(isRef(list[0])).toBe(true);
        });
    });

    describe('arrays', () => {
        it('tracks length and index mutation via push()', () => {
            const list = reactive<number[]>([]);
            const fn = jest.fn(() => list.length);

            effect(fn);
            list.push(1);

            expect(fn).toHaveBeenCalledTimes(2);
            expect(list.length).toBe(1);
        });

        it('does not infinitely loop when push() reads and writes length internally', () => {
            const list = reactive<number[]>([]);
            expect(() => {
                effect(() => list.length);
                list.push(1);
                list.push(2);
            }).not.toThrow();
            expect(list).toEqual([1, 2]);
        });

        it('triggers effects tracking indices dropped by a length shrink', () => {
            const list = reactive([1, 2, 3]);
            const fn = jest.fn(() => list[2]);

            effect(fn);
            list.length = 1;

            expect(fn).toHaveBeenCalledTimes(2);
        });

        it('includes()/indexOf() find reactive-wrapped objects by their raw identity', () => {
            const rawItem = { id: 1 };
            const list = reactive([rawItem]);

            expect(list.includes(rawItem)).toBe(true);
            expect(list.indexOf(rawItem)).toBe(0);
        });
    });
});
