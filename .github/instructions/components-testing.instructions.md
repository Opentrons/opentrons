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

## Project Structure

```shell
components-testing/
├── INSTRUCTIONS.md          # This file
├── Makefile                # Build and setup automation
├── package.json            # Dependencies and scripts
├── vite.config.mts         # Vite configuration
├── index.html             # HTML entry point
└── src/
    ├── main.tsx           # Main application with ProtocolDeck test
    ├── styles.css         # Base styles
    └── StackerAnalysis.json # Protocol analysis test data
```

## Available Make Commands

The Makefile provides automated commands for package building and testing. All commands should be run from the `components-testing` directory:

### Setup Commands

```bash
# Complete setup - builds packages and installs dependencies
make setup
```

This command:

1. Builds the `@opentrons/shared-data` package using `make pack`
2. Builds the `@opentrons/components` package using `make pack`
3. Installs the local `.tgz` packages into this project
4. Installs all other dependencies with `pnpm install`

```bash
# Install only the local packages (assumes they're already built)
make install-local-packages
```

### Development Commands

Use these during normal development (for a full clean cycle use the Quick Start command):

```bash
# Start the development server
make dev
```

Starts Vite development server (typically on <http://localhost:5173>)

```bash
# Build for production
make build
```

```bash
# Preview production build
make preview
```

### Cleanup Commands

```bash
# Remove local packages and clean up
make teardown
```

This command:

1. Removes `@opentrons/shared-data` and `@opentrons/components` from dependencies
2. Cleans up the `.tgz` package files
3. Removes `node_modules` directory

```bash
# Remove only local packages (keeps node_modules)
make clean-local-packages
```

## Testing Workflow

### Initial Setup

1. Run `make setup` to build packages and install dependencies
2. Run `make dev` to start the development server
3. Open your browser to the displayed URL (typically <http://localhost:5173>)

### Testing Changes

When you make changes to the source components or shared-data packages:

1. Run `make clean-local-packages` to remove old packages
2. Run `make install-local-packages` to rebuild and reinstall
3. Refresh your browser to see changes

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
- Ensure packages built successfully (check for `.tgz` files in parent directories)

**CSS not loading:**

- Verify CSS bundling worked in the components package
- Check browser network tab for CSS file requests
- Ensure Vite config aliases are correct

**React hooks errors (e.g. dispatcher null / useMemo undefined):**

- Often caused by multiple React copies (library bundling React instead of externalizing it).
- Verify `components/vite.config.mts` has React entries in `rollupOptions.external`.
- Rebuild packages and reinstall local tarballs (`make clean-local-packages` then `make install-local-packages`).
- Clear browser cache and refresh.
- Ensure only one React version is installed (check `pnpm why react`).

**Build failures:**

- Run `make teardown` then `make setup` for complete reset
- Check parent package build logs for errors

### Package Versions

The local packages are built with version `v0.0.0-dev` and installed as:

- `@opentrons/shared-data` from `../shared-data/opentrons-shared-data-v0.0.0-dev.tgz`
- `@opentrons/components` from `../components/opentrons-components-v0.0.0-dev.tgz`

## Development Notes

- This environment tests the **production build** of packages, not source code
- Changes to source components require rebuilding packages to test
- The setup mimics how external consumers would use these packages
- Focus is specifically on ProtocolDeck component functionality and styling
