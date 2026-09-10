const SKIP_HYDRATE = Symbol('nekuta:skip-hydrate');

/**
 * Marks a value to be excluded from `serializeNekutaState()`'s output — for state that can't
 * survive a JSON round-trip (a class instance, a live connection, anything the client should
 * rebuild fresh rather than receive from the server).
 */
export function skipHydrate<T extends object>(value: T): T {
    Object.defineProperty(value, SKIP_HYDRATE, {
        value: true,
        configurable: true
    });

    return value;
}

export function shouldHydrate(value: unknown): boolean {
    return !(
        value && (value as Record<symbol, unknown>)[SKIP_HYDRATE] === true
    );
}
