# QA Epic Risk Analyzer — run from e2e-testing/ via: make -C epic_risk <target>

E2E_DIR := $(abspath ..)

.PHONY: setup auth run

setup:
	@echo "Installing epic risk analyzer dependencies..."
	@if ! command -v gh &> /dev/null; then brew install gh; fi
	@if ! command -v uv &> /dev/null; then brew install uv; fi
	cd $(E2E_DIR) && uv sync --extra epic-risk --frozen

auth:
	@echo "Checking GitHub CLI authentication..."
	@gh auth status || gh auth login

run:
	cd $(E2E_DIR) && uv run --extra epic-risk streamlit run scrape_repo.py
