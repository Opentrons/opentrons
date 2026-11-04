# Conventions for `protocol-visualization`

Follow the same rules as other Opentrons JS/TS packages. Authoritative detail lives in the Cursor skills below; this file is a checklist for contributors.

## TypeScript and React

**Source of truth:** [`.cursor/skills/opentrons-typescript/SKILL.md`](../.cursor/skills/opentrons-typescript/SKILL.md)

Summary:

- Extend [`tsconfig-base.json`](../tsconfig-base.json): strict mode, `composite`, `rootDir: "src"`, `outDir: "lib"`, project **references** to packages you import (`components`, `shared-data`, `step-generation`).
- **No default exports** in source (ESLint `import/no-default-export`). Exceptions: Vite config, Storybook stories.
- **Prettier:** no semicolons, single quotes (double in JSX), trailing commas ES5, print width 80, 2-space indent, LF.
- **Import order** (Prettier `@ianvs/prettier-plugin-sort-imports`): `react` → third party → `@opentrons/*` → relative → `import type` → assets.
- **Cross-package:** this package already lists `@opentrons/components`, `@opentrons/shared-data`, and `@opentrons/step-generation` in `package.json`; keep imports in source limited until UI lands (no imports from `app/`). Tests in `src/__tests__/workspace-dependencies.test.ts` verify those packages resolve.
- **Lodash:** import per function (`import map from 'lodash/map'`), not `import _ from 'lodash'`.
- **Types:** prefer `import type` for type-only imports.

## CSS Modules

**Source of truth:** [`.cursor/skills/css-modules/SKILL.md`](../.cursor/skills/css-modules/SKILL.md)

Summary:

- Filename: **lowercase**, matches component, suffix **`.module.css`** (e.g. `visualizercontainer.module.css`).
- Class names: **snake_case** only (`/^[a-z0-9_]+$/` per Stylelint).
- Import: `import styles from './componentname.module.css'` and use `styles.class_name`.
- **Design tokens:** prefer CSS variables from [`components/src/styles/global.css`](../components/src/styles/global.css) (`--spacing-*`, `--grey-*`, etc.) over raw hex or px where applicable.
- **Conditional classes:** use [`clsx`](https://github.com/lukeed/clsx).

## Monorepo workflow

- **Node:** `>=22.22.0` (see [`.nvmrc`](../.nvmrc)); Pnpm 10.32.1.
- From repo root: `make setup-js` if needed; **`make -C protocol-visualization lint`** (same as **`make lint-js lint-css lint-json`** from the repo root) and **`make -C protocol-visualization check-ts`**; scoped tests via `make test-js-protocol-visualization` or `make -C protocol-visualization test`.
- This package’s [`Makefile`](./Makefile) defines `lint` (delegates to the root Makefile) and `check-ts`.

## Lint

- ESLint includes this package via root [`tsconfig-eslint.json`](../tsconfig-eslint.json).
- Before merging, run **`make lint-js lint-css lint-json`** from the monorepo root, or **`make -C protocol-visualization lint`**.
