FLEX_MANUAL_PREFIX ?= flex-manual
# AWS_PROFILE is intentionally left undefined by default
BRANCH ?= edge
	
.PHONY: build
build:
	uv run mkdocs build -f ./mkdocs.yml

.PHONY: deploy
deploy:
	python deploy_mkdocs.py $(ENVIRONMENT) --branch $(BRANCH)

.PHONY: serve
serve:
	uv run mkdocs serve -f ./mkdocs.yml

.PHONY: serve-flex-manual
serve-flex-manual:
	uv run mkdocs serve -f $(FLEX_MANUAL_PREFIX)/mkdocs.yml
	
.PHONY: setup
setup:
	uv sync