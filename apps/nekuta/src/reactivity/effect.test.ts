import { effect, stop } from './effect.js';
import { reactive } from './reactive.js';

describe('effect()', () => {
    it('runs the passed function immediately', () => {
        const fn = jest.fn();
        effect(fn);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('re-runs when a tracked reactive property changes', () => {
        const state = reactive({ count: 0 });
        const fn = jest.fn(() => state.count);

        effect(fn);
        expect(fn).toHaveBeenCalledTimes(1);

        state.count++;
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not re-run for properties it never read', () => {
        const state = reactive({ a: 1, b: 1 });
        const fn = jest.fn(() => state.a);

        effect(fn);
        state.b++;

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('stops reacting once stopped', () => {
        const state = reactive({ count: 0 });
        const fn = jest.fn(() => state.count);

        const runner = effect(fn);
        stop(runner);

        state.count++;
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('re-tracks dependencies on every run (branching effects)', () => {
        const state = reactive<{ flag: boolean; a: number; b: number }>({
            flag: true,
            a: 1,
            b: 1
        });
        const fn = jest.fn(() => (state.flag ? state.a : state.b));

        effect(fn);
        expect(fn).toHaveBeenCalledTimes(1);

        state.flag = false;
        expect(fn).toHaveBeenCalledTimes(2);

        // No longer depends on `a` — mutating it should not trigger a re-run.
        state.a++;
        expect(fn).toHaveBeenCalledTimes(2);

        state.b++;
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('restores the outer active effect after a nested effect runs', () => {
        const outer = reactive({ count: 0 });
        const inner = reactive({ count: 0 });
        const outerFn = jest.fn(() => {
            void outer.count;
            effect(() => void inner.count);
        });

        effect(outerFn);
        inner.count++;
        outer.count++;

        // The outer effect re-ran for `outer.count`, spawning a fresh inner effect each time —
        // it should not have been corrupted into tracking `inner.count` itself.
        expect(outerFn).toHaveBeenCalledTimes(2);
    });

    it('does not infinitely recurse when an effect mutates its own dependency', () => {
        const state = reactive({ count: 0 });
        const fn = jest.fn(() => {
            if (state.count < 1) {
                state.count++;
            }
        });

        expect(() => effect(fn)).not.toThrow();
        expect(state.count).toBe(1);
    });

    it('uses the scheduler instead of re-running immediately when provided', () => {
        const state = reactive({ count: 0 });
        const scheduler = jest.fn();
        const fn = jest.fn(() => state.count);

        effect(fn, scheduler);
        state.count++;

        expect(fn).toHaveBeenCalledTimes(1);
        expect(scheduler).toHaveBeenCalledTimes(1);
    });
});
