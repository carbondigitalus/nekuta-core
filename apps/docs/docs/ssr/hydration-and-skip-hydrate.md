---
sidebar_position: 3
---

# Hydration & `skipHydrate`

Both Next.js adapters rely on the same three functions from `nekuta` (not `@nekuta/next` — this logic is router-agnostic, the adapters only handle _transporting_ the result):

- **`serializeNekutaState(nekuta)`** — dehydrates a whole `Nekuta` instance's state into a plain, `JSON.stringify`-safe value. `Map`/`Set` state (valid, since `$patch`'s merge logic supports them) is encoded so it round-trips correctly; anything marked with `skipHydrate()` is dropped, deeply, at any nesting level.
- **`deserializeNekutaState(serialized)`** — the inverse: rebuilds `Map`/`Set` from their encoded form.
- **`hydrateNekutaState(nekuta, serialized)`** — merges a deserialized state tree into a `Nekuta` instance. Must run **before** any store owning one of those ids is first resolved, so its `state()`/setup function sees the hydrated values instead of its own defaults — both `@nekuta/next` providers already call this at the right time; you only need it directly if you're building a custom hydration flow.

## `skipHydrate()`

Marks a value to be excluded from serialization — for state that can't survive a JSON round-trip, or shouldn't: a class instance, a live socket connection, anything the client should construct fresh rather than receive from the server.

```ts
import { skipHydrate } from 'nekuta';

state: () => ({
    count: 0,
    connection: skipHydrate(createLiveConnection())
});
```

`serializeNekutaState()` omits `connection` entirely from the serialized payload; the client-side store still gets a value for it (from re-running `state()` on the client), it's just never sent over the wire.
