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

.PHONY: setup auth lint run scan_python scan_c check_js clean all

SCRIPT_NAME = scrape_repo.py

# 'make all' will do the full fresh setup, lint, and run the script
all: setup auth lint run

setup:
	@echo "📦 Step 1: Installing system tools..."
	@if ! command -v gh &> /dev/null; then brew install gh; fi
	@if ! command -v uv &> /dev/null; then brew install uv; fi
	@echo "🐍 Step 2: Setting up Python environment..."
	uv venv
	uv pip install pandas rich ruff radon lizard streamlit
	@echo "⚙️ Step 3: Setting up Node/TypeScript environment..."
	@if [ ! -f package.json ]; then npm init -y; fi
	npm install @babel/parser tsx @types/node

auth:
	@echo "🔐 Step 4: Checking GitHub CLI authentication..."
	@gh auth status || gh auth login

run:
	@echo "🚀 Booting up the QA Risk Analyzer Web GUI..."
	uv run streamlit run $(SCRIPT_NAME)

scan_python:
	@echo "🧠 Running Radon (Cyclomatic Complexity) on Python files..."
	@echo "Usage: make scan_python path=../api/src/opentrons/..."
	uv run radon cc -s -a $(path)

scan_c:
	@echo "🦾 Running Lizard (Complexity) on C/C++ Firmware..."
	@echo "Usage: make scan_c path=../../ot3-firmware/src/..."
	uv run lizard $(path)

check_js:
	@echo "⚛️  Checking Node environment..."
	@if ! command -v npx &> /dev/null; then echo "❌ npx not found. Please install Node.js."; else echo "✅ npx found. TypeScript parser is ready."; fi

clean:
	@echo "🧹 Cleaning up environments..."
	rm -rf .venv node_modules package-lock.json
	@echo "✨ Clean complete!"