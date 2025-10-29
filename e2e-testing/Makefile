# e2e-testing makefile

# Environment selection (local, sandbox, staging, prod)
TEST_ENV ?= local

.PHONY: setup
setup:
	uv sync --frozen

.PHONY: test-setup
test-setup:
	uv run playwright install chromium --with-deps

.PHONY: format
format:
	uv run ruff format .
	uv run ruff check --fix .

.PHONY: lint
lint:
	uv run ruff check .
	uv run ruff format --check .

.PHONY: typecheck
typecheck:
	uv run mypy automation tests conftest.py

.PHONY: check
check: lint typecheck

.PHONY: test
test:
	TEST_ENV=$(TEST_ENV) uv run pytest

.PHONY: test-local
test-local:
	TEST_ENV=local uv run pytest $(PYTEST_ARGS)

.PHONY: test-local-headless
test-local-headless:
	TEST_ENV=local HEADLESS=true uv run pytest $(PYTEST_ARGS)

# TODO: Implement sandbox testing with branch-specific URL
.PHONY: test-sandbox
test-sandbox:
	@echo "TODO: Implement sandbox testing"
	@exit 1

.PHONY: test-staging
test-staging:
	TEST_ENV=staging uv run pytest $(PYTEST_ARGS)

.PHONY: test-staging-headless
test-staging-headless:
	TEST_ENV=staging HEADLESS=true uv run pytest $(PYTEST_ARGS)

.PHONY: test-prod
test-prod:
	TEST_ENV=prod uv run pytest $(PYTEST_ARGS)

.PHONY: test-debug
test-debug:
	TEST_ENV=$(TEST_ENV) uv run pytest -v --headed --slowmo=1000 -s $(PYTEST_ARGS)

.PHONY: codegen
codegen:
	@echo "Starting Playwright codegen - record your test actions"
	@echo "Target URL: $(or $(URL),http://localhost:4173)"
	uv run playwright codegen $(or $(URL),http://localhost:4173)
