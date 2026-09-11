# 0.1.0 (2026-09-11)

First public release. `@nekuta/next` is the Next.js adapter for [`@nekuta/core`](https://www.npmjs.com/package/@nekuta/core) — SSR and hydration support for both the Pages Router and the App Router, from a single package with named exports for each (kept internally organized by directory, `src/pages/`/`src/app/`, so the two never tangle together in code).

## Pages Router

- **`withNekutaSSR()`** — wraps `getServerSideProps`. Creates a fresh `Nekuta` instance for each request and makes it the active instance for the duration of data-fetching, so `defineStore()` accessors called inside `getServerSideProps` resolve against the right, request-isolated instance — verified to correctly isolate state between two separate concurrent requests, not just sequential ones. Serializes the resulting state onto `pageProps.__NEKUTA_STATE__`.
- **`<NekutaAppProvider>`** — the `_app.tsx` integration. Creates one `Nekuta` instance for the client's entire session on first mount, hydrating it from the first page's `__NEKUTA_STATE__` if present. Deliberately does **not** re-hydrate on a later client-side navigation to a different page — once the client owns a store, a subsequent page's `getServerSideProps` re-running that store's `state()` server-side must not silently overwrite state the user has already interacted with. SSR seeds the initial load only; after that, the client instance is authoritative — the same behavior Pinia's own Nuxt integration has.

## App Router

- **`getServerNekuta()`** — a `cache()`-wrapped per-request `Nekuta` instance, following React's own documented pattern for per-request server resources, since there's no persistent "app instance" available in the RSC render the way Pages Router has `_app.tsx`.
- **`<NekutaClientProvider>`** — the `"use client"` boundary an ancestor Server Component hands its serialized state to. Since nothing above it in the tree can hold React state, this component _is_ the actual store-providing boundary for everything rendered below it. Hydrates from its `state` prop once, on mount — same one-time-only hydration rule as the Pages Router side.

## Known limitation

A getter on one store calling a sibling store's bare (no-argument) accessor relies on the module-level active-instance singleton — that's reliable for the Pages Router's synchronous `getServerSideProps` call, but **not reliable under the App Router's async streaming render**, even for single-page static generation. If a getter like this needs to work correctly during App Router SSR, combine the two stores at the _component_ level instead — call `useStore()` for each and combine the results in your component, rather than inside the getter. This is documented directly in the SSR docs and demonstrated in the playground app.

## Notes

- Both routers consume `@nekuta/core`'s `ssr/serialize.ts`/`skipHydrate.ts` helpers directly — this package only handles _transport_ of the serialized state blob for each router, the same relationship `@pinia/nuxt`'s payload plugin has to Pinia core.
- Peer-depends on `@nekuta/core`, `react`/`react-dom` `^19`, and `next` `^15.0.0 || ^16.0.0`.
- Currently one combined package covering both routers rather than two separate `@nekuta/next-pages`/`@nekuta/next-app` packages — the simplest thing that works today; a split remains the eventual plan once the two routers' needs actually diverge enough to justify the overhead.
