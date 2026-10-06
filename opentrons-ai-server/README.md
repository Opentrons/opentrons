# Opentrons AI Backend

## Overview

The Opentrons AI server is a FastAPI server that runs generative AI models (Anthropic Claude) and returns JSON responses to the frontend. Because protocol generation can take 1-3 minutes, serverless options like Lambda are impractical; instead, the service runs in an ECS Fargate container behind CloudFront and an ALB.

### API endpoints

The server exposes four chat endpoints:

| Endpoint                              | Purpose                                                |
| ------------------------------------- | ------------------------------------------------------ |
| `POST /api/chat/update-protocol`      | Update an existing protocol (no file attachments)      |
| `POST /api/chat/create-protocol`      | Generate a new protocol (no file attachments)          |
| `POST /api/chat/completion`           | General chat completion (no file attachments)          |
| `POST /api/chat/completion-multipart` | Chat completion with file attachments (multipart form) |

### Fake responses

Every endpoint accepts `"fake": true` in the request body to bypass the LLM. The optional `"fake_key"` field selects a canned response from `api/domain/fake_responses.py`:

| `fake_key`                          | Description                    |
| ----------------------------------- | ------------------------------ |
| `"reagent transfer"`, `"pcr"`, etc. | Static protocol fake responses |

Fake response logic lives in `api/domain/fake_responses.py`; the public entry point is `_handle_fake_response` in `api/handler/fast.py`.

## Deployed Environments

Currently we have 2 environments: `staging` and `prod`.

- staging: <https://staging.opentrons.ai>
- prod: <https://ai.opentrons.com>

### Environment Variables and Secrets

The opentrons-ai-server/api/settings.py file manages environment variables and secrets. Locally, a .env file (which is ignored by git) stores these values. For deployed environments, AWS Secrets Manager handles both secrets and environment variables. Our deploy script uses the settings class to ensure ECS Fargate loads these values correctly. Important: Update the settings class whenever you add new environment variables or secrets; otherwise, the deploy script will fail.

> Note: To update and environment variable or secret you must update the value in AWS secrets manager AND redeploy the service. Environment variables and secrets are not dynamically updated in the deployed environment. They are loaded at service start up.

## Developing

- This folder is **not** plugged into the global Make ecosystem. This is intentional, this is a serverless application not tied to the Robot Stack dependencies.

### Setup

1. clone the repository `gh repo clone Opentrons/opentrons`.
1. `cd opentrons/opentrons-ai-server`
1. Have pyenv installed per [DEV_SETUP.md](../DEV_SETUP.md).
1. Use pyenv to install python `pyenv install 3.12.6` or latest 3.12.\*.
1. Have nodejs and pnpm installed per [DEV_SETUP.md](../DEV_SETUP.md).
   1. This allows formatting of of `.md` and `.json` files.
1. select the python version `pyenv local 3.12.6`.
   1. This will create a `.python-version` file in this directory.
1. select the node version with `nvs` or `nvm` currently 22.11\*.
1. Install the pinned [uv](https://docs.astral.sh/uv/getting-started/installation/) version from the repo-root [`uv.toml`](../uv.toml) (`curl -LsSf https://astral.sh/uv/0.12.1/install.sh | sh`) and python dependencies using `make setup`.
   1. `make setup` also syncs Python API docs from the pinned mkdocs tag in the Makefile (`DOCS_TAG`).
1. Install docker if you plan to run and build the docker container locally.
1. `make teardown` will remove the virtual environment.

### Python API documentation

The LLM uses Python API docs from published mkdocs release tags (for example `mkdocs-2026-06-02`), not from the current branch checkout. The default tag is pinned in the Makefile as `DOCS_TAG`.

```shell
make sync-api-docs                              # sync the pinned DOCS_TAG
make sync-api-docs DOCS_TAG=mkdocs-2026-06-02   # sync a specific tag
make list-api-docs-tags                         # list available mkdocs tags
```

| Path                                            | Role                                                            |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `api/storage/api_docs/docs/v2/`                 | Synced markdown (gitignored)                                    |
| `api/storage/api_docs/api_docs_struct.md`       | Generated index fed to the doc-finder LLM (do not edit by hand) |
| `api/storage/api_docs/api_docs_struct_about.md` | Committed curated `<about>` descriptions keyed by markdown path |
| `api/storage/api_docs/.api-level`               | Default `apiLevel` from synced `mkdocs.yml` (gitignored)        |

**Curation workflow:** Edit `api_docs_struct_about.md` with one `<about>` block per synced markdown path. `make sync-api-docs` regenerates `api_docs_struct.md` from that file.

See **[docs/API_DOCS_CURATION.md](docs/API_DOCS_CURATION.md)** for the file format and how to add curation for new pages.

`make setup`, `make local-run`, `make build`, and deploy targets run the sync step automatically.

### Run locally

> The server may be run locally with or without Docker. Run without docker to test changes quickly. Run with docker to test in a more production like environment.

#### Without Docker

1. get the .env file from a team member
1. in the `opentrons-ai-server` directory
1. `make local-run`

#### With Docker

In the deployed environments the FastAPI server is run in a docker container. To run the server locally in a docker container:

1. get the .env file from a team member
1. put the .env file in the `opentrons-ai-server` directory
1. in the `opentrons-ai-server` directory
1. `make rebuild`

Now the API is running at <http://localhost:8000>
View the API docs in a browser at <http://localhost:8000/docs>

##### Docker shell

1. make clean
1. make build
1. make run-shell
1. make shell

Now you are in the docker container and can inspect the environment and such.

#### Direct API Interaction and Authentication

All endpoints require a Bearer token in the `Authorization` header: `"Authorization": "Bearer YOUR_TOKEN"`.

Setting `"fake": true` (and optionally `"fake_key"`) in the request body bypasses the LLM entirely and returns a canned fake response — useful for local UI development without Anthropic API calls.

To get a token for direct API interaction:

1. get the file `test.env` from a team member
1. put the `test.env` file in the `opentrons-ai-server/tests/helpers` directory
1. run `make live-client` and select local for the environment — this fetches a token and caches it at `tests/helpers/cached_token.txt`
1. use the cached token in the `Authorization` header of your favorite API client

#### Live Tests

Live tests hit a running server (default: local). Run them with:

```shell
make live-test          # against local (default)
ENV=staging make live-test
```

Live tests use the `Client` helper in `tests/helpers/client.py` which wraps `httpx` with Auth0 token handling and a configurable timeout.

#### API Access from the UI

1. Follow the directions in the [opentrons-ai-client README](../opentrons-ai-client/README.md) to run the UI locally
1. The UI is running at <http://localhost:5173/> when you load this it will redirect you to the login page
1. It should start with <https://identity.auth-dev.opentrons.com/>
1. Create an account or login with your existing account
1. You will be redirected back to the UI
1. Your token (JWT) will be stored in the browser local storage and used for all API calls
1. The local dev API actually validates this real token.

## Dev process

1. run the server locally `make local-run`
1. do development
1. `make prep` formats, lints, runs mypy, and runs unit tests (matches CI expectations)
1. `make build` to make sure that the docker container builds
1. `make run` to make sure the docker container runs
1. test locally `make live-test` (ENV=local is the default in the Makefile)
1. use the live client `make live-client`, your favorite API tool, or the UI to test the API
1. commit and push your changes and create a PR pointing at the `edge` branch
1. CI passes and a team member reviews your PR
1. when your PR is merged to `edge` it will be automatically deployed to the staging environment

## Install a dev dependency

`uv add --dev pytest==8.2.0`

## Install a production dependency

`uv add openai==1.25.1`

## Upgrade a dependency

1. update the version in `pyproject.toml` (or use `uv add <package>==<version>`)
1. run `uv lock` to update `uv.lock`

## Google Sheets Integration

1. Create a Google Cloud Platform project
1. Enable the Google Sheets and Drive API
1. Go to APIs & Services > Library and enable the Google Sheets API.
1. Go to APIs & Services > Credentials and create a Service Account. This account will be used by your application to access the Google Sheets API.
1. After creating the Service Account, click on it in the Credentials section, go to the Keys tab, and create a JSON key. This will download a JSON file with credentials for your Service Account.
1. Open the JSON file and store its content securely. You’ll set this JSON content as an environment variable.
1. Configure Access to the Google Sheet
1. Open the Google Sheet you want to access.
1. Click Share and add the Service Account email (found in the JSON file under "client_email") as a collaborator, typically with Editor access. This allows the Service Account to interact with the sheet.

### Test that the credentials work with a direct call to the Integration

```shell
make test-googlesheet
```

## Add Secrets or Environment Variables

1. Define the new secret or environment variable in the `api/settings.py` file.
1. Add the new secret or environment variable to your local `.env` file.
1. Test locally.
1. Log into the AWS console and navigate to the Secrets Manager.
1. Environment variables are added into the json secret named ENV_VARIABLES_SECRET_NAME in deploy.py for a given environment.
1. Environment variables MUST be named the same as the property in the Settings class.
1. Secret names MUST be the same as the property in the Settings class but with \_ replaced with - and prefixed with the environment name-.
1. The deploy script will load the environment variables from the secret and set them in the container definition.
1. The deploy script will map the secrets from Settings and match them to the container secrets.
1. If any secrets are missing, the deploy script with retrieve the secret ARN and set the secret in the container definition.

## AWS Deployment

Locally test the deployment script like so:

```shell
AWS_PROFILE=robotics_ai_staging make dry-deploy ENV=staging
```

Locally deploy to the staging environment like so:

```shell
AWS_PROFILE=robotics_ai_staging make deploy ENV=staging
```
