# js-packages-release

TypeScript tooling for **unified GitHub Packages release prep** of four scoped
packages:

`@opentrons/shared-data`, `@opentrons/step-generation`,
`@opentrons/components`, `@opentrons/protocol-visualization`.

See [PLAN.md](./PLAN.md) for the full roadmap and what is still open.

## Layout

- `src/publish_core.mts`: shared `PACKAGES` list, version and tag parsing
  (`js-packages-release@`, `refs/tags/...`), `priorPackages()` pin order
- `src/publish.mts`: small Node CLI for registry checks, preflight validation,
  and current-version inspection
- `src/build_packages.mts`: monorepo **make** build chain, then optional
  `package.json` version and internal pin rewrites
- `src/manifests.mts`: `applyReleaseVersions(repoRoot, version)`
- `tests/`: Vitest

## Setup

This directory uses the monorepo's root JS toolchain. From the repo root:

```bash
make setup-js
```

Commands below can then be run from `scripts/js-packages-release/`.

## Commands

```bash
make clean
make build
make format
make lint
make test

make publish-current
make publish-ci VERSION=1.2.3

make build-packages
make build-packages VERSION=1.2.3
make build-packages-manifests-only VERSION=1.2.3
```

Version input may be:

- plain semver (e.g. `1.2.3`)
- `js-packages-release@1.2.3`
- `refs/tags/js-packages-release@1.2.3`

## Preflight

`make publish-ci` builds the local CLI and validates a target version against
the **GitHub Packages npm registry** for all four packages. 404 or empty
history is treated as unpublished.

If every package already has that version on the registry, preflight fails.
Partial publish also fails.

## Build and manifests

`make build-packages` runs the same ordered **make** sequence as the release
build path, then optionally rewrites the four `package.json` files (version and
pinned internal `@opentrons/*` deps in publish order).

`make build-packages-manifests-only VERSION=...` skips the build and only
applies the manifest rewrite.

## GitHub Actions

Workflow:
[`.github/workflows/js-packages-release.yaml`](../../.github/workflows/js-packages-release.yaml)

- **pull_request** (paths: this workflow + `scripts/js-packages-release/**`):
  **lint** and **unit test** jobs
- **push** tags `js-packages-release@*`: **publish** job only, which builds the
  package set in order and runs preflight

Tag pushes use the full ref as `--version` so
`resolveVersionInput()` accepts it.

## Registry configuration

The preflight defaults to **`https://npm.pkg.github.com`**. Override with
`OT_NPM_REGISTRY` if needed.

For local runs, configure npm auth for the `@opentrons` scope:

```bash
cat <<'EOF' > ~/.npmrc
@opentrons:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
always-auth=true
EOF
```

If GitHub Packages reads require auth in your environment, set
`NODE_AUTH_TOKEN` before running `make publish-ci`. The current workflow does
not perform `npm publish` yet.

## Related monorepo changes

`step-generation` includes **`build-ts`**, **`lib`**, and **`pack`** Makefile
targets and npm-oriented **`exports`** / **`files`** / **`main`** pointing at
`lib/`. See `step-generation/Makefile` and `step-generation/package.json`.
