---
sidebar_position: 5
---

# `<NekutaProvider>`

```tsx
function NekutaProvider(props: {
    nekuta: Nekuta;
    children?: ReactNode;
}): JSX.Element;
```

Makes a [`Nekuta`](./create-nekuta.md) instance available to [`useStore()`](./use-store.md)/[`connectStore()`](./connect-store.md) below it in the tree, via React Context.

```tsx
import { createNekuta, NekutaProvider } from 'nekuta';

const nekuta = createNekuta();

function App() {
    return (
        <NekutaProvider nekuta={nekuta}>
            <YourApp />
        </NekutaProvider>
    );
}
```

If you're using Next.js, you generally don't render this directly — `@nekuta/next`'s [`NekutaAppProvider`](../ssr/nextjs-pages-router.md) (Pages Router) and [`NekutaClientProvider`](../ssr/nextjs-app-router.md) (App Router) both render one internally, already wired for hydration.

## `NekutaContext`

The underlying `React.Context` object, exported for the rare case you need to read it directly (`useContext(NekutaContext)`) rather than through [`useNekuta()`](./use-store.md#usenekuta).
