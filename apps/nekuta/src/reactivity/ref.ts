import { createDep, type Dep } from './dep';
import { trackEffects, triggerEffects } from './effect';
import { TriggerOpTypes } from './operations';
import { isReactive, reactive, toRaw } from './reactive';
import { hasChanged, isArray, isObject } from './shared';

export interface Ref<T = unknown> {
    value: T;
}

const refSymbol = Symbol('nekuta:ref');

function toReactive<T>(value: T): T {
    return isObject(value) ? (reactive(value as object) as T) : value;
}

class RefImpl<T> implements Ref<T> {
    private _value: T;
    private _rawValue: T;
    public readonly dep: Dep = createDep();
    public readonly [refSymbol] = true;

    constructor(value: T) {
        this._rawValue = toRaw(value);
        this._value = toReactive(value);
    }

    get value(): T {
        trackRefValue(this);
        return this._value;
    }

    set value(newValue: T) {
        const rawNewValue = toRaw(newValue);
        if (hasChanged(rawNewValue, this._rawValue)) {
            this._rawValue = rawNewValue;
            this._value = toReactive(newValue);
            triggerRefValue(this);
        }
    }
}

export interface RefLike {
    readonly dep: Dep;
}

export function trackRefValue(ref: RefLike): void {
    trackEffects(ref.dep);
}

export function triggerRefValue(ref: RefLike): void {
    triggerEffects(ref.dep, {
        target: ref as unknown as object,
        type: TriggerOpTypes.SET
    });
}

export function ref<T>(value: T): Ref<T> {
    return new RefImpl(value);
}

export function isRef<T>(value: unknown): value is Ref<T> {
    return !!(value && (value as Record<symbol, unknown>)[refSymbol] === true);
}

export function unref<T>(value: T | Ref<T>): T {
    return isRef(value) ? value.value : value;
}

class ObjectRefImpl<T extends object, K extends keyof T> implements Ref<T[K]> {
    public readonly [refSymbol] = true;
    public readonly dep: Dep = createDep();

    constructor(
        private readonly object: T,
        private readonly key: K,
        private readonly defaultValue?: T[K]
    ) {}

    get value(): T[K] {
        const value = this.object[this.key];
        return value === undefined ? (this.defaultValue as T[K]) : value;
    }

    set value(newValue: T[K]) {
        this.object[this.key] = newValue;
    }
}

export function toRef<T extends object, K extends keyof T>(
    object: T,
    key: K,
    defaultValue?: T[K]
): Ref<T[K]> {
    const value = object[key];
    return isRef(value)
        ? (value as Ref<T[K]>)
        : (new ObjectRefImpl(object, key, defaultValue) as unknown as Ref<
              T[K]
          >);
}

export type ToRefs<T> = { [K in keyof T]: Ref<T[K]> };

export function toRefs<T extends object>(object: T): ToRefs<T> {
    if (!isReactive(object)) {
        throw new Error('toRefs() expects a reactive object');
    }

    const ret = (isArray(object) ? new Array(object.length) : {}) as ToRefs<T>;
    for (const key in object) {
        ret[key] = toRef(object, key as keyof T) as ToRefs<T>[Extract<
            keyof T,
            string
        >];
    }

    return ret;
}
