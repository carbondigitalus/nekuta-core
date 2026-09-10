---
sidebar_position: 7
---

# Reactivity Model

If you know Vue, Nekuta's reactivity works the way you'd expect and you can skip most of this page. If you don't, this is the one piece of Nekuta that doesn't have a close analogue in the rest of the React ecosystem, so it's worth understanding directly rather than by analogy to Redux/Zustand/Jotai.

## Proxy-based reactivity, not selectors

Most React state libraries work by having you write **selector functions** — `useStore((state) => state.count)` — so the library knows exactly which slice of state a component cares about. Nekuta doesn't ask for selectors. Instead, `reactive()` objects (which is what a store's state is, under the hood) are JavaScript `Proxy` objects: every property _read_ is tracked, and every property _write_ notifies whoever read it.

```ts
const state = reactive({ count: 0, other: 0 });

effect(() => {
    console.log(state.count); // reading `count` here registers a dependency
});

state.other++; // doesn't re-run the effect above — `other` was never read
state.count++; // does re-run it
```

This is the same mechanism `@vue/reactivity` provides for Vue, ported from scratch for Nekuta rather than depending on Vue at all. It's what makes getters "just work" — a getter is a `computed()`, and a `computed()` is a memoized `effect()` that only invalidates when something it actually read changes, the same as [Getters](./getters.md) describes.

## What this means for `useStore()` and `connectStore()`

Vue's compiler generates a render function that's itself a reactive effect, so a Vue template only re-renders when a property it actually rendered changes — React has no compiler step doing the equivalent for JSX. Nekuta gets the same result a different way: `useStore()` and `connectStore()` return a **tracked proxy**, not the store itself. Reading a property through it — `counter.count` in your JSX, exactly as you'd already write it — records that read against a dependency effect scoped to that component instance, using the same `track()`/`trigger()` machinery described above, not a separate bookkeeping system. A component only re-renders when a property it actually read last render changes; an unrelated property on the same store changing does nothing.

```tsx
function Counter() {
    const counter = useStore(useCounterStore);
    return <p>{counter.count}</p>; // only `count` is tracked — other properties on this store can change freely
}
```

Tracking is deep, not just top-level — `counter.user.name` tracks specifically `name` on the nested `user` object, so a sibling property changing on that same nested object doesn't re-render it either. Tracking is also per-render: which properties count as "read" is recomputed from scratch every render, so a component that conditionally reads different properties (`flag ? a.x : b.y`) correctly tracks whichever branch it actually took last time, the same re-tracking behavior a Vue effect has.

This applies equally to `connectStore()` — mapping a store as a prop that a class component's `render()` never actually reads doesn't cause re-renders for that store either.

## The bridge to React: `useSyncExternalStore`

Both `useStore()` and `connectStore()` are built on React's `useSyncExternalStore` under the hood, for the tearing-safety guarantees React's own docs describe for external stores. One detail worth knowing if you're ever reading Nekuta's own source: `useSyncExternalStore` decides whether to re-render by comparing a snapshot value across calls, but a Nekuta store mutates its state **in place** — same object reference before and after a change — so the store itself can't be the snapshot. Nekuta instead tracks a version counter, scoped to each component's own tracked dependencies, that increments only when one of THOSE dependencies changes — a plain number, trivially a "new value" by `Object.is` whenever it matters.

You don't need to know any of this to use Nekuta day to day — it's purely an implementation detail.
