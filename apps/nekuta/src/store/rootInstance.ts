import type { Nekuta } from './createNekuta';

/**
 * A plain module-level singleton — the SSR-unsafe, non-Context-aware fallback Pinia itself falls
 * back to outside a component tree. React binds (Milestone 4's react/context.tsx + useNekuta.ts)
 * check a Context first and only fall back to this singleton when there isn't one; this module has
 * no React dependency and is fully usable headless (tests, non-component code) on its own.
 */
let activeNekuta: Nekuta | undefined;

export function setActiveNekuta(
    nekuta: Nekuta | undefined
): Nekuta | undefined {
    activeNekuta = nekuta;
    return nekuta;
}

export function getActiveNekuta(): Nekuta | undefined {
    return activeNekuta;
}
