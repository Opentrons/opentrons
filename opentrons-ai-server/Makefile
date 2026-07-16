# opentrons ai server makefile

include ../scripts/python-uv.mk

# Pin the Python API docs release synced into LLM context. Bump when publishing new mkdocs tags.
DOCS_TAG ?= mkdocs-2026-06-02

.PHONY: ensure-synced-api-docs
ensure-synced-api-docs:
	@test -d api/storage/api_docs/docs/v2 || $(MAKE) sync-api-docs

.PHONY: check-api-docs-curation
check-api-docs-curation: ensure-synced-api-docs
	$(python) -m api.utils.api_docs_struct_curated --check

.PHONY: sync-api-docs
sync-api-docs:
	$(python) -m api.utils.sync_api_docs --tag $(DOCS_TAG)

.PHONY: list-api-docs-tags
list-api-docs-tags:
	git -C .. tag -l 'mkdocs-*'

.PHONY: setup
setup:
	$(UV) sync --frozen --extra dev --python $(UV_PYTHON)
	$(MAKE) sync-api-docs

.PHONY: teardown
teardown:
	rm -rf .venv

.PHONY: ruff
ruff:
	$(ruff) format .
	$(ruff) check . --fix --unsafe-fixes

.PHONY: ruff-check
ruff-check:
	$(ruff) format . --check
	$(ruff) check .

.PHONY: mypy
mypy:
	$(UV) run --python $(UV_PYTHON) mypy deploy.py api tests

.PHONY: format-readme
format-readme:
	cd .. && pnpm exec prettier --ignore-path .eslintignore --write opentrons-ai-server/**/*.md opentrons-ai-server/**/*.json

.PHONY: lint
lint: ruff-check mypy

.PHONY: format
format:
	@echo running ruff format and lint fix
	$(MAKE) ruff
	@echo formatting the readme with pnpm exec prettier
	$(MAKE) format-readme

.PHONY: prep
prep: format lint unit-test check-api-docs-curation
	@echo prep is a combination of format, lint, unit-test, and check-api-docs-curation

.PHONY: gen-env
gen-env:
	$(python) -m api.settings

.PHONY: unit-test
unit-test: ensure-synced-api-docs
	$(pytest) tests -m unit

.PHONY: gen-requirements
gen-requirements:
	@echo "Generating requirements.txt from uv.lock..."
	uv export --no-hashes --no-dev -o requirements.txt

ENV ?= local
TAG ?=

.PHONY: deploy
deploy: gen-requirements sync-api-docs
	@echo "Deploying to environment: $(ENV)"
	$(python) deploy.py --env $(ENV) $(if $(TAG),--tag $(TAG),)

.PHONY: build-only
build-only: gen-requirements sync-api-docs
	@echo "Building Docker image only for environment: $(ENV)"
	$(python) deploy.py --build-only --env $(ENV) $(if $(TAG),--tag $(TAG),)

.PHONY: dry-deploy
dry-deploy: gen-requirements sync-api-docs
	@echo "Dry run deploying to environment: $(ENV)"
	@echo "Data is retrieved from AWS but no changes are made"
	$(python) deploy.py --dry --env $(ENV) $(if $(TAG),--tag $(TAG),)

.PHONY: prompted-deploy
prompted-deploy: gen-requirements sync-api-docs
	$(python) deploy.py

.PHONY: print-client-settings-vars
print-client-settings-vars:
	$(python) -m tests.helpers.settings

.PHONY: live-client
live-client:
	@echo "Uses the test helpers to interact with the API"
	$(python) -m tests.helpers.client

.PHONY: live-hf
live-hf:
	@echo "Sends a simple protocol for simulation to the"
	@echo "Hugging Face Simulate tool to verify connectivity and auth"
	$(python) -m tests.helpers.huggingface_client

.PHONY: live-test
live-test:
	$(pytest) tests -m live --env $(ENV)

IMAGE_NAME=ai-server-local
CONTAINER_NAME=ai-server-container
ENV_FILE=.env

CACHEBUST := $(shell date +%s)

.PHONY: build
build: gen-requirements sync-api-docs
	# Use repo root as context; synced API docs live under api/storage/api_docs/docs/v2
	cd .. && docker build --build-arg CACHEBUST=$(CACHEBUST) -t $(IMAGE_NAME) -f opentrons-ai-server/Dockerfile .

.PHONY: run
run:
	docker run --name $(CONTAINER_NAME) --env-file $(ENV_FILE) -p 8000:8000 $(IMAGE_NAME)
	docker logs -f $(CONTAINER_NAME)

.PHONY: clean
clean: gen-requirements
	docker stop $(CONTAINER_NAME) || true
	docker rm $(CONTAINER_NAME) || true

.PHONY: rebuild
rebuild: clean build run

.PHONY: local-run
local-run: sync-api-docs
	$(python) -m api.handler.local_run --env $(ENV)

.PHONY: run-shell
run-shell:
	docker run -d --name $(CONTAINER_NAME) --env-file $(ENV_FILE) -p 8000:8000 $(IMAGE_NAME) tail -f /dev/null

.PHONY: shell
shell:
	docker exec -it $(CONTAINER_NAME) /bin/bash

.PHONY: test-googlesheet
test-googlesheet:
	@echo "Loading environment variables from .env and running test-googlesheet"
	$(python) -m api.integration.google_sheets
