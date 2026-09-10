import { effect } from './effect.js';
import { isReactive, reactive } from './reactive.js';
import { isRef, ref, toRef, toRefs, unref } from './ref.js';

describe('ref()', () => {
    it('tracks and triggers on .value access', () => {
        const count = ref(0);
        const fn = jest.fn(() => count.value);

        effect(fn);
        count.value++;

        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not trigger when set to an unchanged value', () => {
        const count = ref(0);
        const fn = jest.fn(() => count.value);

        effect(fn);
        count.value = 0;

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('deeply wraps an object value as reactive', () => {
        const state = ref({ nested: { count: 0 } });
        expect(isReactive(state.value.nested)).toBe(true);

        const fn = jest.fn(() => state.value.nested.count);
        effect(fn);
        state.value.nested.count++;

        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('isRef()/unref() identify and unwrap correctly', () => {
        const r = ref(1);
        expect(isRef(r)).toBe(true);
        expect(isRef(1)).toBe(false);
        expect(unref(r)).toBe(1);
        expect(unref(5)).toBe(5);
    });
});

describe('toRef() / toRefs()', () => {
    it('toRef() stays in sync with the source reactive object in both directions', () => {
        const state = reactive({ count: 0 });
        const countRef = toRef(state, 'count');

        expect(countRef.value).toBe(0);

        state.count = 5;
        expect(countRef.value).toBe(5);

        countRef.value = 10;
        expect(state.count).toBe(10);
    });

    it('toRefs() produces one ref per own key, each still linked to the source', () => {
        const state = reactive({ a: 1, b: 2 });
        const refs = toRefs(state);

        expect(refs.a.value).toBe(1);
        expect(refs.b.value).toBe(2);

        state.a = 100;
        expect(refs.a.value).toBe(100);
    });

    it('toRefs() throws for a non-reactive object', () => {
        expect(() => toRefs({ a: 1 })).toThrow();
    });
});
