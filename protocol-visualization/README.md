# `@opentrons/protocol-visualization`

Scaffold for a standalone package that will render **protocol analysis** visualizations for any web app. The visualization UI is **not implemented yet**; see [PLAN.md](./PLAN.md) for the roadmap.

Workspace dependencies **`@opentrons/components`**, **`@opentrons/shared-data`**, and **`@opentrons/step-generation`** are declared in `package.json`; [`workspace-dependencies.test.ts`](./src/__tests__/workspace-dependencies.test.ts) asserts they resolve when you run `make -C protocol-visualization test` locally (or in CI).

## Current exports

- **`getProtocolVisualizationPackageName()`** — stable package id string.
- **Type re-exports** — `ProtocolAnalysisOutput`, `CompletedProtocolAnalysis` from `@opentrons/shared-data`.

## Docs

| Doc                                                                    | Purpose                                       |
| ---------------------------------------------------------------------- | --------------------------------------------- |
| [PLAN.md](./PLAN.md)                                                   | Implementation plan and port checklist        |
| [CONVENTIONS.md](./CONVENTIONS.md)                                     | TypeScript and CSS module conventions         |
| [CHANGES/0001-scaffold-package.md](./CHANGES/0001-scaffold-package.md) | This scaffold PR (includes CI workflow scope) |

## Development

```bash
# from monorepo root
pnpm install
make -C protocol-visualization lint
make -C protocol-visualization check-ts
make -C protocol-visualization test
make -C protocol-visualization lib
```

From `protocol-visualization/`, `make lint` runs the root targets **`lint-js`**, **`lint-css`**, and **`lint-json`** (full monorepo JS/CSS/JSON lint).

## CI

Pull requests that touch `protocol-visualization/` run lint, typecheck, tests, and lib build via [`.github/workflows/protocol-visualization-ci.yaml`](../.github/workflows/protocol-visualization-ci.yaml).
