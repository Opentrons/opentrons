.PHONY: setup teardown install format lint test print deploy-ci deploy-local

setup:
	uv sync --frozen

teardown:
	rm -rf .venv

install:
	uv install

format:
	uv run ruff format
	uv run ruff check --fix

lint:
	uv run ruff check

test:
	uv run pytest tests/ -v

print:
	uv run python deploy_config.py

deploy-ci:
	@echo "Deploying in the CI environment..."
	@echo "Usage: make deploy-ci"
	uv run python deploy.py

deploy-local:
	@echo "Deploying locally..."
	@echo "Usage: make deploy-local ENVIRONMENT=<env> APPLICATION=<app> ARTIFACT_ROOT=<dir> [SANDBOX_PREFIX=<sandbox_prefix> if ENVIRONMENT=sandbox] [AWS_PROFILE=<profile>]"
	@if [ -z "$(ENVIRONMENT)" ]; then echo "Error: ENVIRONMENT is required"; exit 1; fi
	@if [ -z "$(APPLICATION)" ]; then echo "Error: APPLICATION is required"; exit 1; fi
	@if [ -z "$(ARTIFACT_ROOT)" ]; then echo "Error: ARTIFACT_ROOT is required"; exit 1; fi
	@if [ "$(ENVIRONMENT)" = "sandbox" ] && [ -z "$(SANDBOX_PREFIX)" ]; then echo "Error: SANDBOX_PREFIX is required for sandbox"; exit 1; fi
	@CMD="uv run python deploy.py $(ENVIRONMENT) $(APPLICATION) $(ARTIFACT_ROOT)"; \
	if [ "$(ENVIRONMENT)" = "sandbox" ]; then CMD="$$CMD --sandbox-prefix $(SANDBOX_PREFIX)"; fi; \
	if [ -n "$(AWS_PROFILE)" ]; then CMD="$$CMD --aws-profile $(AWS_PROFILE)"; fi; \
	$$CMD
