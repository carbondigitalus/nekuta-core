'use client';

import { useState, type ReactNode } from 'react';
import {
    createNekuta,
    type Nekuta,
    type NekutaPlugin
} from '../store/index.js';
import { NekutaContext } from './context.js';

export interface NekutaStoreProps {
    /**
     * An existing Nekuta instance to use instead of creating one — for the SSR case where an
     * instance was already created per-request (e.g. by the Next.js adapter). Omit this to have
     * `NekutaStore` create and own one automatically.
     */
    nekuta?: Nekuta;
    /** Plugins to install, applied only when `NekutaStore` creates its own instance. */
    plugins?: NekutaPlugin[];
    children?: ReactNode;
}

/**
 * Root component for a Nekuta-powered app: creates a `Nekuta` instance and makes it available to
 * `useStore()`/`connectStore()` below it in the tree, in one step.
 *
 * ```tsx
 * export function App() {
 *     return (
 *         <NekutaStore>
 *             <Counter />
 *         </NekutaStore>
 *     );
 * }
 * ```
 */
export function NekutaStore({ nekuta, plugins, children }: NekutaStoreProps) {
    const [ownNekuta] = useState<Nekuta | undefined>(() => {
        if (nekuta) {
            return undefined;
        }

        const instance = createNekuta();
        plugins?.forEach((plugin) => instance.use(plugin));
        return instance;
    });

    return (
        <NekutaContext.Provider value={nekuta ?? ownNekuta}>
            {children}
        </NekutaContext.Provider>
    );
}
