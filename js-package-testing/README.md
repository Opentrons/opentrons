# JS package testing

A Vite app and Playwright suite for exercising **packed** builds of:

- `@opentrons/components`
- `@opentrons/shared-data`
- `@opentrons/step-generation`
- `@opentrons/protocol-visualization`

The demo app includes two pages: a **Deck map** page built with
**ProtocolDeck** from `@opentrons/components`, and a **Protocol visualization**
page built with `@opentrons/protocol-visualization`. Visual regression uses
**Applitools Eyes**, not committed screenshots.

This project is the **reference external consumer**. It installs the four
packages the way another app would (pack, patch manifests, link, install peer
deps), documents required bootstrap steps, and validates that published
artifacts work outside the monorepo.

## External consumer guide

Use this section when integrating the four `@opentrons/*` packages into another
project (Figma Make, a standalone React app, etc.). The Vite demo in this
directory is the working example.

### Install all four packages at the same version

The packages depend on each other. Install matching versions of every package
you use:

| Package                             | Role                                                       |
| ----------------------------------- | ---------------------------------------------------------- |
| `@opentrons/shared-data`            | Types, labware/robot definitions, protocol analysis shapes |
| `@opentrons/step-generation`        | Timeline / command generation (pulled in by components)    |
| `@opentrons/components`             | Deck map, buttons, shared UI primitives                    |
| `@opentrons/protocol-visualization` | Annotated protocol steps UI                                |

```bash
# pnpm (recommended for Opentrons consumers)
pnpm add @opentrons/shared-data@X.Y.Z \
  @opentrons/step-generation@X.Y.Z \
  @opentrons/components@X.Y.Z \
  @opentrons/protocol-visualization@X.Y.Z

# npm also fine
npm install @opentrons/shared-data@X.Y.Z \
  @opentrons/step-generation@X.Y.Z \
  @opentrons/components@X.Y.Z \
  @opentrons/protocol-visualization@X.Y.Z
```

### Required peer / runtime dependencies

Your app must provide these (versions match what js-package-testing uses):

| Package         | Version   | Required by                                          |
| --------------- | --------- | ---------------------------------------------------- |
| `react`         | `18.2.0`  | components, protocol-visualization                   |
| `react-dom`     | `18.2.0`  | components, protocol-visualization                   |
| `react-i18next` | `14.0.0`  | protocol-visualization (and many components strings) |
| `i18next`       | `^19.8.3` | host i18n instance for `react-i18next`               |

Optional but used in the demo:

| Package                   | Notes                                    |
| ------------------------- | ---------------------------------------- |
| `@fontsource/public-sans` | Matches Opentrons typography in the demo |

**Not required in the host app:** `styled-components`, `redux`, `lodash`, and
most other runtime deps are **bundled into** `@opentrons/components` and
`@opentrons/protocol-visualization` at build time. You do not need to install
them separately unless your bundler fails to resolve something (uncommon with
Vite/webpack).

### Required CSS imports (do this in your app entry)

Styles are **not** auto-injected. Import all three stylesheets before rendering
Opentrons UI:

```tsx
import '@opentrons/protocol-visualization/styles'
import '@opentrons/components/styles/global'
import '@opentrons/components/styles'
```

Equivalent paths also work:

- `@opentrons/protocol-visualization/lib/style.css`
- `@opentrons/components/styles` resolves to `lib/style.css`

The bundled CSS uses **per-module hashed scoped class names**
(`[name]__[local]__[hash:base64:5]`). Do not re-process library CSS with a
different CSS modules `generateScopedName`; that breaks class name alignment
between JS and CSS.

### Required i18n setup

`ProtocolVisualization` (and many `@opentrons/components` strings) use
`react-i18next`. Wrap your app with `I18nextProvider` and load the
`protocol_visualization` namespace.

Shared component namespaces (`command_type_summary`, `deck_configuration`,
`protocol_command_text`) come from the Node-safe subpath
`@opentrons/components/localization` (do not import them from the package root
in Node — that entry loads React/DOM).

Minimal example (see [`src/i18n.ts`](src/i18n.ts) and
[`src/main.tsx`](src/main.tsx)):

```tsx
import { I18nextProvider } from 'react-i18next'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { shared_en_resources } from '@opentrons/components/localization'
import protocolVisualizationEn from './locale/en/protocol_visualization.json'

void i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      ...shared_en_resources,
      protocol_visualization: protocolVisualizationEn,
    },
  },
  interpolation: { escapeValue: false },
})

root.render(
  <I18nextProvider i18n={i18n}>
    <App />
  </I18nextProvider>
)
```

Copy English strings for `protocol_visualization` from
[`src/locale/en/protocol_visualization.json`](src/locale/en/protocol_visualization.json)
(keep in sync with
[`app/src/assets/localization/en/protocol_visualization.json`](../app/src/assets/localization/en/protocol_visualization.json)).

### Vite-specific configuration

If you use Vite, mirror [`vite.config.mts`](vite.config.mts):

1. **Single React instance** (alias + `dedupe`) so linked or nested copies of
   React do not break hooks.
2. **`cssModuleSideEffect` plugin** ([`cssModulesSideEffect.ts`](cssModulesSideEffect.ts))
   so CSS modules inside the library are not tree-shaken out.
3. **`optimizeDeps.include`** for all four `@opentrons/*` packages plus React
   ecosystem deps your app uses.
4. **`define: { 'process.env': {} }`** if you hit `process is not defined`
   from bundled library code.

CSS path aliases in the demo Vite config are a fallback when subpath exports
resolve unexpectedly; with a normal npm install the import paths above should
work without aliases.

### What publish.mts does before npm

Monorepo `package.json` files use `workspace:*` and `catalog:` specifiers that
**do not work on npm**. Always publish with
[`../scripts/publish.mts`](../scripts/publish.mts).

Pipeline:

1. **Debt patches** via
   [`../scripts/package-json-patches.mts`](../scripts/package-json-patches.mts)
   (shared with `scripts/patch-packed-packages.mts`):
   - `@types/*` (and a few unused runtime deps) moved out of `dependencies`
   - `peerDependencies` → npm-friendly ranges (`^18.2.0`, etc.)
   - `files` allowlists and `exports` maps
2. **Temporarily set** each package `version` to the publish semver, then run
   **`pnpm pack`** so pnpm rewrites `catalog:` / `workspace:*` (do not
   reimplement that in our scripts)
3. Inject README + LICENSE, then **`npm publish`** the tarball (OIDC Trusted
   Publishing on pnpm 10.x)

**Follow-up:** when the monorepo moves to **pnpm 11+**, switch the publish step
from `npm publish` to `pnpm publish` (native OIDC). Keep using pnpm for
`catalog:` / `workspace:*` rewriting.

```bash
# From monorepo root (always publishes dist-tag "latest")
node --experimental-strip-types scripts/next-npm-version.mts
node --experimental-strip-types scripts/publish.mts \
  --version 0.3.9-alpha.0 --dry-run
```

Dry-run needs no npm auth. A real local publish uses whatever `npm` is logged in
as (interactive 2FA); these packages disallow automation tokens, so prefer the
GitHub Actions workflow for releases. Do not pass `--tag` (hardcoded to `latest`).

### How js-package-testing simulates npm install

Local dev does **not** use monorepo `workspace:*` links to source. The Makefile:

1. Runs `make pack` in each library (builds `lib/` + `pnpm pack`)
2. Extracts tarballs to `pack/opentrons-*/`
3. Runs [`../scripts/patch-packed-packages.mts`](../scripts/patch-packed-packages.mts) so each
   `pack/*/package.json` matches what `publish.mts` would ship
4. `pnpm install` with `link:pack/...` deps and [`pnpm-workspace.yaml`](pnpm-workspace.yaml)
   **overrides** so transitive `@opentrons/*` also resolve to `pack/`

That is as close as we get to `npm install @opentrons/components@X` without
hitting the registry on every dev run. The demo app's `dependencies` list only
what an external app must install (React, i18n, the four packages). Test tooling
(Vite, Playwright, Applitools) stays in `devDependencies`.

### Known limitations

- **Alpha software.** Published packages are experimental; API stability is not
  guaranteed.
- **No default styles.** Missing CSS imports produce unstyled or broken layout.
- **i18n is mandatory** for protocol visualization copy; missing namespaces
  show translation keys.
- **React 18 only** today; other React versions are untested.
- **Bundlers differ.** This repo validates Vite; webpack/Next may need extra
  config (CSS handling, `process.env`, React dedupe).
- **Legacy CI tag publishes** for `components@*` / `shared-data@*` tags may not
  match `publish.mts` output. Prefer `publish.mts` for all four packages.

## Applitools Eyes

Visual checks use [`@applitools/eyes-playwright`](https://www.npmjs.com/package/@applitools/eyes-playwright) with the fixture-based `eyes.check()` API. Baselines and diffs live in Applitools, not in this repo.

### Setup

1. Log in to Applitools and copy an API key from the [API keys page](https://applitools.com/app/settings/api-keys).
2. Put the key in the environment. Easiest: copy [`.env.example`](.env.example) to **`.env`** in `js-package-testing/` (gitignored). [`playwright.config.ts`](playwright.config.ts) runs `import 'dotenv/config'` first, so **`make test`**, **`pnpm test`**, and **`pnpm exec playwright test`** load `.env` when run from this directory.

   You can still `export APPLITOOLS_API_KEY=...` in the shell; values already set are not overwritten by `.env`.

3. Run tests (`make test`). Checkpoints are recorded under the Eyes app name **`js-package-testing`** ([`playwright.config.ts`](playwright.config.ts) `eyesConfig.appName`).

### Reports

```bash
pnpm exec playwright show-report
```

Use the Applitools UI to accept or reject visual changes when baselines need updating.

## Quick start

### Requirements

- Node 22 (see monorepo `.nvmrc`)
- pnpm 10.x: this project pins **`pnpm@10.32.1`** in [`package.json`](package.json) `packageManager` (Corepack: `corepack enable`)

### Clean rebuild and dev server

From the **monorepo root**, install JS dependencies once so `pnpm pack` / `tsc` / `vite` work when this Makefile builds the four packages:

```bash
make setup-js
```

Then from **`js-package-testing/`** (not the repo root):

```bash
cd js-package-testing
make teardown setup dev
```

`make setup` runs `pnpm install --frozen-lockfile` in this directory. Run all **`pnpm`** / **`make`** commands for this app from `js-package-testing/`.

## Prerequisites

1. `make setup-js` at the monorepo root (required for packing `shared-data`, `step-generation`, `components`, and `protocol-visualization`; see Quick start).
2. Install pnpm (see above).
3. Set `APPLITOOLS_API_KEY` before visual tests.

## Make targets

### `make setup`

1. `make pack` in `shared-data`, then move and extract the tarball into `pack/opentrons-shared-data/`.
2. Same for `step-generation` → `pack/opentrons-step-generation/`.
3. Same for `components` → `pack/opentrons-components/`.
4. Same for `protocol-visualization` → `pack/opentrons-protocol-visualization/`.
5. `node --experimental-strip-types ../scripts/patch-packed-packages.mts` (rewrite manifests for external consumers).
6. `pnpm install --frozen-lockfile`.

Extracted directories must exist before `pnpm install` because direct dependencies use `link:pack/...`.

### `make build-local-packages`

Rebuild and extract `pack/` only. After source changes in any of the four packages, run this then `pnpm install` (or restart `make dev`).

### `make dev` / `make build` / `make preview`

Vite dev server, production build, and preview.

### `make test` / `make test-setup`

Playwright + Eyes (needs API key). `test-setup` installs Chromium; run after `make setup`.

### `make teardown` / `make clean-local-packages`

`teardown` removes `pack/` and `node_modules`. `clean-local-packages` removes only `pack/`.

## i18n

`ProtocolVisualization` uses the `react-i18next` namespace
`protocol_visualization`. English strings live in
[`src/locale/en/protocol_visualization.json`](src/locale/en/protocol_visualization.json).
Keep them aligned with
[`app/src/assets/localization/en/protocol_visualization.json`](../app/src/assets/localization/en/protocol_visualization.json)
when keys change.

## Package linking

Direct deps use `link:pack/opentrons-*`. [`pnpm-workspace.yaml`](pnpm-workspace.yaml) **`overrides`** force the same four paths for transitive `@opentrons/*` resolution.

After extraction, [`../scripts/patch-packed-packages.mts`](../scripts/patch-packed-packages.mts)
applies the same debt patches as `scripts/publish.mts` via
[`../scripts/package-json-patches.mts`](../scripts/package-json-patches.mts)
(`@types/*` moves, peer ranges, `files` / `exports`). `catalog:` / `workspace:*`
were already rewritten by each library's `pnpm pack`.

The `pack/` directory is gitignored. Committed `link:` entries and `pnpm-lock.yaml` describe the strategy; linked contents can change without lockfile churn for those packages.

## Project structure

```text
scripts/
├── publish.mts                # npm publish pipeline
├── next-npm-version.mts       # patch bump from npm latest
├── npm-latest-versions.mts    # print npm dist-tags
├── package-json-patches.mts   # single source of truth for published manifests
└── patch-packed-packages.mts  # applies patches to js-package-testing/pack/

js-package-testing/
├── Makefile
├── package.json
├── pnpm-workspace.yaml
├── playwright.config.ts
├── vite.config.mts
├── index.html
├── pack/                     # gitignored
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── i18n.ts
│   ├── styles.css
│   ├── locale/en/protocol_visualization.json
│   └── StackerAnalysis.json
└── tests/
    ├── protocolDeck.spec.ts
    └── protocolVisualization.spec.ts
```

## Dependencies (high level)

**Runtime (`dependencies`):** the four `@opentrons/*` packages (via `link:pack/...`), React 18.2, `react-i18next` 14, `i18next`, and `@fontsource/public-sans`. These mirror what an external app must install.

**Dev-only (`devDependencies`):** Vite, Playwright, Applitools, TypeScript, and test typings. Library runtime deps (`styled-components`, `redux`, etc.) are bundled inside the published packages and are not listed here.

After upgrading Playwright, run `make test-setup` or `pnpm exec playwright install chromium` so browser binaries match.

## Troubleshooting

### Pack or `make build-local-packages` fails

Root `node_modules` must exist. From the monorepo root run `make setup-js` (or `pnpm` with the repo’s usual workflow), then try again from `js-package-testing/`.

### `pnpm install --frozen-lockfile` fails

Use the `pnpm-lock.yaml` from your branch. If you changed `package.json` locally, run `pnpm install` once without `--frozen-lockfile`, then commit an updated lockfile if needed.

### Vite build or dev fails resolving `@opentrons/*` or CSS

`pack/opentrons-*` must exist **before** `pnpm install`, because dependencies use `link:pack/...`. Run `make build-local-packages` (or full `make setup`), then `pnpm install` from `js-package-testing/`. If you already installed without `pack/`, rebuild packs and run `pnpm install` again.

### Protocol visualization renders with broken styles

Package CSS for `@opentrons/components` and `@opentrons/protocol-visualization` is imported from [`src/main.tsx`](src/main.tsx) so Vite reliably includes both bundles in the module graph:

- `@opentrons/protocol-visualization/styles`
- `@opentrons/components/styles/global`
- `@opentrons/components/styles`

The bundled CSS for these packages uses **per-module hashed scoped names** (`[name]__[local]__[hash:base64:5]`) so unscoped local names like `.container`, `.header`, `.footer`, `.body_container` cannot collide across `*.module.css` files. This is configured in:

- `components/vite.config.mts` -> `css.modules.generateScopedName`
- `protocol-visualization/vite.config.mts` -> `css.modules.generateScopedName`

If a future change reverts those scoped names back to `'[local]'`, expect cross-component class collisions in the packed `lib/style.css` (for example the right rail panel collapsing, deck slot labels misrendering, or footer text getting clipped) because many modules share generic class names. The fix is to keep the hashed scoped name pattern in those library `vite.config.mts` files, not to add per-class overrides in this consumer.
