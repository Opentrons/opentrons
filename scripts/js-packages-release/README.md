# js-packages-release

uv-managed Python tooling for **unified GitHub Packages releases** of four scoped packages:

`@opentrons/shared-data`, `@opentrons/step-generation`, `@opentrons/components`, `@opentrons/protocol-visualization`.

See [PLAN.md](./PLAN.md) for the full roadmap and what is still open.

## Layout

- `publish_core.py`: shared `PACKAGES` list, version and tag parsing (`js-packages-release@`, `refs/tags/...`), `prior_packages()` pin order
- `publish.py`: preflight CLI, registry checks, Rich table, job summary, `--interactive` / `--non-interactive`
- `build_packages.py`: monorepo **make** build chain, then optional `package.json` version and internal pin rewrites
- `manifests.py`: `apply_release_versions(repo_root, version)`
- `github_summary.py`: append markdown to `GITHUB_STEP_SUMMARY` in GitHub Actions
- `tests/`: pytest

## Setup

From **monorepo root** or this directory:

```bash
cd scripts/js-packages-release
make setup
```

Requires **Node** with `npm` on `PATH` when running preflight (uses `npm view` against GitHub Packages). Release builds use **yarn** and **make** at the repo root.

## Preflight (`publish.py`)

Validates a target version against the **GitHub Packages npm registry** for all four packages (404 / empty history treated as unpublished).

```bash
# Interactive (prompts for version; shows registry snapshot first)
make publish-local

# CI-style (needs VERSION)
make publish-ci
# equivalent: uv run python publish.py --version "$VERSION" --non-interactive
```

Version input may be:

- plain semver (e.g. `1.2.3`)
- `js-packages-release@1.2.3`
- `refs/tags/js-packages-release@1.2.3`

**Note:** If every package already has that version on the registry, preflight **fails**. Partial publish (subset only) also fails.

Job summary: preflight writes markdown to **`GITHUB_STEP_SUMMARY`** when set unless `--no-write-summary`.

## Build and manifests (`build_packages.py`)

Runs the same **make** sequence as the release build path, then optionally rewrites the four `package.json` files (version + pinned `@opentrons/*` deps in publish order).

```bash
# Build only (sanity check; no manifest changes)
make build-packages
# or: uv run python build_packages.py

# Build + apply release manifests
make build-packages VERSION=1.2.3
# or: uv run python build_packages.py --version "refs/tags/js-packages-release@1.2.3"

# Manifests only (requires VERSION)
make build-packages-manifests-only VERSION=1.2.3
```

`--write-summary` / `--no-write-summary` control **`GITHUB_STEP_SUMMARY`** output (default: write).

## GitHub Actions

Workflow: [`.github/workflows/js-packages-release.yaml`](../../.github/workflows/js-packages-release.yaml)

- **pull_request** (paths: this workflow + `scripts/js-packages-release/**`): **lint** and **unit test** jobs (parallel, no `needs`).
- **push** tags `js-packages-release@*`: **publish** job only: resolve version from tag, run preflight (`publish.py`). Lint and unit tests do not run on tag push.

Tag pushes use the full ref as `--version` so `publish_core.resolve_version_input` accepts it.

## Registry configuration

The preflight defaults to **`https://npm.pkg.github.com`**. Override with `OT_NPM_REGISTRY` if needed.

For local runs, configure npm auth for the `@opentrons` scope:

```bash
cat <<'EOF' > ~/.npmrc
@opentrons:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
always-auth=true
EOF
```

In GitHub Actions, use **`GITHUB_TOKEN`** (or a PAT) with package permissions and set `NODE_AUTH_TOKEN` before running `publish.py`.

## Tests

```bash
make test
make lint
```

## Related monorepo changes

`step-generation` includes **`build-ts`**, **`lib`**, and **`pack`** Makefile targets and npm-oriented **`exports`** / **`files`** / **`main`** pointing at `lib/`. See `step-generation/Makefile` and `step-generation/package.json`.
