import { createContext, type ReactNode } from 'react';
import type { Nekuta } from '../store/index.js';

export const NekutaContext = createContext<Nekuta | undefined>(undefined);

export interface NekutaProviderProps {
    nekuta: Nekuta;
    children?: ReactNode;
}

/** Makes a Nekuta instance available to `useStore()`/`connectStore()` below it in the tree. */
export function NekutaProvider({ nekuta, children }: NekutaProviderProps) {
    return (
        <NekutaContext.Provider value={nekuta}>
            {children}
        </NekutaContext.Provider>
    );
}
