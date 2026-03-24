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

# --- Migration export & fixture simulation ---
# Export PD fixtures as .py under migration-report/<app-version>/ (needs: make setup && make test-setup).
# Optional env: MIGRATION_REPORT_KEYS, MIGRATION_REPORT_SINGLE_KEY, MIGRATION_REPORT_CLEAN=true, etc.
# See migration_report.py module docstring.

.PHONY: migration-export-prod
migration-export-prod:
	uv run python migration_report.py

.PHONY: migration-export-staging
migration-export-staging:
	MIGRATION_REPORT_BASE_URL=https://staging.designer.opentrons.com uv run python migration_report.py

# Local PD dev server (default http://localhost:4173). Override: make migration-export-local PD_URL=http://127.0.0.1:4173

.PHONY: migration-export-local
migration-export-local:
	MIGRATION_REPORT_BASE_URL="$(or $(PD_URL),http://localhost:4173)" uv run python migration_report.py

# Promote migration-report/<SOURCE_FOLDER>/exports → migration-report/baseline/exports
# Example: make migration-baseline SOURCE_FOLDER=8.7.1
# Replace existing baseline: make migration-baseline SOURCE_FOLDER=8.7.1 OVERWRITE=1

.PHONY: migration-baseline
migration-baseline:
	@test -n "$(SOURCE_FOLDER)" || (echo "Set SOURCE_FOLDER (e.g. SOURCE_FOLDER=8.7.1). See migration_baseline.py."; exit 1)
	uv run python migration_baseline.py --source-folder "$(SOURCE_FOLDER)" $(if $(filter 1 true yes,$(OVERWRITE)),--overwrite,)

# Import each fixture in PD, export Python, run opentrons_simulate (slow). Requires api venv: make -C ../api setup

.PHONY: test-pd-simulate
test-pd-simulate:
	TEST_ENV=local uv run pytest tests/pd/test_pd_import_export_simulate.py $(PYTEST_ARGS)

# Same as test-pd-simulate but skips per-test video encoding (bulk run).
# Optional: PD_PROTOCOL_FIXTURE_KEYS=key1,key2 to narrow fixtures.

.PHONY: test-pd-simulate-fast
test-pd-simulate-fast:
	TEST_ENV=local PW_E2E_RECORD_VIDEO=false uv run pytest tests/pd/test_pd_import_export_simulate.py $(PYTEST_ARGS)
