import { isRef } from '../reactivity';
import type { DeepPartial, StateTree } from './types';

function isMergeableObject(value: unknown): value is StateTree {
    return Object.prototype.toString.call(value) === '[object Object]';
}

export function mergeReactiveObjects<T extends StateTree>(
    target: T,
    patchToApply: DeepPartial<T>
): T {
    if (target instanceof Map && patchToApply instanceof Map) {
        (patchToApply as Map<unknown, unknown>).forEach((value, key) =>
            target.set(key, value)
        );
        return target;
    }

    if (target instanceof Set && patchToApply instanceof Set) {
        (patchToApply as Set<unknown>).forEach((value) => target.add(value));
        return target;
    }

    for (const key in patchToApply) {
        if (!Object.prototype.hasOwnProperty.call(patchToApply, key)) {
            continue;
        }

        const subPatch = (patchToApply as Record<string, unknown>)[key];
        const targetValue = (target as Record<string, unknown>)[key];

        if (
            isMergeableObject(targetValue) &&
            isMergeableObject(subPatch) &&
            Object.prototype.hasOwnProperty.call(target, key) &&
            !isRef(subPatch)
        ) {
            (target as Record<string, unknown>)[key] = mergeReactiveObjects(
                targetValue,
                subPatch
            );
        } else {
            (target as Record<string, unknown>)[key] = subPatch;
        }
    }

    return target;
}
