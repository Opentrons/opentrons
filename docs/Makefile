FLEX_MANUAL_PREFIX ?= flex-manual
# AWS_PROFILE is intentionally left undefined by default
BRANCH ?= edge

.PHONY: setup
setup:
	uv sync

.PHONY: serve-flex-manual
serve-flex-manual:
	uv run mkdocs serve -f $(FLEX_MANUAL_PREFIX)/mkdocs.yml

.PHONY: build-flex-manual
build-flex-manual:
	uv run mkdocs build -f $(FLEX_MANUAL_PREFIX)/mkdocs.yml

.PHONY: deploy_flex_manual_sandbox
deploy_flex_manual_production:
    python deploy_flex_manual.py sandbox --branch ${{ env.BRANCH }}

.PHONY: deploy_flex_manual_staging
deploy_flex_manual_production:
    python deploy_flex_manual.py staging --branch ${{ env.BRANCH }}

.PHONY: deploy_flex_manual_production
deploy_flex_manual_production:
    python deploy_flex_manual.py production --branch ${{ env.BRANCH }}
