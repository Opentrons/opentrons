---
applyTo: 'ci-docker/**'
---

# CI Docker Bootstrap — Instructions

## Purpose

This directory contains the tooling required to build and maintain **pre-warm CI Docker containers** that dramatically accelerate our GitHub Actions jobs.

The primary performance goals are to reduce the cost of:

1. **`actions/checkout`** for our large monorepo
2. `make setup-py` → Python environment setup
3. `make setup-js` → Node environment setup

These containers are runner-agnostic:
✅ Used **only** with GitHub-hosted runners  
✅ No self-hosted runners required  
✅ Fully reproducible and debuggable **locally**

---

## What This Supports Right Now

| Thing                         | Current Source of Truth                 | Notes                                                  |
| ----------------------------- | --------------------------------------- | ------------------------------------------------------ |
| Node & npm versions           | `.github/actions/setup-js/` scripts     | Pin and bootstrap Node toolchain exactly as CI expects |
| Python version & dependencies | `.github/actions/setup-py/` scripts     | Includes venv creation and dependency locking          |
| Repo bootstrap                | `make setup` (runs setup-js + setup-py) | Container aims to make both nearly no-ops              |

This folder provides a **shared, faster, hermetic** baseline for all workflow jobs that rely on Node + Python.

---

## Components

```
ci-docker/
├── Dockerfile              # Multi-stage build for CI environments
├── build.py                # Interface: build & publish containers
├── run.py                  # Local reproduction helpers (drop into container)
├── Makefile                # User-friendly shortcuts
├── uv.lock / requirements* # (Optional) pinned Python constraints
└── README.md or INSTRUCTIONS.md (this file)
```

All Python dependencies for these scripts are managed using **uv** in a local virtual environment.

> Scripts should never implicitly rely on global python tools.

---

## Expected Container Behavior

The built CI image must:

✅ Pre-install correct Node, npm/yarn, Python, pipenv versions
✅ Warm caches (npm + pipenv) based on lockfiles  
✅ Create predictable non-root `ci` user  
✅ Expose `/workspace` as the working project root  
✅ Allow mounting the monorepo locally for debugging  
✅ Optimize Docker layers for cache hits

At runtime, GitHub Actions still runs:

```
make setup-py  # should be near-instant
make setup-js  # should be near-instant
```

We enforce correctness by still checking lockfile integrity every run.

---

## Local Development Workflow

### 1️⃣ Install local environment

```bash
cd ci-docker
uv venv
. .venv/bin/activate
uv pip install -r requirements.txt   # if needed later
```

### 2️⃣ Build the CI container locally

```bash
make build
```

Equivalent:

```bash
python build.py --tag local-ci
```

### 3️⃣ Validate container behavior

```bash
make shell
```

Equivalent:

```bash
python run.py --image local-ci --shell
```

Inside the container:

```bash
make setup
npm run test:unit
pytest -q
```

---

## GitHub Actions Integration

We will update targeted CI jobs to run _inside_ this container:
This is eventually, first we will have a PR that builds and publishes the container to GHCR. In addition this PR with have a new job that runs the /api unit tests and the pd unit tests inside the container as a proof of concept.

```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/opentrons/ci-bootstrap:<tag>
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Bootstrap Python (fast)
        run: make setup-py -j
      - name: Bootstrap JS (fast)
        run: make setup-js
```

Publishing to GHCR will occur automatically in a separate workflow when:

- Dockerfile changes
- lockfiles change (`uv.lock`, `package-lock.json`, etc.)
- weekly scheduled refresh

---

## Make Targets

| Command                   | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `make build`              | Build CI runtime image locally                  |
| `make publish` _(future)_ | Push to GHCR with correct tags                  |
| `make shell`              | Enter container with repo mounted for debugging |
| `make clean`              | Remove dangling local images/layers             |

---

## Future Extensions (not in v1 scope)

- **pnpm migration** (will align cleanly with this approach)
- **devcontainers** using the same base for local DX
- **OS matrix** expansion (macOS and windows toolchain container later if needed)

---

## TL;DR for Contributors

> If you are improving CI performance:
>
> - Start with this folder
> - Modify Dockerfile / caching logic
> - Build locally via `make build`
> - Test in container via `make shell`
> - Ship changes → GHCR → CI adopts automatically

---

Happy Speeding Up CI 🚀
