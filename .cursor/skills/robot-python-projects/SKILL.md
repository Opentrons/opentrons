---
name: robot-python-projects
description: Guidelines for robot Python projects — api/, robot-server/, hardware/, auth-server/, shared-data/, server-utils/, system-server/, update-server/, usb-bridge/, g-code-testing/. Use when working with Python files in these directories or their pyproject.toml files.
---

# Robot Python Projects

The following directories contain the robot Python projects — packages that run on or support Opentrons robots:

| Project                 | Directory         | Description                                          |
| ----------------------- | ----------------- | ---------------------------------------------------- |
| `opentrons`             | `api/`            | Core Opentrons Python API for protocol execution     |
| `robot-server`          | `robot-server/`   | HTTP API server that runs on the robot               |
| `opentrons-hardware`    | `hardware/`       | Low-level hardware control and CAN bus communication |
| `auth-server`           | `auth-server/`    | Authentication server for Flex                       |
| `opentrons-shared-data` | `shared-data/`    | Shared data definitions (labware, pipettes, modules) |
| `server-utils`          | `server-utils/`   | Common utilities for Python servers                  |
| `system-server`         | `system-server/`  | System-level server for robot management             |
| `otupdate`              | `update-server/`  | Server for software and firmware updates             |
| `ot3usb`                | `usb-bridge/`     | USB bridge daemon for Flex                           |
| `g-code-testing`        | `g-code-testing/` | G-code testing and emulation tools                   |

## Common Patterns

- **Build system**: `pyproject.toml` with **hatchling** (`hatchling==1.27.0`)
- **Dependency management**: **uv** with `uv.lock` files (not pipenv or poetry)
- **Python version**: 3.12 (set via `UV_PYTHON = 3.12` in `scripts/python-uv.mk`)
- **Testing**: pytest 9+ with config in `[tool.pytest]` section of `pyproject.toml`
- **Linting**: ruff (replaces flake8 + isort) with config in `[tool.ruff]` sections of `pyproject.toml`
- **Type checking**: mypy with config in `[tool.mypy]` section of `pyproject.toml` (not `mypy.ini`)
- **Shared Make includes**: all Makefiles include `../scripts/python-uv.mk` which provides common targets

## Running Tests

Prefer running tests scoped to the project where your changes are:

```bash
# From the project directory
cd api && make test

# Or from the monorepo root
make -C api test
```

Each project has a Makefile with a `test` target. The exception is `shared-data`, which uses `test-py`:

```bash
make -C shared-data test-py
```

## Checking Types and Linting

Each project has a Makefile with a `lint` target (runs ruff check + mypy). `shared-data` uses `lint-py`:

```bash
make -C api lint
make -C shared-data lint-py
```

## Formatting

Each project has a Makefile with a `format` target (runs ruff format + isort fix). `shared-data` uses `format-py`:

```bash
make -C api format
make -C shared-data format-py
```

## Setup and Teardown

Each project has `setup` and `teardown` targets. Setup runs `uv sync --frozen --group dev --python 3.12`. `shared-data` uses `setup-py` and `teardown-py`:

```bash
make -C api setup
make -C shared-data setup-py
```

Or from the monorepo root for all robot Python projects at once:

```bash
make setup-py      # setup all
make teardown-py   # teardown all
```

## Dependency Management

```bash
cd api  # or any robot Python project

uv add <package>              # add production dependency
uv add --group dev <package>  # add dev dependency
uv remove <package>           # remove dependency
uv lock                       # re-resolve after manual pyproject.toml edits
```

After changing dependencies, **commit both** `pyproject.toml` and `uv.lock`.
