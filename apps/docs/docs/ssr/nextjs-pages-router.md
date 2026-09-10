---
sidebar_position: 1
---

# Next.js — Pages Router

Two pieces from `@nekuta/next`: `withNekutaSSR()` wraps `getServerSideProps`, and `NekutaAppProvider` wraps your `_app.tsx`.

## `_app.tsx`

```tsx title="pages/_app.tsx"
import { NekutaAppProvider } from '@nekuta/next';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <NekutaAppProvider pageProps={pageProps}>
            <Component {...pageProps} />
        </NekutaAppProvider>
    );
}
```

`NekutaAppProvider` creates one `Nekuta` instance for the client's entire session (on first mount) and hydrates it from `pageProps.__NEKUTA_STATE__` if a page's `getServerSideProps` set one. It renders a [`<NekutaProvider>`](../api/nekuta-provider.md) internally — you don't add one yourself in a Pages Router app.

## A page

```tsx title="pages/index.tsx"
import { withNekutaSSR } from '@nekuta/next';
import { useCounterStore } from '../stores/counterStore';

export const getServerSideProps = withNekutaSSR(async (context) => {
    // A fresh Nekuta instance is already active for this request by the time this runs —
    // defineStore() accessors called here (with no explicit instance) resolve against it.
    const counter = useCounterStore();
    counter.count = await fetchInitialCount();

    return { props: {} };
});

export default function HomePage() {
    const counter = useStore(useCounterStore);
    return <p>{counter.count}</p>;
}
```

`withNekutaSSR()` creates a fresh `Nekuta` instance for each request, makes it the active instance for the duration of your `getServerSideProps` function (so any store you touch resolves against _this_ request, not some other one), then serializes its state onto `pageProps.__NEKUTA_STATE__` automatically. You don't need to call `serializeNekutaState()` yourself for the Pages Router — `withNekutaSSR()` already does it.

You can also wrap a page with no `getServerSideProps` of your own at all — `withNekutaSSR()` with no argument just creates the request-scoped instance and serializes its (empty) state, which is enough if the page's stores only need client-side interaction, no server-fetched initial data.

## Hydration is one-time, not per-navigation

Worth knowing: `NekutaAppProvider` hydrates from `__NEKUTA_STATE__` **once**, on the client's first mount. Navigating to another page client-side (Next's own router, not a full page load) does **not** re-hydrate the store from that page's `getServerSideProps` result, even though Next still calls `getServerSideProps` for it.

This is deliberate. Once the client owns a store — the user has clicked a button, added an item, whatever — a later page's server-computed default state must not silently overwrite it. SSR seeds the _initial_ load; the client is authoritative after that, the same as Pinia's own Nuxt integration.

See [Hydration & skipHydrate](./hydration-and-skip-hydrate.md) for what actually gets serialized.
