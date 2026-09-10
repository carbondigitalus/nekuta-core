import { ITERATE_KEY, MAP_KEY_ITERATE_KEY } from './dep.js';
import { track, trigger, triggerAll } from './effect.js';
import { TrackOpTypes, TriggerOpTypes } from './operations.js';
import { ReactiveFlags, reactive, toRaw } from './reactive.js';
import { hasChanged, hasOwn, isMap, isObject } from './shared.js';

type CollectionTypes = Map<unknown, unknown> | Set<unknown>;

function toReactive<T>(value: T): T {
    return isObject(value) ? (reactive(value as object) as T) : value;
}

/**
 * Map/Set methods throw "incompatible receiver" if invoked with the Proxy as `this` (they need
 * the internal [[MapData]]/[[SetData]] slot the raw object has). Every instrumented method below
 * re-derives the raw target from `this` rather than closing over a fixed `target`.
 */
function has(this: CollectionTypes, key: unknown): boolean {
    const target = toRaw(this) as Map<unknown, unknown>;
    const rawKey = toRaw(key);

    if (key !== rawKey) {
        track(target, TrackOpTypes.GET, key);
    }
    track(target, TrackOpTypes.GET, rawKey);

    return target.has(key) || (key !== rawKey && target.has(rawKey));
}

function get(this: CollectionTypes, key: unknown): unknown {
    const target = toRaw(this) as Map<unknown, unknown>;
    const rawKey = toRaw(key);

    if (key !== rawKey) {
        track(target, TrackOpTypes.GET, key);
    }
    track(target, TrackOpTypes.GET, rawKey);

    return toReactive(target.has(key) ? target.get(key) : target.get(rawKey));
}

function size(this: CollectionTypes): number {
    const target = toRaw(this) as CollectionTypes;
    track(
        target,
        TrackOpTypes.ITERATE,
        isMap(target) ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
    );
    return Reflect.get(target, 'size', target) as number;
}

function add(this: Set<unknown>, value: unknown): Set<unknown> {
    const target = toRaw(this);
    const rawValue = toRaw(value);
    const hadKey = target.has(rawValue);

    if (!hadKey) {
        target.add(rawValue);
        trigger(target, TriggerOpTypes.ADD, rawValue, rawValue);
    }

    return this;
}

function set(
    this: Map<unknown, unknown>,
    key: unknown,
    value: unknown
): Map<unknown, unknown> {
    const target = toRaw(this);
    const rawKey = toRaw(key);
    const rawValue = toRaw(value);

    const usesOriginalKey = key !== rawKey && target.has(key);
    const hadKey = usesOriginalKey || target.has(rawKey);
    const oldValue = usesOriginalKey ? target.get(key) : target.get(rawKey);

    target.set(rawKey, rawValue);

    if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, rawKey, rawValue);
    } else if (hasChanged(rawValue, oldValue)) {
        trigger(target, TriggerOpTypes.SET, rawKey, rawValue, oldValue);
    }

    return this;
}

function deleteEntry(this: CollectionTypes, key: unknown): boolean {
    const target = toRaw(this) as Map<unknown, unknown>;
    const rawKey = toRaw(key);

    const usesOriginalKey = key !== rawKey && target.has(key);
    const hadKey = usesOriginalKey || target.has(rawKey);
    const oldValue = isMap(target)
        ? target.get(usesOriginalKey ? key : rawKey)
        : undefined;

    const result = target.delete(usesOriginalKey ? key : rawKey);

    if (hadKey) {
        trigger(target, TriggerOpTypes.DELETE, rawKey, undefined, oldValue);
    }

    return result;
}

function clear(this: CollectionTypes): void {
    const target = toRaw(this) as Map<unknown, unknown>;
    if (target.size === 0) {
        return;
    }

    target.clear();
    triggerAll(target);
}

function forEach(
    this: CollectionTypes,
    callback: (value: unknown, key: unknown, target: CollectionTypes) => void,
    thisArg?: unknown
) {
    const observed = this;
    const target = toRaw(observed) as Map<unknown, unknown>;
    // Always ITERATE_KEY (never MAP_KEY_ITERATE_KEY) — forEach visits values too, so it must
    // also react to a plain value-only SET, not just key add/delete.
    track(target, TrackOpTypes.ITERATE, ITERATE_KEY);

    return target.forEach((value, key) =>
        callback.call(thisArg, toReactive(value), toReactive(key), observed)
    );
}

function createIterableMethod(method: string | symbol) {
    return function (
        this: CollectionTypes,
        ...args: unknown[]
    ): IterableIterator<unknown> {
        const target = toRaw(this) as Map<unknown, unknown>;
        const isMapTarget = isMap(target);
        const isPair =
            method === 'entries' || (method === Symbol.iterator && isMapTarget);
        const isKeyOnly = method === 'keys' && isMapTarget;

        track(
            target,
            TrackOpTypes.ITERATE,
            isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
        );

        const innerIterator = (
            target as unknown as {
                [key: string]: (...a: unknown[]) => Iterator<unknown>;
            }
        )[method as string](...args);

        return {
            next(): IteratorResult<unknown> {
                const { value, done } = innerIterator.next();
                if (done) {
                    return { value: undefined, done };
                }
                return {
                    value: isPair
                        ? [
                              toReactive((value as [unknown, unknown])[0]),
                              toReactive((value as [unknown, unknown])[1])
                          ]
                        : toReactive(value),
                    done
                };
            },
            [Symbol.iterator](): IterableIterator<unknown> {
                return this;
            }
        };
    };
}

const instrumentations: Record<string | symbol, unknown> = {
    get,
    set,
    add,
    has,
    delete: deleteEntry,
    clear,
    forEach,
    keys: createIterableMethod('keys'),
    values: createIterableMethod('values'),
    entries: createIterableMethod('entries'),
    [Symbol.iterator]: createIterableMethod(Symbol.iterator)
};

export const mutableCollectionHandlers: ProxyHandler<CollectionTypes> = {
    get(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true;
        }
        if (key === ReactiveFlags.RAW) {
            return target;
        }
        if (key === 'size') {
            return size.call(receiver as CollectionTypes);
        }

        return hasOwn(instrumentations, key)
            ? instrumentations[key]
            : Reflect.get(target, key, receiver);
    }
};
