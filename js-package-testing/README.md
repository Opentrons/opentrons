# JS package testing

A Vite app and Playwright suite for exercising **packed** builds of:

- `@opentrons/components`
- `@opentrons/shared-data`
- `@opentrons/step-generation`
- `@opentrons/protocol-visualization`

The demo page includes **ProtocolDeck** (components) and **AnnotatedSteps** (protocol-visualization), which is the current exported UI for protocol visualization and exercises its internal molecules and organisms (command rows, groups, icons, error modal). Visual regression uses **Applitools Eyes**, not committed screenshots.

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

```bash
make teardown setup dev
```

## Prerequisites

1. Run `make setup-js` at the monorepo root so packages can be packed.
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

`AnnotatedSteps` uses `react-i18next` namespace `protocol_visualization`. English strings live in [`src/locale/en/protocol_visualization.json`](src/locale/en/protocol_visualization.json). Keep them aligned with [`app/src/assets/localization/en/protocol_visualization.json`](../app/src/assets/localization/en/protocol_visualization.json) when keys change.

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
    └── protocolDeck.spec.ts
```

## Dependencies (high level)

Versions align with the monorepo where applicable: React 18.2, TypeScript 5.3.3, Vite 7, Playwright ^1.58, `@applitools/eyes-playwright`, `react-i18next` 14 / `i18next` for the protocol visualization demo.

After upgrading Playwright, run `make test-setup` or `pnpm exec playwright install chromium` so browser binaries match.
