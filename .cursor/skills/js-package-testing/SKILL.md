---
name: js-package-testing
description: Vite demo and Playwright + Applitools tests for packed @opentrons JS packages in js-package-testing/. Covers components, shared-data, step-generation, and protocol-visualization. Use for integration testing, package linking, external consumer bootstrap, or visual testing.
---

# JS package testing

## Purpose

Reference **external consumer** for four npm packages:

- `@opentrons/shared-data`
- `@opentrons/step-generation`
- `@opentrons/components`
- `@opentrons/protocol-visualization`

Builds packed artifacts (not live monorepo source), patches manifests like `publish.mts`, links via `link:pack/...`, and runs a Vite demo plus Playwright + Applitools Eyes.

**Full external consumer docs:** `js-package-testing/README.md` section "External consumer guide".

## External consumer checklist

1. Install all four `@opentrons/*` at the **same version**.
2. Install peers: `react@18.2.0`, `react-dom@18.2.0`, `react-i18next@14.0.0`, `i18next@^19.8.3`.
3. Import CSS in app entry:
   - `@opentrons/protocol-visualization/styles`
   - `@opentrons/components/styles/global`
   - `@opentrons/components/styles`
4. Wrap app in `I18nextProvider` with `protocol_visualization` namespace (see `src/i18n.ts`).
5. Vite: dedupe React, use `cssModulesSideEffect` plugin, `define: { 'process.env': {} }` if needed.

Library runtime deps (`styled-components`, `redux`, etc.) are bundled; host app does not install them.

## Applitools

- Set **`APPLITOOLS_API_KEY`** via `.env` in `js-package-testing/` or shell export.
- App name: **`js-package-testing`** (`playwright.config.ts`).
- Import **`test`** from `@applitools/eyes-playwright/fixture`; use **`eyes.check()`**.

## Package linking strategy

**Order matters:** build packs first, patch manifests, then install.

1. `make pack` in each library → extract to `pack/opentrons-*/`
2. `patch-packed-packages.mts` rewrites `pack/*/package.json` (same logic as `publish.mts`)
3. `pnpm install` with `link:pack/...` deps
4. `pnpm-workspace.yaml` **overrides** pin transitive `@opentrons/*` to `pack/`

Shared patching: `package-json-patches.mts` (used by `publish.mts` and `patch-packed-packages.mts`).

## Publish

From repo root:

```bash
node --experimental-strip-types js-package-testing/next-npm-version.mts
node --experimental-strip-types js-package-testing/publish.mts \
  --version X.Y.Z-alpha.0 --dry-run
```

Always publishes dist-tag `latest` (no `--tag` flag). Dry-run needs no auth; real
local publish needs interactive npm 2FA (tokens disallowed). Prefer CI for releases.

Never publish raw monorepo manifests (`workspace:*`, `catalog:` break npm consumers).

## Project structure

```text
js-package-testing/
├── Makefile
├── package.json
├── package-json-patches.mts
├── patch-packed-packages.mts
├── publish.mts
├── pnpm-workspace.yaml
├── playwright.config.ts
├── cssModulesSideEffect.ts
├── tests/
├── src/
│   ├── main.tsx          # CSS imports + I18nextProvider
│   ├── i18n.ts
│   └── locale/en/protocol_visualization.json
└── pack/                 # gitignored
```

## Makefile targets

| Target                      | Description                                                 |
| --------------------------- | ----------------------------------------------------------- |
| `make setup`                | Build/extract/patch packs, `pnpm install --frozen-lockfile` |
| `make dev`                  | Run Vite dev server (runs `setup` first)                    |
| `make test-setup`           | Install Playwright Chromium (`make setup` first)            |
| `make test`                 | Playwright + Eyes (needs `APPLITOOLS_API_KEY`)              |
| `make build-local-packages` | Rebuild and patch `pack/` only                              |
| `make teardown`             | Remove `pack/` and `node_modules`                           |

## Quick start

```bash
# monorepo root
make setup-js

cd js-package-testing
make teardown setup dev
```

## Lint (monorepo root)

`make lint-js`, `make lint-css`, `make format-js`

## Troubleshooting

- **Module not found / broken links:** `make clean-local-packages && make setup`
- **Unstyled UI:** missing CSS imports in app entry (see `src/main.tsx`)
- **Translation keys visible:** missing i18n namespace setup
- **After library source edits:** `make build-local-packages` then `pnpm install`
