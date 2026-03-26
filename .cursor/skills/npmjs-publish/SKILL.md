---
name: npmjs-publish
description: Conventions for unified NPM release tooling in scripts/npmjs-publish/ (preflight registry checks, build_packages make chain, manifest pins, GitHub workflow npmjs-publish@ tags, uv and pytest). Use when working in that directory, editing publish.py, build_packages.py, manifests.py, publish_core.py, or .github/workflows/npmjs-publish.yaml.
---

# npmjs-publish

## Scope

Python CLIs and helpers under **`scripts/npmjs-publish/`** for releasing four scoped packages together:

`@opentrons/shared-data`, `@opentrons/step-generation`, `@opentrons/components`, `@opentrons/protocol-visualization`.

**Tags:** `npmjs-publish@<semver>` (see workflow and `publish_core.TAG_PREFIX`).

## Tooling

- **uv:** `make setup`, `uv run python ...` (see `scripts/npmjs-publish/Makefile`)
- **Ruff / pytest:** `make lint`, `make test` from `scripts/npmjs-publish/`
- **Node:** `npm` required for `publish.py` (`npm view`). **yarn** + root **make** required for `build_packages.py`

## Modules (single responsibility)

| Module              | Purpose                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `publish_core.py`   | `PACKAGES`, `PACKAGE_REL_DIRS`, semver and tag parsing, `prior_packages()` for pin order                |
| `publish.py`        | Typer preflight: registry snapshot, Rich, `GITHUB_STEP_SUMMARY` via `github_summary.append_job_summary` |
| `build_packages.py` | Ordered `make` invocations; optional `--version`; manifest apply; job summary                           |
| `manifests.py`      | `apply_release_versions(repo_root, semver)` only                                                        |
| `github_summary.py` | `append_job_summary` when `GITHUB_STEP_SUMMARY` is set                                                  |

Do not duplicate version parsing: import **`resolve_version_input`** (or helpers) from **`publish_core`**.

## CLI behavior

- **`publish.py`:** `--interactive` / `--non-interactive`; `--version` optional in interactive mode. Full tag ref allowed. Fails on partial or complete “already published” for the target version (no npm republish).
- **`build_packages.py`:** Omit `--version` for **build only**. `--skip-build` requires `--version`. `--write-summary` mirrors preflight (default on).

## CI

`.github/workflows/npmjs-publish.yaml`:

- **PR** (paths): lint + test jobs, no `needs` between them
- **push** `npmjs-publish@*`: **publish** job only (preflight with version from `github.ref`), no lint or unit test jobs

## Monorepo build order

`build_packages.py` uses a fixed tuple of make commands: root **`build-ts`**, **`shared-data lib-js`**, **`step-generation lib`**, components **`build-ts`** + **`lib`**, protocol-visualization **`build-ts`** + **`lib`**. Keep this in sync with **`PACKAGES`** publish order in `publish_core.py`.

## step-generation

Release-oriented **`package.json`** (`lib` entry points, `files`, `exports`) and **`Makefile`** targets **`build-ts`**, **`lib`**, **`pack`**. `.PHONY` kept inline per target.

## Tests

- Preflight and version parsing: **`tests/test_publish.py`**
- Manifests: **`tests/test_manifests.py`**
- Build CLI: **`tests/test_build_packages.py`**

## Roadmap

See **`scripts/npmjs-publish/PLAN.md`** for remaining work (npm publish wiring, removing legacy workflow publish jobs, components-testing).
