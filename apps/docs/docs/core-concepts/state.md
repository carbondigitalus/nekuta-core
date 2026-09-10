---
sidebar_position: 2
---

# State

State is whatever `state()` returns (options stores) or whatever `ref()`/`reactive()` values a setup function returns (setup stores). It's exposed directly on the store — no `.value`, no selector functions:

```ts
const counter = useCounterStore();
counter.count; // read
counter.count = 5; // write — triggers subscribers, re-renders, etc.
```

This works even for state that started life as a `ref()` in a setup store: Nekuta automatically unwraps refs stored as properties on a reactive object (the same behavior Vue's `reactive()` has), so `counter.count` is always the plain value, never a `Ref` wrapper, regardless of which style defined the store.

## Objects and arrays are deeply reactive

Nested objects, arrays, `Map`, and `Set` are all reactive automatically — mutating something nested works exactly like mutating a top-level property:

```ts
state: () => ({
    user: { name: 'Ada', tags: new Set(['admin']) }
});

// later
store.user.name = 'Grace'; // reactive
store.user.tags.add('editor'); // reactive
```

## Resetting state — `$reset()`

Options stores get `$reset()` for free — it re-runs `state()` and applies the result as a patch:

```ts
counter.$reset(); // count is back to whatever state() returns
```

Setup stores don't implement `$reset()` (there's no single `state()` factory to re-run) — calling it throws. If you need reset behavior for a setup store, write your own action that puts each ref back to its initial value.

## Replacing the whole state tree — `$state`

`$state` is a getter/setter over a store's entire state object:

```ts
counter.$state; // the same as reading counter.count etc., just as one object
counter.$state = { count: 100 }; // routes through $patch — see below
```

## Batched updates — `$patch()`

Setting several properties one at a time fires one `$subscribe()` notification per change. `$patch()` batches them into exactly one:

```ts
// Object form — deep-merges into the current state (plain objects merge key by key;
// Map/Set merge their entries; anything else replaces the existing value outright).
counter.$patch({ count: 5, nested: { a: 1 } });

// Function form — for changes that aren't a simple merge (e.g. array mutation).
todoStore.$patch((state) => {
    state.items = state.items.filter((item) => !item.done);
});
```

Use `$patch()` whenever a single logical change touches more than one property — it's both fewer notifications for subscribers to react to and one entry in `$subscribe()`'s mutation log instead of several.
