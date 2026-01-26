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
	uv run ruff format . *.py
	uv run ruff check --fix . *.py

.PHONY: lint
lint:
	uv run ruff check . *.py
	uv run ruff format --check . *.py

.PHONY: typecheck
typecheck:
	uv run mypy automation tests conftest.py migration_report.py protocols.py run_many_tests.py utility.py

.PHONY: check
check: lint typecheck

.PHONY: test-pd
test-pd:
	TEST_ENV=$(TEST_ENV) uv run pytest -m pdE2E

.PHONY: test-pd-local
test-pd-local:
	# Running the command with '-' ignores the failure exit code so the echos run
	-TEST_ENV=local uv run pytest -m pdE2E $(PYTEST_ARGS)
	@echo ""
	@echo "---------------------------------------------------------"
	@echo "🧪 Tests Finished!"
	@echo "View /opentrons/e2e-testing/test-results/report.html for report"
	@echo "Use /opentrons/e2e-testing/test-result to see videos"
	@echo "Use 'make troubleshoot' to view and troubleshoot failed tests"
	@echo "Run the python file run_many_tests in /e2e-testing to auto-format"
	@echo "---------------------------------------------------------"

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

.PHONY: migration-report
migration-report:
	@echo "Generating migration export report (prod baseline -> staging diff)"
	uv run python -m tests.migration_report

.PHONY: migration-export-prod
migration-export-prod:
	@echo "Exporting protocol fixtures from production"
	MIGRATION_REPORT_BASE_URL=$(or $(MIGRATION_REPORT_BASE_URL),https://designer.opentrons.com) \
	MIGRATION_REPORT_HEADLESS=$(or $(MIGRATION_REPORT_HEADLESS),true) \
	MIGRATION_REPORT_UI_TIMEOUT_MS=$(or $(MIGRATION_REPORT_UI_TIMEOUT_MS),3000) \
	MIGRATION_REPORT_DOWNLOAD_TIMEOUT_MS=$(or $(MIGRATION_REPORT_DOWNLOAD_TIMEOUT_MS),15000) \
	MIGRATION_REPORT_CLEAN=$(or $(MIGRATION_REPORT_CLEAN),false) \
	MIGRATION_REPORT_KEYS=$(MIGRATION_REPORT_KEYS) \
	MIGRATION_REPORT_SINGLE_KEY=$(MIGRATION_REPORT_SINGLE_KEY) \
	MIGRATION_REPORT_LOG_MIGRATION_MODAL=$(MIGRATION_REPORT_LOG_MIGRATION_MODAL) \
	MIGRATION_REPORT_LOG_DOWNLOAD=$(MIGRATION_REPORT_LOG_DOWNLOAD) \
	uv run python -m tests.migration_report

.PHONY: migration-export-staging
migration-export-staging:
	@echo "Exporting protocol fixtures from staging"
	MIGRATION_REPORT_BASE_URL=$(or $(MIGRATION_REPORT_BASE_URL),https://staging.designer.opentrons.com) \
	MIGRATION_REPORT_HEADLESS=$(or $(MIGRATION_REPORT_HEADLESS),false) \
	MIGRATION_REPORT_UI_TIMEOUT_MS=$(or $(MIGRATION_REPORT_UI_TIMEOUT_MS),3000) \
	MIGRATION_REPORT_DOWNLOAD_TIMEOUT_MS=$(or $(MIGRATION_REPORT_DOWNLOAD_TIMEOUT_MS),15000) \
	MIGRATION_REPORT_CLEAN=$(or $(MIGRATION_REPORT_CLEAN),false) \
	MIGRATION_REPORT_KEYS=$(MIGRATION_REPORT_KEYS) \
	MIGRATION_REPORT_SINGLE_KEY=$(MIGRATION_REPORT_SINGLE_KEY) \
	MIGRATION_REPORT_LOG_MIGRATION_MODAL=$(MIGRATION_REPORT_LOG_MIGRATION_MODAL) \
	MIGRATION_REPORT_LOG_DOWNLOAD=$(MIGRATION_REPORT_LOG_DOWNLOAD) \
	uv run python -m tests.migration_report

.PHONY: migration-report-debug
migration-report-debug:
	@echo "Running migration report in DEBUG mode (headed, single fixture)"
	@echo "Set MIGRATION_REPORT_SINGLE_KEY=<fixtureKey> to choose a fixture"
	@echo "Optional: set MIGRATION_REPORT_PAUSE=true to open Playwright inspector"
	MIGRATION_REPORT_MODE=debug MIGRATION_REPORT_HEADLESS=false uv run python -m tests.migration_report

.PHONY: prep
prep: format check test-unit test-pd-local
