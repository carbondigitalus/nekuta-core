'use client';

import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { ReactiveEffect, resetEffectTracking } from '../reactivity/index.js';
import { createTrackedProxy } from './trackedProxy.js';

/**
 * Wraps `target` (a store, or a plain `{ key: store }` map for connectStore's multiple-store
 * case) in a tracked proxy and re-renders the calling component only when a property it actually
 * READ during its last render changes — not on any change to the underlying store(s), the coarse
 * behavior Milestone 4 shipped with. Fine-grained tracking, matching Pinia's DX.
 *
 * One `ReactiveEffect` lives for the whole lifetime of the hook (a ref, not recreated per render).
 * Its scheduler — called by the reactivity engine's own trigger() whenever a tracked dependency
 * changes, no separate subscription mechanism needed — bumps a version counter and notifies
 * useSyncExternalStore. Dependencies tracked during the PREVIOUS render are dropped once, here in
 * the hook body (which runs exactly once per actual render) — deliberately NOT inside getSnapshot,
 * which React's own contract allows calling more than once per render for its internal consistency
 * checks; a side effect there would wipe out the current render's just-collected tracking the
 * moment React re-invoked it, which is exactly what happened before this was split out.
 */
export function useTrackedProxy<T extends object>(target: T): T {
    const versionRef = useRef(0);
    const notifyRef = useRef<(() => void) | null>(null);

    const effectRef = useRef<ReactiveEffect | null>(null);
    if (!effectRef.current) {
        effectRef.current = new ReactiveEffect(
            () => {},
            () => {
                versionRef.current++;
                notifyRef.current?.();
            }
        );
    }

    resetEffectTracking(effectRef.current);

    const subscribe = useCallback((onStoreChange: () => void) => {
        notifyRef.current = onStoreChange;
        return () => {
            notifyRef.current = null;
            effectRef.current?.stop();
        };
    }, []);

    const getSnapshot = useCallback(() => versionRef.current, []);

    useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    // eslint-disable-next-line react-hooks/exhaustive-deps -- effectRef.current is stable for the hook's lifetime
    return useMemo(
        () => createTrackedProxy(target, effectRef.current!),
        [target]
    );
}
