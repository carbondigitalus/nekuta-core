'use client';

import { trackWith, type ReactiveEffect } from '../reactivity/index.js';
import { isObject } from '../reactivity/shared.js';

/**
 * Wraps `target` so that every property READ is attributed to `effect` (via `trackWith`), and any
 * object a read returns is itself recursively wrapped the same way — deep property access
 * (`tracked.user.name`) is tracked at every level, not just the top one, the same granularity a
 * reactive() object's own get trap gives a normal effect().
 *
 * Cached per (target, effect) pair so re-reading the same property across renders — or a parent
 * object reachable through more than one path — returns the identical wrapper object, not a fresh
 * one each time (referential stability for things like `useEffect` deps or `React.memo`).
 */
const trackedProxyCache = new WeakMap<
    object,
    WeakMap<ReactiveEffect, unknown>
>();

export function createTrackedProxy<T extends object>(
    target: T,
    effect: ReactiveEffect
): T {
    let cacheForTarget = trackedProxyCache.get(target);
    if (!cacheForTarget) {
        cacheForTarget = new WeakMap();
        trackedProxyCache.set(target, cacheForTarget);
    }

    const cached = cacheForTarget.get(effect);
    if (cached) {
        return cached as T;
    }

    const proxy = new Proxy(target, {
        get(obj, key, receiver) {
            const value = trackWith(effect, () =>
                Reflect.get(obj, key, receiver)
            );

            if (typeof value === 'function') {
                // Actions, $patch, $subscribe, etc. — bind to the real target so `this` inside
                // them is the actual store, never this tracking wrapper.
                return value.bind(obj);
            }

            return isObject(value) ? createTrackedProxy(value, effect) : value;
        }
    });

    cacheForTarget.set(effect, proxy);
    return proxy as T;
}
