---
applyTo: 'components-testing/**'
---

## Quick Start

Clean environment, rebuild local packages, and start the dev server:

```bash
make teardown setup dev
```

# Components Testing – ProtocolDeck Component Testing Environment

## Purpose

This project is specifically designed to test the **built packages** of `@opentrons/components` and `@opentrons/shared-data`, with a focus on testing the **ProtocolDeck component only**.

The testing environment simulates a real-world scenario where these packages would be consumed as external dependencies, ensuring that:

- CSS bundling works correctly in built packages
- Component exports are properly accessible
- All dependencies are correctly packaged and resolved
- The ProtocolDeck component renders correctly with real protocol analysis data
- Visual changes are caught through Playwright snapshot testing

## Package Linking Strategy

This project uses **`pnpm link`** with extracted package directories to install local packages. This approach:

- **Does NOT modify** `package.json` or `pnpm-lock.yaml`
- Avoids unnecessary lock file churn
- Prevents side effects on other dependencies during relocks
- Stores `.tgz` packages in a gitignored `pack/` directory
- Extracts packages to `pack/` subdirectories for linking

The workflow:

1. Run `pnpm install` first to create `node_modules`
2. Build packages as `.tgz` files
3. Extract to `pack/opentrons-shared-data/` and `pack/opentrons-components/`
4. Use `pnpm link <absolute-path>` to symlink into `node_modules/@opentrons/`

Local packages are linked at runtime, not declared as dependencies.

## Project Structure

```shell
components-testing/
├── Makefile                    # Build and setup automation
├── package.json               # Dependencies (local packages NOT listed)
├── pnpm-lock.yaml            # Lock file (unaffected by local links)
├── playwright.config.ts      # Playwright test configuration
├── vite.config.mts           # Vite configuration
├── index.html                # HTML entry point
├── pack/                     # Gitignored .tgz packages (created by make)
├── src/
│   ├── main.tsx             # Main application with ProtocolDeck test
│   ├── styles.css           # Base styles
│   └── StackerAnalysis.json # Protocol analysis test data
└── tests/
    ├── protocolDeck.spec.ts     # Playwright visual tests
    └── __screenshots__/         # Baseline screenshots (committed)
```

## Available Make Commands

The Makefile provides automated commands for package building and testing. All commands should be run from the `components-testing` directory.

### Setup Commands

**`make setup`** - Complete setup: builds packages and links them

This command:

1. Runs `pnpm install` to create `node_modules` and install dependencies
2. Builds the `@opentrons/shared-data` package using `make pack`
3. Moves the built `.tgz` to `pack/opentrons-shared-data-v0.0.0-dev.tgz`
4. Extracts the tarball to `pack/opentrons-shared-data/`
5. Builds the `@opentrons/components` package using `make pack`
6. Moves the built `.tgz` to `pack/opentrons-components-v0.0.0-dev.tgz`
7. Extracts the tarball to `pack/opentrons-components/`
8. Links packages using `pnpm link <absolute-path>` (no package.json changes)

**`make install-local-packages`** - Rebuild and link local packages only

Use this when you've made changes to source packages and want to test them.

### Development Commands

**`make dev`** - Start Vite development server

Typically runs on <http://localhost:5173>

**`make build`** - Build for production

**`make preview`** - Preview production build

### Testing Commands

**`make test`** - Run Playwright tests with current snapshots

**`make test-setup`** - Install Playwright browsers (one-time setup)

Installs Chromium with dependencies for running visual tests.

**`make test-update-snapshots`** - Update visual snapshots after intentional style changes

Use this when you've made **purposeful** changes to ProtocolDeck styling or layout and need to update the baseline screenshots. The updated snapshots will be committed to the repository as the new expected output.

You can also use the npm script:

```bash
pnpm test:update-snapshots
```

### Cleanup Commands

**`make teardown`** - Complete teardown: remove pack directory and node_modules

This command:

1. Removes the `pack/` directory with `.tgz` files and extracted packages
2. Removes `node_modules` directory

**`make clean-local-packages`** - Remove local packages only (keeps node_modules)

Useful when you want to refresh just the linked packages without reinstalling everything.

## Testing Workflow

### Initial Setup

1. Run `make setup` to build packages and link dependencies
2. Run `make test-setup` to install Playwright browsers (one-time)
3. Run `make test` to verify visual tests pass
4. Run `make dev` to start the development server

### Development Workflow

When you make changes to the source `components` or `shared-data` packages:

1. Run `make clean-local-packages` to unlink old packages
2. Run `make install-local-packages` to rebuild and relink
3. Run `make test` to verify visual tests still pass
4. Run `make dev` to see changes in the browser

### Updating Visual Snapshots

When you make **intentional** style or layout changes to ProtocolDeck:

1. Make your changes in the source `components` package
2. Run `make clean-local-packages && make install-local-packages` to rebuild
3. Run `make test-update-snapshots` to update the baseline screenshots
4. Review the updated snapshots in `tests/__screenshots__/`
5. Commit the updated snapshots if they look correct

### Complete Reset

If you encounter issues:

1. Run `make teardown` to completely clean the environment
2. Run `make setup` to rebuild everything from scratch

## What's Being Tested

### ProtocolDeck Component

The main focus is testing the `ProtocolDeck` component with:

- Real protocol analysis data (StackerAnalysis.json)
- Proper context providers (Redux, React Query, i18next)
- CSS styling from bundled packages
- Component props and rendering
- Visual regression testing with Playwright snapshots

### Package Integration

- CSS bundling and import resolution
- Component exports from built packages
- Dependency resolution between packages
- TypeScript type definitions

### Provider Setup

The test environment includes all necessary providers:

- **Redux Provider**: For state management
- **React Query Provider**: For data fetching context
- **i18next Provider**: For internationalization (mocked)
- **React StrictMode**: For development warnings

## Troubleshooting

### Common Issues

**"Module not found" errors:**

- Run `make clean-local-packages` then `make install-local-packages`
- Ensure packages built successfully (check for `.tgz` files in `pack/` directory)

**CSS not loading:**

- Verify CSS bundling worked in the components package
- Check browser network tab for CSS file requests
- Ensure Vite config aliases are correct

**React hooks errors (e.g. dispatcher null / useMemo undefined):**

- Often caused by multiple React copies (library bundling React instead of externalizing it)
- Verify `components/vite.config.mts` has React entries in `rollupOptions.external`
- Rebuild packages and reinstall local tarballs (`make clean-local-packages` then `make install-local-packages`)
- Clear browser cache and refresh
- Ensure only one React version is installed (check `pnpm why react`)

**Build failures:**

- Run `make teardown` then `make setup` for complete reset
- Check parent package build logs for errors

**Playwright test failures:**

- Run `make test-setup` to ensure browsers are installed
- Check that dev server is not running when running tests
- Review test output for specific failures
- Use `make test-update-snapshots` if changes are intentional

### Package Locations

The local packages are built with version `v0.0.0-dev` and stored in:

- `pack/opentrons-shared-data-v0.0.0-dev.tgz` (tarball)
- `pack/opentrons-shared-data/` (extracted, linked via pnpm)
- `pack/opentrons-components-v0.0.0-dev.tgz` (tarball)
- `pack/opentrons-components/` (extracted, linked via pnpm)

These are linked using `pnpm link` with absolute paths and do NOT appear in `package.json`.

## Development Notes

- This environment tests the **production build** of packages, not source code
- Changes to source components require rebuilding packages to test
- The setup mimics how external consumers would use these packages
- Focus is specifically on ProtocolDeck component functionality and styling
- **`package.json` and `pnpm-lock.yaml` remain stable** - they are not modified by the linking process
- The `pack/` directory is gitignored and can be safely deleted
