---
sidebar_position: 8
---

# SSR helpers

Covered in depth in [Hydration & skipHydrate](../ssr/hydration-and-skip-hydrate.md) — this page is the quick signature reference.

```ts
function serializeNekutaState(nekuta: Nekuta): SerializedNekutaState;
function deserializeNekutaState(
    serialized: SerializedNekutaState
): Record<string, StateTree>;
function hydrateNekutaState(
    nekuta: Nekuta,
    serialized: SerializedNekutaState
): void;

function skipHydrate<T extends object>(value: T): T;
function shouldHydrate(value: unknown): boolean;
```

All five live in `nekuta` (not `@nekuta/next`) — they're router-agnostic; the Next.js adapter only handles _transporting_ the serialized value across the server/client boundary for each router.
