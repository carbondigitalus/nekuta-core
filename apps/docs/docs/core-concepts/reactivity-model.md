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

## What this means for `useStore()` today

Here's the one place Nekuta and Pinia currently differ in _behavior_, not just implementation: Vue's compiler generates a render function that's itself a reactive effect, so a component only re-renders when a property it actually rendered changes. React has no equivalent — there's no compiler step generating fine-grained per-component dependency tracking.

`useStore()` and `connectStore()` currently re-render on **any** change to the store(s) they're reading, not just the specific properties a component's render actually used. A component reading only `counter.count` will still re-render if some _other_ property on the same store changes.

In practice this is rarely a problem — React's own reconciliation means an unnecessary re-render that produces the same output is cheap, not incorrect — but it's worth knowing about if you're debugging a re-render you didn't expect, or profiling a store with many independent pieces of state read by many different components.

Fine-grained tracking (a component only re-rendering for state it actually reads, matching Pinia's DX exactly) is planned as a non-breaking enhancement on top of the same `useStore()`/`connectStore()` APIs — see the project's build plan for status.

## The bridge to React: `useSyncExternalStore`

Both `useStore()` and `connectStore()` are built on React's `useSyncExternalStore` under the hood. One detail worth knowing if you're ever reading Nekuta's own source: `useSyncExternalStore` decides whether to re-render by comparing a snapshot value across calls, but a Nekuta store mutates its state **in place** — same object reference before and after a change — so the store itself can't be the snapshot. Nekuta instead tracks a version counter that increments on every relevant change and uses _that_ as the snapshot, which is a plain number and trivially a "new value" each time something changed.

You don't need to know this to use Nekuta — it's purely an implementation detail — but it explains why re-renders are coarse today: the version counter increments on **any** subscribed change, with no per-property distinction (yet).
