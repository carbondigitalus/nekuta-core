import { mutableHandlers } from './baseHandlers';
import { mutableCollectionHandlers } from './collectionHandlers';
import { isMap, isObject, isSet } from './shared';

export enum ReactiveFlags {
    SKIP = '__nekuta_skip',
    IS_REACTIVE = '__nekuta_is_reactive',
    RAW = '__nekuta_raw'
}

export interface Target {
    [ReactiveFlags.SKIP]?: boolean;
    [ReactiveFlags.IS_REACTIVE]?: boolean;
    [ReactiveFlags.RAW]?: unknown;
}

const enum TargetType {
    INVALID = 0,
    COMMON = 1,
    COLLECTION = 2
}

function getTargetType(value: Target): TargetType {
    if (value[ReactiveFlags.SKIP] || !Object.isExtensible(value)) {
        return TargetType.INVALID;
    }

    if (isMap(value) || isSet(value)) {
        return TargetType.COLLECTION;
    }

    return TargetType.COMMON;
}

const reactiveMap = new WeakMap<object, object>();

export function reactive<T extends object>(target: T): T {
    if (!isObject(target)) {
        return target;
    }

    if ((target as Target)[ReactiveFlags.RAW]) {
        // `target` is already a reactive proxy — avoid double-wrapping.
        return target;
    }

    const existing = reactiveMap.get(target);
    if (existing) {
        return existing as T;
    }

    const targetType = getTargetType(target as Target);
    if (targetType === TargetType.INVALID) {
        return target;
    }

    const handlers = (
        targetType === TargetType.COLLECTION
            ? mutableCollectionHandlers
            : mutableHandlers
    ) as ProxyHandler<object>;
    const proxy = new Proxy(target as object, handlers);

    reactiveMap.set(target, proxy);

    return proxy as T;
}

export function isReactive(value: unknown): boolean {
    return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE]);
}

export function markRaw<T extends object>(value: T): T {
    if (Object.isExtensible(value)) {
        Object.defineProperty(value, ReactiveFlags.SKIP, {
            value: true,
            configurable: true
        });
    }

    return value;
}

export function toRaw<T>(observed: T): T {
    const raw = observed && (observed as Target)[ReactiveFlags.RAW];
    return raw ? (toRaw(raw) as T) : (observed as T);
}
