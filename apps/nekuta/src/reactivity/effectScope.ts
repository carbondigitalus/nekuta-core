import type { ReactiveEffect } from './effect';

let activeEffectScope: EffectScope | undefined;

export class EffectScope {
    active = true;
    effects: ReactiveEffect[] = [];
    cleanups: (() => void)[] = [];

    parent: EffectScope | undefined;
    private scopes: EffectScope[] | undefined;
    private index: number | undefined;

    constructor(detached = false) {
        if (!detached && activeEffectScope) {
            this.parent = activeEffectScope;
            this.index = (activeEffectScope.scopes ??= []).push(this) - 1;
        }
    }

    run<T>(fn: () => T): T | undefined {
        if (!this.active) {
            return undefined;
        }

        const prevScope = activeEffectScope;
        activeEffectScope = this;

        try {
            return fn();
        } finally {
            activeEffectScope = prevScope;
        }
    }

    stop(fromParent = false): void {
        if (!this.active) {
            return;
        }

        for (const effect of this.effects) {
            effect.stop();
        }
        for (const cleanup of this.cleanups) {
            cleanup();
        }
        if (this.scopes) {
            for (const scope of this.scopes) {
                scope.stop(true);
            }
        }

        if (
            this.parent &&
            !fromParent &&
            this.parent.scopes &&
            this.index !== undefined
        ) {
            const last = this.parent.scopes.pop();
            if (last && last !== this) {
                this.parent.scopes[this.index] = last;
                last.index = this.index;
            }
        }

        this.parent = undefined;
        this.active = false;
    }
}

export function effectScope(detached = false): EffectScope {
    return new EffectScope(detached);
}

export function recordEffectScope(
    effect: ReactiveEffect,
    scope: EffectScope | undefined = activeEffectScope
): void {
    if (scope?.active) {
        scope.effects.push(effect);
    }
}

export function getCurrentScope(): EffectScope | undefined {
    return activeEffectScope;
}

export function onScopeDispose(fn: () => void): void {
    if (activeEffectScope) {
        activeEffectScope.cleanups.push(fn);
    }
}
