---
name: js-package-testing
description: Vite demo and Playwright + Applitools tests for packed @opentrons JS packages in js-package-testing/. Covers components, shared-data, step-generation, and protocol-visualization. Use for integration testing, package linking, or visual testing.
---

# JS package testing

## Purpose

This project tests **built packages** of `@opentrons/components`, `@opentrons/shared-data`, `@opentrons/step-generation`, and `@opentrons/protocol-visualization` the way consumers would install them: pack, extract under `pack/`, and link with pnpm. It includes:

- A **Vite** demo: **ProtocolDeck** plus **AnnotatedSteps** from `@opentrons/protocol-visualization` (current public surface of that package)
- **Playwright** with **Applitools Eyes** for visual checks (not committed image snapshots)

## Applitools

- Set **`APPLITOOLS_API_KEY`** via `.env` in `js-package-testing/` (loaded by `import 'dotenv/config'` in `playwright.config.ts`) or export it in the shell (see `js-package-testing/.env.example`).
- App name in Eyes: **`js-package-testing`** (`playwright.config.ts` → `use.eyesConfig.appName`).
- Import **`test`** from `@applitools/eyes-playwright/fixture` in specs; use **`eyes.check(name, { region, matchLevel })`** for checkpoints.
- Baseline updates happen in the Applitools dashboard (or enhanced HTML report), not via `--update-snapshots`.

## Package linking strategy

Uses **`pnpm link`** with extracted package directories. Workflow: `pnpm install` → build packages as `.tgz` → extract to `pack/` (see `js-package-testing/Makefile` `build-local-packages`). **`pnpm-workspace.yaml`** `overrides` pin all four `@opentrons/*` packages to the `pack/` trees so transitive `link:../` paths inside packed `package.json` files do not break resolution.

## Project structure

```text
js-package-testing/
├── Makefile
├── package.json
├── playwright.config.ts
├── cssModulesSideEffect.ts
├── tests/protocolDeck.spec.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── i18n.ts
│   ├── styles.css
│   ├── locale/en/protocol_visualization.json
│   └── StackerAnalysis.json
└── pack/                  # gitignored
```

## Lint and format (monorepo root)

CI runs the same Stylelint, Prettier, and ESLint as the rest of the repo. **Run from the monorepo root** after `make setup-js` (or equivalent).

| Check                         | Command          |
| ----------------------------- | ---------------- |
| Full CSS (matches CI)         | `make lint-css`  |
| Full JS                       | `make lint-js`   |
| Auto-format JS/TS/JSON/CSS/MD | `make format-js` |

**Scoped checks** while editing only this package:

```bash
pnpm stylelint "js-package-testing/**/*.css"
pnpm prettier --ignore-path .eslintignore --check "js-package-testing/**/*.{ts,tsx,js,json,css,md}"
pnpm eslint --report-unused-disable-directives-severity error --ignore-pattern "node_modules/" "js-package-testing/**/*.{ts,tsx,js}"
pnpm eslint --report-unused-disable-directives-severity error --max-warnings 0 --ext .json js-package-testing/
```

Global `styles.css` uses **`stylelint-config-idiomatic-order`** (via root `.stylelintrc.js`): keep declarations in that order so `make lint-css` passes.

## Makefile targets

| Target                      | Description                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| `make setup`                | Build/extract all four packages, `pnpm install --frozen-lockfile` |
| `make dev`                  | Run Vite dev server (runs `setup` first)                          |
| `make test-setup`           | Install Playwright Chromium (`make setup` first)                  |
| `make test`                 | Playwright + Eyes (needs `APPLITOOLS_API_KEY`)                    |
| `make build-local-packages` | Rebuild `pack/` only                                              |
| `make clean-local-packages` | Remove `pack/`                                                    |
| `make teardown`             | Remove `pack/` and `node_modules`                                 |
| `make build`                | Production Vite build (after `setup`)                             |
| `make preview`              | `vite preview`                                                    |

## Quick start

```bash
export APPLITOOLS_API_KEY='...'
make teardown setup dev
```

## Troubleshooting

- **Eyes / auth errors**: Confirm `APPLITOOLS_API_KEY` is set in the shell running Playwright.
- **Module not found**: `make clean-local-packages && make setup`
- **Playwright failures**: `make test-setup`; avoid port 5173 conflicts when CI sets `reuseExistingServer` false.

## Notes

- The demo loads English strings for the `protocol_visualization` i18n namespace from `src/locale/en/protocol_visualization.json` (kept in sync with `app/src/assets/localization/en/protocol_visualization.json`).
- Tests consume the **packed** artifacts under `pack/`, not live monorepo source, until you rebuild.
