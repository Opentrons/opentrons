---
name: components-testing
description: ProtocolDeck component testing environment using built packages with Playwright and Applitools Eyes in components-testing/. Use when working with component integration tests, package linking, or visual testing.
---

# Components Testing — ProtocolDeck Component Testing Environment

## Purpose

This project tests the **built packages** of `@opentrons/components` and `@opentrons/shared-data`, focusing on the **ProtocolDeck component**. It simulates real-world consumption as external dependencies to verify:

- CSS bundling works correctly in built packages
- Component exports are properly accessible
- Dependencies are correctly packaged and resolved
- ProtocolDeck renders correctly with real protocol analysis data
- Visual changes are tracked in **Applitools Eyes** (`@applitools/eyes-playwright`), not committed Playwright image snapshots

## Applitools

- Set **`APPLITOOLS_API_KEY`** via `.env` in `components-testing/` (loaded by `import 'dotenv/config'` in `playwright.config.ts`) or export it in the shell (see `components-testing/.env.example`).
- App name in Eyes: **`Opentrons components-testing`** (`playwright.config.ts` → `use.eyesConfig.appName`).
- Import **`test`** from `@applitools/eyes-playwright/fixture` in specs; use **`eyes.check(name, { region, matchLevel })`** for checkpoints.
- Baseline updates happen in the Applitools dashboard (or enhanced HTML report), not via `--update-snapshots`.

## Package Linking Strategy

Uses **`pnpm link`** with extracted package directories. Workflow: `pnpm install` → build packages as `.tgz` → extract to `pack/` (see `components-testing/Makefile` `build-local-packages`).

## Project Structure

```text
components-testing/
├── Makefile
├── package.json
├── playwright.config.ts   # EyesFixture + Applitools reporter
├── tests/protocolDeck.spec.ts
├── src/main.tsx
└── pack/                  # gitignored
```

## Makefile Targets

| Target                      | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `make setup`                | Build/extract local packages, `pnpm install --frozen-lockfile` |
| `make dev`                  | Run Vite dev server (runs `setup` first)                       |
| `make test-setup`           | Install Playwright Chromium (`make setup` first)               |
| `make test`                 | Playwright + Eyes (needs `APPLITOOLS_API_KEY`)                 |
| `make build-local-packages` | Rebuild pack only                                              |
| `make clean-local-packages` | Remove `pack/`                                                 |
| `make teardown`             | Remove `pack/` and `node_modules`                              |

## Quick Start

```bash
export APPLITOOLS_API_KEY='...'
make teardown setup dev
```

## Troubleshooting

- **Eyes / auth errors**: Confirm `APPLITOOLS_API_KEY` is set in the shell running Playwright.
- **Module not found**: `make clean-local-packages && make setup`
- **Playwright failures**: `make test-setup`; avoid port 5173 conflicts when CI sets `reuseExistingServer` false.

## Notes

- Tests consume the **packed** `components` and `shared-data` artifacts under `pack/`, not live monorepo source (until rebuilt).
