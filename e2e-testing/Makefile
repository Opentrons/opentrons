# e2e-testing makefile

# Environment selection (local, sandbox, staging, prod)
TEST_ENV ?= local

# Define OS detection variables
# 'uname' is available on Unix-like systems (Linux, macOS, etc.)
UNAME_S := $(shell uname -s)

.PHONY: setup
setup: install-uv
	# This step now runs AFTER UV is guaranteed to be installed
	uv sync --frozen

# --- UV Installation Logic ---

.PHONY: install-uv
install-uv:
	# Check if 'uv' is already installed. If missing, call the OS-specific installer.
	@if command -v uv > /dev/null 2>&1; then \
		echo "UV is already installed. Skipping installation."; \
	else \
		echo "UV not found. Attempting installation..."; \
		$(MAKE) __install-uv-os-specific; \
	fi
	# Final verification step (runs whether installation was skipped or attempted)
	@echo "Checking UV installation..."
	@command -v uv || (echo "ERROR: UV installation failed. Please install manually." && exit 1)

# Helper target to run OS-specific installation logic only when needed
.PHONY: __install-uv-os-specific
__install-uv-os-specific:
ifeq ($(UNAME_S),Darwin) # macOS detection
	@echo "Installing UV for macOS..."
	# Use 'brew' if available, otherwise use 'pipx' or the install script
	@(command -v brew > /dev/null 2>&1 && brew install uv) || (pipx install uv) || (curl -LsSf https://astral.sh/uv/install.sh | sh)
else ifeq ($(UNAME_S),Linux) # Linux detection
	@echo "Installing UV for Linux..."
	# Use 'pipx' or the install script
	@(pipx install uv) || (curl -LsSf https://astral.sh/uv/install.sh | sh)
else ifdef SystemRoot # Heuristic for Windows (checking for Windows environment variable)
	@echo "Installing UV for Windows. Please ensure 'pipx' is available or install manually if this fails."
	# Best reliable method is often 'pipx' since it cleanly handles CLI tools
	pipx install uv
endif

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