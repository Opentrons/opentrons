FLEX_MANUAL_PREFIX ?= flex
# AWS_PROFILE is intentionally left undefined by default
BRANCH ?= edge
SANDBOX_S3_BUCKET ?= sandbox.docs

.PHONY: build
build:	
	@if [ -n "$$CI" ]; then \
		uv run mkdocs build -f ./mkdocs.yml --strict; \
	else \
		uv run mkdocs build -f ./mkdocs.yml; \
	fi