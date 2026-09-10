import { effect } from './effect.js';
import { effectScope, getCurrentScope, onScopeDispose } from './effectScope.js';
import { reactive } from './reactive.js';

describe('effectScope()', () => {
    it('captures effects created while running and stops them together', () => {
        const state = reactive({ count: 0 });
        const fn = jest.fn(() => state.count);
        const scope = effectScope();

        scope.run(() => {
            effect(fn);
        });

        state.count++;
        expect(fn).toHaveBeenCalledTimes(2);

        scope.stop();
        state.count++;
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('runs onScopeDispose() callbacks when the scope stops', () => {
        const cleanup = jest.fn();
        const scope = effectScope();

        scope.run(() => {
            onScopeDispose(cleanup);
        });

        expect(cleanup).not.toHaveBeenCalled();
        scope.stop();
        expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('exposes the active scope via getCurrentScope() only while running', () => {
        const scope = effectScope();

        expect(getCurrentScope()).toBeUndefined();
        scope.run(() => {
            expect(getCurrentScope()).toBe(scope);
        });
        expect(getCurrentScope()).toBeUndefined();
    });

    it('cascades stop() to child scopes created within it', () => {
        const state = reactive({ count: 0 });
        const fn = jest.fn(() => state.count);
        const parent = effectScope();

        parent.run(() => {
            const child = effectScope();
            child.run(() => effect(fn));
        });

        parent.stop();
        state.count++;

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('a detached scope is not captured by a currently-running parent scope', () => {
        const state = reactive({ count: 0 });
        const fn = jest.fn(() => state.count);
        const parent = effectScope();
        const detached = effectScope(true);

        parent.run(() => {
            detached.run(() => effect(fn));
        });

        parent.stop();
        state.count++;

        // The detached scope's effect should still be alive — parent stopping it would be a bug.
        expect(fn).toHaveBeenCalledTimes(2);

        detached.stop();
    });
});
