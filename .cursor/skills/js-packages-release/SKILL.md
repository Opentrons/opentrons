---
name: js-packages-release
description: Conventions for unified GitHub Packages release-prep tooling in scripts/js-packages-release/ (preflight registry checks, build_packages make chain, manifest pins, GitHub workflow js-packages-release@ tags, uv and pytest). Use when working in that directory, editing publish.py, build_packages.py, manifests.py, publish_core.py, or .github/workflows/js-packages-release.yaml.
---

# js-packages-release

## Scope

Python CLIs and helpers under **`scripts/js-packages-release/`** for preparing four scoped packages to release together via **GitHub Packages**:

`@opentrons/shared-data`, `@opentrons/step-generation`, `@opentrons/components`, `@opentrons/protocol-visualization`.

**Tags:** `js-packages-release@<semver>` (see workflow and `publish_core.TAG_PREFIX`).

## Tooling

- **uv:** `make setup`, `uv run python ...` (see `scripts/js-packages-release/Makefile`)
- **Ruff / pytest:** `make lint`, `make test` from `scripts/js-packages-release/`
- **Node:** `npm` required for `publish.py` (`npm view` against GitHub Packages). **yarn** + root **make** required for `build_packages.py`

## Modules (single responsibility)

| Module              | Purpose                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `publish_core.py`   | `PACKAGES`, `PACKAGE_REL_DIRS`, semver and tag parsing, `prior_packages()` for pin order                |
| `publish.py`        | Small stdlib CLI for preflight and current-version inspection                                            |
| `build_packages.py` | Ordered `make` invocations; optional `--version`; manifest apply                                         |
| `manifests.py`      | `apply_release_versions(repo_root, semver)` only                                                        |

Do not duplicate version parsing: import **`resolve_version_input`** (or helpers) from **`publish_core`**.

## CLI behavior

- **`publish.py`:** non-interactive only; use `--version` for preflight or `--current` to inspect the current published versions. Full tag ref allowed. Defaults to `https://npm.pkg.github.com` and fails on partial or complete “already published” for the target version.
- **`build_packages.py`:** Omit `--version` for **build only**. `--skip-build` requires `--version`.

## CI

`.github/workflows/js-packages-release.yaml`:

- **PR** (paths): lint + test jobs, no `needs` between them
- **push** `js-packages-release@*`: **publish** job only (preflight with version from `github.ref`), no lint or unit test jobs

## Monorepo build order

`build_packages.py` uses a fixed tuple of make commands: root **`build-ts`**, **`shared-data lib-js`**, **`step-generation lib`**, components **`build-ts`** + **`lib`**, protocol-visualization **`build-ts`** + **`lib`**. Keep this in sync with **`PACKAGES`** publish order in `publish_core.py`.

## step-generation

Release-oriented **`package.json`** (`lib` entry points, `files`, `exports`) and **`Makefile`** targets **`build-ts`**, **`lib`**, **`pack`**. `.PHONY` kept inline per target.

## Tests

- Preflight parsing and version validation: **`tests/test_publish.py`**
- Manifests: **`tests/test_manifests.py`**

## Roadmap

See **`scripts/js-packages-release/PLAN.md`** for remaining work (`npm publish` wiring to GitHub Packages, removing legacy workflow publish jobs, components-testing).
