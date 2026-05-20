# e2e-testing makefile

SHELL := bash

# Environment selection (local, sandbox, staging, prod)
TEST_ENV ?= local

# Parallel pytest workers (override: make test-pd-local XDIST_ARGS="-n 0")
XDIST_ARGS ?= -n 2 --dist loadscope

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
	uv run mypy automation tests conftest.py pd_server.py

.PHONY: prep
prep: 
	echo "Format and typecheck the code"
	$(MAKE) format
	$(MAKE) typecheck

.PHONY: check
check: lint typecheck

.PHONY: serve-pd
serve-pd:
	uv run python pd_server.py

.PHONY: test-pd-local
test-pd-local:
	@# Local dev: run `make serve-pd` in another terminal first (needed for xdist).
	@# CI (CI=true): builds and serves PD via pd_server.py, then runs pytest.
	@set -euo pipefail; \
	status=0; \
	if [ "$${CI:-}" = "true" ]; then \
	  echo "Starting Protocol Designer via make serve-pd..."; \
	  $(MAKE) serve-pd & pd_pid=$$!; \
	  trap 'kill $$pd_pid 2>/dev/null || true; wait $$pd_pid 2>/dev/null || true' EXIT INT TERM; \
	  uv run python pd_server.py --wait || exit 1; \
	fi; \
	TEST_ENV=local uv run pytest -m pdE2E $(XDIST_ARGS) $(PYTEST_ARGS) || status=$$?; \
	echo ""; \
	echo "---------------------------------------------------------"; \
	echo "🧪 Tests Finished!"; \
	echo "View /opentrons/e2e-testing/test-results/report.html for report"; \
	echo "Use /opentrons/e2e-testing/test-result to see videos"; \
	echo "Use 'make troubleshoot' to view and troubleshoot failed tests"; \
	echo "Run the python file run_many_tests in /e2e-testing to auto-format"; \
	echo "---------------------------------------------------------"; \
	exit $$status

.PHONY: troubleshoot
troubleshoot:
	@echo "🛠️ Re-running last failures in headed mode..."
	-TEST_ENV=local uv run pytest --lf --headed -s --tb=short

.PHONY: test-pd-local-headed
test-pd-local-headed:
	@# Headed debugging: always sequential (no xdist); use PYTEST_ARGS="-k ..." for one test.
	@echo "Example: make test-pd-local-headed PYTEST_ARGS=\"-k test_pd_home\""
	TEST_ENV=local HEADLESS=false uv run pytest -m pdE2E -n 0 $(PYTEST_ARGS)

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

.PHONY: test-ll-local
test-ll-local:
	TEST_ENV=local uv run pytest -m llE2E $(PYTEST_ARGS)

.PHONY: test-ll
test-ll:
	TEST_ENV=$(TEST_ENV) uv run pytest -m llE2E $(PYTEST_ARGS)

.PHONY: test-ll-local-headed
test-ll-local-headed:
	TEST_ENV=local HEADLESS=false uv run pytest -m llE2E $(PYTEST_ARGS)

.PHONY: test-ll-staging
test-ll-staging:
	TEST_ENV=staging uv run pytest -m llE2E $(PYTEST_ARGS)

.PHONY: test-ll-staging-headed
test-ll-staging-headed:
	TEST_ENV=staging HEADLESS=false uv run pytest -m llE2E $(PYTEST_ARGS)

.PHONY: test-ll-prod
test-ll-prod:
	TEST_ENV=prod uv run pytest -m llE2E $(PYTEST_ARGS)

.PHONY: test-compare
test-compare:
	@if [ "$(HEADLESS)" = "false" ]; then \
		uv run pytest -m compare_versions \
		  --browser chromium \
		  tests/pd $(PYTEST_ARGS) -s; \
	else \
		HEADLESS=true uv run pytest -m compare_versions \
		  --browser chromium \
		  tests/pd $(PYTEST_ARGS) -s; \
	fi
