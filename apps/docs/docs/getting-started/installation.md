---
sidebar_position: 1
---

# Installation

```bash
npm install @nekuta/core
```

React 19 and React DOM 19 are peer dependencies — install them if your project doesn't already have them:

```bash
npm install react@^19 react-dom@^19
```

## Next.js

If you're using Next.js (Pages Router, App Router, or both), also install the adapter:

```bash
npm install @nekuta/next
```

`@nekuta/next` depends on `nekuta` and `next` (`^15.0.0 || ^16.0.0`) as peer dependencies. See [SSR & Next.js](../ssr/nextjs-pages-router.md) once you have a store defined.

## Not using Next.js?

You don't need `@nekuta/next` at all. `nekuta` on its own works in any React app — Create React App, Vite, a plain client-rendered SPA. Wrap your app in a [`<NekutaProvider>`](../api/nekuta-provider.md) and start defining stores.
