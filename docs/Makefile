FLEX_MANUAL_PREFIX ?= flex-manual
# AWS_PROFILE is intentionally left undefined by default
BRANCH ?= edge
SANDBOX_S3_BUCKET ?= sandbox.docs

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
	@if [ -n "$$CI" ]; then \
		echo "If you need to run this locally, set the variable AWS_PROFILE."; \
	fi
	aws s3 sync $(FLEX_MANUAL_PREFIX)/site/ s3://$(SANDBOX_S3_BUCKET)/$(BRANCH)/$(FLEX_MANUAL_PREFIX)/ --delete --acl public-read $(if $(AWS_PROFILE),--profile $(AWS_PROFILE))
