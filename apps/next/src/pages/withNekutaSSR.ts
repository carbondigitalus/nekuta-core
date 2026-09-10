import {
    createNekuta,
    serializeNekutaState,
    setActiveNekuta,
    type SerializedNekutaState
} from '@nekuta/core';
import type {
    GetServerSideProps,
    GetServerSidePropsContext,
    GetServerSidePropsResult
} from 'next';

export const NEKUTA_STATE_PROP = '__NEKUTA_STATE__';

export interface WithNekutaStateProp {
    [NEKUTA_STATE_PROP]: SerializedNekutaState;
}

/**
 * Wraps a page's `getServerSideProps`: creates a fresh Nekuta instance per request, makes it the
 * active instance for the duration of data-fetching (so any `defineStore()` accessor called
 * during `getServerSideProps` — including from the wrapped function itself — resolves against
 * it, not some other request's), then serializes its state onto `pageProps.__NEKUTA_STATE__` for
 * `NekutaAppProvider` to pick up. `setActiveNekuta` is always reset back to `undefined` in a
 * `finally`, since a long-lived Node process serving multiple requests must not leak one
 * request's instance into the next.
 */
export function withNekutaSSR<
    P extends Record<string, unknown> = Record<string, unknown>
>(
    getServerSideProps?: GetServerSideProps<P>
): GetServerSideProps<P & WithNekutaStateProp> {
    return async (
        context: GetServerSidePropsContext
    ): Promise<GetServerSidePropsResult<P & WithNekutaStateProp>> => {
        const nekuta = createNekuta();
        setActiveNekuta(nekuta);

        try {
            const result = getServerSideProps
                ? await getServerSideProps(context)
                : ({ props: {} as P } as GetServerSidePropsResult<P>);

            if (!('props' in result)) {
                // A redirect or notFound result — no page will render, nothing to hydrate.
                return result;
            }

            const props = await result.props;
            const nekutaState = serializeNekutaState(nekuta);

            return {
                props: {
                    ...props,
                    [NEKUTA_STATE_PROP]: nekutaState
                } as P & WithNekutaStateProp
            };
        } finally {
            setActiveNekuta(undefined);
        }
    };
}
