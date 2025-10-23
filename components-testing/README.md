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

Clean environment, rebuild local packages, and start the dev server:

```bash
make teardown setup dev
```

## Prerequisites

1. Run `make setup-js` at the monorepo root so that components and shared-data are ready to be packed
2. Ensure pnpm is installed globally in your node environment

## Available Make Commands

### Setup Commands

#### `make setup`

Complete setup - builds packages and links them locally.

This command:

1. Builds the `@opentrons/shared-data` package using `make pack`
2. Builds the `@opentrons/components` package using `make pack`
3. Moves the built `.tgz` packages to a local `pack/` directory
4. Links the packages using `pnpm link` (does NOT modify package.json or pnpm-lock.yaml)
5. Installs all other dependencies with `pnpm install`

#### `make install-local-packages`

Install only the local packages (assumes they're already built). Use this when you've made changes to the source packages.

### Development Commands

#### `make dev`

Starts Vite development server (typically on <http://localhost:5173>)

#### `make build`

Build for production

#### `make preview`

Preview production build

### Testing Commands

#### `make test`

Run Playwright tests with current snapshots

#### `make test-setup`

Install Playwright browser dependencies (Chromium). Run this once before running tests.

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

1. Unlinks `@opentrons/shared-data` and `@opentrons/components`
2. Removes the `pack/` directory with `.tgz` files
3. Removes `node_modules` directory

#### `make clean-local-packages`

Remove only local packages (keeps node_modules). Useful when you want to refresh just the linked packages.

## Testing Workflow

### Initial Setup

1. Run `make setup` to build packages and link dependencies
2. Run `make test-setup` to install Playwright browsers (one-time setup)
3. Run `make test` to verify everything works

### Development Workflow

When you make changes to the source components or shared-data packages:

1. Run `make clean-local-packages` to unlink old packages
2. Run `make install-local-packages` to rebuild and relink
3. Run `make dev` to see changes in the browser
4. Run `make test` to verify visual tests still pass

### Updating Visual Snapshots

When you make **intentional** style or layout changes to ProtocolDeck:

1. Make your changes in the source `components` package
2. Run `make clean-local-packages && make install-local-packages` to rebuild
3. Run `make test-update-snapshots` to update the baseline screenshots
4. Review the updated snapshots in `tests/__screenshots__/`
5. Commit the updated snapshots if they look correct

## Package Linking Approach

This project uses `pnpm link` instead of `pnpm add` to avoid:

- Modifying package.json with file: dependencies
- Causing unnecessary pnpm-lock.yaml relocks
- Potential side effects on other dependencies during lock updates

The `.tgz` packages are stored in a local `pack/` directory that is gitignored, keeping the repository clean.

## Project Structure

```text
components-testing/
├── Makefile                    # Build and setup automation
├── package.json               # Dependencies (local packages NOT listed here)
├── pnpm-lock.yaml            # Lock file (unaffected by local package changes)
├── playwright.config.ts      # Playwright test configuration
├── vite.config.mts           # Vite configuration
├── index.html                # HTML entry point
├── pack/                     # Gitignored directory for .tgz packages
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

### Local Packages (Linked, Not in package.json)

The following packages are linked at build time via `pnpm link`:

- `@opentrons/shared-data`: Built from `../shared-data/pack/opentrons-shared-data-v0.0.0-dev.tgz`
- `@opentrons/components`: Built from `../components/pack/opentrons-components-v0.0.0-dev.tgz`
