import { useCallback } from 'react';
import type { Nekuta, StoreGeneric } from '../store/index.js';
import { useSubscribeForRerender } from './subscription.js';
import { useNekuta } from './useNekuta.js';

export type UseStoreDefinition<S extends StoreGeneric> = (nekuta?: Nekuta) => S;

/**
 * Resolves `useStoreDefinition` against the active Nekuta instance and re-renders the calling
 * component on any subsequent change to that store — coarse-grained for now (any change re-renders,
 * not just the specific properties this component happens to read; see Milestone 9 in the plan).
 */
export function useStore<S extends StoreGeneric>(
    useStoreDefinition: UseStoreDefinition<S>
): S {
    const nekuta = useNekuta();
    const store = useStoreDefinition(nekuta);

    const subscribe = useCallback(
        (onChange: () => void) =>
            store.$subscribe(onChange, { detached: true }),
        [store]
    );

    useSubscribeForRerender(subscribe);

    return store;
}
