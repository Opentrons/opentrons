# Opentrons App E2E Tests

End-to-end tests for the **Opentrons desktop application** (Electron), powered by [Playwright](https://playwright.dev/) and TypeScript.

## How It Works

Playwright's native [`_electron.launch()`](https://playwright.dev/docs/api/class-electron) API starts the installed Opentrons app directly — no manual subprocess management or CDP ports required. This gives tests full access to the renderer (via a normal Playwright `Page`) **and** the Electron main process (via `electronApp.evaluate()`).

### Fixture chain

| Fixture        | Scope  | What it does                                            |
| -------------- | ------ | ------------------------------------------------------- |
| `electronApp`  | worker | Launches the Opentrons binary, yields `ElectronApplication` |
| `appWindow`    | worker | Waits for the first `BrowserWindow`, yields its `Page`  |
| `appPage`      | worker | Sets a default timeout on `appWindow` and yields it     |

Tests import `test` and `expect` from `fixtures/electron-app.ts` rather than `@playwright/test` directly:

```ts
import { test, expect } from '../fixtures/electron-app';
import { AppPage } from '../pages';

test('app launches', async ({ appPage }) => {
  const app = new AppPage(appPage);
  await app.waitForReady();
  await app.expectTitleContains('Opentrons');
});
```

## Prerequisites

- **Node.js ≥ 22** — use `nvs use 22` to switch
- **pnpm** — installed globally (`npm i -g pnpm@latest`)
- **Opentrons app** — installed at `/Applications/Opentrons.app` (macOS) or set `OPENTRONS_APP_PATH`

## Setup

```bash
make setup          # installs deps from the lockfile
```

## Running Tests

```bash
make test           # headless
make test-headed    # see the app window
make test-debug     # headed + Playwright Inspector
make test-ui        # Playwright UI mode
make report         # open the HTML report from the last run
```

Or with pnpm directly:

```bash
pnpm test
pnpm test:headed
pnpm test:debug
pnpm test:ui
pnpm report
```

## Code Quality

```bash
make check          # lint + typecheck (CI gate)
make prep           # auto-fix + format + typecheck (pre-commit)
make lint           # lint only
make format         # format only
make typecheck      # tsc --noEmit
```

## Environment Variables

| Variable              | Default                                        | Description                                  |
| --------------------- | ---------------------------------------------- | -------------------------------------------- |
| `OPENTRONS_APP_PATH`  | Auto-detected from well-known install locations | Path to the Electron binary or `.app` bundle |
| `APP_STARTUP_TIMEOUT` | `30000`                                        | Milliseconds to wait for the app window      |

## Project Structure

```
e2e-testing/app/
├── Makefile               # Setup, test, and code-quality targets
├── package.json           # pnpm project, scripts, deps
├── pnpm-lock.yaml
├── playwright.config.ts   # Playwright configuration
├── tsconfig.json          # TypeScript (strict, ESNext)
├── biome.json             # Biome v2 — lint + format
├── fixtures/
│   └── electron-app.ts    # Electron launch fixtures (worker-scoped)
├── pages/
│   ├── index.ts
│   └── app-page.ts        # Page object for the Opentrons window
└── tests/
    └── app-smoke.spec.ts  # Smoke tests
```

## Teardown

```bash
make teardown       # removes node_modules
```
