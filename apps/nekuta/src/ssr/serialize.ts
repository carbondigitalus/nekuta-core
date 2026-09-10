import { toRaw } from '../reactivity/index.js';
import { isArray, isMap, isObject, isSet } from '../reactivity/shared.js';
import type { Nekuta, StateTree } from '../store/index.js';
import { shouldHydrate } from './skipHydrate.js';

const MAP_TYPE = '__nekuta_map__';
const SET_TYPE = '__nekuta_set__';

export type SerializedNekutaState = Record<string, unknown>;

/**
 * Dehydrates a Nekuta instance's whole state tree into a plain, `JSON.stringify`-safe value —
 * the server side of an SSR adapter's hydration handoff (see the Next.js adapter section of the
 * plan). Values marked via `skipHydrate()` are dropped; `Map`/`Set` (both valid store state per
 * `$patch`'s `mergeReactiveObjects`) are encoded so `deserializeNekutaState()` can rebuild them.
 */
export function serializeNekutaState(nekuta: Nekuta): SerializedNekutaState {
    const raw = toRaw(nekuta.state.value) as Record<string, StateTree>;
    const result: SerializedNekutaState = {};

    for (const storeId of Object.keys(raw)) {
        result[storeId] = serializeValue(raw[storeId]);
    }

    return result;
}

function serializeValue(value: unknown): unknown {
    const raw = toRaw(value);

    if (!isObject(raw)) {
        return raw;
    }

    if (!shouldHydrate(raw)) {
        return undefined;
    }

    if (isMap(raw)) {
        return {
            [MAP_TYPE]: [...raw.entries()].map(([key, val]) => [
                serializeValue(key),
                serializeValue(val)
            ])
        };
    }

    if (isSet(raw)) {
        return {
            [SET_TYPE]: [...raw.values()].map((val) => serializeValue(val))
        };
    }

    if (isArray(raw)) {
        return raw.map((item) => serializeValue(item));
    }

    const result: Record<string, unknown> = {};
    for (const key of Object.keys(raw)) {
        const serialized = serializeValue(
            (raw as Record<string, unknown>)[key]
        );
        if (serialized !== undefined) {
            result[key] = serialized;
        }
    }

    return result;
}

/** The inverse of `serializeNekutaState()` — rebuilds `Map`/`Set` state from their encoded form. */
export function deserializeNekutaState(
    serialized: SerializedNekutaState
): Record<string, StateTree> {
    const result: Record<string, StateTree> = {};

    for (const storeId of Object.keys(serialized)) {
        result[storeId] = deserializeValue(serialized[storeId]) as StateTree;
    }

    return result;
}

function deserializeValue(value: unknown): unknown {
    if (!isObject(value)) {
        return value;
    }

    if (MAP_TYPE in value) {
        const entries = value[MAP_TYPE] as [unknown, unknown][];
        return new Map(
            entries.map(([key, val]) => [
                deserializeValue(key),
                deserializeValue(val)
            ])
        );
    }

    if (SET_TYPE in value) {
        const items = value[SET_TYPE] as unknown[];
        return new Set(items.map((item) => deserializeValue(item)));
    }

    if (isArray(value)) {
        return value.map((item) => deserializeValue(item));
    }

    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
        result[key] = deserializeValue((value as Record<string, unknown>)[key]);
    }

    return result;
}

/**
 * Merges a previously-serialized state tree into a Nekuta instance — must run before any store
 * that owns one of these ids is first resolved, so its setup/state() call sees the hydrated
 * values rather than fresh defaults (the client side of the hydration handoff).
 */
export function hydrateNekutaState(
    nekuta: Nekuta,
    serialized: SerializedNekutaState
): void {
    const deserialized = deserializeNekutaState(serialized);

    for (const storeId of Object.keys(deserialized)) {
        nekuta.state.value[storeId] = deserialized[storeId];
    }
}
