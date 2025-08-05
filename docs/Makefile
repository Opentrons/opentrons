FLEX_MANUAL_PREFIX ?= flex
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

.PHONY: serve
serve:
	uv run mkdocs serve -f ./mkdocs.yml

.PHONY: build
build:
	@if [ -n "$$CI" ]; then \
		uv run mkdocs build -f ./mkdocs.yml --strict; \
	else \
		uv run mkdocs build -f ./mkdocs.yml; \
	fi

.PHONY: deploy
deploy:
	@if [ -n "$$CI" ]; then \
		echo "If you need to run this locally, set the variable AWS_PROFILE."; \
	fi
	aws s3 sync ./site/ s3://$(SANDBOX_S3_BUCKET)/$(BRANCH)/ --acl public-read $(if $(AWS_PROFILE),--profile $(AWS_PROFILE))

.PHONY: serve-flex-manual
serve-flex-manual:
	uv run mkdocs serve -f $(FLEX_MANUAL_PREFIX)/mkdocs.yml
	
.PHONY: setup
setup:
	uv sync