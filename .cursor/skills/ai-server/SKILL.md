---
name: ai-server
description: Conventions for the opentrons-ai-server FastAPI service — project structure, uv dependency management, settings, testing, Docker, and deployment. Use when working with files in opentrons-ai-server/ or discussing the AI server API.
---

# AI Server Instructions

## Overview

`opentrons-ai-server` is a standalone FastAPI service for Opentrons AI — protocol generation, chat completions, and related AI features. It is **not** part of the monorepo build system; it has its own dependency management, CI workflows, and deployment pipeline.

Deployed environments: **staging** (`staging.opentrons.ai`) and **prod** (`ai.opentrons.com`), running on AWS ECS Fargate behind CloudFront.

## API Endpoints

The server exposes four chat endpoints that return JSON responses:

| Endpoint                              | Purpose                                     |
| ------------------------------------- | ------------------------------------------- |
| `POST /api/chat/completion`           | General chat (no file attachments)          |
| `POST /api/chat/completion-multipart` | Chat with file attachments (multipart form) |
| `POST /api/chat/create-protocol`      | Generate a new protocol                     |
| `POST /api/chat/update-protocol`      | Update an existing protocol                 |

All endpoints require a Bearer token in `Authorization`. Setting `"fake": true` in the request body bypasses the LLM and returns a canned response from `api/domain/fake_responses.py` — useful for local development without Anthropic API calls.

## Package Manager — uv

This project uses **uv** for Python dependency management (not pipenv, pip-tools, or poetry).

| File               | Role                                                        | Committed?      |
| ------------------ | ----------------------------------------------------------- | --------------- |
| `pyproject.toml`   | Single source of truth for dependencies AND all tool config | Yes             |
| `uv.lock`          | Locked dependency graph                                     | Yes             |
| `requirements.txt` | Generated pip-format file for Docker builds                 | No (gitignored) |
| `.venv/`           | Local virtual environment created by `uv sync`              | No (gitignored) |

### Key Commands

```bash
make setup                    # Install all deps (uv sync --frozen)
uv add <package>              # Add production dep
uv add --dev <package>        # Add dev-only dep
uv remove <package>           # Remove dep
uv lock                       # Re-resolve after manual pyproject.toml edits
uv run <command>              # Run inside the managed venv
```

After changing deps, **commit both** `pyproject.toml` and `uv.lock`.

## Project Structure

```markdown
opentrons-ai-server/
├── api/ # Application source code
│ ├── handler/ # FastAPI app, routes, middleware (fast.py entrypoint)
│ ├── domain/ # Business logic — LLM prediction (Anthropic, OpenAI)
│ ├── models/ # Pydantic request/response models
│ ├── services/ # File processing and other services
│ ├── integration/ # External integrations (Auth0, Google Sheets, AWS)
│ ├── constants/ # Shared constants
│ ├── data/ # Static data files
│ ├── storage/ # Stored API docs, indexes
│ ├── utils/ # API docs sync, curation, metadata helpers
│ └── settings.py # Pydantic Settings — all env vars and secrets
├── tests/
│ ├── conftest.py # Pytest fixtures and --env option
│ ├── helpers/ # Client, token helpers for live testing
│ └── test\_\*.py # Unit and live tests
├── deploy.py # ECS Fargate deployment script
├── Dockerfile
├── Makefile
├── pyproject.toml
└── uv.lock
```

## Configuration & Settings

All runtime configuration lives in `api/settings.py` via `pydantic-settings`:

- **Locally**: values come from a `.env` file (gitignored)
- **Deployed**: values come from AWS Secrets Manager, loaded into ECS by `deploy.py`
- Every new env var or secret **must** be added as a field on the `Settings` class
- Secrets use `SecretStr` type; non-secret vars are plain strings with defaults
- Always import settings via the `get_settings()` singleton (not `Settings()` directly) to avoid re-parsing `.env` on every import

Notable settings:

- `allowed_origins` — comma-separated CORS origins (must be explicit; wildcard `*` is invalid with `allow_credentials=True`)
- `request_timeout_seconds` — request timeout in seconds (default `"300"`); production proxies must be configured to allow at least this duration
- `anthropic_max_tokens` — stored as a string, cast to `int` when used

Generate a template `.env` from defaults: `make gen-env`

## Tool Configuration

All config is in `pyproject.toml` — no separate config files:

| Tool   | Section                                                 | Purpose                                     |
| ------ | ------------------------------------------------------- | ------------------------------------------- |
| ruff   | `[tool.ruff]`, `[tool.ruff.lint]`, `[tool.ruff.format]` | Linting AND formatting                      |
| mypy   | `[tool.mypy]`, `[[tool.mypy.overrides]]`                | Strict type checking with pydantic plugin   |
| pytest | `[tool.pytest.ini_options]`                             | Test runner config, markers: `unit`, `live` |

Line length: **140**. Target: **Python 3.12**. Mypy is in **strict** mode.

## Makefile Targets

All targets run from `opentrons-ai-server/`.

### Development

| Target           | Description                                                   |
| ---------------- | ------------------------------------------------------------- |
| `make setup`     | Install all deps (`uv sync --frozen --extra dev`)             |
| `make teardown`  | Delete `.venv/`                                               |
| `make format`    | Auto-fix lint + format with ruff, then prettier for .md/.json |
| `make lint`      | Check lint (ruff) + type check (mypy) — no auto-fix           |
| `make prep`      | `format` then `lint` then `unit-test`                         |
| `make unit-test` | Run unit tests (`pytest tests -m unit`)                       |

### Running Locally

| Target             | Description                                                   |
| ------------------ | ------------------------------------------------------------- |
| `make local-run`   | Run FastAPI with uvicorn (hot reload, no Docker)              |
| `make build`       | Generate requirements.txt, build Docker image                 |
| `make run`         | Run the Docker container (requires `.env` file)               |
| `make rebuild`     | `clean` + `build` + `run`                                     |
| `make live-test`   | Run live tests against a running server (`ENV=local` default) |
| `make live-client` | Interactive client for testing the API                        |

### Deployment

| Target                        | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `make gen-requirements`       | Export `uv.lock` to `requirements.txt` (production deps only) |
| `make deploy ENV=staging`     | Build, push to ECR, update ECS service                        |
| `make dry-deploy ENV=staging` | Retrieve AWS data but make no changes                         |
| `make build-only ENV=staging` | Build Docker image only, no push/deploy                       |

## Docker Build

The container does **not** use uv internally:

1. `make build` calls `make gen-requirements` → `uv export --no-hashes --no-dev -o requirements.txt`
2. Dockerfile installs with plain `pip`
3. Copies `api/` source and Opentrons API docs synced under `api/storage/api_docs/docs/v2`
4. Entrypoint: `uvicorn api.handler.fast:app` (3 workers, port 8000)

Docker build context is the **repo root** (not `opentrons-ai-server/`). Run `make sync-api-docs` before building so Python API docs from the pinned `DOCS_TAG` Makefile variable are present under `api/storage/api_docs/docs/v2`.

## Python API docs curation

The helper model that selects relevant docs reads `api/storage/api_docs/api_docs_struct.md`. Rich `<about>` routing text is **not** taken from synced markdown alone; it comes from committed curation.

| File                         | Edit?  | Purpose                                             |
| ---------------------------- | ------ | --------------------------------------------------- |
| `api_docs_struct_about.json` | Yes    | Source of truth for curated `<about>` text          |
| `api_docs_struct_v2.25.md`   | Rarely | Legacy RST-path archive; bootstrap for regeneration |
| `api_docs_struct.md`         | **No** | Generated on `make sync-api-docs`                   |
| `docs/v2/` (synced markdown) | **No** | Gitignored; fetched from `DOCS_TAG`                 |

**Legacy → markdown mapping** (single module: `api/utils/api_docs_struct_curated.py`):

1. `LEGACY_RST_TO_MD` for explicit renames (e.g. `docs/v2/new_modules.rst` → `modules/index.md`)
2. Mechanical rule for other `docs/v2/*.rst`: underscores → hyphens, `.rst` → `.md`
3. `REFERENCE_ABOUT_OVERRIDES` and `NEW_DOCS_ABOUT_OVERRIDES` for pages without legacy entries

Runtime path resolution in `anthropic_predict.py` imports the same mapping. Do not duplicate the map.

```bash
uv run --python 3.12 python -m api.utils.api_docs_struct_curated  # rebuild JSON from legacy + overrides
make sync-api-docs                                                 # regenerate api_docs_struct.md (warns on gaps)
make check-api-docs-curation                                       # fail if JSON and synced docs diverge
```

Full details: `opentrons-ai-server/docs/API_DOCS_CURATION.md`

## Testing

- **Unit tests** (`@pytest.mark.unit`): run offline → `make unit-test`
- **Live tests** (`@pytest.mark.live`): run against a real server → `make live-test ENV=local`
- The `--env` pytest option selects the target environment (local/staging/prod)
- Test helpers in `tests/helpers/` handle Auth0 token caching and HTTP client setup

## Authentication

Auth0 JWT verification via `api/integration/auth.py`. Config: `auth0_domain`, `auth0_api_audience`, `auth0_issuer`, `auth0_algorithms` in Settings.

## Code Conventions

- Formatting and linting: **ruff only** (no black). `make format` to auto-fix
- Type annotations: **required everywhere** — mypy strict mode
- Pydantic models for all request/response schemas (in `api/models/`)
- Structured logging via `structlog`
- Import sorting handled by ruff's `I` rule (isort-compatible)

## Adding a New Env Var or Secret

1. Add the field to the `Settings` class in `api/settings.py` (use `SecretStr` for secrets)
2. Add the value to your local `.env` file
3. Before deploying: add the value in **AWS Secrets Manager** under the environment's secret name
4. Re-deploy — the deploy script maps Settings fields to ECS container env vars automatically
