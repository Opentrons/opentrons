# CI Bootstrap Container

This directory holds the tooling that builds the Docker image used to accelerate
GitHub Actions workflows. The resulting image pre-installs Node.js, Python
tooling, and a fully cloned repository with warmed dependency caches so that
`make setup` becomes nearly instantaneous inside CI.

## What's Inside

- **Node.js 22.12.0** with Yarn 1.22.19
- **Python 3.10** with pipenv 2023.12.1, virtualenv 20.30.0, uv 0.4.29
- **Pre-cloned repository** at `/opt/opentrons` with 150 commits of history and all tags
- **Warmed dependencies** via `make setup` with BuildKit cache mounts
- **Non-root user** `ci` (UID 1001, GID 121) aligned with GitHub Actions runner
- **Dependency checksums** stored in `.ci-dependency-checksums.json` for drift detection
- **Increased Node.js heap** via `NODE_OPTIONS="--max-old-space-size=6144"` for large builds
- **Yarn cache optimization** with cache folder at `/home/ci/.cache/yarn` and 16 concurrent downloads

## Prerequisites

- Docker 24.x or newer with BuildKit enabled
- Python 3.10+ (for running the orchestration scripts via `uv`)

## Quick Start

```bash
# Install project dependencies (creates .venv via uv)
make -C ci-docker setup

# Build the image locally (defaults to ghcr.io/opentrons/ci-bootstrap:local)
make -C ci-docker build

# Launch an interactive shell with the repo mounted at /workspace
make -C ci-docker shell

# Build and push to a registry
make -C ci-docker push TAG=ghcr.io/opentrons/ci-bootstrap:edge
```

Override build parameters as needed:

```bash
# Build for specific platform (auto-detects your architecture by default)
make -C ci-docker build PLATFORM=linux/arm64

# Build with custom tag and default ref
make -C ci-docker build TAG=my-image:test OPENTRONS_DEFAULT_REF=my-branch
```

## Python CLI Reference

The `utils/actions.py` script provides helper utilities for GitHub Actions workflows:

```bash
# Helper utilities for GitHub Actions (exposed via Makefile)
make -C ci-docker determine-container-tag EVENT_NAME=pull_request BASE_REF=edge
make -C ci-docker determine-source-ref REF=refs/heads/edge DEFAULT_BRANCH=edge
make -C ci-docker dependency-checksums OUTPUT=/path/to/checksums.json
make -C ci-docker check-dependency-drift BASELINE=/path/to/checksums.json
```

All Docker operations use native `docker` commands via the Makefile:

```bash
# Build container
make -C ci-docker build TAG=<image> PLATFORM=linux/amd64

# Interactive shell with repo mounted
make -C ci-docker shell TAG=<image>

# Build and push
make -C ci-docker push TAG=<image>
```

The `shell` target mounts the repository root to `/workspace` so you can
exercise `make setup`, run tests, or diagnose dependency issues directly inside
the container.

## Container Environment

The container provides:

- **`OT_REPO_CACHE=/opt/opentrons`** - Pre-cloned repository with warmed dependencies
- **`GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/opentrons/.git/objects`** - Git optimization
- **`NODE_OPTIONS="--max-old-space-size=6144"`** - Increased heap for large JS builds
- **`OT_PYTHON=/usr/bin/python3`** - Python interpreter path
- **`HOME=/home/ci`** - Home directory for the `ci` user

The pre-cloned repo at `/opt/opentrons` has:

- Git history (150 commits deep with `--filter=blob:none` for efficiency)
- All tags fetched
- Default branch (`edge`) checked out
- Dependencies pre-installed via `make setup`
- Checksums stored in `.ci-default-ref` and `.ci-dependency-checksums.json`
- BuildKit cache mounts for git objects, Python venvs, and package downloads

## GitHub Actions Workflows

### Container Build (`.github/workflows/ci-docker-build.yaml`)

**Triggered by:**

- PRs modifying `ci-docker/**`, workflows, or dependency manifests (`**/Pipfile*`, `**/package.json`, `**/yarn.lock`)
- Pushes to `edge` or `chore_release*` branches
- Manual workflow dispatch

**Behavior:**

- PRs: Build only (validation)
- Pushes/dispatch: Build and push to `ghcr.io/opentrons/ci-bootstrap`

**Generated tags:**

- `edge` - Latest from default branch
- `branch-<name>` - Branch-specific builds
- `sha-<commit>` - Commit-specific builds

### CI Test Workflows (using container)

Examples: `.github/workflows/ci-docker-api.yaml`, `.github/workflows/ci-docker-pd.yaml`

These workflows:

1. Determine which container tag to use (via `determine-container-tag`)
2. Run jobs inside the container with `OT_REPO_CACHE=/opt/opentrons`
3. Update the cached repo to target SHA via `git fetch` + `git checkout`
4. Check for dependency drift and conditionally refresh
5. Run tests/lint with pre-warmed dependencies

## Dockerfile Highlights

- **Base**: Ubuntu 22.04 to match GitHub-hosted runners
- **Node.js**: v22.12.0 with Yarn 1.22.19 installed globally
- **Python**: 3.10 with pipenv==2023.12.1, virtualenv==20.30.0, uv==0.4.29
- **User**: Non-root `ci` user with UID 1001, GID 121 (matches GitHub runner)
- **System packages**: build-essential, git, curl, libusb-dev, and other build dependencies
- **Pre-cloned repo**: Clone with `--depth=150 --filter=blob:none` at `/opt/opentrons`
- **Warmed dependencies**: `make setup` run during build with BuildKit cache mounts
- **Dependency tracking**: Checksums stored in `.ci-dependency-checksums.json`
- **Git optimization**: `GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/opentrons/.git/objects`
- **Heap size**: `NODE_OPTIONS="--max-old-space-size=6144"` for Protocol Designer builds
- **Yarn optimization**: Cache at `/home/ci/.cache/yarn` with 16 concurrent downloads
- **BuildKit caching**: Cache mounts for git objects, Python venvs, and package downloads

## Dependency Drift Detection

Workflows automatically detect when dependency manifests change:

1. Container stores baseline checksums during build (`.ci-dependency-checksums.json`)
2. Workflows run `make -C ci-docker check-dependency-drift` at runtime
3. If manifests changed, run `make teardown && make setup` to refresh
4. Update checksums for next run

This ensures fast startup when dependencies haven't changed, while guaranteeing
correctness when they have.

## Local Development

```bash
# Build container
make -C ci-docker build

# Test interactively
make -C ci-docker shell

# Inside container, test the git fetch pattern:
cd /opt/opentrons
git fetch origin edge --depth=1
git checkout FETCH_HEAD
make -C ci-docker check-dependency-drift
make -C api test
```

## Design Decisions

**Why pre-clone instead of `actions/checkout`?**

- Faster: `git fetch --depth=1` is faster than full clone
- Consistent: Same Git objects shared between container and workspace
- Optimized: `GIT_ALTERNATE_OBJECT_DIRECTORIES` prevents duplication

**Why UID 1001 / GID 121?**

- Matches GitHub Actions runner to avoid permission errors
- Allows writing to `$GITHUB_OUTPUT`, `$GITHUB_STEP_SUMMARY`, etc.

**Why 6GB Node.js heap?**

- Protocol Designer build exceeds default ~4GB limit
- Prevents "JavaScript heap out of memory" errors

**Why dependency drift detection?**

- Performance: Skip refresh when dependencies unchanged (common case)
- Correctness: Always use fresh dependencies when manifests change
- Visibility: Workflow logs show whether refresh occurred

## Future Enhancements

- Migrate additional CI workflows to use this container
- Multi-platform builds (arm64) if needed for self-hosted runners
- VS Code dev containers using same base image
- Scheduled weekly rebuilds for security updates
