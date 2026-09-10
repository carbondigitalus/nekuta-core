import { createDep, type Dep } from './dep';
import { ReactiveEffect, trackEffects, triggerEffects } from './effect';
import { TriggerOpTypes } from './operations';
import { isFunction } from './shared';
import { refSymbol, type RefLike } from './ref';

export interface ComputedRef<T = unknown> {
    readonly value: T;
}

export interface WritableComputedRef<T> {
    value: T;
}

export interface WritableComputedOptions<T> {
    get: () => T;
    set: (value: T) => void;
}

const computedSymbol = Symbol('nekuta:computed');

class ComputedRefImpl<T> implements RefLike {
    public readonly dep: Dep = createDep();
    public readonly effect: ReactiveEffect<T>;
    public readonly [computedSymbol] = true;
    /** A computed IS a ref — see the note on `refSymbol` in ref.ts. */
    public readonly [refSymbol] = true;

    private _value!: T;
    private _dirty = true;

    constructor(
        getter: () => T,
        private readonly setter?: (value: T) => void
    ) {
        this.effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true;
                triggerEffects(this.dep, {
                    target: this as unknown as object,
                    type: TriggerOpTypes.SET
                });
            }
        });
        this.effect.computed = this;
    }

    get value(): T {
        trackEffects(this.dep);

        if (this._dirty) {
            this._dirty = false;
            this._value = this.effect.run();
        }

        return this._value;
    }

    set value(newValue: T) {
        if (!this.setter) {
            throw new Error(
                'Write operation failed: computed value is readonly'
            );
        }
        this.setter(newValue);
    }
}

export function computed<T>(getter: () => T): ComputedRef<T>;
export function computed<T>(
    options: WritableComputedOptions<T>
): WritableComputedRef<T>;
export function computed<T>(
    getterOrOptions: (() => T) | WritableComputedOptions<T>
): ComputedRef<T> | WritableComputedRef<T> {
    const getter = isFunction(getterOrOptions)
        ? (getterOrOptions as () => T)
        : getterOrOptions.get;
    const setter = isFunction(getterOrOptions)
        ? undefined
        : getterOrOptions.set;

    return new ComputedRefImpl(getter, setter);
}

export function isComputed<T>(value: unknown): value is ComputedRef<T> {
    return !!(
        value && (value as Record<symbol, unknown>)[computedSymbol] === true
    );
}
