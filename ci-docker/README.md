# CI Bootstrap Container

This directory holds the tooling that builds the Docker image used to warm our
GitHub Actions jobs. The resulting image mirrors the Node and Python
bootstrapping performed by the `setup-js` and `setup-py` composite actions so
that `make setup` becomes nearly instantaneous inside CI.

## Prerequisites

- Docker 24.x or newer with BuildKit enabled
- Python 3.10 (used to run the orchestration script via `uv`)

```bash
# Optional: create an isolated environment with uv
uv venv
source .venv/bin/activate
```

## Quick Start

```bash
# Build the image (defaults to ghcr.io/opentrons/ci-bootstrap:local)
make -C ci-docker build

# Launch an interactive shell with the repo mounted at /workspace
make -C ci-docker shell

# Build for linux/amd64 and push to a registry
make -C ci-docker publish TAG=ghcr.io/opentrons/ci-bootstrap:edge ARGS="--platform linux/amd64"
```

The `ARGS` make variable forwards arbitrary flags to the underlying Python CLI.
Use it for `--platform`, extra `--build-arg`, or additional options.

## Python CLI Reference

```bash
uv run ci-docker/main.py --help
uv run ci-docker/main.py build --tag <image> --platform linux/amd64
uv run ci-docker/main.py shell --image <image> --env FOO=bar -- npm test

# Helper utilities exposed via make
EVENT_NAME=pull_request BASE_REF=edge DEFAULT_TAG=edge make -C ci-docker determine-container-tag
REF=refs/heads/edge DEFAULT_BRANCH=edge make -C ci-docker determine-source-ref
```

The `shell` sub-command mounts the repository root to `/workspace` so you can
exercise `make setup`, run tests, or diagnose dependency issues directly inside
the container.

Inside the container the environment variable `OT_REPO_CACHE` points at a
checked-out copy of the repository with _full_ history, tags, and blobs
pre-fetched (defaults to `/opt/opentrons`) and the `edge` branch already
checked out. You can bootstrap a workspace instantly by running
`rsync -a $OT_REPO_CACHE/ /workspace/` before invoking project tooling. Git
commands automatically reference the cache via
`GIT_ALTERNATE_OBJECT_DIRECTORIES`.

## Dockerfile Highlights

- Ubuntu 22.04 base to match GitHub-hosted runners
- Node.js `22.12.0` and Yarn `1.22.19`
- Python 3.10 plus `pipenv==2023.12.1`, `virtualenv==20.30.0`, and `uv`
- Non-root `ci` user with `$HOME/.local/bin` on the `PATH`
- Pre-installed system packages required by the monorepo builds
- Full clone of `Opentrons/opentrons` default branch for faster checkouts
- During build the container executes `make setup-py -j` and `make setup-js`
  (followed by `make teardown`) to pre-populate pip/pipenv/npm/yarn caches while
  keeping project virtual environments and `node_modules` directories out of the
  final image

Future enhancements (lockfile caching layers, CI publication workflow, etc.)
can extend this baseline without changing developer ergonomics.
