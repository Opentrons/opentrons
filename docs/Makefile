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

.PHONY: deploy-flex-manual-sandbox
deploy-flex-manual-sandbox:
	python deploy_flex_manual.py sandbox $(if $(BRANCH),--branch $(BRANCH)) $(if $(AWS_PROFILE),--aws-profile $(AWS_PROFILE)) $(if $(FLEX_MANUAL_PREFIX),--flex-manual-prefix $(FLEX_MANUAL_PREFIX))

.PHONY: deploy-flex-manual-staging
deploy-flex-manual-staging:
	python deploy_flex_manual.py staging $(if $(BRANCH),--branch $(BRANCH)) $(if $(AWS_PROFILE),--aws-profile $(AWS_PROFILE)) $(if $(FLEX_MANUAL_PREFIX),--flex-manual-prefix $(FLEX_MANUAL_PREFIX))

.PHONY: deploy-flex-manual-production
deploy-flex-manual-production:
	python deploy_flex_manual.py production $(if $(BRANCH),--branch $(BRANCH)) $(if $(AWS_PROFILE),--aws-profile $(AWS_PROFILE)) $(if $(FLEX_MANUAL_PREFIX),--flex-manual-prefix $(FLEX_MANUAL_PREFIX))

# Backward compatibility - defaults to sandbox
#.PHONY: deploy-flex-manual
#deploy-flex-manual: deploy-flex-manual-sandbox