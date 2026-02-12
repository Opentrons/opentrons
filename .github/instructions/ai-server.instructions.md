# AI Server Instructions

## Overview

`opentrons-ai-server` is a standalone FastAPI service for Opentrons AI — protocol generation, chat completions, and related AI features. It is **not** part of the Robot Stack monorepo build system; it has its own dependency management, CI workflows, and deployment pipeline.

Deployed environments: **staging** (`staging.opentrons.ai`) and **prod** (`ai.opentrons.com`), running on AWS ECS Fargate behind CloudFront.

## Package Manager — uv

This project uses **[uv](https://docs.astral.sh/uv/)** for Python dependency management (not pipenv, pip-tools, or poetry).

| File               | Role                                                        | Committed?      |
| ------------------ | ----------------------------------------------------------- | --------------- |
| `pyproject.toml`   | Single source of truth for dependencies AND all tool config | Yes             |
| `uv.lock`          | Locked dependency graph                                     | Yes             |
| `requirements.txt` | Generated pip-format file for Docker builds                 | No (gitignored) |
| `.venv/`           | Local virtual environment created by `uv sync`              | No (gitignored) |

### Key commands

```bash
# Install all deps (including dev) from the lockfile
make setup          # runs: uv sync --frozen

# Add / remove / upgrade a dependency
uv add <package>              # production dep
uv add --dev <package>        # dev-only dep
uv remove <package>
uv add <package>==<version>   # upgrade to specific version
uv lock                       # re-resolve after manual pyproject.toml edits

# Run something inside the managed venv
uv run <command>
```

After changing deps, **commit both** `pyproject.toml` and `uv.lock`.

## Project Structure

```
opentrons-ai-server/
├── api/                        # Application source code
│   ├── handler/                # FastAPI app, routes, middleware (fast.py is the entrypoint)
│   ├── domain/                 # Business logic — LLM prediction (Anthropic, OpenAI)
│   ├── models/                 # Pydantic request/response models
│   ├── services/               # File processing and other services
│   ├── integration/            # External integrations (Auth0, Google Sheets, AWS Secrets Manager)
│   ├── constants/              # Shared constants
│   ├── data/                   # Static data files (generated markdown docs, etc.)
│   ├── storage/                # Stored API docs, indexes
│   ├── utils/                  # Markdown conversion, index creation utilities
│   └── settings.py             # Pydantic Settings — all env vars and secrets
├── tests/
│   ├── conftest.py             # Pytest fixtures and --env option
│   ├── helpers/                # Client, token helpers for live testing
│   ├── test_*.py               # Unit and live tests
├── deploy.py                   # ECS Fargate deployment script (build, push, update service)
├── Dockerfile
├── Makefile
├── pyproject.toml
└── uv.lock
```

## Configuration & Settings

All runtime configuration lives in `api/settings.py` via `pydantic-settings`:

- **Locally**: values come from a `.env` file in the project root (gitignored).
- **Deployed**: values come from AWS Secrets Manager, loaded into the ECS task definition by `deploy.py`.
- Every new env var or secret **must** be added as a field on the `Settings` class. The deploy script validates settings against this model; missing fields will cause deployment failure.
- Secrets use `SecretStr` type. Non-secret env vars are plain strings with defaults.

Generate a template `.env` from defaults: `make gen-env`

## Tool Configuration

All linting/formatting/testing/type-checking config is consolidated in `pyproject.toml` — there are no separate config files:

| Tool   | Section                                                 | Purpose                                                  |
| ------ | ------------------------------------------------------- | -------------------------------------------------------- |
| ruff   | `[tool.ruff]`, `[tool.ruff.lint]`, `[tool.ruff.format]` | Linting AND formatting (replaces black + isort + flake8) |
| mypy   | `[tool.mypy]`, `[[tool.mypy.overrides]]`                | Strict type checking with pydantic plugin                |
| pytest | `[tool.pytest.ini_options]`                             | Test runner config, markers: `unit`, `live`              |

Line length: **140**. Target: **Python 3.12**. Mypy is in **strict** mode.

## Makefile Targets

All targets run from the `opentrons-ai-server/` directory.

### Development workflow

| Target           | What it does                                                              |
| ---------------- | ------------------------------------------------------------------------- |
| `make setup`     | Install all deps (`uv sync --frozen --extra dev`)                         |
| `make teardown`  | Delete `.venv/`                                                           |
| `make format`    | Auto-fix lint issues + format code with ruff, then prettier for .md/.json |
| `make lint`      | Check lint (ruff) + type check (mypy) — no auto-fix                       |
| `make prep`      | `format` then `lint` then `unit-test`                                     |
| `make unit-test` | Run unit tests (`pytest tests -m unit`)                                   |

### Running locally

| Target             | What it does                                                  |
| ------------------ | ------------------------------------------------------------- |
| `make local-run`   | Run FastAPI with uvicorn (hot reload, no Docker)              |
| `make build`       | Generate requirements.txt, build Docker image                 |
| `make run`         | Run the Docker container (requires `.env` file)               |
| `make rebuild`     | `clean` + `build` + `run`                                     |
| `make live-test`   | Run live tests against a running server (`ENV=local` default) |
| `make live-client` | Interactive client for testing the API                        |

### Deployment

| Target                        | What it does                                                 |
| ----------------------------- | ------------------------------------------------------------ |
| `make gen-requirements`       | Export `uv.lock` → `requirements.txt` (production deps only) |
| `make deploy ENV=staging`     | Build, push to ECR, update ECS service                       |
| `make dry-deploy ENV=staging` | Retrieve AWS data but make no changes                        |
| `make build-only ENV=staging` | Build Docker image only, no push/deploy                      |

## Docker Build

The container does **not** use uv internally. The build flow:

1. `make build` calls `make gen-requirements` → `uv export --no-hashes --no-dev -o requirements.txt`
2. Dockerfile copies `requirements.txt` and installs with plain `pip`
3. Copies `api/` source code and Opentrons API docs into the image
4. Entrypoint: `uvicorn api.handler.fast:app` (3 workers, port 8000)

The Docker build context is the **repo root** (not `opentrons-ai-server/`) so the Dockerfile can copy `api/docs/v2` from the sibling `api/` package.

## CI Workflows

Three GitHub Actions workflows (`opentrons-ai-server/**` path trigger):

1. **Lint + Test** (`opentrons-ai-server-lint-test.yaml`) — on PRs: ruff check, mypy, unit tests
2. **Staging Deploy** (`opentrons-ai-server-staging-continuous-deploy.yaml`) — on push to `edge`: auto-deploy to staging
3. **Prod Deploy** (`opentrons-ai-production-deploy.yaml`) — on `ai-server@*` tag push: deploy to prod with version tag

All CI uses `astral-sh/setup-uv@v4` and `make setup` for environment setup.

## Testing

- **Unit tests** (`@pytest.mark.unit`): run offline, no external services needed → `make unit-test`
- **Live tests** (`@pytest.mark.live`): run against a real server → `make live-test ENV=local`
- The `--env` pytest option selects the target environment (local/staging/prod).
- Test helpers in `tests/helpers/` handle Auth0 token caching and HTTP client setup.

## Authentication

The API uses **Auth0** JWT verification (`api/integration/auth.py`). Config: `auth0_domain`, `auth0_api_audience`, `auth0_issuer`, `auth0_algorithms` in Settings. JWKS is fetched from Auth0's well-known endpoint.

## Code Conventions

- Formatting and linting: **ruff only** (no black). Run `make format` to auto-fix, `make ruff-check` to verify.
- Type annotations: **required everywhere** — mypy strict mode is enabled.
- Pydantic models for all request/response schemas (in `api/models/`).
- Structured logging via `structlog`.
- Observability: Weave analytics for tracing LLM calls (opt-in per request via `x-enable-analytics` header).
- Import sorting handled by ruff's `I` rule (isort-compatible).

## Adding a New Env Var or Secret

1. Add the field to the `Settings` class in `api/settings.py` (use `SecretStr` for secrets).
2. Add the value to your local `.env` file.
3. Before deploying: add the value in **AWS Secrets Manager** under the environment's secret name.
4. Re-deploy — the deploy script maps Settings fields to ECS container env vars and secrets automatically.

## Working Directory

All `make` targets expect `cwd` to be `opentrons-ai-server/`. The project is intentionally decoupled from the root monorepo Makefile.
