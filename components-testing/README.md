# Components Testing

A minimal React app with Vite for testing components and shared-data packages.

## Quick Start

1. run `make setup-js` at the root so that components and shared-data are ready to be packed.
1. pnpm is installed globally in your node environment.
1. in this directory, run:

```bash
make setup dev
```

This will

- builds components and shared-data
- installs dependencies
- starts the Vite development server at <http://localhost:5173>

## Project Structure

- `index.html` - Main HTML file with #root mount
- `src/main.tsx` - React entry point with "Hello, world" component (TypeScript)
- `vite.config.mts` - Vite configuration (TypeScript)
- `tsconfig.json` - TypeScript configuration for source files
- `tsconfig.node.json` - TypeScript configuration for Vite config
- `package.json` - Dependencies with exact versions from monorepo
- `Makefile` - Simple build targets

## Dependencies

This project uses exact versions matching the monorepo's root package.json:

- react: 18.2.0
- react-dom: 18.2.0
- typescript: 5.3.3 (dev)
- @types/react: 18.2.51 (dev)
- @types/react-dom: 18.2.0 (dev)

### Local Packages

The following packages are installed as local file dependencies:

- @opentrons/shared-data: Built from `../shared-data`
- @opentrons/components: Built from `../components`
