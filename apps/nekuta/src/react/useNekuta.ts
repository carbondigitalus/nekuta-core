'use client';

import { useContext } from 'react';
import { getActiveNekuta, type Nekuta } from '../store/index.js';
import { NekutaContext } from './context.js';

/**
 * Resolves the active Nekuta instance: a `<NekutaStore>` above in the tree first, falling back
 * to the module-level singleton (`setActiveNekuta()`) — the same fallback the headless store
 * engine itself uses outside of React (see store/rootInstance.ts).
 */
export function useNekuta(): Nekuta {
    const contextNekuta = useContext(NekutaContext);
    const nekuta = contextNekuta ?? getActiveNekuta();

    if (!nekuta) {
        throw new Error(
            'nekuta: no <NekutaStore> found in the component tree, and no active Nekuta instance is set. Wrap your app in <NekutaStore> (or call setActiveNekuta() before rendering).'
        );
    }

    return nekuta;
}
