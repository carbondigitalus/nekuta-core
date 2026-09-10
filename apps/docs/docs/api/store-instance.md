---
sidebar_position: 2
---

# Store instance

Every store — however it was defined — has the same built-in members alongside its own state/getters/actions:

| Member                           | Signature                                                                                  | See                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$id`                            | `string`                                                                                   | the id passed to `defineStore()`                                                                                                                         |
| `$state`                         | property, get/set                                                                          | [State](../core-concepts/state.md#replacing-the-whole-state-tree--state)                                                                                 |
| `$patch(partialOrFn)`            | `(partial: DeepPartial<S>) => void` or `(fn: (state: S) => void) => void`                  | [State](../core-concepts/state.md#batched-updates--patch)                                                                                                |
| `$reset()`                       | `() => void` — options stores only; throws for setup stores                                | [State](../core-concepts/state.md#resetting-state--reset)                                                                                                |
| `$subscribe(callback, options?)` | `(callback: (mutation, state: S) => void, options?: { detached?: boolean }) => () => void` | [Subscriptions & Action Hooks](../core-concepts/subscriptions-and-actions.md#subscribe--state-changes)                                                   |
| `$onAction(callback)`            | `(callback: (context: ActionListenerContext) => void) => () => void`                       | [Subscriptions & Action Hooks](../core-concepts/subscriptions-and-actions.md#onaction--action-lifecycle)                                                 |
| `$dispose()`                     | `() => void`                                                                               | stops the store's internal reactivity and removes it from the `Nekuta` instance's registry — a later call to the same store definition rebuilds it fresh |

`$subscribe()`/`$onAction()` both return an unsubscribe function.

## `SubscriptionCallbackMutation`

The first argument `$subscribe()`'s callback receives:

```ts
type SubscriptionCallbackMutation<S> = {
    type: 'direct' | 'patch object' | 'patch function';
    storeId: string;
};
```

## `ActionListenerContext`

The single argument `$onAction()`'s callback receives:

```ts
type ActionListenerContext = {
    name: string; // the action's name
    store: StoreGeneric;
    args: unknown[]; // the arguments the action was called with
    after: (callback: (result: unknown) => void) => void;
    onError: (callback: (error: unknown) => void) => void;
};
```
