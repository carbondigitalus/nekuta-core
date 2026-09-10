/**
 * @jest-environment jsdom
 */
import { defineStore, useStore } from '@nekuta/core';
import { render, screen, type RenderOptions } from '@testing-library/react';
import { NekutaAppProvider } from './NekutaAppProvider.js';
import { NEKUTA_STATE_PROP } from './withNekutaSSR.js';

const useCounterStore = defineStore({
    id: 'counter',
    state: () => ({ count: 0 })
});

function Probe() {
    const store = useStore(useCounterStore);
    return <span data-testid="count">{store.count}</span>;
}

function renderApp(
    pageProps: Record<string, unknown>,
    options?: RenderOptions
) {
    return render(
        <NekutaAppProvider pageProps={pageProps}>
            <Probe />
        </NekutaAppProvider>,
        options
    );
}

describe('NekutaAppProvider', () => {
    it('hydrates from pageProps.__NEKUTA_STATE__ when present', () => {
        renderApp({ [NEKUTA_STATE_PROP]: { counter: { count: 9 } } });
        expect(screen.getByTestId('count')).toHaveTextContent('9');
    });

    it('creates a fresh instance when there is no __NEKUTA_STATE__', () => {
        renderApp({});
        expect(screen.getByTestId('count')).toHaveTextContent('0');
    });

    it('does not re-hydrate on a later pageProps change (one-time initial hydration only)', () => {
        const { rerender } = renderApp({
            [NEKUTA_STATE_PROP]: { counter: { count: 9 } }
        });
        expect(screen.getByTestId('count')).toHaveTextContent('9');

        rerender(
            <NekutaAppProvider
                pageProps={{ [NEKUTA_STATE_PROP]: { counter: { count: 999 } } }}
            >
                <Probe />
            </NekutaAppProvider>
        );

        // Still 9 — a later navigation's server snapshot must not clobber live client state.
        expect(screen.getByTestId('count')).toHaveTextContent('9');
    });
});
