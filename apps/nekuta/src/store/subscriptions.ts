import { effect, getCurrentScope, isRef, onScopeDispose } from '../reactivity';
import { isMap, isObject, isSet } from '../reactivity/shared';

export function addSubscription<T extends (...args: never[]) => unknown>(
    subscriptions: T[],
    callback: T,
    detached?: boolean,
    onCleanup: () => void = () => {}
): () => void {
    subscriptions.push(callback);

    const remove = () => {
        const idx = subscriptions.indexOf(callback);
        if (idx > -1) {
            subscriptions.splice(idx, 1);
            onCleanup();
        }
    };

    if (!detached && getCurrentScope()) {
        onScopeDispose(remove);
    }

    return remove;
}

export function triggerSubscriptions<T extends (...args: never[]) => unknown>(
    subscriptions: T[],
    ...args: Parameters<T>
): void {
    for (const callback of subscriptions.slice()) {
        callback(...args);
    }
}

/**
 * Deep-reads every nested property of `value` so an enclosing effect depends on the whole tree,
 * not just its top-level keys — the read-only counterpart to `{ deep: true }` on Vue's `watch()`,
 * which we didn't build as a standalone reactivity primitive (see Milestone 2 scoping notes).
 */
function traverse(value: unknown, seen = new Set<unknown>()): unknown {
    if (!isObject(value) || seen.has(value)) {
        return value;
    }
    seen.add(value);

    if (isRef(value)) {
        traverse(value.value, seen);
    } else if (Array.isArray(value)) {
        for (const item of value) {
            traverse(item, seen);
        }
    } else if (isMap(value) || isSet(value)) {
        (value as Map<unknown, unknown> | Set<unknown>).forEach((item) =>
            traverse(item, seen)
        );
    } else {
        for (const key in value as Record<string, unknown>) {
            traverse((value as Record<string, unknown>)[key], seen);
        }
    }

    return value;
}

/**
 * Deep-watches whatever `getState()` currently returns and calls `callback` on every change,
 * re-tracking the (possibly new) shape of the state after each firing — the engine underneath
 * a store's `$subscribe()`.
 */
export function watchState(
    getState: () => unknown,
    callback: () => void
): () => void {
    const runner = effect(
        () => traverse(getState()),
        () => {
            callback();
            runner();
        }
    );

    return () => runner.effect.stop();
}
