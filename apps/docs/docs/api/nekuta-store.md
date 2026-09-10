---
sidebar_position: 5
---

# `<NekutaStore>`

```tsx
function NekutaStore(props: {
    nekuta?: Nekuta;
    plugins?: NekutaPlugin[];
    children?: ReactNode;
}): JSX.Element;
```

Root component for a Nekuta-powered app: creates a [`Nekuta`](./create-nekuta.md) instance and makes it available to [`useStore()`](./use-store.md)/[`connectStore()`](./connect-store.md) below it in the tree, via React Context — in one step.

```tsx
import { NekutaStore } from '@nekuta/core';

function App() {
    return (
        <NekutaStore>
            <YourApp />
        </NekutaStore>
    );
}
```

## Props

- **`nekuta`** (optional) — an existing `Nekuta` instance to use instead of creating one. Omit this to have `NekutaStore` create and own one automatically (the common case for a plain client-rendered app). This is the escape hatch used internally by `@nekuta/next`'s [`NekutaAppProvider`](../ssr/nextjs-pages-router.md) (Pages Router) and [`NekutaClientProvider`](../ssr/nextjs-app-router.md) (App Router), which each create a per-request instance server-side and hand it in — you generally don't need this prop unless you're wiring SSR by hand.
- **`plugins`** (optional) — plugins to install, applied only when `NekutaStore` creates its own instance (ignored if `nekuta` is passed — install plugins on that instance yourself before rendering).

## `NekutaContext`

The underlying `React.Context` object `NekutaStore` writes to, exported for the rare case you need to read it directly (`useContext(NekutaContext)`) rather than through [`useNekuta()`](./use-store.md#usenekuta).
