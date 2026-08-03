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

.PHONY: prep
prep: 
	echo "Format and typecheck the code"
	$(MAKE) format
	$(MAKE) typecheck

.PHONY: check
check: lint typecheck

.PHONY: test-pd-local
test-pd-local:
	@# Always print the summary banner, but preserve pytest's exit code.
	@status=0; \
	TEST_ENV=local uv run pytest -m pdE2E $(PYTEST_ARGS) || status=$$?; \
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

# Load persisted robot settings when present (from `make configure-robot`).
ifneq (,$(wildcard .env))
include .env
export
endif

HEADED ?=
PYTEST_HEADED := $(if $(HEADED),HEADED=1,)

.PHONY: configure-robot check-robot test-app test-app-headed test-app-nav test-app-nav-headed \
	test-app-device-cards test-app-device-cards-headed _app-report-banner

configure-robot:
	uv run python configure_robot.py

check-robot:
	uv run python -m automation.app_helpers.robot_connection

test-app:
	@status=0; \
	$(PYTEST_HEADED) uv run pytest tests/app/ $(PYTEST_ARGS) || status=$$?; \
	$(MAKE) --no-print-directory _app-report-banner; \
	exit $$status

test-app-headed:
	@status=0; \
	HEADED=1 uv run pytest tests/app/ $(PYTEST_ARGS) || status=$$?; \
	$(MAKE) --no-print-directory _app-report-banner; \
	exit $$status

test-app-nav:
	@status=0; \
	$(PYTEST_HEADED) uv run pytest tests/app/nav/ $(PYTEST_ARGS) || status=$$?; \
	$(MAKE) --no-print-directory _app-report-banner; \
	exit $$status

test-app-nav-headed:
	@status=0; \
	HEADED=1 uv run pytest tests/app/nav/ $(PYTEST_ARGS) || status=$$?; \
	$(MAKE) --no-print-directory _app-report-banner; \
	exit $$status

test-app-device-cards:
	@status=0; \
	$(PYTEST_HEADED) uv run pytest tests/app/device_cards/ $(PYTEST_ARGS) || status=$$?; \
	$(MAKE) --no-print-directory _app-report-banner; \
	exit $$status

test-app-device-cards-headed:
	@status=0; \
	HEADED=1 uv run pytest tests/app/device_cards/ $(PYTEST_ARGS) || status=$$?; \
	$(MAKE) --no-print-directory _app-report-banner; \
	exit $$status

_app-report-banner:
	@echo ""
	@echo "---------------------------------------------------------"
	@echo "App tests finished."
	@echo "Open test-results/report.html for the HTML report."
	@echo "Videos: test-results/videos/ (headed runs)"
	@echo "Traces: test-results/traces/"
	@echo "---------------------------------------------------------"
