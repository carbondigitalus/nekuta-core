'use client';

import { useCallback, useRef, useSyncExternalStore } from 'react';

/**
 * Bridges a Nekuta subscription (fires on ANY relevant change, no fine-grained dependency
 * tracking yet — see the plan's Milestone 9) to React's `useSyncExternalStore`.
 *
 * `useSyncExternalStore` decides whether to re-render by comparing `getSnapshot()`'s result
 * across calls with `Object.is` — but a Nekuta store mutates its state IN PLACE (same object
 * reference before and after a change), so the store itself can't be the snapshot value. Instead
 * a version counter is bumped inside the subscription callback and returned as the snapshot: a
 * plain number that's trivially a new value (by `Object.is`) every time something changed.
 */
export function useSubscribeForRerender(
    subscribe: (onStoreChange: () => void) => () => void
): void {
    const versionRef = useRef(0);

    const stableSubscribe = useCallback(
        (onStoreChange: () => void) =>
            subscribe(() => {
                versionRef.current++;
                onStoreChange();
            }),
        [subscribe]
    );

    const getSnapshot = useCallback(() => versionRef.current, []);

    // getServerSnapshot: required whenever this can be part of a server-rendered/statically
    // generated tree (any Next.js App Router page not explicitly forced dynamic) — without it,
    // React errors during prerendering. The version counter's fresh-mount value (0) is exactly
    // the right server snapshot: there's no prior subscription state to diverge from during SSR.
    useSyncExternalStore(stableSubscribe, getSnapshot, getSnapshot);
}
