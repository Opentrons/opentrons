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
	@echo "Usage: make deploy-ci ENVIRONMENT=<env> APPLICATION=<app> BRANCH=<branch> SOURCE_DIR=<dir>"
	@if [ -z "$(ENVIRONMENT)" ]; then echo "Error: ENVIRONMENT is required"; exit 1; fi
	@if [ -z "$(APPLICATION)" ]; then echo "Error: APPLICATION is required"; exit 1; fi
	@if [ -z "$(BRANCH)" ]; then echo "Error: BRANCH is required"; exit 1; fi
	@if [ -z "$(SOURCE_DIR)" ]; then echo "Error: SOURCE_DIR is required"; exit 1; fi
	uv run python deploy.py $(ENVIRONMENT) $(APPLICATION) $(SOURCE_DIR) --branch $(BRANCH)

deploy-local:
	@echo "Deploying locally..."
	@echo "Usage: make deploy-local ENVIRONMENT=<env> APPLICATION=<app> BRANCH=<branch> SOURCE_DIR=<dir> [AWS_PROFILE=<profile>]"
	@if [ -z "$(ENVIRONMENT)" ]; then echo "Error: ENVIRONMENT is required"; exit 1; fi
	@if [ -z "$(APPLICATION)" ]; then echo "Error: APPLICATION is required"; exit 1; fi
	@if [ -z "$(BRANCH)" ]; then echo "Error: BRANCH is required"; exit 1; fi
	@if [ -z "$(SOURCE_DIR)" ]; then echo "Error: SOURCE_DIR is required"; exit 1; fi
	@if [ -n "$(AWS_PROFILE)" ]; then \
		uv run python deploy.py $(ENVIRONMENT) $(APPLICATION) $(SOURCE_DIR) --branch $(BRANCH) --aws-profile $(AWS_PROFILE); \
	else \
		uv run python deploy.py $(ENVIRONMENT) $(APPLICATION) $(SOURCE_DIR) --branch $(BRANCH); \
	fi
