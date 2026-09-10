---
sidebar_position: 6
---

# Actions

Actions are plain methods, called directly off the store — synchronous or `async`, it doesn't matter:

```ts
actions: {
    increment(this: { count: number }, by = 1) {
        this.count += by;
    },
    async fetchCount(this: { count: number }) {
        const response = await fetch('/api/count');
        this.count = await response.json();
    }
}
```

```ts
counter.increment(5);
await counter.fetchCount();
```

## The `this` type

TypeScript can't automatically infer `this` inside an action the way it infers the `state` parameter in a getter — annotate it explicitly with the shape of state (and any other actions/getters) the method actually uses. This is boilerplate, not a design choice worth fighting; see [Defining Stores](./defining-stores.md) for the alternative setup-store style, where actions are just plain closures over local `ref()`s and don't need a `this` annotation at all.

## Actions are wrapped — `$onAction()`

Every action call is intercepted so `$onAction()` listeners can observe it starting, finishing (with its return value), or throwing — see [Subscriptions & Action Hooks](./subscriptions-and-actions.md). This wrapping is transparent: an action's `this`, arguments, and return value all behave exactly as if it were called directly.

## Actions and `$patch`

An action that touches several properties should generally use `$patch()` rather than several separate assignments, for the same reason described in [State](./state.md#batched-updates--patch) — one `$subscribe()` notification instead of several:

```ts
actions: {
    reset(this: { $patch: (fn: (state: TodoState) => void) => void }) {
        this.$patch((state) => {
            state.items = [];
            state.nextId = 1;
        });
    }
}
```
