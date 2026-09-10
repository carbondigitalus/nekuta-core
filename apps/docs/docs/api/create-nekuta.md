---
sidebar_position: 6
---

# `createNekuta()`

```ts
function createNekuta(): Nekuta;
```

Creates a new `Nekuta` instance — the root object every store lives on, the equivalent of Pinia's `createPinia()`. Typically created once per app (client-side) or once per request (server-side — see [SSR & Next.js](../ssr/nextjs-pages-router.md)).

```ts
const nekuta = createNekuta();
```

A `Nekuta` instance holds:

- `state` — the root reactive state tree (every store's state, keyed by id).
- `_s` — the store registry (a `Map<string, Store>`).
- `_p` — registered [plugins](../core-concepts/plugins.md).
- `use(plugin)` — registers a plugin; chainable.

You won't normally touch `state`/`_s`/`_p` directly — they're there for plugin authors and Nekuta's own internals.

## `disposeNekuta(nekuta)`

```ts
function disposeNekuta(nekuta: Nekuta): void;
```

Tears down an instance entirely: stops its root reactive scope (and every store's scope nested under it), clears the store registry, and resets state to `{}`. Rare to need directly — mostly useful in tests that create many short-lived instances, or a long-running process (a worker, a script) that creates instances in a loop and needs to release them.

## `setActiveNekuta()` / `getActiveNekuta()`

```ts
function setActiveNekuta(nekuta: Nekuta | undefined): Nekuta | undefined;
function getActiveNekuta(): Nekuta | undefined;
```

A plain module-level singleton — the fallback [`useNekuta()`](./use-store.md#usenekuta) and a bare `useCounterStore()` call (no explicit instance) resolve against when there's no React Context to read from (outside a component entirely: scripts, plugin code, a getter reaching for a sibling store — see [Getters](../core-concepts/getters.md#cross-store-getters--a-caveat)).

```ts
setActiveNekuta(nekuta);
// ... code that calls store accessors with no explicit instance ...
setActiveNekuta(undefined); // don't leak it into unrelated code afterward
```

`@nekuta/next`'s `withNekutaSSR()` already manages this correctly for Pages Router requests — you only need to call it directly for your own headless code (tests, scripts) or a custom SSR flow.
