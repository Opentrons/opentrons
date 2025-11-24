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

.PHONY: test-pd
test-pd:
	TEST_ENV=$(TEST_ENV) uv run pytest -m pdE2E

.PHONY: test-pd-local
test-pd-local:
	@echo "use PYTEST_ARGS to pass additional arguments"
	TEST_ENV=local uv run pytest -m pdE2E $(PYTEST_ARGS)

.PHONY: test-pd-local-headed
test-pd-local-headed:
	@echo "Example to run one test: "
	@echo "make test-pd-local PYTEST_ARGS=\"-k test_flex_onboarding_workflow\""
	TEST_ENV=local HEADLESS=false uv run pytest -m pdE2E $(PYTEST_ARGS)

# TODO: Implement sandbox testing with branch-specific URL
.PHONY: test-pd-sandbox
test-pd-sandbox:
	@echo "TODO: Implement sandbox testing"
	@exit 1

.PHONY: test-pd-staging
test-pd-staging:
	TEST_ENV=staging uv run pytest -m pdE2E $(PYTEST_ARGS)

.PHONY: test-pd-staging-headed
test-pd-staging-headed:
	TEST_ENV=staging HEADLESS=false uv run pytest -m pdE2E $(PYTEST_ARGS)

.PHONY: test-pd-prod
test-pd-prod:
	TEST_ENV=prod uv run pytest -m pdE2E $(PYTEST_ARGS)

.PHONY: test-pd-debug
test-pd-debug:
	TEST_ENV=$(TEST_ENV) uv run pytest -m pdE2E -v --headed --slowmo=1000 -s $(PYTEST_ARGS)

.PHONY: codegen
codegen:
	@echo "Starting Playwright codegen - record your test actions"
	@echo "Target URL: $(or $(URL),http://localhost:4173)"
	uv run playwright codegen --target python $(or $(URL),http://localhost:4173)

.PHONY: test-unit
test-unit:
	TEST_ENV=$(TEST_ENV) uv run pytest -m unit $(PYTEST_ARGS)
