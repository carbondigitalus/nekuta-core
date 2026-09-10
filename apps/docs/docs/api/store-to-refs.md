---
sidebar_position: 7
---

# `storeToRefs()`

```ts
function storeToRefs<S extends Record<string, unknown>>(
    store: S
): StoreToRefs<S>;
```

Splits a store's state and getters off into individually-subscribable refs — the same purpose as Pinia's `storeToRefs()`: destructuring a store directly (`const { count } = counter`) loses reactivity, since it copies the current value out at that instant rather than keeping a live binding. `storeToRefs()` gives you refs instead, which do stay live:

```ts
import { storeToRefs } from '@nekuta/core';

const counter = useStore(useCounterStore);
const { count, doubleCount } = storeToRefs(counter);

count.value; // stays in sync with counter.count going forward
```

`$`-prefixed store methods (`$patch`, `$subscribe`, etc.) and actions (any function-valued property) are excluded — only state and getters get turned into refs. Actions should be destructured directly off the store instead, since they don't need reactivity (`const { increment } = counter` is fine on its own).
