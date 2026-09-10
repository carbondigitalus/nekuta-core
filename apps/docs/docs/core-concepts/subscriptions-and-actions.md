---
sidebar_position: 8
---

# Subscriptions & Action Hooks

Two independent ways to observe a store from the outside, without modifying the store itself — useful for logging, persistence, analytics, or building the kind of tooling a future DevTools extension would need.

## `$subscribe()` — state changes

Fires whenever the store's state changes, however that change happened (direct mutation, an action, or `$patch()`):

```ts
const unsubscribe = counter.$subscribe((mutation, state) => {
    console.log(mutation.type, state); // 'direct' | 'patch object' | 'patch function'
});

// later
unsubscribe();
```

A `$patch()` call — object form or function form — fires exactly **one** `$subscribe()` notification, tagged `'patch object'`/`'patch function'`, no matter how many properties it touched. A direct mutation (`counter.count++`) fires one notification per change, tagged `'direct'`.

Pass `{ detached: true }` if the subscription should outlive whatever reactive scope it was created in (rarely needed — Nekuta's own internals use this for the React hooks' subscriptions, since a React render isn't itself a reactive scope).

## `$onAction()` — action lifecycle

Fires when an action is _called_, before it runs, with hooks to observe how it finishes:

```ts
const unsubscribe = counter.$onAction(({ name, args, after, onError }) => {
    console.log('calling', name, 'with', args);

    after((result) => {
        console.log(name, 'finished with', result);
    });

    onError((error) => {
        console.error(name, 'threw', error);
    });
});
```

`after()` fires once — after the action's return value resolves, if it returned a `Promise`, or immediately for a synchronous action. `onError()` fires if the action throws (synchronously) or its returned `Promise` rejects; the error still propagates to the original caller either way — `$onAction()` observes, it doesn't swallow.

## Both together

A typical use is combining them to build an activity log — `$onAction()` for "what was called," `$subscribe()` for "what actually changed":

```ts
counter.$onAction(({ name }) => log(`${name}() called`));
counter.$subscribe((mutation) => log(`state changed (${mutation.type})`));
```

See the playground app's `ActivityLog` component for a complete, running example of this pattern.
