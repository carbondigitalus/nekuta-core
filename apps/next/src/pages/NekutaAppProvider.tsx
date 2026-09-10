import {
    createNekuta,
    hydrateNekutaState,
    NekutaProvider,
    type Nekuta
} from '@nekuta/core';
import { useState, type ReactNode } from 'react';
import {
    NEKUTA_STATE_PROP,
    type WithNekutaStateProp
} from './withNekutaSSR.js';

export interface NekutaAppProviderProps {
    /** `_app.tsx`'s own `pageProps` — read once for `__NEKUTA_STATE__`, if `withNekutaSSR` set it. */
    pageProps: Partial<WithNekutaStateProp> & Record<string, unknown>;
    children: ReactNode;
}

/**
 * `_app.tsx` integration: creates one Nekuta instance for the client's whole session, hydrating
 * it from the FIRST page's `__NEKUTA_STATE__` if present. Deliberately does NOT re-hydrate on
 * later client-side navigations — once the client owns a store, a subsequent page's
 * `getServerSideProps` re-running that store's `state()` server-side must not silently overwrite
 * state the user has already interacted with. SSR only seeds the initial load; after that the
 * client instance is authoritative, same as Pinia's own Nuxt behavior.
 */
export function NekutaAppProvider({
    pageProps,
    children
}: NekutaAppProviderProps) {
    const [nekuta] = useState<Nekuta>(() => {
        const instance = createNekuta();
        const state = pageProps[NEKUTA_STATE_PROP];
        if (state) {
            hydrateNekutaState(instance, state);
        }
        return instance;
    });

    return <NekutaProvider nekuta={nekuta}>{children}</NekutaProvider>;
}
