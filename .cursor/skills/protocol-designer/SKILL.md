---
name: protocol-designer
description: Protocol Designer (PD) application architecture, Redux slices, step/timeline system, domain concepts, and dev workflow. Use when working with files in protocol-designer/ or discussing PD features, steps, timelines, or protocol design.
---

# Protocol Designer — Application-Specific Conventions

General TypeScript, React, styling, testing, import, and tooling conventions are in the `opentrons-typescript` skill. This file covers only what is unique to the `protocol-designer` package.

## Project Overview

Protocol Designer (PD) is a React + Redux + React Router + TypeScript web app for designing Opentrons liquid-handling protocols. It depends on `@opentrons/components`, `@opentrons/shared-data`, and `@opentrons/step-generation`. It follows an atomic design system.

## Redux Architecture

PD uses **Redux** (legacy `createStore`) with **redux-thunk** and **reselect**. The store shape is `BaseState` in `src/types.ts`.

### Slices

Each slice directory contains `reducers/`, `actions/`, `selectors/`, and `types.ts`:

| Slice            | Key             | Purpose                                               |
| ---------------- | --------------- | ----------------------------------------------------- |
| `analytics`      | `analytics`     | Event tracking                                        |
| `dismiss`        | `dismiss`       | Dismissible UI elements                               |
| `feature-flags`  | `featureFlags`  | Feature flags (`OT_PD_*` env vars)                    |
| `file-data`      | `fileData`      | Protocol file data and export                         |
| `labware-ingred` | `labwareIngred` | Labware, ingredients, deck state                      |
| `load-file`      | `loadFile`      | File loading/parsing                                  |
| `navigation`     | `navigation`    | Navigation state                                      |
| `step-forms`     | `stepForms`     | Saved step forms, pipettes, modules, labware entities |
| `tutorial`       | `tutorial`      | Tutorial/hint state                                   |
| `ui`             | `ui`            | UI state (steps, labware, wells)                      |
| `well-selection` | `wellSelection` | Well selection state                                  |

### Middleware

- `timelineMiddleware` — generates robot state timeline from steps
- `trackEventMiddleware` — analytics event tracking
- `thunk` — async action support

### Selectors

Use **reselect** `createSelector` for all derived state. Per-slice selectors go in `selectors/` directories. Cross-slice selectors go in `src/top-selectors/`.

```typescript
import { createSelector } from 'reselect'

export const getLabwareNicknamesById = createSelector(
  getLabwareEntities,
  labwareEntities => mapValues(labwareEntities, e => e.nickname)
)
```

### Thunks

```typescript
import type { ThunkAction } from '/protocol-designer/types'

export const myThunk = (): ThunkAction<any> => (dispatch, getState) => {
  const state = getState()
  dispatch({ type: 'MY_ACTION', payload: someSelector(state) })
}
```

## Step & Timeline System

### Core Concepts

- **Steps**: User-created protocol actions (move liquid, set temperature, pause, etc.)
- **Timeline**: Array of "frames" — each frame has `robotState` and `commands`
- **Step forms**: Redux state in `stepForms.savedStepForms` (keyed by step ID)
- **Ordered steps**: `stepForms.orderedStepIds` array

### Step Form Flow

1. Step form data → `stepFormToArgs()` → command args
2. Command args → `@opentrons/step-generation` command creators → protocol commands
3. Commands → `commandCreatorsTimeline()` → timeline with robot state

### Entities

Normalized by ID in Redux:

- `labwareInvariantProperties` — labware on deck
- `pipetteInvariantProperties` — pipettes by mount
- `moduleInvariantProperties` — hardware modules

Access via selectors: `getLabwareEntities`, `getPipetteEntities`, `getModuleEntities`.

## Pages

Pages live in `src/pages/`:

- `Designer/` — main protocol design canvas and step editing
- `Landing/` — start screen
- `Liquids/` — liquid definitions management
- `ProtocolOverview/` — protocol summary
- `Settings/` — user settings
- `Hardware/` — hardware configuration
- `Onboarding/` — first-run flow

## PD-Specific File Conventions

Feature directories use **kebab-case** matching the Redux slice name: `step-forms/`, `file-data/`, `labware-ingred/`, `well-selection/`, etc.

The `/protocol-designer/` path alias maps to `src/`. Use it for imports across feature directories:

```typescript
import { getFileMetadata } from '/protocol-designer/file-data/selectors'

import type { BaseState } from '/protocol-designer/types'
```

## Internationalization

Uses `react-i18next`. Translation files in `src/assets/localization/`.

Common namespaces: `'starting_deck_state'`, `'protocol_steps'`, `'shared'`, `'application'`.

```typescript
const { t } = useTranslation(['protocol_steps', 'shared'])
return (
  <>
    <span>{t('step_title')}</span>
   <span>{t('shared:step_body')}</span>
  </>
 )
```

Always use translation keys for user-facing strings — never hardcode display text.

## PD Testing

Use `renderWithProviders` from `protocol-designer/src/__testing-utils__/`:

```typescript
import { renderWithProviders } from '/protocol-designer/__testing-utils__'
```

## PD Makefile Targets

Run from the `protocol-designer/` directory:

| Target                 | Description                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `make dev`             | Start Vite dev server (port 5178)                                 |
| `make build`           | Production build (8GB heap)                                       |
| `make serve`           | Build then preview production assets                              |
| `make clean`           | Remove `dist/`                                                    |
| `make test`            | Run PD tests (delegates to root `make test-js-protocol-designer`) |
| `make test-cov`        | Tests with coverage                                               |
| `make bundle-analyzer` | Analyze production bundle size                                    |

```bash
# Run a specific test file
make test tests="src/components/organisms/__tests__/MyComponent.test.tsx"

# Run vitest directly from monorepo root
pnpm vitest protocol-designer/src/step-forms/
```

### Environment Variables

PD feature flags use `OT_PD_*` env vars, injected at build time via Vite `define`. `NODE_OPTIONS=--max-old-space-size=8192` is set automatically by the Makefile for `dev`, `build`, and `serve`.
