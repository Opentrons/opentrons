# Components Testing

A minimal React app with Vite for testing the **built packages** of `@opentrons/components` and `@opentrons/shared-data`, with a focus on testing the **ProtocolDeck component** using Playwright for visual regression testing.

## Purpose

This project is specifically designed to test built packages in a real-world consumption scenario, ensuring that:

- CSS bundling works correctly in built packages
- Component exports are properly accessible
- All dependencies are correctly packaged and resolved
- The ProtocolDeck component renders correctly with real protocol analysis data
- Visual changes are caught through snapshot testing

## Quick Start

### Requirements

- node 22
- pnpm 10.x installed in your node environment. For example via npm:

```bash
npm install -g pnpm@10.22.0
```

Or use corepack:

```bash
corepack enable
```

### Clean environment, rebuild local packages, and start the dev server:

```bash
make teardown setup dev
```

## Prerequisites

1. Run `make setup-js` at the monorepo root so that components and shared-data are ready to be packed
2. Ensure pnpm is installed globally in your node environment

## Available Make Commands

### Setup Commands

#### `make setup`

Complete setup - installs dependencies, then builds and links packages locally.

This command:

1. Builds the `@opentrons/shared-data` package using `make pack`
2. Moves the built `.tgz` to `pack/opentrons-shared-data-v0.0.0-dev.tgz`
3. Extracts it to `pack/opentrons-shared-data/`
4. Builds the `@opentrons/components` package using `make pack`
5. Moves the built `.tgz` to `pack/opentrons-components-v0.0.0-dev.tgz`
6. Extracts it to `pack/opentrons-components/`
7. Runs `pnpm install --frozen-lockfile` to create `node_modules` and install dependencies (including symlinks to the extracted packages)

Note: Building packages happens BEFORE `pnpm install` because the `link:` entries in `package.json` reference the `pack/` directories, which must exist.

#### `make build-local-packages`

Build and extract local packages only (without running `pnpm install`). Use this when you've made changes to the source packages and want to rebuild them. After running this, run `pnpm install` to update the symlinks.

### Development Commands

#### `make dev`

Starts Vite development server (typically on <http://localhost:5173>)

#### `make build`

Build for production

#### `make preview`

Preview production build

### Testing Commands

#### `make test`

Run Playwright tests with current snapshots. Note: You must run `make test-setup` first to install browsers.

#### `make test-setup`

Install Playwright browser dependencies (Chromium). Run `make setup` first, then run this once before running tests for the first time.

#### `make test-update-snapshots`

**Update visual snapshots after intentional style changes.**

Use this when you've made purposeful changes to the ProtocolDeck styling or layout and need to update the baseline screenshots. The updated snapshots will be committed to the repository as the new expected output.

You can also use the npm script version:

```bash
pnpm test:update-snapshots
```

### Cleanup Commands

#### `make teardown`

Remove linked packages and clean up completely.

This command:

1. Removes the `pack/` directory with `.tgz` files and extracted packages
2. Removes `node_modules` directory

#### `make clean-local-packages`

Remove only local packages (keeps node_modules). Useful when you want to refresh just the linked packages.

## Testing Workflow

### Initial Setup

1. Run `make setup` to build packages and link dependencies
2. Run `make test-setup` to install Playwright browsers (one-time setup)
3. Run `make test` to verify visual tests pass
4. Run `make dev` to start the development server

### Development Workflow

When you make changes to the source components or shared-data packages:

1. Run `make clean-local-packages` to remove old built packages
2. Run `make build-local-packages` to rebuild and extract
3. Run `pnpm install` to update symlinks (or just restart `make dev`)
4. Run `make test` to verify visual tests still pass

### Updating Visual Snapshots

When you make **intentional** style or layout changes to ProtocolDeck:

1. Make your changes in the source `components` package
2. Run `make clean-local-packages build-local-packages` to rebuild
3. Run `pnpm install` to update symlinks
4. Run `make test-update-snapshots` to update the baseline screenshots
5. Review the updated snapshots in `tests/__screenshots__/`
6. Commit the updated snapshots if they look correct

## Package Linking Approach

This project uses `pnpm link` with extracted package directories to test built packages in a realistic consumption scenario.

**How pnpm 10 handles linking:**

- Adds `link:` protocol entries to `package.json` (e.g., `"@opentrons/components": "link:pack/opentrons-components"`)
- Records links in `pnpm-lock.yaml` but does NOT lock to specific versions
- The lockfile only changes when regular (non-linked) dependencies change, NOT when linked package contents change
- Creates symlinks in `node_modules/@opentrons/` pointing to the extracted packages

**Why this approach:**

- Linked packages can be rebuilt and updated without causing lockfile churn
- The `link:` protocol means pnpm always uses the current contents of `pack/opentrons-*/` directories
- Regular dependencies remain stable and locked as expected
- Simulates real-world package consumption while allowing rapid iteration

The workflow:

1. Build packages as `.tgz` files using `make pack`
2. Extract `.tgz` files to `pack/opentrons-shared-data/` and `pack/opentrons-components/`
3. Use `pnpm link` (only needed the very first time to add the link in package.json) with absolute paths to add `link:` entries and symlink packages
4. Install regular dependencies with `pnpm install` to create `node_modules`

The `pack/` directory is gitignored. The `link:` entries in `package.json` and `pnpm-lock.yaml` are committed to track the linking strategy.

## Project Structure

```text
components-testing/
├── Makefile                    # Build and setup automation
├── package.json               # Dependencies (includes link: entries for local packages)
├── pnpm-lock.yaml            # Lock file (tracks links but not versions)
├── playwright.config.ts      # Playwright test configuration
├── vite.config.mts           # Vite configuration
├── index.html                # HTML entry point
├── pack/                     # Gitignored directory for .tgz packages and extracted dirs
├── src/
│   ├── main.tsx             # Main application with ProtocolDeck test
│   ├── styles.css           # Base styles
│   └── StackerAnalysis.json # Protocol analysis test data
└── tests/
    ├── protocolDeck.spec.ts     # Playwright tests
    └── __screenshots__/         # Baseline screenshots (committed)
```

## Dependencies

This project uses exact versions matching the monorepo's root package.json:

- react: 18.2.0
- react-dom: 18.2.0
- typescript: 5.3.3
- @types/react: 18.2.51
- @types/react-dom: 18.2.0

### Local Packages (Linked)

The following packages are linked at build time via `pnpm link`:

- `@opentrons/shared-data`: Extracted to `pack/opentrons-shared-data/`, linked with `link:` protocol
- `@opentrons/components`: Extracted to `pack/opentrons-components/`, linked with `link:` protocol

These appear in `package.json` with the `link:` protocol (e.g., `"@opentrons/components": "link:pack/opentrons-components"`) and are symlinked into `node_modules/@opentrons/`. The links are tracked in `pnpm-lock.yaml` but versions are not locked, allowing the linked directories to be updated without relocking.
