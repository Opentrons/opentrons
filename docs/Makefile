
FLEX_MANUAL_PREFIX ?= flex-manual
AWS_PROFILE ?= your-profile
BRANCH ?= edge
SANDBOX_S3_BUCKET ?= your-bucket-name

.PHONY: setup
setup:
	uv sync

.PHONY: serve-flex-manual
serve-flex-manual:
	uv run mkdocs serve -f $(FLEX_MANUAL_PREFIX)/mkdocs.yml

.PHONY: build-flex-manual
build-flex-manual:
	uv run mkdocs build -f $(FLEX_MANUAL_PREFIX)/mkdocs.yml

.PHONY: deploy-flex-manual
deploy-flex-manual:
	aws s3 sync $(FLEX_MANUAL_PREFIX)/site/ s3://$(SANDBOX_S3_BUCKET)/$(BRANCH)/$(FLEX_MANUAL_PREFIX)/ --delete --acl public-read --profile $(AWS_PROFILE)
