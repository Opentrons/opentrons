UV ?= uv
TAG ?= ghcr.io/opentrons/ci-bootstrap:local
DOCKERFILE := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))/Dockerfile
UTILS_SCRIPT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))/utils/actions.py
REPO_ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST)))/..)

# Optional parameters consumed by helper targets. Defaults make local testing easy.
DEFAULT_BRANCH ?= edge
DEFAULT_TAG ?=
RELEASE_PREFIX ?= chore_release
REF ?=
REF_NAME ?=
BASE_REF ?=
EVENT_NAME ?=
TITLE ?=
OPENTRONS_DEFAULT_REF ?= edge
PLATFORM ?= linux/$(shell uname -m | sed 's/x86_64/amd64/; s/aarch64/arm64/')

# Ensure dependency graph runs the setup before utility commands
determine-source-ref determine-container-tag dependency-checksums check-dependency-drift: setup

.PHONY: build
build:
	docker build \
		--file $(DOCKERFILE) \
		--tag $(TAG) \
		--platform $(PLATFORM) \
		--build-arg OPENTRONS_DEFAULT_REF=$(OPENTRONS_DEFAULT_REF) \
		$(REPO_ROOT)

.PHONY: push
push: build
	docker push $(TAG)

.PHONY: shell
shell:
	docker run --rm -it \
		-v $(REPO_ROOT):/workspace \
		-w /workspace \
		$(TAG) \
		/bin/bash

.PHONY: determine-source-ref
determine-source-ref:
	$(UV) run $(UTILS_SCRIPT) determine-source-ref --ref "$(REF)" --default-branch "$(DEFAULT_BRANCH)" --title "$(if $(TITLE),$(TITLE),CI Docker Source Ref)"

.PHONY: determine-container-tag
determine-container-tag:
	$(UV) run $(UTILS_SCRIPT) determine-container-tag --event-name "$(EVENT_NAME)" --base-ref "$(BASE_REF)" --ref-name "$(REF_NAME)" --default-tag "$(if $(DEFAULT_TAG),$(DEFAULT_TAG),edge)" --release-prefix "$(if $(RELEASE_PREFIX),$(RELEASE_PREFIX),chore_release)" --title "$(if $(TITLE),$(TITLE),CI Docker Container Tag)"

.PHONY: dependency-checksums
dependency-checksums:
	$(UV) run $(UTILS_SCRIPT) dependency-checksums --root "$(REPO_ROOT)" --output "$(if $(OUTPUT),$(OUTPUT),$(REPO_ROOT)/.ci-dependency-checksums.json)" --title "$(if $(TITLE),$(TITLE),CI Dependency Checksums)"

.PHONY: check-dependency-drift
check-dependency-drift:
	$(UV) run $(UTILS_SCRIPT) dependency-checksums --root "$(REPO_ROOT)" --baseline "$(if $(BASELINE),$(BASELINE),$(REPO_ROOT)/.ci-dependency-checksums.json)" --title "$(if $(TITLE),$(TITLE),CI Dependency Drift)"

.PHONY: setup
setup:
	$(UV) sync --frozen --all-groups

.PHONY: format
format: setup
	$(UV) run ruff format utils/
	$(UV) run ruff check --fix utils/

.PHONY: lint
lint: setup
	$(UV) run ruff check utils/

.PHONY: clean
clean:
	-@docker image rm $(TAG)

.PHONY: help
help:
	@printf "Available targets:\n"
	@printf "  make build           # Build the CI container (override TAG/PLATFORM/OPENTRONS_DEFAULT_REF as needed)\n"
	@printf "  make push            # Build and push the container\n"
	@printf "  make shell           # Start an interactive shell with the repo mounted\n"
	@printf "  make format          # Format and fix Python code with ruff\n"
	@printf "  make lint            # Check Python code with ruff (no changes)\n"
	@printf "  make clean           # Remove the local container image\n"
	@printf "\n"
	@printf "Examples:\n"
	@printf "  make build TAG=ghcr.io/opentrons/ci-bootstrap:test PLATFORM=linux/amd64\n"
	@printf "  make shell TAG=ghcr.io/opentrons/ci-bootstrap:edge\n"
