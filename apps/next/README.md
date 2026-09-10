# @nekuta/next

Next.js adapter for [`@nekuta/core`](../nekuta) — SSR/hydration support for both the Pages Router and the App Router, shipped as one package for now. Router-specific code lives in its own directory (`src/pages/`, `src/app/`) but is exported as plain named exports from `@nekuta/next` rather than as separate subpaths — that split is deferred until it's actually needed. See the root [README](../../README.md) for the full build plan.

Status: scaffolding only.
