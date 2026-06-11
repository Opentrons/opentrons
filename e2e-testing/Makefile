# e2e-testing makefile

# Pin the interpreter for all `uv sync` / `uv run` in this file (matches robot stack 3.12 / CI).
export UV_PYTHON := 3.12

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

.PHONY: test-api-integration
test-api-integration:
	TEST_ENV=$(TEST_ENV) uv run pytest tests/auth -m auth_api $(PYTEST_ARGS)

.PHONY: test-auth
test-auth: test-api-integration

DEMO_ACCESS_MATRIX_HTML ?= test-results/demo-access-matrix.html
DEMO_ACCESS_MATRIX_PORT ?= 8765

.PHONY: demo-access-matrix
demo-access-matrix:
	uv run python scripts/print_demo_access_matrix.py --output $(DEMO_ACCESS_MATRIX_HTML) --serve --port $(DEMO_ACCESS_MATRIX_PORT)

.PHONY: provision-demo-users
provision-demo-users:
	@if [ -z "$(ROBOT_IP)" ]; then \
		echo "Usage: make provision-demo-users ROBOT_IP=<robot-ip-or-hostname> [PROVISION_DEMO_ARGS='--replace']"; \
		exit 1; \
	fi
	uv run python scripts/provision_demo_users.py $(ROBOT_IP) $(PROVISION_DEMO_ARGS)

.PHONY: cleanup-robot-runs
cleanup-robot-runs:
	@if [ -z "$(ROBOT_IP)" ]; then \
		echo "Usage: make cleanup-robot-runs ROBOT_IP=<robot-ip-or-hostname> [CLEANUP_ROBOT_ARGS='--keep-idle-runs']"; \
		exit 1; \
	fi
	uv run python scripts/cleanup_robot_runs.py $(ROBOT_IP) $(CLEANUP_ROBOT_ARGS)

.PHONY: inspect-robot-auth
inspect-robot-auth:
	@if [ -z "$(ROBOT_IP)" ]; then \
		echo "Usage: make inspect-robot-auth ROBOT_IP=<robot-ip-or-hostname> [INSPECT_AUTH_ARGS='--username u --password p']"; \
		exit 1; \
	fi
	uv run python scripts/inspect_robot_auth.py $(ROBOT_IP) $(INSPECT_AUTH_ARGS)

.PHONY: ssh-flex
ssh-flex:
	@if [ -z "$(ROBOT_IP)" ]; then \
		echo "Usage: make ssh-flex ROBOT_IP=<robot-ip-or-hostname> [SSH_FLEX_ARGS='-- ls /data']"; \
		exit 1; \
	fi
	uv run python scripts/ssh_flex.py $(ROBOT_IP) $(SSH_FLEX_ARGS)

.PHONY: reset-robot-auth-server
reset-robot-auth-server:
	@if [ -z "$(ROBOT_IP)" ]; then \
		echo "Usage: make reset-robot-auth-server ROBOT_IP=<robot-ip-or-hostname> [RESET_AUTH_ARGS='--yes']"; \
		exit 1; \
	fi
	uv run python scripts/reset_robot_auth_server.py $(ROBOT_IP) $(RESET_AUTH_ARGS)

.PHONY: verify-robot-encryption
verify-robot-encryption:
	@if [ -z "$(ROBOT_IP)" ]; then \
		echo "Usage: make verify-robot-encryption ROBOT_IP=<robot-ip-or-hostname> [VERIFY_ENCRYPTION_ARGS='--skip-https-test']"; \
		exit 1; \
	fi
	uv run python scripts/verify_robot_encryption.py $(ROBOT_IP) $(VERIFY_ENCRYPTION_ARGS)

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
