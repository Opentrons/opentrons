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

.PHONY: deploy_sandbox
deploy_sandbox:
    python deploy_flex_manual.py sandbox --branch ${{ env.BRANCH }}

.PHONY: deploy_staging
deploy_staging:
    python deploy_flex_manual.py staging --branch ${{ env.BRANCH }}

.PHONY: deploy_production
deploy_production:
    python deploy_flex_manual.py production --branch ${{ env.BRANCH }}
