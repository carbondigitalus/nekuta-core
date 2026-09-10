import { computed } from './computed.js';
import { effect } from './effect.js';
import { reactive } from './reactive.js';
import { ref } from './ref.js';

describe('computed()', () => {
    it('is lazy — the getter does not run until .value is first read', () => {
        const getter = jest.fn(() => 1);
        computed(getter);

        expect(getter).not.toHaveBeenCalled();
    });

    it('memoizes and only recomputes when a tracked dependency actually changes', () => {
        const state = reactive({ count: 0, other: 0 });
        const getter = jest.fn(() => state.count * 2);
        const double = computed(getter);

        expect(double.value).toBe(0);
        expect(double.value).toBe(0);
        expect(getter).toHaveBeenCalledTimes(1);

        state.other++;
        expect(double.value).toBe(0);
        expect(getter).toHaveBeenCalledTimes(1);

        state.count = 5;
        expect(double.value).toBe(10);
        expect(getter).toHaveBeenCalledTimes(2);
    });

    it('propagates through a chain of computeds in the correct order', () => {
        const count = ref(1);
        const double = computed(() => count.value * 2);
        const quadruple = computed(() => double.value * 2);

        expect(quadruple.value).toBe(4);

        count.value = 2;
        expect(quadruple.value).toBe(8);
    });

    it('re-runs effects that read a computed once its dependency changes', () => {
        const count = ref(1);
        const double = computed(() => count.value * 2);
        const fn = jest.fn(() => double.value);

        effect(fn);
        expect(fn).toHaveBeenCalledTimes(1);

        count.value = 2;
        expect(fn).toHaveBeenCalledTimes(2);
        expect(double.value).toBe(4);
    });

    it('supports a writable {get, set} form', () => {
        const count = ref(1);
        const doubled = computed({
            get: () => count.value * 2,
            set: (value: number) => {
                count.value = value / 2;
            }
        });

        expect(doubled.value).toBe(2);
        doubled.value = 10;
        expect(count.value).toBe(5);
    });

    it('throws when writing to a getter-only computed', () => {
        const readOnly = computed(() => 1);
        expect(() => {
            (readOnly as { value: number }).value = 2;
        }).toThrow();
    });
});
