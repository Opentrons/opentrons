FLEX_MANUAL_PREFIX ?= flex
# AWS_PROFILE is intentionally left undefined by default
BRANCH ?= edge
SANDBOX_S3_BUCKET ?= sandbox.docs

# API docs configuration
include ../scripts/python.mk
SHX := npx shx

# Sphinx build commands - use pipenv from the api directory with proper paths
sphinx_build := cd ../api && $(pipenv) run sphinx-build -W --keep-going -d $(CURDIR)/docs/build/doctrees
sphinx_build_allow_warnings := cd ../api && $(pipenv) run sphinx-build -d $(CURDIR)/docs/build/doctrees

.PHONY: setup
setup:
	uv sync

.PHONY: clean
clean: api-docs-clean
	$(SHX) rm -rf site

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

.PHONY: serve-flex-manual
serve-flex-manual:
	uv run mkdocs serve -f $(FLEX_MANUAL_PREFIX)/mkdocs.yml

.PHONY: build-flex-manual
build-flex-manual:
	uv run mkdocs build -f $(FLEX_MANUAL_PREFIX)/mkdocs.yml

.PHONY: deploy
deploy:
	python deploy_mkdocs.py $(ENVIRONMENT) --branch $(BRANCH)

# API Documentation Build Targets
docs/build/html/v%: ../api/docs/v%
	$(SHX) mkdir -p docs/build/doctrees
	$(sphinx_build) -b html -n $< $(CURDIR)/$@

docs/build/html/hardware: ../api/docs/hardware ../api/src/opentrons/hardware_control
	$(SHX) mkdir -p docs/build/doctrees
	$(sphinx_build_allow_warnings) -b html -n $< $(CURDIR)/$@
	$(SHX) mkdir $@/_images/

docs/dist/v%: docs/build/html/v%
	$(SHX) mkdir -p $@
	$(SHX) ls -la docs/build/html/
	$(SHX) cp -R $^ $(@D) $(if $(CI),,|| true)

docs/dist/hardware: docs/build/html/hardware
	$(SHX) mkdir -p $@
	$(SHX) cp -R $^ $(@D) $(if $(CI),,|| true)

docs/dist/ot1: ../api/docs/ot1
	$(SHX) mkdir -p $@
	$(SHX) cp -R $< $(@D)



.PHONY: api-docs
api-docs: docs/dist/v1 docs/dist/v2 docs/dist/hardware docs/dist/ot1

.PHONY: api-docs-clean
api-docs-clean:
	$(SHX) rm -rf docs/dist/v1 docs/dist/v2 docs/dist/hardware docs/dist/ot1 docs/build

.PHONY: all-docs
all-docs: build api-docs
