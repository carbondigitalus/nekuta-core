---
sidebar_position: 2
---

# Next.js — App Router

There's no persistent "app instance" in the App Router the way Pages Router has `_app.tsx` — Server Components render per-request, and state has to cross an explicit Server → Client boundary. Two pieces from `@nekuta/next` handle this: `getServerNekuta()` (a Server Component helper) and `<NekutaClientProvider>` (the Client Component boundary).

## Root layout

```tsx title="app/layout.tsx"
import { serializeNekutaState } from 'nekuta';
import { getServerNekuta, NekutaClientProvider } from '@nekuta/next';
import { useCounterStore } from '../stores/counterStore';

export default function RootLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const nekuta = getServerNekuta();

    // Populate whatever stores this request needs — a real app would fetch data here.
    useCounterStore(nekuta);

    const state = serializeNekutaState(nekuta);

    return (
        <html lang="en">
            <body>
                <NekutaClientProvider state={state}>
                    {children}
                </NekutaClientProvider>
            </body>
        </html>
    );
}
```

`getServerNekuta()` is wrapped in React's `cache()`, which memoizes it **per request** when called from Server Component code — the RSC-era equivalent of Nuxt's server plugin creating one Pinia instance per request. It only behaves this way inside an actual Server Component render; calling it from a plain test or script just creates a fresh instance every time.

`<NekutaClientProvider>` is a `"use client"` boundary — since nothing above it in the tree can hold React state (Server Components can't), this component _is_ the actual `<NekutaProvider>` for everything rendered below it. It hydrates from the `state` prop once, the same one-time-only rule described in [Pages Router](./nextjs-pages-router.md#hydration-is-one-time-not-per-navigation).

## A Client Component below it

Everything below `<NekutaClientProvider>` uses `useStore()`/`connectStore()` completely normally — they don't need to know they're in the App Router at all:

```tsx title="app/page.tsx"
'use client';

import { useStore } from 'nekuta';
import { useCounterStore } from '../stores/counterStore';

export default function Page() {
    const counter = useStore(useCounterStore);
    return <p>{counter.count}</p>;
}
```

## A caveat: cross-store getters during SSR

`getServerNekuta()`'s `cache()`-based per-request scoping does **not** set the module-level "active instance" the way `withNekutaSSR()` does for the Pages Router. If a getter in one store calls another store's bare accessor (`useOtherStore()`, no explicit instance — see [Getters](../core-concepts/getters.md#cross-store-getters--a-caveat)) and that getter gets evaluated during the App Router's server render, it will throw — there's nothing for the bare accessor to resolve against.

This isn't a narrow edge case specific to concurrent multi-request servers, either — it showed up even for a single, statically-generated page, because the App Router's render is internally asynchronous (streaming), and a plain synchronously-set global variable doesn't reliably stay set by the time a deeply nested Client Component's own render actually reads the getter.

If you need to combine two stores' state during App Router SSR, do it at the **component** level instead of inside a getter — call `useStore()` for each store and combine the results directly in your component. `useStore()` resolves through React Context, which is part of the actual component tree and survives the streaming render correctly:

```tsx
function Combined() {
    const a = useStore(useStoreA);
    const b = useStore(useStoreB);
    return <p>{a.value + b.value}</p>;
}
```
