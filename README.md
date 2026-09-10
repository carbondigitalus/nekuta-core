# Nekuta

Nekuta (ネクター), "nectar" in Japanese, is a React store ecosystem that is based on Vue's Pinia store.

## Notice

I realize that Pinia currently integrates with the Vue DevTools browser extension. So, we will probably end up building our own React browser extension to match Vue's amazing extension. Just so that we can use this package in the DevTools.

## Nekuta — React port of Pinia (build plan)

### Context

`nekuta-core` (this TurboRepo) already declares its intent in its own README: build "a React store ecosystem based on Vue's Pinia store," with parity for both functional and class components, no DevTools extension yet (planned as a separate future repo). Today the repo is a mostly-empty scaffold: `turbo.json` anticipates four Next.js apps (`content`, `portal`, `sso`, `web`) that don't exist yet, only `apps/docs` (Docusaurus, essentially unstarted content) is real, and `packages/` holds only internal tooling (`eslint-config`, `prettier-config`, `typescript-config`, `jest-config`) plus one real library, `@nekuta/utils`, built with plain `tsc -b`. There is no CI, no git hooks, no bundler anywhere in the repo.

This plan designs the Nekuta store engine and its supporting packages from scratch, porting Pinia's architecture (studied directly from the vendored reference at `nekuta-core/pinia/`) onto React 19, inside this monorepo's existing npm/turbo/eslint/prettier/jest conventions, per the user's explicit constraints:

- No Netlify, no oxfmt/`.oxfmtrc` (use the repo's existing `@nekuta/eslint-config` + `@nekuta/prettier-config`).
- Codecov wired through Jest coverage, not Vitest.
- npm workspaces (already the repo's setup), not pnpm.
- Gulpfiles replace Pinia's `scripts/` folder for release/commit-verification automation.
- Next.js support via **one combined adapter package** for now, covering both Pages Router and App Router — not Nuxt. A split into `@nekuta/next-pages`/`@nekuta/next-app` is still the eventual goal (likely within the adapter's first year), but isn't worth the overhead until the combined package's shared logic actually diverges.
- React 19, both class and functional components. **Class components ship first**; hooks build on top of the same mechanism (confirmed below).
- Custom Proxy-based reactivity engine (Vue-`@vue/reactivity`-style), not a Zustand-style manual-selector store — chosen so getters auto-memoize on real dependency changes, matching Pinia's DX.
- The core engine and its Next.js adapter are **apps**, not packages — "the apps are the product; packages are support elements of the apps." `packages/` stays limited to shared tooling (`eslint-config`, `prettier-config`, `typescript-config`, `jest-config`, `utils`).
- The core package is a real publishable open-source package (like `pinia` itself), not internal-only — published as `@nekuta/core`, matching this monorepo's existing `@nekuta/*` scoping convention (the npm registry confirmed unscoped `nekuta` was actually available too, but `@nekuta/core` is the chosen name).
- Scope: core engine + one Next.js adapter + **one** publicly-deployed playground app + the existing docs app. No dedicated testing package (each app tests itself with Jest) and no dedicated size-check package (folded into the core package).
- `apps/content`, `apps/portal`, `apps/sso`, `apps/web` referenced in `turbo.json`/`.gitignore` are leftovers from the Turborepo starter this repo was cloned from — disregard them; they'll be updated separately as that work happens, unrelated to Nekuta.

### Package / App Layout

```
nekuta-core/
  apps/
    nekuta/          → published as "@nekuta/core" on npm (core engine)
    next/            → published as "@nekuta/next" (Next.js adapter — Pages Router + App Router)
    eslint-plugin/   → published as "@nekuta/eslint-plugin" (lint rules for Nekuta consumers)
    playground/      → @nekuta/playground (private, live-deployed Next.js demo)
    docs/            → existing Docusaurus app, content to be built out
  packages/
    eslint-config, prettier-config, typescript-config, jest-config, utils   (existing — shared tooling only)
```

- `apps/nekuta` ships as `"name": "@nekuta/core"`, matching this monorepo's `@nekuta/*` scoping convention (Pinia itself ships unscoped rather than as `@vue/pinia`, but the scoped name is the chosen option here).
- **One adapter package for now**: `apps/next` (`@nekuta/next`), mirroring Pinia's scoped-adapter pattern (core unscoped, adapter scoped). It supports both Pages Router and App Router from a single set of named exports out of one package root, kept internally organized by directory (`src/pages/`, `src/app/`) so the two are never actually tangled together in code — but not exposed as separate `package.json` `exports` subpaths unless/until that's actually needed (e.g. to keep server-only code out of a client bundle). Simplest thing that works; add the subpath split later only if a real problem shows up. Depends on `@nekuta/core` and consumes the `ssr/serialize.ts`/`skipHydrate.ts` helpers that live in core. The eventual split into `@nekuta/next-pages`/`@nekuta/next-app` as two real packages is still the plan — likely within the first year, once the two routers' needs actually diverge enough to justify it.
- `apps/playground` and `apps/docs` are deployable Next.js/Docusaurus apps in the ordinary sense — same placement logic as before, just now siblings of the product packages rather than the only things in `apps/`.
- New `turbo.json` task overrides needed: `@nekuta/playground#build` (`.next/**` outputs, same shape as the existing per-app override pattern). `@nekuta/core` and `@nekuta/next` are plain TS libraries (not Next runtime apps themselves) — they're covered by the existing generic `build` task (`dist/**` output, `dependsOn: ["^build"]`) with no override needed, same as any `packages/*` library would be; their location under `apps/` is an organizational choice, not a turbo task-graph one.
- `apps/eslint-plugin` (`@nekuta/eslint-plugin`, added post-Milestone-10): a real publishable package, same "apps are the product" reasoning as `@nekuta/core`/`@nekuta/next` — any Nekuta consumer can install it, not just this monorepo's own apps. Plain TS library covered by the generic `build` task, no override needed. Peer-depends on `eslint@^9`. Ships one rule, `define-store-format`, that optionally enforces a single `defineStore()` call style (`'schema'` or `'hooks'`) project-wide — deliberately a lint rule, not a `<NekutaStore>` prop, since `defineStore()` calls run at module-evaluation time, before any `<NekutaStore>` ever renders; a runtime prop can't retroactively enforce a decision already made at import time. Documented in `apps/docs/docs/cookbook/enforcing-a-store-style.md`.

### Core package (`apps/nekuta`, published as `@nekuta/core`) — module breakdown

```
src/
  reactivity/
    effect.ts        ← effect() runner + activeEffect tracking stack
    dep.ts            ← target→key→Dep registry backing track()/trigger()
    reactive.ts        ← Proxy get/set/deleteProperty traps (ports Vue's reactive.ts/baseHandlers.ts)
    ref.ts               ← boxed reactive primitive
    computed.ts           ← lazy, memoized, dirty-flag invalidation
    effectScope.ts         ← groups effects for bulk disposal — built from scratch, no React analog,
                             needed 1:1 per store so $dispose() cleanly stops all internal watchers
    index.ts

  store/
    createNekuta.ts    ← root instance: {state, registry Map, plugins[], root effectScope} — replaces createPinia.ts
    rootInstance.ts      ← module-level active-instance singleton + React-Context-aware lookup
                           (Context first, singleton fallback) — replaces rootStore.ts's activePinia
    defineStore.ts         ← options-style AND setup-style stores, both converging on one engine
                             (replaces store.ts's createOptionsStore/createSetupStore — largest file)
    patch.ts                 ← $patch (object-merge + mutator-fn forms), batched notification
    subscriptions.ts           ← $subscribe/$onAction event bus (the same one a future devtools
                                 extension will consume, exactly as Pinia's own devtools does)
    storeToRefs.ts               ← ref/computed wrappers for state+getters, skips actions
    mapHelpers.ts                  ← mapState/mapActions/mapWritableState/mapStores — feeds connect.tsx
    plugins.ts                      ← plugin registration + context (store, nekuta, options) — no `app`
                                       field (no Vue-app equivalent exists)
    hmr.ts                            ← dev-mode state preservation across Next.js Fast Refresh re-execution
    diagnostics.ts                      ← dev-only warnings, gated by `process.env.NODE_ENV`

  react/
    context.tsx        ← NekutaStore — replaces provide/inject; also SSR request-scoping boundary
    useNekuta.ts          ← usePinia() equivalent — Context read with singleton fallback
    useStore.ts             ← primary hook: useSyncExternalStore + per-render dependency tracking via
                               effect(), so components only re-render for state they actually read
    connect.tsx                ← class-component support: connectStore(mapStoresToProps) HOC,
                                   subscribes in componentDidMount/unmount, injects stores as props

  ssr/
    serialize.ts        ← dehydration helper (skips values marked via skipHydrate)
    skipHydrate.ts         ← non-serializable-state marker, consumed by the Next adapter

  devtools/
    hooks.ts             ← NOT an implementation — formalizes the $onAction/$subscribe/plugin contract
                            as the stable surface a future separate devtools-extension repo will attach to

  index.ts               ← public API surface
```

**Build order within `react/`, confirmed: class components first, hooks second.** Your research call is correct, and it changes the risk profile of this milestone for the better:

- `connect.tsx` (class components) only needs **coarse-grained** subscription: `componentDidMount` calls `store.$subscribe(...)`, the callback shallow-compares the HOC's mapped props against their previous values and calls `setState`/`forceUpdate` only if something the mapping actually reads changed, `componentWillUnmount` disposes the subscription. This is the same shape as pre-hooks `react-redux`'s `connect()` (`mapStateToProps` + shallow-equal), and it requires nothing beyond the store engine's existing `$subscribe`/`$onAction` primitives — no React-render-phase instrumentation at all.
- `useStore.ts` (functional components) can reuse that exact mechanism for a first version: `useSyncExternalStore(subscribe, getSnapshot)` where `subscribe` is `store.$subscribe` and `getSnapshot` returns the whole store state (or a shallow-compared selector), giving a fully correct, if slightly coarser-grained, hook on day one.
- The fully Pinia-faithful piece — automatic per-property dependency tracking so a component only re-renders for the exact state it read, via an `effect()`-wrapped `getSnapshot` — is real, but it's an **internal optimization layered on top of the same public `useStore()` API later**, not a blocker for shipping either class or hook support. Recommend treating it as its own follow-up milestone after both bindings are working end-to-end, rather than gating hook support on it.

**Highest-risk piece, build and test first regardless of binding order:** `effectScope.ts` — zero React precedent, and both `connect.tsx` and `useStore.ts` (in any version) depend on the store engine's getters/computeds/disposal working correctly underneath them.

Porting source of truth: `nekuta-core/pinia/packages/pinia/src/store.ts` (1007 lines — the store engine), `rootStore.ts`, `subscriptions.ts`, `hmr.ts`, `mapHelpers.ts`. Recommend porting a subset of Vue's own `@vue/reactivity` unit tests (MIT-licensed) as a correctness baseline for the reactivity engine, since they already exercise the hard edge cases (nested reactives, array mutation, Map/Set proxying, computed dirty-chains).

### Next.js adapter (`apps/next`, published as `@nekuta/next`)

One package for now, depending on `@nekuta/core`, supporting both routers as plain named exports from `@nekuta/next` rather than two separate packages — no subpath exports (`@nekuta/next/pages` / `@nekuta/next/app`) unless a concrete need (bundling, tree-shaking, keeping server-only code out of a client bundle) actually forces it later; simplicity over anticipatory structure. Internally the router-specific code still lives in its own directory (`src/pages/`, `src/app/`), so a future split into `@nekuta/next-pages`/`@nekuta/next-app` — or, short of that, introducing the subpath exports — is mostly a matter of moving/exposing an existing directory, not an architectural rewrite. Both sides consume the same `ssr/serialize.ts` + `skipHydrate.ts` helpers living in core — the adapter only handles _transport_ of the serialized state blob for each router, mirroring how `@pinia/nuxt`'s payload-plugin only wires Nuxt's payload reducer/reviver around logic that already lives in Pinia core. (Per your note: expect to fork this shared logic apart once the two packages actually split — no action needed now, just keeping the seam visible so that split is easy later — e.g. keep `serialize.ts`/`skipHydrate.ts` as a self-contained module within core rather than letting router-specific assumptions leak into it.)

- **Pages Router support**: `withNekutaSSR` wraps `getServerSideProps` — creates a fresh `createNekuta()` per request, sets it active for the duration of data-fetching (so `defineStore()` calls resolve against the right instance — the SSR request-scoping concern Nuxt handles the same way), serializes state into `pageProps.__NEKUTA_STATE__`. `NekutaAppProvider` in `_app.tsx` rehydrates from that prop if present, else creates fresh client-side (client-nav-between-pages case).
- **App Router support**: no persistent app instance exists in RSC. `getServerNekuta = cache(() => createNekuta())` gives a per-request singleton (React's documented pattern for per-request resources). A root Server Component creates the store, serializes it, and passes it as a prop into `NekutaClientProvider` (a `"use client"` boundary) which renders `NekutaStore` around everything below it — this is the RSC-era equivalent of Nuxt's server→client payload handoff.
- `skipHydrate()` (core) is essential on both paths for excluding non-JSON-safe state from the serialization boundary.

Porting source of truth: `nekuta-core/pinia/packages/nuxt/src/module.ts` and `runtime/payload-plugin.ts`.

### Build tooling & size check

**Plain `tsc -b`**, matching `@nekuta/utils`'s existing convention — no bundler introduced. Pinia's 5-target `tsdown` build (including IIFE/CDN globals) exists to support `<script>`-tag/CDN consumption, a legacy-Vue-ecosystem concern with no React equivalent (React apps are always bundled) — drop those targets entirely rather than port them.

The one real gap plain `tsc` leaves is dev-code stripping: write `diagnostics.ts`'s dev-only branches as `if (process.env.NODE_ENV !== 'production')` (not a custom `__DEV__` global needing a compile-time define step) — every downstream consumer's own bundler already tree-shakes that convention in production builds, so no extra tooling is needed here.

`apps/nekuta/package.json` and `tsconfig.json` should mirror `packages/utils`'s shape (`composite: true`, `declaration: true`, extends `@nekuta/typescript-config/base.json`), minus `experimentalDecorators`.

**Size budget**, folded into `apps/nekuta` itself (no dedicated package): a small `scripts/check-size.mjs` gzips the built `dist/index.js` via Node's `zlib` and compares against a budget field in `package.json`, run as its own CI step after `build` (not embedded in the build script) so a regression is clearly attributed. Label it honestly as an "unminified ESM output, gzip size" budget, since there's no bundler doing minification here — not directly comparable to Pinia's minified-IIFE numbers.

### Gulpfile + CI / release automation

Root-level `gulpfile.mjs` (not per-package) — Gulp owns what `turbo.json`'s per-package task model doesn't: git-hook scripting and release sequencing.

- `gulp lintStaged` — runs eslint/prettier against staged files only, for the pre-commit hook.
- `gulp release` (composed of `release:version`, `release:changelog`, `release:tag` via `gulp.series`; `release:publish` stays a separate, explicit command) — port of `pinia/scripts/release.ts`, simplified since there are only two publishable packages here (`@nekuta/core`, `@nekuta/next`), each addressed via `--pkg <core|next>`. Each package gets independent versioning/changelog scoped to its own directory and git-tag prefix, using the real `conventional-changelog@8` fluent API (angular preset). **Decision, not a port**: `.github/npm-version-script.js` (the repo's existing beta-version-bump-by-branch-name script) was deliberately NOT reused — it parses a GitHub Actions `ref` string (`refs/heads/beta-x.x.x`) and has no meaning outside a CI job, which conflicts with the "Gulp-only, no CI" constraint. `release:version` instead takes an explicit `--type`/`--preid` and bumps via plain `semver.inc()`, run locally by a human.
- **No `docs-check.sh` port** — that script exists solely to work around `netlify.toml` not supporting `&&` in build-skip conditions. Netlify is out of scope; Turborepo's own change-detection (`turbo build --filter=...[origin/main]`) already gives equivalent "only rebuild what changed" behavior in CI, natively.

Root `simple-git-hooks` devDependency + config block (`pre-commit` → `gulp lintStaged`) + `postinstall: simple-git-hooks` script — added and installed. `commit-msg` → `gulp verifyCommit` (conventional-commit message enforcement) was removed after the repo moved to a personal account — not needed for a solo/portfolio project.

**No GitHub Actions / Codecov for now.** A `ci.yml` and `codecov.yml` were drafted and then explicitly removed — not part of the plan at this stage. `.github/workflows/release.yml` (`gulp release`, npm publish, tag push) stays deferred to the release-automation-hardening milestone regardless, same as before; whether any CI comes back before then is an open question, not something to reintroduce speculatively.

### Playground app (`apps/playground`, `@nekuta/playground`)

One Next.js app (not two, per your answer) that dogfoods both routers side by side — Next.js supports Pages and App Router coexisting in the same project, e.g. `/pages-demo/*` and `/app-demo/*`, both importing from the same `@nekuta/next` package. Demo content: counter/todo store exercising `$patch`/`$subscribe`/`$onAction`/cross-store getters, shown via both a class (`connectStore`, built first) and a functional (`useStore`) component, since both are required. Deployed publicly — Vercel is the natural fit for a Next.js app and isn't excluded by any stated constraint, but flagging that as worth an explicit nod from you before we act on it, since only Netlify was ruled out and Vercel specifically wasn't discussed.

### Docs app (`apps/docs`)

Confirmed: `docs/` source content is just a placeholder `intro.md` and an empty `uploads` category — genuinely unstarted, as you described. (Its `build/` output directory does contain stale pages like `veteran-verification`/`listings` from a prior/different project's build cache — that's a git-ignored build artifact, not source content, and will simply be overwritten by the next real build; not something to clean up by hand.)

Recommended IA, adapted from Pinia's own docs structure for React/Next:

- `getting-started/` — installation, quick-start (functional), **class-components** (genuinely new IA — Pinia has no Options-vs-Composition-API axis to map from, since Vue's split doesn't correspond to React's class/function split).
- `core-concepts/` — defining stores, state, getters, actions, plugins, subscriptions/action-hooks, and a **reactivity-model** page explaining the custom Proxy engine in more depth than Pinia needed (React devs won't already have Vue's mental model).
- `ssr/` — Next.js Pages Router, App Router, hydration & skipHydrate.
- `cookbook/` — testing stores directly with Jest (explicit "no createTestingPinia-equivalent here" callout), migrating from Pinia, migrating from Zustand/Redux (for the React audience that won't know Pinia).

- `api/` — reference documentation for `@nekuta/core`'s public TypeScript exports (`defineStore`, `useStore`, `connectStore`, `Store` type, etc.) — the same role as Pinia's own "API Documentation" section on its docs site. To be clear on scope: this is _not_ a REST/backend API — there isn't one, and doesn't need to be one — it's a reference for the functions/types consumers of the `nekuta` package import. Since nothing is built yet, there's nothing to document yet; the recommendation is simply to hand-write this section's pages as each export ships (rather than reaching for TypeDoc auto-generation from day one, which would mean regenerating against a still-churning API every commit). Revisit auto-generation once the public surface stabilizes after the first release.

### Sequencing

1. **Scaffolding** — empty `apps/nekuta`, `apps/next` skeletons wired into workspaces/turbo so install+build succeed trivially; add `simple-git-hooks` + `gulp verifyCommit` early so every subsequent commit has a guardrail from day one. (Done — no CI workflow for now, per above. `verifyCommit`/the `commit-msg` hook were later removed once the repo moved to a personal account — conventional-commit enforcement wasn't worth keeping for a solo project.)
2. **Reactivity engine** (`reactivity/`) — built and unit-tested standalone, no store/React coupling yet. Highest risk; do not parallelize with anything else.
3. **Store engine** (`store/`) — headless, testable via plain Jest against `apps/nekuta` directly, no React involved yet.
4. **React bindings** (`react/`) — `context.tsx` → `connect.tsx` (class components, built first) → `useStore.ts` v1 (functional components, coarse-grained, reusing the same `$subscribe`-based mechanism). Needs `@testing-library/react` added to `apps/nekuta`'s devDependencies.
5. **SSR primitives + build hardening** — `ssr/serialize.ts`/`skipHydrate.ts`, finalize `tsc -b` output + `package.json` `exports`/`files`, wire the size-check script, cut an internal `0.1.0-alpha` and validate `npm pack`/`publish --dry-run`.
6. **Next.js adapter** (`apps/next`) — Pages Router support first (simpler, validates the hydration handoff), then App Router support (adds the RSC boundary).
7. **Playground app** — built directly against both of `@nekuta/next`'s router demos.
8. **Docs content** — conceptual pages can start as soon as step 4's APIs stabilize, in parallel with steps 6/7; SSR-section docs wait on step 6.
9. **Fine-grained `useStore`/`connectStore` optimization** (done) — both bindings now return a tracked proxy (deep, not just top-level) built on the reactivity engine's own `track()`/`trigger()`, instead of the coarse `$subscribe`-based approach described in step 4 above. Turned out `getSnapshot` itself can't carry the tracking-reset side effect it was originally sketched with — React's contract allows calling it more than once per render, which silently wiped out the current render's just-collected dependencies; the reset now happens once in the hook body itself instead. Also fixed a latent gap surfaced along the way: a stopped `ReactiveEffect` could still be re-added to a dependency set and have its scheduler fire — `trackEffects()`/`triggerEffects()` now both check `.active`.
10. **Release automation hardening** (done, Gulp-only — no CI/GitHub Actions/Codecov) — root `gulpfile.mjs` gained a full per-package release pipeline: `release:version` (semver bump via `--pkg <core|next> --type <bump> [--preid]`), `release:changelog` (real `conventional-changelog@8`'s fluent `ConventionalChangelog` class, angular preset, commits/tags scoped to the package's own directory and tag prefix, prepended to that package's `CHANGELOG.md`), `release:tag` (local-only annotated git tag, never pushed), and `release:publish` (`npm publish`, dry-run by default, `--live` to actually execute). The combined `release` task is a `gulp.series(releaseVersion, releaseChangelog, releaseTag)` that deliberately excludes `release:publish` — publishing is the one step with an irreversible external side effect, so it always stays a separate, explicit command. Verified end-to-end against `apps/nekuta` (real version bump, real changelog generated from actual commit history, reverted after) and caught a real bug along the way: npm refuses to publish a prerelease version without an explicit dist-tag, since it would otherwise become `latest` — `release:publish` now defaults to tag `next` for prereleases and `latest` for stable versions (via `semver.prerelease()`), overridable with `--tag`.

### Verification

- Reactivity engine and store engine: headless Jest suites in `apps/nekuta` (via `@nekuta/jest-config`'s `node` preset), including the ported `@vue/reactivity` edge-case tests.
- React bindings: `@testing-library/react` tests in `apps/nekuta` covering mount/unmount subscription lifecycle and shallow-compare re-render behavior for `connectStore`, then the same for `useStore`.
- Next adapter: integration tests in `apps/next` exercising each router's hydration round-trip (server-serialize → client-rehydrate matches pre-serialization state).
- End-to-end: the playground app, run locally (`npm run start:dev`) and clicked through in a browser for both `/pages-demo` and `/app-demo` routes, class- and functional-component demos, before considering step 6/7 done.
- Run `turbo lint && turbo typecheck && turbo test:unit && turbo build` locally and confirm all green before merging — there's no CI pipeline enforcing this automatically right now.

### Pre-Publish Checklist

Before running `gulp release:publish --pkg <alias> --live` for the first real public release of any package (`@nekuta/core`, `@nekuta/next`, `@nekuta/eslint-plugin`), confirm all of the following:

- **`npm run lint` (`turbo lint`)** — real for `@nekuta/playground` (`next lint` via its own `eslint.config.mjs`, importing the already-built `@nekuta/eslint-config/next-js`, matching the same shared-config + per-app-config pattern used elsewhere) — verified by both a passing run and a deliberately-introduced violation that correctly failed it. Still **not wired for the publishable packages** (`@nekuta/core`, `@nekuta/next`, `@nekuta/eslint-plugin`) or `@nekuta/docs` — matching this pattern's own precedent of leaving plain TS libraries and the docs site unlinted, but worth revisiting before those specifically are published, since this checklist's "every publishable package" framing isn't fully satisfied by playground alone.
- **`npm run format:check`** (root `prettier --check`, added alongside the existing mutating `format` script specifically as a non-destructive verification gate) — passes as of now; requires `.prettierignore` (added — excludes the vendored `pinia/` reference source and build output, which the ungated glob was previously silently willing to rewrite).
- **`npm run typecheck` (`turbo typecheck`)** — passes.
- **`npm run test:unit` (`turbo test:unit`)** — passes.
- **`npm run build` (`turbo build`)** — passes.
- `apps/nekuta`'s `npm run size` — gzip size budget check passes.
- `gulp release:version --pkg <alias> --type <bump>` then `gulp release:changelog --pkg <alias>` — version bump and generated `CHANGELOG.md` entry both look right for the package being released.
- `gulp release:publish --pkg <alias>` (dry-run, the default) — validated before ever adding `--live`.

### Critical files (existing, for reference/porting)

- `nekuta-core/turbo.json`, `nekuta-core/package.json` — need the new task overrides and git-hooks config described above.
- `nekuta-core/packages/utils/package.json` + `tsconfig.json` — template for `apps/nekuta`'s own config.
- `nekuta-core/pinia/packages/pinia/src/store.ts`, `rootStore.ts`, `subscriptions.ts`, `hmr.ts`, `mapHelpers.ts` — primary porting source for the store engine.
- `nekuta-core/pinia/packages/nuxt/src/module.ts`, `runtime/payload-plugin.ts` — primary porting source for the Next.js adapter's Pages Router and App Router support.
- `nekuta-core/pinia/scripts/verifyCommit.mjs`, `scripts/release.ts` — primary porting source for the Gulp tasks.
