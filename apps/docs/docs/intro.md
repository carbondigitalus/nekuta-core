---
sidebar_position: 1
---

# Introduction

Nekuta is a React store ecosystem based on [Pinia](https://pinia.vuejs.org) — Vue's official state management library. It aims to work the same way for the people using it: `defineStore()`, state, getters, actions, `$patch`/`$subscribe`/`$onAction`, plugins — the same shape, the same names, adapted to React instead of Vue.

Under the hood it's a from-scratch port, not a wrapper around Pinia or Vue. Nekuta ships its own small reactivity engine (a Proxy-based `reactive()`/`ref()`/`computed()`/`effect()` system modeled on `@vue/reactivity`) so that getters auto-memoize on the exact state they read, the same way Pinia's do — rather than the more common "manual selector" approach other React state libraries use.

## Why not just use Zustand / Redux / Jotai?

Those are all good libraries, and if you're starting fresh with no Vue background, they're worth considering too. Nekuta exists for a specific case: teams or people who already know Pinia and want the same mental model and API in a React codebase, without relearning a different store shape. If you already think in `state` / `getters` / `actions`, Nekuta should feel immediately familiar. See [Migrating from Zustand/Redux](./cookbook/migrating-from-zustand-redux.md) and [Migrating from Pinia](./cookbook/migrating-from-pinia.md) if either applies to you.

## Packages

- **`@nekuta/core`** — the store engine itself: `defineStore`, `useStore`, `connectStore`, plugins, SSR helpers. Framework-router-agnostic.
- **`@nekuta/next`** — the Next.js adapter: SSR/hydration support for both the Pages Router and the App Router.

## What's supported today

- Both **functional components** (`useStore()`, a hook) and **class components** (`connectStore()`, a HOC) — React 19.
- **Options-style** stores (`state`/`getters`/`actions`, like Pinia's Options API) and **setup-style** stores (a function returning refs/computed/functions, like Pinia's `<script setup>` style) — the same two flavors, converging on one engine.
- `$patch`, `$subscribe`, `$onAction`, `$reset`, `$dispose`, `storeToRefs()`, plugins.
- SSR/hydration for Next.js, both routers.

## What's intentionally not built yet

- **Fine-grained reactivity in React bindings.** `useStore()` currently re-renders a component on _any_ change to the store it's reading, not just the specific properties that component actually read during render (Pinia/Vue get this for free from Vue's compiler; React has no equivalent). This is a planned follow-up, not a design dead-end — see the [reactivity model](./core-concepts/reactivity-model.md) page for what this means in practice today.
- **A DevTools browser extension.** Vue DevTools' Pinia integration doesn't have a React equivalent yet — planned as a separate project.
- **A dedicated testing package.** There's no `createTestingPinia()`-equivalent; see [Testing](./cookbook/testing.md) for how to test stores directly with Jest instead.

Start with [Installation](./getting-started/installation.md) or jump straight to the [Quick Start](./getting-started/quick-start.md).
