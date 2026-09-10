'use client';

import {
    createNekuta,
    hydrateNekutaState,
    NekutaStore,
    type Nekuta,
    type SerializedNekutaState
} from '@nekuta/core';
import { useState, type ReactNode } from 'react';

export interface NekutaClientProviderProps {
    /** Usually `serializeNekutaState(getServerNekuta())`, computed in an ancestor Server Component. */
    state: SerializedNekutaState;
    children: ReactNode;
}

/**
 * The Client Component boundary an ancestor Server Component hands its serialized state to —
 * there's no persistent "app instance" in RSC the way Pages Router has `_app.tsx`, so this is
 * itself the actual `NekutaStore` boundary for everything rendered below it. Only hydrates
 * once per client instance (see NekutaAppProvider's note on the Pages Router side for why:
 * SSR seeds the initial load, the client owns state after that).
 */
export function NekutaClientProvider({
    state,
    children
}: NekutaClientProviderProps) {
    const [nekuta] = useState<Nekuta>(() => {
        const instance = createNekuta();
        hydrateNekutaState(instance, state);
        return instance;
    });

    return <NekutaStore nekuta={nekuta}>{children}</NekutaStore>;
}
