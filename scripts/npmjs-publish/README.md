# npmjs-publish

uv-managed Python tooling for **unified NPM releases** of four scoped packages:

`@opentrons/shared-data`, `@opentrons/step-generation`, `@opentrons/components`, `@opentrons/protocol-visualization`.

See [PLAN.md](./PLAN.md) for the full roadmap and what is still open.

## Layout

| File                | Role                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `publish_core.py`   | Shared `PACKAGES` list, version and tag parsing (`npmjs-publish@`, `refs/tags/...`), `prior_packages()` pin order |
| `publish.py`        | Preflight CLI: registry checks, Rich table, job summary, `--interactive` / `--non-interactive`                    |
| `build_packages.py` | Monorepo **make** build chain, then optional `package.json` version and internal pin rewrites                     |
| `manifests.py`      | `apply_release_versions(repo_root, version)`                                                                      |
| `github_summary.py` | Append markdown to `GITHUB_STEP_SUMMARY` in GitHub Actions                                                        |
| `tests/`            | pytest                                                                                                            |

## Setup

From **monorepo root** or this directory:

```bash
cd scripts/npmjs-publish
make setup
```

Requires **Node** with `npm` on `PATH` when running preflight (uses `npm view`). Release builds use **yarn** and **make** at the repo root.

## Preflight (`publish.py`)

Validates a target version against the **public** npm registry for all four packages (404 / empty history treated as unpublished).

```bash
# Interactive (prompts for version; shows registry snapshot first)
make run-local

# CI-style (needs VERSION)
make run-ci
# equivalent: uv run python publish.py --version "$VERSION" --non-interactive
```

Version input may be:

- plain semver (e.g. `1.2.3`)
- `npmjs-publish@1.2.3`
- `refs/tags/npmjs-publish@1.2.3`

**Note:** If every package already has that version on npm, preflight **fails** (npm does not allow replacing a published version). Partial publish (subset only) also fails.

Job summary: preflight writes markdown to **`GITHUB_STEP_SUMMARY`** when set unless `--no-write-summary`.

## Build and manifests (`build_packages.py`)

Runs the same **make** sequence as the release build path, then optionally rewrites the four `package.json` files (version + pinned `@opentrons/*` deps in publish order).

```bash
# Build only (sanity check; no manifest changes)
make build-packages
# or: uv run python build_packages.py

# Build + apply release manifests
make build-packages VERSION=1.2.3
# or: uv run python build_packages.py --version "refs/tags/npmjs-publish@1.2.3"

# Manifests only (requires VERSION)
make build-packages-manifests-only VERSION=1.2.3
```

`--write-summary` / `--no-write-summary` control **`GITHUB_STEP_SUMMARY`** output (default: write).

## GitHub Actions

Workflow: [`.github/workflows/npmjs-publish.yaml`](../../.github/workflows/npmjs-publish.yaml)

- **pull_request** (paths: this workflow + `scripts/npmjs-publish/**`): **lint** and **unit test** jobs (parallel, no `needs`).
- **push** tags `npmjs-publish@*`: same jobs plus **publish** job: resolve version from tag, run preflight (`publish.py`).

Tag pushes use the full ref as `--version` so `publish_core.resolve_version_input` accepts it.

## Tests

```bash
make test
make lint
```

## Related monorepo changes

`step-generation` includes **`build-ts`**, **`lib`**, and **`pack`** Makefile targets and npm-oriented **`exports`** / **`files`** / **`main`** pointing at `lib/`. See `step-generation/Makefile` and `step-generation/package.json`.
