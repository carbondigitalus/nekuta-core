---
sidebar_position: 3
---

# Getters

Getters are computed values derived from state — the equivalent of a Vue `computed()`, memoized and only recomputed when something they actually read changes.

```ts
getters: {
    doubleCount: (state) => state.count * 2;
}
```

Read them exactly like state, no function call:

```ts
counter.doubleCount; // not counter.doubleCount()
```

## Calling another getter or an action

A getter written as `(state) => ...` only has access to `state`. To reach `this` (the full store — other getters, actions, `$patch`, etc.), write it as a regular method instead of an arrow function:

```ts
getters: {
    doubleCount: (state) => state.count * 2,
    quadrupleCount(): number {
        // `this` is the full store here
        return this.doubleCount * 2;
    }
}
```

This mirrors Pinia exactly: `state =>` getters are simpler and slightly cheaper to type; `this`-based getters can compose with the rest of the store.

## Memoization

A getter only recomputes when a piece of state it actually read during its last run changes — reading an _unrelated_ property doesn't trigger it:

```ts
getters: {
    doubleCount: (state) => state.count * 2; // only depends on `count`
}

store.otherField = 'x'; // doubleCount is NOT recomputed
store.count++; // doubleCount IS recomputed, next time it's read
```

This is the same automatic dependency tracking Pinia getters get from Vue's reactivity system — Nekuta's own reactivity engine (see [Reactivity Model](./reactivity-model.md)) provides the same guarantee.

## Cross-store getters — a caveat

A getter can call another store's own accessor to combine state across stores, the same pattern Pinia supports:

```ts
getters: {
    combined(): number {
        return this.remainingCount + useOtherStore().count;
    }
}
```

This works when there's an active `Nekuta` instance to resolve `useOtherStore()` against — inside a component tree wrapped in `<NekutaStore>`, or anywhere `setActiveNekuta()` has been called. It's **not reliable during Next.js App Router server rendering**: the module-level "active instance" a bare `useOtherStore()` call resolves against doesn't survive React's async streaming render the way a single synchronous call (like a Pages Router `getServerSideProps` call) does. If a getter like this needs to work during App Router SSR, combine the two stores at the **component** level instead — call `useStore()` for each and combine the results in your component, rather than inside the getter:

```tsx
function Combined() {
    const a = useStore(useStoreA);
    const b = useStore(useStoreB);
    return <p>{a.remainingCount + b.count}</p>;
}
```

`useStore()` resolves through React Context, which — unlike a plain module-level variable — is part of the actual component tree and survives RSC's streaming render correctly. See [Next.js App Router](../ssr/nextjs-app-router.md) for more on why.
