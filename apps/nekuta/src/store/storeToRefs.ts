import { toRaw, toRef } from '../reactivity/index.js';
import type { Ref } from '../reactivity/index.js';
import type { StateTree } from './types.js';

export type StoreToRefs<S> = {
    [
        K in keyof S as S[K] extends (...args: never[]) => unknown
            ? never
            : K extends `$${string}`
              ? never
              : K
    ]: Ref<S[K]>;
};

/**
 * Splits state + getters off a store into individually-subscribable refs, skipping `$`-prefixed
 * store methods and actions — mirrors Pinia's `storeToRefs()`, letting callers destructure a
 * store without losing reactivity the way a plain object destructure would.
 *
 * Generic over its own `S` (rather than constrained by `StoreGeneric`) deliberately — requiring
 * assignability to a fixed `StoreGeneric` alias trips a known TS limitation where a concrete
 * `Store<Id, S, G, A>` intersection isn't assignable to another type that itself embeds a
 * `Record<string, unknown>` index signature, even though every store is structurally one.
 */
export function storeToRefs<S extends Record<string, unknown>>(
    store: S
): StoreToRefs<S> {
    const rawStore = toRaw(store) as unknown as StateTree;
    const refs = {} as StoreToRefs<S>;

    for (const key of Object.keys(rawStore)) {
        if (key.startsWith('$')) {
            continue;
        }

        const value = (store as unknown as StateTree)[key];
        if (typeof value === 'function') {
            continue;
        }

        (refs as unknown as StateTree)[key] = toRef(
            store as unknown as StateTree,
            key
        );
    }

    return refs;
}
