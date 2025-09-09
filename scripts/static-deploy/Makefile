.PHONY: setup teardown install format lint test deploy resolve-ci deploy-ci

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

resolve-ci:
	@echo "Resolving CI deployment parameters..."
	@echo "Usage: make resolve-ci"
	@uv run python deploy_ci_config.py

deploy:
	@echo "Deploying..."
	@echo "Usage: make deploy-local ENVIRONMENT=<env> APPLICATION=<app> RELATIVE_ARTIFACT_DIR=<dir> [SANDBOX_PREFIX=<sandbox_prefix> if ENVIRONMENT=sandbox] [AWS_PROFILE=<profile>]"
	@if [ -z "$(ENVIRONMENT)" ]; then echo "Error: ENVIRONMENT is required"; exit 1; fi
	@if [ -z "$(APPLICATION)" ]; then echo "Error: APPLICATION is required"; exit 1; fi
	@if [ -z "$(RELATIVE_ARTIFACT_DIR)" ]; then echo "Error: RELATIVE_ARTIFACT_DIR is required"; exit 1; fi
	@if [ "$(ENVIRONMENT)" = "sandbox" ] && [ -z "$(SANDBOX_PREFIX)" ]; then echo "Error: SANDBOX_PREFIX is required for sandbox"; exit 1; fi
	@CMD="uv run python deploy.py $(ENVIRONMENT) $(APPLICATION) $(RELATIVE_ARTIFACT_DIR)"; \
	if [ "$(ENVIRONMENT)" = "sandbox" ]; then CMD="$$CMD --sandbox-prefix $(SANDBOX_PREFIX)"; fi; \
	if [ -n "$(AWS_PROFILE)" ]; then CMD="$$CMD --aws-profile $(AWS_PROFILE)"; fi; \
	$$CMD

deploy-ci:
	@echo "Deploying from CI environment..."
	@if [ -z "$(SOURCE_DIR)" ]; then echo "Error: SOURCE_DIR is required for CI deployment"; exit 1; fi
	@if [ -z "$(GITHUB_OUTPUT)" ]; then echo "Error: GITHUB_OUTPUT not set - run resolve-ci first"; exit 1; fi
	@eval $$(grep '^APPLICATION=' $(GITHUB_OUTPUT) 2>/dev/null || echo "APPLICATION=") && \
	eval $$(grep '^ENVIRONMENT=' $(GITHUB_OUTPUT) 2>/dev/null || echo "ENVIRONMENT=") && \
	eval $$(grep '^SANDBOX_PREFIX=' $(GITHUB_OUTPUT) 2>/dev/null || echo "SANDBOX_PREFIX=") && \
	if [ -z "$$APPLICATION" ] || [ -z "$$ENVIRONMENT" ]; then \
		echo "Error: APPLICATION and ENVIRONMENT must be set in GITHUB_OUTPUT"; exit 1; \
	fi && \
	CMD="uv run python deploy.py $$ENVIRONMENT $$APPLICATION $(SOURCE_DIR)" && \
	if [ "$$ENVIRONMENT" = "sandbox" ] && [ -n "$$SANDBOX_PREFIX" ]; then \
		CMD="$$CMD --sandbox-prefix $$SANDBOX_PREFIX"; \
	fi && \
	echo "Running: $$CMD" && \
	$$CMD
