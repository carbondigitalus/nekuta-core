'use client';

import { createContext } from 'react';
import type { Nekuta } from '../store/index.js';

/**
 * The underlying React Context `<NekutaStore>` writes to and `useNekuta()`/`useStore()`/
 * `connectStore()` read from. Not rendered directly by app code — use `<NekutaStore>`.
 */
export const NekutaContext = createContext<Nekuta | undefined>(undefined);
