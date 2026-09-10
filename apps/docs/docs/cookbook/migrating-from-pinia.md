---
sidebar_position: 2
---

# Migrating from Pinia

If you already know Pinia, most of this is a rename exercise. The table below is the quick reference; the sections after it cover the handful of places where the mapping isn't 1:1.

| Pinia (Vue)                                      | Nekuta (React)                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `createPinia()`                                  | `createNekuta()`                                                    |
| `app.use(pinia)`                                 | `<NekutaStore>`                                                     |
| `defineStore(...)`                               | `defineStore(...)` — same two styles (options/setup)                |
| `const store = useCounterStore()` (in `setup()`) | `const store = useStore(useCounterStore)` (in a function component) |
| Options API: `mapStores`/`mapState`/`mapActions` | `connectStore({ counter: useCounterStore }, Component)`             |
| `storeToRefs(store)`                             | `storeToRefs(store)` — same purpose, same caveats                   |
| `store.$patch(...)`                              | `store.$patch(...)` — identical                                     |
| `store.$subscribe(...)`                          | `store.$subscribe(...)` — identical                                 |
| `store.$onAction(...)`                           | `store.$onAction(...)` — identical                                  |
| `store.$reset()`                                 | `store.$reset()` — options stores only, same as Pinia               |
| `pinia.use(plugin)`                              | `nekuta.use(plugin)` — same shape, no `app` field                   |
| `@pinia/nuxt`                                    | `@nekuta/next`                                                      |
| `skipHydrate()`                                  | `skipHydrate()` — same purpose                                      |
| Vue DevTools' Pinia panel                        | Not built yet — planned as a separate project                       |

## What's genuinely different

- **Functional vs. class components, not Options vs. Composition API.** Pinia works identically from either Vue API because Vue's own split there doesn't affect state management. React's split does — see [Class Components](../getting-started/class-components.md) if you're coming from an Options API codebase; `connectStore()` is the closest equivalent to `mapStores()`.
- **No dedicated testing package.** Pinia has `@pinia/testing`; Nekuta doesn't — see [Testing](./testing.md) for the direct alternative.
- **Cross-store getters need care during Next.js App Router SSR.** A getter calling another store's bare accessor is fully supported and works the same as Pinia everywhere else, but see [Getters](../core-concepts/getters.md#cross-store-getters--a-caveat) for the one place it doesn't translate cleanly (React's streaming SSR model, not something Vue's own SSR has to contend with the same way).
