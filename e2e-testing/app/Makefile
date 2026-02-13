# e2e-testing/app

SHELL := bash
.DEFAULT_GOAL := help

# Use nvs to ensure Node 22+ and pnpm are available.
# COREPACK_ENABLE_STRICT=0 prevents corepack from refusing to run pnpm
# when the parent monorepo declares yarn as its packageManager.
export COREPACK_ENABLE_STRICT := 0

# ---------------------------------------------------------------------------
# Setup / Teardown
# ---------------------------------------------------------------------------

.PHONY: setup
setup: ## Install all dependencies from the lockfile
	@echo "Switching to Node 22 via nvs …"
	@command -v nvs >/dev/null 2>&1 && nvs use 22 || true
	pnpm install --frozen-lockfile

.PHONY: teardown
teardown: ## Remove node_modules
	rm -rf node_modules
	@echo "✓ node_modules removed"

# ---------------------------------------------------------------------------
# Testing – Installed (production) app
# ---------------------------------------------------------------------------

.PHONY: test
test: ## Run installed-app tests (headless)
	pnpm test

.PHONY: test-headed
test-headed: ## Run installed-app tests (headed – visible window)
	pnpm test:headed

.PHONY: test-debug
test-debug: ## Run installed-app tests with Playwright Inspector
	pnpm test:debug

# ---------------------------------------------------------------------------
# Testing – Dev app (from source)
# ---------------------------------------------------------------------------

.PHONY: test-dev
test-dev: ## Run dev-mode tests (headless, builds + launches from source)
	pnpm test:dev

.PHONY: test-dev-headed
test-dev-headed: ## Run dev-mode tests (headed – visible window)
	pnpm test:dev:headed

.PHONY: test-dev-debug
test-dev-debug: ## Run dev-mode tests with Playwright Inspector
	pnpm test:dev:debug

.PHONY: test-dev-skip-build
test-dev-skip-build: ## Run dev-mode tests, skip app-shell rebuild
	SKIP_SHELL_BUILD=true pnpm test:dev

# ---------------------------------------------------------------------------
# Testing – All dev tests (smoke + visualization)
# ---------------------------------------------------------------------------

.PHONY: test-dev-all
test-dev-all: ## Run all dev-mode tests (smoke + visualization, headless)
	pnpm test:dev:all

# ---------------------------------------------------------------------------
# Testing – Protocol Visualization (dev)
# ---------------------------------------------------------------------------

.PHONY: test-dev-viz
test-dev-viz: ## Run protocol visualization tests (headless)
	pnpm test:dev:viz

.PHONY: test-dev-viz-headed
test-dev-viz-headed: ## Run protocol visualization tests (headed)
	pnpm test:dev:viz:headed

.PHONY: test-dev-viz-debug
test-dev-viz-debug: ## Run protocol visualization tests with Inspector
	pnpm test:dev:viz:debug

.PHONY: test-dev-viz-skip-build
test-dev-viz-skip-build: ## Run visualization tests, skip app-shell rebuild
	SKIP_SHELL_BUILD=true pnpm test:dev:viz

# ---------------------------------------------------------------------------
# Testing – All
# ---------------------------------------------------------------------------

.PHONY: test-all
test-all: ## Run all tests (installed + dev)
	pnpm test:all

.PHONY: test-ui
test-ui: ## Run tests in Playwright UI mode
	pnpm test:ui

.PHONY: report
report: ## Open the HTML test report
	pnpm report

# ---------------------------------------------------------------------------
# Code quality
# ---------------------------------------------------------------------------

.PHONY: lint
lint: ## Lint with Biome
	pnpm lint

.PHONY: lint-fix
lint-fix: ## Lint and auto-fix with Biome
	pnpm lint:fix

.PHONY: format
format: ## Format with Biome
	pnpm format

.PHONY: format-check
format-check: ## Check formatting (no writes)
	pnpm format:check

.PHONY: typecheck
typecheck: ## Run TypeScript type checking
	pnpm typecheck

.PHONY: check
check: ## Lint + typecheck (CI gate)
	pnpm check

.PHONY: prep
prep: ## Auto-fix, format, and typecheck (pre-commit)
	pnpm prep

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
