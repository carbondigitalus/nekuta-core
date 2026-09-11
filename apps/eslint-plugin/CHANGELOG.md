# 0.1.0 (2026-09-11)

First public release. `@nekuta/eslint-plugin` ships ESLint rules for projects using [`@nekuta/core`](https://www.npmjs.com/package/@nekuta/core) — starting with enforcing a single `defineStore()` authoring style project-wide.

## `define-store-format`

`defineStore()` supports two equivalent styles — schema stores (`defineStore({ id, state, getters, actions })`) and hooks stores (`defineStore(id, () => {...})`) — and nothing about the store engine itself picks one for a given project. Left alone, different stores (or different contributors) can end up mixing the two freely.

- **Optional, by design.** The rule does nothing unless you pass a `format` option (`'schema'` or `'hooks'`). Without one, `defineStore()` calls across a project are free to mix styles — each individual call is still inherently one shape or the other (that's inherent to `defineStore()`'s two overloads), just not required to agree with the rest of the project.
- **Import-tracked, not name-matched.** Only calls to `defineStore` actually imported from `@nekuta/core` are checked — including through an aliased import (`import { defineStore as define } from '@nekuta/core'`) — so an unrelated function that happens to also be named `defineStore` and imported from somewhere else is left alone.
- **Conservative classification.** A call whose shape can't be statically determined (for example `defineStore(someVariable)`) is left alone rather than guessed at, to avoid false positives.

```js title="eslint.config.mjs"
import nekuta from '@nekuta/eslint-plugin';

export default [
    {
        plugins: { nekuta },
        rules: {
            'nekuta/define-store-format': ['error', { format: 'schema' }]
            // or: { format: 'hooks' }
        }
    }
];
```

## Why a lint rule, not a runtime option

It's a natural instinct to want this configured alongside the rest of an app's Nekuta setup — as a `<NekutaStore>` prop, for instance. That doesn't actually work: `defineStore()` calls run at **module-evaluation time**, the moment a store file is imported, which happens before `<NekutaStore>` ever renders. By the time a runtime prop's value exists, every `defineStore()` call in a codebase has already executed and already committed to whichever shape its call site used — a runtime value can't reach back and change a decision already made. Choosing a store style is a codebase-authoring convention, so it's enforced the same way other authoring conventions are: at edit-time and in CI, via lint — not at runtime.

## Notes

- Peer-depends on `eslint` `^9`.
- Built with plain flat-config (ESLint 9), no `.eslintrc` legacy config support.
