---
sidebar_position: 9
---

# `@nekuta/next`

Covered with full examples in [SSR & Next.js](../ssr/nextjs-pages-router.md) — this page is the quick signature reference. One package, plain named exports (no subpath split — see the project's build plan for why), internally organized by router.

## Pages Router

```ts
function withNekutaSSR<
    P extends Record<string, unknown> = Record<string, unknown>
>(
    getServerSideProps?: GetServerSideProps<P>
): GetServerSideProps<P & { __NEKUTA_STATE__: SerializedNekutaState }>;
```

```tsx
function NekutaAppProvider(props: {
    pageProps: Record<string, unknown>;
    children: ReactNode;
}): JSX.Element;
```

## App Router

```ts
const getServerNekuta: () => Nekuta; // wrapped in React's cache()
```

```tsx
function NekutaClientProvider(props: {
    state: SerializedNekutaState;
    children: ReactNode;
}): JSX.Element; // "use client"
```

See [Next.js — Pages Router](../ssr/nextjs-pages-router.md) and [Next.js — App Router](../ssr/nextjs-app-router.md) for how these four fit together.
