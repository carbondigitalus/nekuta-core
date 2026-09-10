---
sidebar_position: 4
---

# Enforcing a Store Style

`defineStore()` supports two styles — see [Defining Stores](../core-concepts/defining-stores.md) — and nothing about the store engine itself picks one for your project. Left alone, different stores (or different contributors) can end up mixing `schema` stores and `hooks` stores in the same codebase.

If you want every store in a project to agree on one style, install `@nekuta/eslint-plugin`:

```bash
npm install --save-dev @nekuta/eslint-plugin
```

```js title="eslint.config.mjs"
import nekuta from '@nekuta/eslint-plugin';

export default [
    {
        plugins: { nekuta },
        rules: {
            // Require every defineStore() call to use the object-literal
            // `{ id, state, getters, actions }` shape.
            'nekuta/define-store-format': ['error', { format: 'schema' }]

            // Or, to require the function-body shape instead:
            // 'nekuta/define-store-format': ['error', { format: 'hooks' }]
        }
    }
];
```

## Why this isn't a `<NekutaStore>` option

It might seem natural to configure this next to the rest of your app's Nekuta setup — as a prop on [`<NekutaStore>`](../api/nekuta-store.md), for example. That doesn't actually work: `defineStore()` calls run at **module-evaluation time** (the moment a file like `stores/counterStore.ts` is imported), which happens before `<NekutaStore>` ever renders. By the time a runtime prop's value exists, every `defineStore()` call in your codebase has already executed and already committed to whichever shape its call site used — a runtime value can't reach back and change (or reject) a decision already made.

Choosing a store style is a codebase-authoring convention, not app runtime configuration, so it's enforced the same way other authoring conventions are: at edit-time and in CI, via lint.

## `format` is optional

`nekuta/define-store-format` does nothing unless you pass a `format` option. Without one, `defineStore()` calls across your project are free to mix styles — each individual call is still inherently one shape or the other (that's inherent to `defineStore()`'s two overloads), just not required to agree with the rest of the project.

## What it catches

A call whose shape the rule can't statically determine (for example `defineStore(someVariable)`) is left alone rather than guessed at. Aliased imports are tracked correctly too:

```ts
import { defineStore as define } from '@nekuta/core';

// still flagged under { format: 'schema' }
const useCounterStore = define('counter', () => ({ count: ref(0) }));
```

Only calls to `defineStore` actually imported from `@nekuta/core` are checked — an unrelated function that happens to also be named `defineStore` and imported from somewhere else is ignored.
