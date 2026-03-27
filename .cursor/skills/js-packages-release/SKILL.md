---
name: js-packages-release
description: Conventions for unified GitHub Packages release-prep tooling in scripts/js-packages-release/ (preflight registry checks, build_packages make chain, manifest pins, GitHub workflow js-packages-release@ tags, TypeScript .mts source, and Vitest). Use when working in that directory, editing src/*.mts files, tests, or .github/workflows/js-packages-release.yaml.
---

# js-packages-release

## Scope

TypeScript CLIs and helpers under **`scripts/js-packages-release/`** for preparing four scoped packages to release together via **GitHub Packages**:

`@opentrons/shared-data`, `@opentrons/step-generation`, `@opentrons/components`, `@opentrons/protocol-visualization`.

**Tags:** `js-packages-release@<semver>` (see workflow and `publish_core.TAG_PREFIX`).

## Tooling

- **Root JS toolchain:** run `make setup-js` at the monorepo root
- **TypeScript / Vitest:** `make clean`, `make build`, `make format`, `make lint`, `make test` from `scripts/js-packages-release/`
- **Node:** `npm` required for `src/publish.mts` (`npm view` against GitHub Packages). **yarn** + root **make** required for `src/build_packages.mts`

## Modules (single responsibility)

| Module                   | Purpose                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `src/publish_core.mts`   | `PACKAGES`, `PACKAGE_REL_DIRS`, semver and tag parsing, `priorPackages()` for pin order |
| `src/publish.mts`        | Small Node CLI for preflight and current-version inspection                             |
| `src/build_packages.mts` | Ordered `make` invocations; optional `--version`; manifest apply                        |
| `src/manifests.mts`      | `applyReleaseVersions(repoRoot, semver)` only                                           |

Do not duplicate version parsing: import **`resolveVersionInput`** (or helpers) from **`src/publish_core.mts`**.

## CLI behavior

- **`src/publish.mts`:** non-interactive only; use `--version` for preflight or `--current` to inspect the current published versions. Full tag ref allowed. Defaults to `https://npm.pkg.github.com` and fails on partial or complete “already published” for the target version.
- **`src/build_packages.mts`:** Omit `--version` for **build only**. `--skip-build` requires `--version`.

## CI

`.github/workflows/js-packages-release.yaml`:

- **PR** (paths): lint + test jobs, no `needs` between them
- **push** `js-packages-release@*`: **publish** job only (preflight with version from `github.ref`), no lint or unit test jobs
- CI uses `./.github/actions/js/setup`, not uv

## Monorepo build order

`src/build_packages.mts` uses a fixed tuple of make commands: root **`build-ts`**, **`shared-data lib-js`**, **`step-generation lib`**, components **`build-ts`** + **`lib`**, protocol-visualization **`build-ts`** + **`lib`**. Keep this in sync with **`PACKAGES`** publish order in `src/publish_core.mts`.

## step-generation

Release-oriented **`package.json`** (`lib` entry points, `files`, `exports`) and **`Makefile`** targets **`build-ts`**, **`lib`**, **`pack`**. `.PHONY` kept inline per target.

## Tests

- Preflight parsing and version validation: **`tests/publish.test.ts`**
- Manifests: **`tests/manifests.test.ts`**

## Roadmap

See **`scripts/js-packages-release/PLAN.md`** for remaining work (`npm publish` wiring to GitHub Packages, removing legacy workflow publish jobs, components-testing).
