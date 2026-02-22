# Opentrons Pyodide — build wheels, run dev server, and test in-browser protocol analysis.
# Run from this directory (pyodide/). Requires: uv, Python 3.12, Node.js (for tests).

# Resolve paths before including python-uv.mk; after the include, $(lastword $(MAKEFILE_LIST))
# points to python-uv.mk rather than this file, so PYODIDE_DIR would resolve incorrectly.
PYODIDE_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
REPO_ROOT   := $(PYODIDE_DIR)..
DIST_DIR    := $(PYODIDE_DIR)dist

include ../scripts/python-uv.mk

NODE := node
NPM  := npm
PORT        ?= 8080

PYFILES := opentrons_pyodide_shims.py generate_manifest.py serve.py tests/

.DEFAULT_GOAL := help

# ------------------------------------------------------------------------------
# Default: show help
# ------------------------------------------------------------------------------
.PHONY: help
help:
	@echo "Opentrons Pyodide — targets (run from pyodide/)"
	@echo ""
	@echo "  make build-wheels   Build opentrons + opentrons-shared-data wheels into dist/"
	@echo "  make serve          Rebuild wheels, then run HTTP server (PORT=$(PORT))"
	@echo "  make test           Run headless Pyodide tests (Node.js)"
	@echo "  make test-py        Run Python unit tests (pytest)"
	@echo "  make debug          Run debug_pe.mjs (step-by-step shim diagnostics)"
	@echo "  make lint           Ruff lint + format check"
	@echo "  make format         Ruff auto-format (writes files)"
	@echo "  make typecheck      mypy type check"
	@echo "  make prep           format → lint → typecheck → test → test-py"
	@echo "  make setup          Install Node + Python dev dependencies"
	@echo "  make clean          Remove dist/ and build artifacts"
	@echo ""
	@echo "Requirements: uv, Python 3.12, Node.js (for tests)."

# ------------------------------------------------------------------------------
# Build wheels for Pyodide (shared-data + api)
# ------------------------------------------------------------------------------
.PHONY: build-wheels
build-wheels: wheels

.PHONY: wheels
wheels: clean-dist
	@echo "=== Building opentrons-shared-data wheel (uv, Python $(UV_PYTHON)) ==="
	cd $(REPO_ROOT)/shared-data && $(UV) run --python $(UV_PYTHON) python -m build --wheel --outdir $(DIST_DIR)
	@echo ""
	@echo "=== Building opentrons wheel (uv, Python $(UV_PYTHON)) ==="
	cd $(REPO_ROOT)/api && $(UV) run --python $(UV_PYTHON) python -m build --wheel --outdir $(DIST_DIR)
	@echo ""
	@echo "=== Generating manifest ==="
	DIST_DIR=$(DIST_DIR) $(python) generate_manifest.py
	@echo ""
	@echo "=== Built wheels ==="
	@ls -lh $(DIST_DIR)/*.whl

.PHONY: clean-dist
clean-dist:
	rm -rf $(DIST_DIR)
	mkdir -p $(DIST_DIR)

# ------------------------------------------------------------------------------
# Rebuild wheels then run local dev server (CORS, protocol file routing)
# ------------------------------------------------------------------------------
.PHONY: serve
serve: build-wheels
	@echo "Serving $(PYODIDE_DIR)"
	@echo "Open http://localhost:$(PORT) in your browser"
	@echo "Press Ctrl+C to stop"
	$(python) serve.py --port $(PORT)

# ------------------------------------------------------------------------------
# Headless tests (Node.js + Pyodide)
# ------------------------------------------------------------------------------
.PHONY: test
test: setup
	$(NODE) test_pyodide.mjs

# ------------------------------------------------------------------------------
# Python unit tests (pytest — no Pyodide required)
# ------------------------------------------------------------------------------
.PHONY: test-py
test-py: setup
	$(pytest) tests/ -v

# ------------------------------------------------------------------------------
# Debug: step-by-step Protocol Engine shim diagnostics
# Runs debug_pe.mjs which tests each compatibility layer individually.
# Requires wheels to be built first (make build-wheels).
# ------------------------------------------------------------------------------
.PHONY: debug
debug: setup
	$(NODE) debug_pe.mjs

# ------------------------------------------------------------------------------
# Lint (ruff check + format check — no auto-fix)
# ------------------------------------------------------------------------------
.PHONY: lint
lint:
	$(ruff) check $(PYFILES)
	$(ruff) format --check $(PYFILES)

# ------------------------------------------------------------------------------
# Format (ruff — writes files in place)
# ------------------------------------------------------------------------------
.PHONY: format
format:
	$(ruff) format $(PYFILES)
	$(ruff) check --select I --fix $(PYFILES)

# ------------------------------------------------------------------------------
# Type check (mypy)
# ------------------------------------------------------------------------------
.PHONY: typecheck
typecheck:
	$(python) -m mypy $(PYFILES)

# ------------------------------------------------------------------------------
# Prep: format → lint → typecheck → test (Node/Pyodide) → test-py (pytest)
# Run this before pushing to catch all issues in one shot.
# ------------------------------------------------------------------------------
.PHONY: prep
prep: setup
	@echo "=== [1/5] format ==="
	$(MAKE) format
	@echo ""
	@echo "=== [2/5] lint ==="
	$(MAKE) lint
	@echo ""
	@echo "=== [3/5] typecheck ==="
	$(MAKE) typecheck
	@echo ""
	@echo "=== [4/5] test (Node + Pyodide) ==="
	$(MAKE) test
	@echo ""
	@echo "=== [5/5] test-py (pytest) ==="
	$(MAKE) test-py
	@echo ""
	@echo "=== prep complete ==="

# ------------------------------------------------------------------------------
# Setup (Node + Python dev deps)
# ------------------------------------------------------------------------------
.PHONY: setup
setup:
	$(NPM) install
	$(uv_sync_dev)

# ------------------------------------------------------------------------------
# Clean (remove dist only; build-wheels recreates it)
# ------------------------------------------------------------------------------
.PHONY: clean
clean:
	rm -rf $(DIST_DIR)
	@echo "Cleaned $(DIST_DIR)"
