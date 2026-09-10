'use client';

import type { Nekuta, StoreGeneric } from '../store/index.js';
import { useTrackedProxy } from './subscription.js';
import { useNekuta } from './useNekuta.js';

export type UseStoreDefinition<S extends StoreGeneric> = (nekuta?: Nekuta) => S;

/**
 * Resolves `useStoreDefinition` against the active Nekuta instance and re-renders the calling
 * component only when a property it actually reads changes — fine-grained, matching Pinia's DX
 * (see Milestone 9's notes in the plan for how: the returned store is a tracked proxy, not the
 * store itself, built on the reactivity engine's own dependency tracking).
 */
export function useStore<S extends StoreGeneric>(
    useStoreDefinition: UseStoreDefinition<S>
): S {
    const nekuta = useNekuta();
    const store = useStoreDefinition(nekuta);

    return useTrackedProxy(store);
}
