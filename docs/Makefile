FLEX_MANUAL_PREFIX ?= flex
# AWS_PROFILE is intentionally left undefined by default
BRANCH ?= edge
SANDBOX_S3_BUCKET ?= sandbox.docs

.PHONY: setup
setup:
	uv sync

.PHONY: serve
serve:
	uv run mkdocs serve -f ./mkdocs.yml

.PHONY: build
build:
	uv run mkdocs build -f ./mkdocs.yml

.PHONY: serve-flex-manual
serve-flex-manual:
	uv run mkdocs serve -f $(FLEX_MANUAL_PREFIX)/mkdocs.yml

.PHONY: build-flex-manual
build-flex-manual:
	uv run mkdocs build -f $(FLEX_MANUAL_PREFIX)/mkdocs.yml

.PHONY: deploy
deploy:
	python deploy_mkdocs.py $(ENVIRONMENT) --branch $(BRANCH)
