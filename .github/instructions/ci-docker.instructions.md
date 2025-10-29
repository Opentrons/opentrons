---
applyTo: 'ci-docker/**'
---

# CI Docker Bootstrap — Instructions

## Purpose

This directory contains the tooling required to build and maintain **pre-warm CI Docker containers** that dramatically accelerate our GitHub Actions jobs.

The primary performance goals are to reduce the cost of:

1. **Repository cloning** - Pre-cloned repo at `/opt/opentrons` with 150 commits of history
2. **`make setup`** - Python and Node dependencies pre-warmed in container with BuildKit cache mounts
3. **Dependency drift detection** - Automatic refresh when manifests change

These containers are runner-agnostic:
✅ Used **only** with GitHub-hosted runners  
✅ No self-hosted runners required  
✅ Fully reproducible and debuggable **locally**

---

## What This Supports Right Now

| Component                    | Source of Truth                                          | Notes                                                                                |
| ---------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Node.js version              | `ci-docker/Dockerfile` ARG `NODE_VERSION=22.12.0`        | Hardcoded in Dockerfile, not tied to setup-js composite action                       |
| Yarn version                 | `ci-docker/Dockerfile` `yarn@1.22.19`                    | Installed globally via npm                                                           |
| Python version               | `ci-docker/Dockerfile` ARG `PYTHON_VERSION=3.10`         | Uses system python3 from Ubuntu 22.04                                                |
| Python tooling               | `pipenv==2023.12.1`, `virtualenv==20.30.0`, `uv==0.4.29` | Installed globally via pip                                                           |
| Container user               | UID `1001`, GID `121` (user `ci`)                        | Aligned with GitHub Actions runner to avoid permission issues                        |
| Pre-cloned repository        | `/opt/opentrons` (env: `OT_REPO_CACHE`)                  | Clone with `--depth=150 --filter=blob:none`, tags fetched, `edge` branch checked out |
| Warmed dependencies          | `make setup` during build with BuildKit cache mounts     | Python venvs and node_modules pre-installed with persistent caching                  |
| Dependency checksums         | `.ci-dependency-checksums.json`                          | SHA256 hashes of `Pipfile*`, `package.json/yarn.lock`, and `ci-docker/Dockerfile`    |
| Heap size for Node.js builds | `NODE_OPTIONS="--max-old-space-size=6144"`               | 6GB heap to prevent OOM during Protocol Designer builds                              |

This folder provides a **shared, faster, hermetic** baseline for all workflow jobs that rely on Node + Python.

---

## Components

```
ci-docker/
├── Dockerfile              # Container definition with pre-warmed dependencies
├── utils/
│   └── actions.py          # GitHub Actions helpers (ref/tag/checksum logic)
├── Makefile                # Docker build/shell commands and utility wrappers
├── pyproject.toml          # uv project with rich + ruff dependencies
├── uv.lock                 # Lockfile for reproducible builds
├── .python-version         # Python 3.10 for local uv environment
├── README.md               # User-facing documentation
└── TODO-BEFORE-MERGE.md    # Checklist for edge merge (temporary)
```

All Python dependencies for these scripts are managed using **uv** in a local virtual environment.

> Scripts never implicitly rely on global python tools - always use `uv run` or activate the venv.

All Docker operations use native `docker` commands via the Makefile - no Python wrapper needed.

---

## Expected Container Behavior

The built CI image provides:

✅ **Pre-installed toolchain**: Node.js 22.12.0, Yarn 1.22.19, Python 3.10, pipenv, virtualenv, uv  
✅ **Pre-cloned repository**: Clone with 150 commits at `/opt/opentrons` with warmed dependencies  
✅ **Non-root user**: `ci` user with UID 1001, GID 121 (matches GitHub Actions runner)  
✅ **Git optimization**: `GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/opentrons/.git/objects`  
✅ **Dependency checksums**: Stored in `.ci-dependency-checksums.json` for drift detection  
✅ **BuildKit cache mounts**: Git objects, Python venvs, and package downloads cached  
✅ **Yarn optimization**: Cache folder `/home/ci/.cache/yarn` with 16 concurrent downloads  
✅ **Increased heap**: `NODE_OPTIONS="--max-old-space-size=6144"` for large JS builds

At runtime, GitHub Actions workflows:

1. Update the cached repo to the target SHA via `git fetch` + `git checkout`
2. Check for dependency drift by comparing checksums
3. Conditionally refresh dependencies if manifests changed (`make teardown && make setup`)
4. Run tests/lint with near-instant startup

**Workflows do NOT use `actions/checkout`** - they update the pre-cloned repo instead.

---

## Local Development Workflow

### 1️⃣ Install local environment

```bash
cd ci-docker
make setup  # Creates venv via `uv sync --frozen --all-groups`
```

### 2️⃣ Build the CI container locally

```bash
make build  # Builds ghcr.io/opentrons/ci-bootstrap:local
```

Equivalent:

```bash
docker build \
  --file ci-docker/Dockerfile \
  --tag ghcr.io/opentrons/ci-bootstrap:local \
  --platform linux/$(shell uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/') \
  --build-arg OPENTRONS_DEFAULT_REF=edge \
  .
```

### 3️⃣ Validate container behavior

```bash
make shell  # Mounts repo root to /workspace
```

Equivalent:

```bash
docker run --rm -it \
  -v $(pwd):/workspace \
  -w /workspace \
  ghcr.io/opentrons/ci-bootstrap:local \
  /bin/bash
```

Inside the container, the pre-cloned repo is at `/opt/opentrons`:

```bash
cd /opt/opentrons
make -C api test
make -C protocol-designer test-cov
```

To test the workflow pattern (git fetch + dependency drift):

```bash
# Inside the container
cd /opt/opentrons
git fetch origin edge
git checkout origin/edge
make -C ci-docker check-dependency-drift
```

---

## GitHub Actions Integration

### Container Build Workflow (`.github/workflows/ci-docker-build.yaml`)

**Triggers:**

- **Pull requests** that modify:
  - `ci-docker/**`
  - `.github/workflows/ci-docker-build.yaml`
  - `**/Pipfile` or `**/Pipfile.lock`
  - `**/package.json` or `**/yarn.lock`
- **Push events** to:
  - `edge` branch
  - `chore_release*` branches
- **Manual workflow_dispatch**

**Behavior:**

- PRs: Build only (validate that container builds successfully)
- Push/dispatch: Build **and push** to `ghcr.io/opentrons/ci-bootstrap`

**Tags generated:**

- `edge` - Pushes to the default branch
- `branch-chore_release-*` - Pushes to release branches (e.g., `branch-chore_release-8.0.0`)
- `sha-<commit>` - All push events for debugging

**Tag selection logic:**

- PRs targeting `edge` → use `edge` tag
- PRs targeting `chore_release-*` → use `branch-chore_release-*` tag
- PRs targeting other branches → fallback to default tag

### CI Workflows Using Container

**Example: `.github/workflows/ci-docker-api.yaml`**

```yaml
jobs:
  select-image:
    # Determines which container tag to use (edge, branch-*, etc.)
    outputs:
      tag: ${{ steps.tag.outputs.tag }}

  api-tests:
    needs: select-image
    container:
      image: ghcr.io/opentrons/ci-bootstrap:${{ needs.select-image.outputs.tag }}
      credentials:
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    env:
      OT_REPO_CACHE: /opt/opentrons
      HOME: /home/ci
    steps:
      - name: Configure Git access
        run: git -C "$OT_REPO_CACHE" remote set-url origin "https://..."

      - name: Update cached repository
        run: |
          cd "$OT_REPO_CACHE"
          git fetch origin "$TARGET_REF" --depth=1
          git checkout "$TARGET_SHA"

      - name: Check dependency drift
        run: make -C ci-docker check-dependency-drift

      - name: Refresh dependencies if needed
        if: steps.deps.outputs.dependencies_changed == 'true'
        run: make teardown && make setup

      - name: Run tests
        run: make -C api test-cov
```

**Active workflows:**

- `.github/workflows/ci-docker-api.yaml` - API linting and unit tests
- `.github/workflows/ci-docker-pd.yaml` - Protocol Designer build and unit tests

---

## Make Targets

| Command                        | Description                                                               |
| ------------------------------ | ------------------------------------------------------------------------- |
| `make setup`                   | Install uv dependencies (`uv sync --frozen --all-groups`)                 |
| `make build`                   | Build container locally (default: `ghcr.io/opentrons/ci-bootstrap:local`) |
| `make push`                    | Build and push container (set `TAG=` to override)                         |
| `make shell`                   | Interactive shell with repo mounted at `/workspace`                       |
| `make format`                  | Auto-format and fix Python code with ruff                                 |
| `make lint`                    | Check Python code with ruff (no changes)                                  |
| `make clean`                   | Remove local container image                                              |
| `make determine-source-ref`    | Compute Git ref for container build (used by build workflow)              |
| `make determine-container-tag` | Select container tag for CI jobs (used by test workflows)                 |
| `make dependency-checksums`    | Compute and save checksums of dependency manifests                        |
| `make check-dependency-drift`  | Compare current checksums against baseline (exits 0 if unchanged)         |

**Advanced usage:**

```bash
# Build for specific platform (auto-detects your architecture by default)
make build TAG=my-image:test PLATFORM=linux/arm64

# Build with custom default ref
make build OPENTRONS_DEFAULT_REF=my-branch

# Build and push
make push TAG=ghcr.io/opentrons/ci-bootstrap:edge
```

---

## Dependency Drift Detection

The container stores checksums of all dependency manifests (Pipfile, Pipfile.lock, package.json, yarn.lock, ci-docker/Dockerfile) in `.ci-dependency-checksums.json` during build.

At runtime, workflows:

1. Run `make -C ci-docker check-dependency-drift` (compares current manifests to baseline)
2. If changed, run `make teardown && make setup` to refresh dependencies
3. Save updated checksums back to `.ci-dependency-checksums.json`

This ensures that:

- ✅ Container dependency cache is used when possible (fast path)
- ✅ Fresh dependencies are installed when manifests change (correctness)
- ✅ No stale dependencies from container build time

## Key Design Decisions

### Why pre-clone the repo instead of using `actions/checkout`?

- **Faster**: `git fetch --depth=1` + `git checkout` is faster than full clone
- **Consistent**: Same repository state in container and workflows
- **Git optimization**: `GIT_ALTERNATE_OBJECT_DIRECTORIES` shares objects between cached repo and workspace

### Why UID 1001 and GID 121?

- Matches GitHub Actions runner user/group to avoid permission issues
- Prevents errors writing to `$GITHUB_OUTPUT`, `$GITHUB_STEP_SUMMARY`, etc.

### Why increase Node.js heap size?

- Protocol Designer build exceeds default 4GB heap limit
- Setting `NODE_OPTIONS="--max-old-space-size=6144"` prevents OOM errors

### Why check dependency drift instead of always refreshing?

- **Performance**: Most commits don't change dependencies
- **Reliability**: When dependencies do change, we catch and refresh them
- **Transparency**: Workflow logs show whether refresh occurred

### Why use BuildKit cache mounts?

- **Persistent caching**: Git objects, Python venvs, and package downloads persist across builds
- **Local + CI**: Same cache strategy works for both local development and GitHub Actions
- **Performance**: Dramatically reduces dependency installation time on rebuilds

## Future Extensions

- **Additional workflows**: Migrate more CI jobs to use this container
- **Multi-platform**: Add arm64 builds if needed for self-hosted runners
- **Dev containers**: Use same base image for VS Code development containers
- **Scheduled rebuilds**: Weekly container refresh to pick up security updates

---

## TL;DR for Contributors

> **Improving CI performance?**
>
> 1. Modify `ci-docker/Dockerfile` or workflow patterns
> 2. Build locally: `make -C ci-docker build`
> 3. Test interactively: `make -C ci-docker shell`
> 4. Push changes → PR triggers build validation
> 5. Merge to edge → Container auto-publishes to GHCR
> 6. CI workflows automatically use new container

---

Happy Speeding Up CI 🚀
