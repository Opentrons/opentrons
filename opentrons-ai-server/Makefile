# opentrons ai server makefile

.PHONY: setup
setup:
	uv sync --frozen --extra dev

.PHONY: teardown
teardown:
	rm -rf .venv

.PHONY: ruff
ruff:
	uv run ruff format .
	uv run ruff check . --fix --unsafe-fixes

.PHONY: ruff-check
ruff-check:
	uv run ruff format . --check
	uv run ruff check .

.PHONY: mypy
mypy:
	uv run mypy deploy.py api tests

.PHONY: format-readme
format-readme:
	yarn prettier --ignore-path .eslintignore --write opentrons-ai-server/**/*.md opentrons-ai-server/**/*.json

.PHONY: lint
lint: ruff-check mypy

.PHONY: format
format:
	@echo running ruff format and lint fix
	$(MAKE) ruff
	@echo formatting the readme with yarn prettier
	$(MAKE) format-readme

.PHONY: prep
prep: format lint unit-test
	@echo prep is a combination of format, lint, and unit-test

.PHONY: gen-env
gen-env:
	uv run python -m api.settings

.PHONY: unit-test
unit-test:
	uv run pytest tests -m unit

.PHONY: gen-requirements
gen-requirements:
	@echo "Generating requirements.txt from uv.lock..."
	uv export --no-hashes --no-dev -o requirements.txt

ENV ?= local
TAG ?=

.PHONY: deploy
deploy: gen-requirements
	@echo "Deploying to environment: $(ENV)"
	uv run python deploy.py --env $(ENV) $(if $(TAG),--tag $(TAG),)

.PHONY: build-only
build-only: gen-requirements
	@echo "Building Docker image only for environment: $(ENV)"
	uv run python deploy.py --build-only --env $(ENV) $(if $(TAG),--tag $(TAG),)

.PHONY: dry-deploy
dry-deploy: gen-requirements
	@echo "Dry run deploying to environment: $(ENV)"
	@echo "Data is retrieved from AWS but no changes are made"
	uv run python deploy.py --dry --env $(ENV) $(if $(TAG),--tag $(TAG),)

.PHONY: prompted-deploy
prompted-deploy: gen-requirements
	uv run python deploy.py

.PHONY: print-client-settings-vars
print-client-settings-vars:
	uv run python -m tests.helpers.settings

.PHONY: live-client
live-client:
	@echo "Uses the test helpers to interact with the API"
	uv run python -m tests.helpers.client

.PHONY: live-hf
live-hf:
	@echo "Sends a simple protocol for simulation to the"
	@echo "Hugging Face Simulate tool to verify connectivity and auth"
	uv run python -m tests.helpers.huggingface_client

.PHONY: live-test
live-test:
	uv run pytest tests -m live --env $(ENV)

IMAGE_NAME=ai-server-local
CONTAINER_NAME=ai-server-container
ENV_FILE=.env

CACHEBUST := $(shell date +%s)

.PHONY: build
build: gen-requirements
	# Use repo root as context so Dockerfile COPY paths like 'api/docs/v2' resolve
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
local-run:
	uv run python -m api.handler.local_run --env $(ENV)

.PHONY: run-shell
run-shell:
	docker run -d --name $(CONTAINER_NAME) --env-file $(ENV_FILE) -p 8000:8000 $(IMAGE_NAME) tail -f /dev/null

.PHONY: shell
shell:
	docker exec -it $(CONTAINER_NAME) /bin/bash

.PHONY: test-googlesheet
test-googlesheet:
	@echo "Loading environment variables from .env and running test-googlesheet"
	uv run python -m api.integration.google_sheets
