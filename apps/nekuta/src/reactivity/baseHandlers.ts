import { ITERATE_KEY } from './dep';
import { track, trigger } from './effect';
import { TrackOpTypes, TriggerOpTypes } from './operations';
import { ReactiveFlags, reactive, toRaw } from './reactive';
import { isRef } from './ref';
import {
    hasChanged,
    hasOwn,
    isArray,
    isIntegerKey,
    isObject,
    isSymbol
} from './shared';

const builtInSymbols = new Set(
    Object.getOwnPropertyNames(Symbol)
        .map((key) => Symbol[key as keyof SymbolConstructor])
        .filter(isSymbol)
);

/**
 * Vue's own baseHandlers pauses tracking inside push/pop/shift/unshift/splice — those
 * methods read + write `length` internally, and without pausing that read would create a
 * dependency loop (the mutation's own `length` trigger would re-run the very effect that's
 * still inside the mutation call).
 */
const arrayInstrumentations = createArrayInstrumentations();

function createArrayInstrumentations(): Record<
    string,
    (this: unknown[], ...args: unknown[]) => unknown
> {
    const instrumentations: Record<
        string,
        (this: unknown[], ...args: unknown[]) => unknown
    > = {};

    (['includes', 'indexOf', 'lastIndexOf'] as const).forEach((key) => {
        instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
            const raw = toRaw(this) as unknown[];
            for (let i = 0, l = this.length; i < l; i++) {
                track(raw, TrackOpTypes.GET, i + '');
            }

            const res = raw[key](...(args as [unknown]));
            if (res === -1 || res === false) {
                return raw[key](...(args.map(toRaw) as [unknown]));
            }
            return res;
        };
    });

    (['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach((key) => {
        instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
            pauseTracking();
            const res = (
                Array.prototype[key] as (...a: unknown[]) => unknown
            ).apply(this, args);
            resetTracking();
            return res;
        };
    });

    return instrumentations;
}

let trackingPaused = false;

function pauseTracking(): void {
    trackingPaused = true;
}

function resetTracking(): void {
    trackingPaused = false;
}

export const mutableHandlers: ProxyHandler<object> = {
    get(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true;
        }
        if (key === ReactiveFlags.RAW) {
            return target;
        }

        const targetIsArray = isArray(target);

        if (targetIsArray && hasOwn(arrayInstrumentations, key as string)) {
            return Reflect.get(arrayInstrumentations, key, receiver);
        }

        const res = Reflect.get(target, key, receiver);

        if (isSymbol(key) && builtInSymbols.has(key)) {
            return res;
        }

        if (!trackingPaused) {
            track(target, TrackOpTypes.GET, key);
        }

        // A ref stored as a plain object property auto-unwraps to its `.value` (Vue's own
        // behavior) — arrays are the one exception, so `list[0]` still returns the ref itself.
        if (isRef(res)) {
            return targetIsArray && isIntegerKey(key as string)
                ? res
                : res.value;
        }

        if (isObject(res)) {
            return reactive(res);
        }

        return res;
    },

    set(target, key, value, receiver) {
        const oldValue = (target as Record<PropertyKey, unknown>)[
            key as string
        ];
        const rawValue = toRaw(value);

        if (!isArray(target) && isRef(oldValue) && !isRef(rawValue)) {
            oldValue.value = rawValue;
            return true;
        }

        const hadKey =
            isArray(target) && isIntegerKey(key)
                ? Number(key) < target.length
                : hasOwn(target, key);

        const result = Reflect.set(target, key, rawValue, receiver);

        // Only trigger for the receiver that owns `target` (ignore prototype-chain sets).
        if (target === toRaw(receiver)) {
            if (!hadKey) {
                trigger(target, TriggerOpTypes.ADD, key, rawValue);
            } else if (hasChanged(rawValue, oldValue)) {
                trigger(target, TriggerOpTypes.SET, key, rawValue, oldValue);
            }
        }

        return result;
    },

    deleteProperty(target, key) {
        const hadKey = hasOwn(target, key);
        const oldValue = (target as Record<PropertyKey, unknown>)[
            key as string
        ];
        const result = Reflect.deleteProperty(target, key);

        if (result && hadKey) {
            trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue);
        }

        return result;
    },

    has(target, key) {
        const result = Reflect.has(target, key);
        if (!isSymbol(key) || !builtInSymbols.has(key)) {
            track(target, TrackOpTypes.HAS, key);
        }
        return result;
    },

    ownKeys(target) {
        track(
            target,
            TrackOpTypes.ITERATE,
            isArray(target) ? 'length' : ITERATE_KEY
        );
        return Reflect.ownKeys(target);
    }
};
