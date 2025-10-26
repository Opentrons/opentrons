UV ?= uv
TAG ?= ghcr.io/opentrons/ci-bootstrap:local
SCRIPT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))/main.py
UTILS_SCRIPT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))/utils/actions.py

# Optional parameters consumed by helper targets. Defaults make local testing easy.
DEFAULT_BRANCH ?= edge
DEFAULT_TAG ?=
RELEASE_PREFIX ?= chore_release
REF ?=
REF_NAME ?=
BASE_REF ?=
EVENT_NAME ?=
TITLE ?=

.PHONY: build publish shell clean help determine-source-ref determine-container-tag

build:
	$(UV) run $(SCRIPT) build --tag $(TAG) $(ARGS)

publish:
	$(UV) run $(SCRIPT) build --tag $(TAG) --push $(ARGS)

shell:
	$(UV) run $(SCRIPT) shell --image $(TAG) $(ARGS)

determine-source-ref:
	$(UV) run $(UTILS_SCRIPT) determine-source-ref --ref "$(REF)" --default-branch "$(DEFAULT_BRANCH)" --title "$(if $(TITLE),$(TITLE),CI Docker Source Ref)"

determine-container-tag:
	$(UV) run $(UTILS_SCRIPT) determine-container-tag --event-name "$(EVENT_NAME)" --base-ref "$(BASE_REF)" --ref-name "$(REF_NAME)" --default-tag "$(if $(DEFAULT_TAG),$(DEFAULT_TAG),edge)" --release-prefix "$(if $(RELEASE_PREFIX),$(RELEASE_PREFIX),chore_release)" --title "$(if $(TITLE),$(TITLE),CI Docker Container Tag)"

clean:
	-@docker image rm $(TAG)

help:
	@printf "Available targets:\n"
	@printf "  make build    # Build the CI container (override TAG/ARGS as needed)\n"
	@printf "  make publish  # Build and push the container\n"
	@printf "  make shell    # Start an interactive shell with the repo mounted\n"
	@printf "  make clean    # Remove the local container image\n"
