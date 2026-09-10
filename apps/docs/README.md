# @nekuta/docs

The Nekuta documentation site, built with [Docusaurus](https://docusaurus.io/).

Part of the `nekuta` Turborepo — see the [root README](../../readme.md) for monorepo-wide setup.

## Development

From the repo root:

```sh
npx turbo run start:dev --filter=@nekuta/docs
```

Or from this directory directly:

```sh
npm run start:dev
```

## Build

From the repo root:

```sh
npm run build:docs
```

This builds a static site into `apps/docs/build`.
