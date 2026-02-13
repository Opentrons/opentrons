# Opentrons App E2E Tests

End-to-end tests for the **Opentrons desktop application** (Electron), powered by [Playwright](https://playwright.dev/) and TypeScript.

## How It Works

Two test modes are supported:

### Installed (production) app

Playwright's native [`_electron.launch()`](https://playwright.dev/docs/api/class-electron) API starts the installed Opentrons app directly — no manual subprocess management or CDP ports required. This gives tests full access to the renderer (via a normal Playwright `Page`) **and** the Electron main process (via `electronApp.evaluate()`).

### Dev app (from source)

The dev fixture replicates `make -C app dev` by:

1. **Starting a Vite dev-server** (`vite serve` in `app/`) on a configurable port
2. **Building app-shell** (`vite build` in `app-shell/`) unless `SKIP_SHELL_BUILD=true`
3. **Launching Electron** with the same dev-mode flags the monorepo uses (`--devtools`, `--ui.url.protocol=http:`, `--ui.url.path=localhost:<port>`, etc.)
4. **Tearing everything down** after tests finish

### Fixture chains

**Installed app** (`fixtures/electron-app.ts`):

| Fixture        | Scope  | What it does                                            |
| -------------- | ------ | ------------------------------------------------------- |
| `electronApp`  | worker | Launches the Opentrons binary, yields `ElectronApplication` |
| `appWindow`    | worker | Waits for the first `BrowserWindow`, yields its `Page`  |
| `appPage`      | worker | Sets a default timeout on `appWindow` and yields it     |

**Dev app** (`fixtures/electron-dev.ts`):

| Fixture        | Scope  | What it does                                                       |
| -------------- | ------ | ------------------------------------------------------------------ |
| `electronApp`  | worker | Starts Vite dev-server, builds app-shell, launches Electron in dev mode |
| `appWindow`    | worker | Waits for the first `BrowserWindow`, yields its `Page`             |
| `appPage`      | worker | Sets a default timeout on `appWindow` and yields it                |

Tests import `test` and `expect` from the relevant fixture file:

```ts
// Installed app
import { test, expect } from '../fixtures/electron-app';

// Dev app
import { test, expect } from '../fixtures/electron-dev';

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
- **For dev tests:** The monorepo must have its dependencies installed (`yarn` / `make setup` at the monorepo root)

## Setup

```bash
make setup          # installs deps from the lockfile
```

## Running Tests

### Installed (production) app

```bash
make test           # headless
make test-headed    # see the app window
make test-debug     # headed + Playwright Inspector
```

### Dev app (from source)

```bash
make test-dev              # headless – builds app-shell, starts Vite, launches Electron
make test-dev-headed       # headed – visible window
make test-dev-debug        # headed + Playwright Inspector
make test-dev-skip-build   # skip app-shell rebuild (if already built)
```

### All tests

```bash
make test-all       # run both installed and dev tests
make test-ui        # Playwright UI mode
make report         # open the HTML report from the last run
```

Or with pnpm directly:

```bash
pnpm test              # installed app
pnpm test:dev          # dev app
pnpm test:all          # both
pnpm test:headed
pnpm test:dev:headed
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

| Variable              | Default                                        | Description                                           |
| --------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `OPENTRONS_APP_PATH`  | Auto-detected from well-known install locations | Path to the Electron binary or `.app` bundle           |
| `APP_STARTUP_TIMEOUT` | `30000` (installed) / `60000` (dev)              | Milliseconds to wait for the app window               |
| `DEV_PORT`            | `5173`                                         | Port for the Vite dev-server (dev mode)                |
| `MONOREPO_ROOT`       | Auto-detected (`../../..` from this dir)        | Path to the opentrons monorepo root                   |
| `SKIP_SHELL_BUILD`    | `false`                                        | Set to `true` to skip `vite build` in app-shell        |

## Project Structure

```
e2e-testing/app/
├── Makefile               # Setup, test, and code-quality targets
├── package.json           # pnpm project, scripts, deps
├── pnpm-lock.yaml
├── playwright.config.ts   # Playwright configuration (2 projects)
├── tsconfig.json          # TypeScript (strict, ESNext)
├── biome.json             # Biome v2 — lint + format
├── fixtures/
│   ├── electron-app.ts    # Installed app fixtures (worker-scoped)
│   └── electron-dev.ts    # Dev-mode fixtures (Vite + Electron from source)
├── pages/
│   ├── index.ts
│   └── app-page.ts        # Page object for the Opentrons window
└── tests/
    ├── app-smoke.spec.ts      # Smoke tests (installed app)
    └── dev-app-smoke.spec.ts  # Smoke tests (dev app)
```

## Teardown

```bash
make teardown       # removes node_modules
```
