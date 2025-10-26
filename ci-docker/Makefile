PYTHON ?= python3
TAG ?= ghcr.io/opentrons/ci-bootstrap:local
SCRIPT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))/main.py

.PHONY: build publish shell clean help

build:
	$(PYTHON) $(SCRIPT) build --tag $(TAG) $(ARGS)

publish:
	$(PYTHON) $(SCRIPT) build --tag $(TAG) --push $(ARGS)

shell:
	$(PYTHON) $(SCRIPT) shell --image $(TAG) $(ARGS)

clean:
	-@docker image rm $(TAG)

help:
	@printf "Available targets:\n"
	@printf "  make build    # Build the CI container (override TAG/ARGS as needed)\n"
	@printf "  make publish  # Build and push the container\n"
	@printf "  make shell    # Start an interactive shell with the repo mounted\n"
	@printf "  make clean    # Remove the local container image\n"
