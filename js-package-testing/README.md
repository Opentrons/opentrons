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
5. `pnpm install --frozen-lockfile`.

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

Direct deps use `link:pack/opentrons-*`. [`pnpm-workspace.yaml`](pnpm-workspace.yaml) **`overrides`** force the same four paths for transitive `@opentrons/*` resolution so packed `package.json` files that still contain monorepo `link:../` specifiers resolve correctly.

The `pack/` directory is gitignored. Committed `link:` entries and `pnpm-lock.yaml` describe the strategy; linked contents can change without lockfile churn for those packages.

## Project structure

```text
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

Versions align with the monorepo where applicable: React 18.2, TypeScript 5.3.3, Vite 7, Playwright ^1.58, `@applitools/eyes-playwright`, `react-i18next` 14 / `i18next` for the protocol visualization demo.

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

- `@opentrons/protocol-visualization/lib/style.css`
- `@opentrons/components/styles/global`
- `@opentrons/components/styles`

The bundled CSS for these packages uses **per-module hashed scoped names** (`[name]__[local]__[hash:base64:5]`) so unscoped local names like `.container`, `.header`, `.footer`, `.body_container` cannot collide across `*.module.css` files. This is configured in:

- `components/vite.config.mts` -> `css.modules.generateScopedName`
- `protocol-visualization/vite.config.mts` -> `css.modules.generateScopedName`

If a future change reverts those scoped names back to `'[local]'`, expect cross-component class collisions in the packed `lib/style.css` (for example the right rail panel collapsing, deck slot labels misrendering, or footer text getting clipped) because many modules share generic class names. The fix is to keep the hashed scoped name pattern in those library `vite.config.mts` files, not to add per-class overrides in this consumer.
