---
sidebar_position: 5
---

# Plugins

A plugin extends every store created on a `Nekuta` instance — the same extension point Pinia plugins use.

```ts
import { createNekuta } from 'nekuta';

const nekuta = createNekuta();

nekuta.use(({ store, nekuta, options }) => {
    // Runs once per store, right after it's created.
    return {
        createdAt: new Date()
    };
});
```

Whatever object a plugin returns is merged onto the store — `store.createdAt` would be available on every store from then on. A plugin that doesn't need to add anything can return nothing (`undefined`/`void`).

## The plugin context

- **`store`** — the store that was just created (already fully set up — state, getters, actions, `$patch`/`$subscribe`/etc. are all present).
- **`nekuta`** — the `Nekuta` instance the store belongs to. Useful for a plugin that needs to read/write other stores, or stash instance-level state.
- **`options`** — whatever was passed to `defineStore()` for this store (the full options object for an options store; `{ id }` only for a setup store, since there's no separate options object to inspect there).

## Registering multiple plugins

`use()` returns the instance, so calls chain — and plugins run in the order they were registered, for every store created after that point (a plugin registered after a store already exists won't retroactively apply to it):

```ts
createNekuta().use(persistencePlugin).use(loggerPlugin);
```

## What plugins are for

Anything that should apply uniformly across stores without each store opting in individually — persistence to `localStorage`, wiring up a router reference, attaching a logger, computed devtools metadata. If you only need to extend _one_ specific store, it's usually simpler to just add what you need directly in that store's own definition instead.
