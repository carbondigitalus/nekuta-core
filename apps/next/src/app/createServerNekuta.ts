import { createNekuta, type Nekuta } from '@nekuta/core';
import { cache } from 'react';

/**
 * Per-request Nekuta singleton for the App Router — React's documented pattern for per-request
 * resources in Server Components (`cache()` memoizes within a single render pass; outside an RSC
 * environment it's effectively a no-op, so this must only be called from Server Component code).
 * The RSC-era equivalent of Nuxt's server plugin creating one Pinia instance per SSR request.
 */
export const getServerNekuta = cache((): Nekuta => createNekuta());
