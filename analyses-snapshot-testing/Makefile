BASE_IMAGE_NAME ?= opentrons-python-base:3.10
CACHEBUST ?= $(shell date +%s)
ANALYSIS_REF ?= edge
PROTOCOL_NAMES ?= all
OVERRIDE_PROTOCOL_NAMES ?= all
LOCAL_IMAGE_TAG ?= local
ANALYZER_IMAGE_NAME ?= opentrons-analysis

export ANALYSIS_REF # tag, branch or commit for the opentrons repository. Used as the image tag for the analyzer image
export PROTOCOL_NAMES # tell the test which protocols to run
export OVERRIDE_PROTOCOL_NAMES # tell the test which override protocols to run

.PHONY: ruff
ruff:
	uv run ruff format
	uv run ruff check . --fix

.PHONY: ruff-check
ruff-check:
	uv run ruff format --check
	uv run ruff check .

.PHONY: format
format: 
	@echo "Running ruff"
	$(MAKE) ruff
	@echo "Formatting the readme with yarn prettier"
	$(MAKE) format-readme

.PHONY: test-ci
test-ci:
	$uv run python -m pytest -m "emulated_alpha"

.PHONY: audit
audit:
	uv run python -m automation.audit_snapshots

.PHONY: test-protocol-analysis
test-protocol-analysis:
	uv run python -m pytest -v tests/protocol_analyze_test.py

.PHONY: ci-setup
ci-setup:
	uv sync --locked --all-extras

.PHONY: setup
setup:
	@echo "You must have uv installed to run this Makefile"
	uv sync

.PHONY: format-readme
format-readme:
	yarn prettier --ignore-path .eslintignore --write analyses-snapshot-testing/**/*.md .github/workflows/analyses-snapshot-test.yaml


.PHONY: snapshot-test
snapshot-test:
	@echo "ANALYSIS_REF is $(ANALYSIS_REF)"
	@echo "PROTOCOL_NAMES is $(PROTOCOL_NAMES)"
	@echo "OVERRIDE_PROTOCOL_NAMES is $(OVERRIDE_PROTOCOL_NAMES)"
	uv run python -m pytest -k analyses_snapshot_test -vv

.PHONY: snapshot-audit-test
snapshot-audit-test:
	@echo "validate that analysis outcome matches the test intention"
	uv run python -m pytest -k audit_snapshot_test -vv

.PHONY: snapshot-test-update
snapshot-test-update:
	@echo "ANALYSIS_REF is $(ANALYSIS_REF)"
	@echo "PROTOCOL_NAMES is $(PROTOCOL_NAMES)"
	@echo "OVERRIDE_PROTOCOL_NAMES is $(OVERRIDE_PROTOCOL_NAMES)"
	uv run python -m pytest -k analyses_snapshot_test --snapshot-update

.PHONY: build-base-image
build-base-image:
	@echo "Building the base image $(BASE_IMAGE_NAME)"
	docker build --build-arg BASE_IMAGE_NAME=$(BASE_IMAGE_NAME) -f citools/Dockerfile.base -t $(BASE_IMAGE_NAME) citools/.

.PHONY: build-opentrons-analysis
build-opentrons-analysis:
	@echo "Building docker image for opentrons repository reference$(ANALYSIS_REF)"
	@echo "The image will be named $(ANALYZER_IMAGE_NAME):$(ANALYSIS_REF)"
	@echo "If you want to build a different version, run 'make build-opentrons-analysis ANALYSIS_REF=<tag, branch, or commit>'"
	docker build --build-arg BASE_IMAGE_NAME=$(BASE_IMAGE_NAME) --build-arg ANALYSIS_REF=$(ANALYSIS_REF) --build-arg CACHEBUST=$(CACHEBUST) -t $(ANALYZER_IMAGE_NAME):$(ANALYSIS_REF) -f citools/Dockerfile.analyze citools/.

.PHONY: build-local
build-local:
	@echo "Building docker image for your local opentrons code"
	@echo "This image will be named $(ANALYZER_IMAGE_NAME):$(LOCAL_IMAGE_TAG)"
	docker build --build-arg BASE_IMAGE_NAME=$(BASE_IMAGE_NAME) -t $(ANALYZER_IMAGE_NAME):$(LOCAL_IMAGE_TAG) -f citools/Dockerfile.local ..
	@echo "Build complete"

.PHONY: snapshot-test-local
snapshot-test-local: ANALYSIS_REF=$(LOCAL_IMAGE_TAG)
snapshot-test-local: build-base-image build-local
	@echo "This target is overriding the ANALYSIS_REF to the LOCAL_IMAGE_TAG: $(LOCAL_IMAGE_TAG)"
	@echo "ANALYSIS_REF is $(ANALYSIS_REF). The the test maps this env variable to the image tag."
	@echo "The image the test will use is $(ANALYZER_IMAGE_NAME):$(LOCAL_IMAGE_TAG)"
	@echo "PROTOCOL_NAMES is $(PROTOCOL_NAMES)"
	@echo "OVERRIDE_PROTOCOL_NAMES is $(OVERRIDE_PROTOCOL_NAMES)"
	uv run python -m pytest -k analyses_snapshot_test -vv

.PHONY: snapshot-test-update-local
snapshot-test-update-local: ANALYSIS_REF=$(LOCAL_IMAGE_TAG)
snapshot-test-update-local: build-base-image build-local
	@echo "This target is overriding the ANALYSIS_REF to the LOCAL_IMAGE_TAG: $(LOCAL_IMAGE_TAG)"
	@echo "ANALYSIS_REF is $(ANALYSIS_REF). The the test maps this env variable to the image tag."
	@echo "The image the test will use is $(ANALYZER_IMAGE_NAME):$(LOCAL_IMAGE_TAG)"
	@echo "PROTOCOL_NAMES is $(PROTOCOL_NAMES)"
	@echo "OVERRIDE_PROTOCOL_NAMES is $(OVERRIDE_PROTOCOL_NAMES)"
	uv run python -m pytest -k analyses_snapshot_test --snapshot-update

.PHONY: generate-protocols
generate-protocols:
	uv run python -m automation.data.protocol_registry

.PHONY: matrix
matrix:
	uv run python -m automation.analysis_matrix

# Tools for running the robot server in a container

OPENTRONS_VERSION ?= edge
export OPENTRONS_VERSION # used for the robot server image as the tag, branch or commit for the opentrons repository

.PHONY: build-rs
build-rs:
	@echo "Building docker image for opentrons-robot-server:$(OPENTRONS_VERSION)"
	@echo "Cache is always busted to ensure latest version of the code is used"
	@echo "If you want to build a different version, run 'make build-rs OPENTRONS_VERSION=chore_release-8.0.0'"
	docker build --build-arg BASE_IMAGE_NAME=$(BASE_IMAGE_NAME) --build-arg OPENTRONS_VERSION=$(OPENTRONS_VERSION) --build-arg CACHEBUST=$(CACHEBUST) -t opentrons-robot-server:$(OPENTRONS_VERSION) -f citools/Dockerfile.server .

.PHONY: run-flex
run-flex:
	@echo "Running opentrons-robot-server:$(OPENTRONS_VERSION)"
	@echo "If you want to run a different version, run 'make run-flex OPENTRONS_VERSION=chore_release-8.0.0'"
	docker run -p 31950:31950 --env-file ../robot-server/dev-flex.env opentrons-robot-server:$(OPENTRONS_VERSION)

.PHONY: run-ot2
run-ot2:
	@echo "Running opentrons-robot-server:$(OPENTRONS_VERSION)"
	@echo "If you want to run a different version, run 'make run-ot2 OPENTRONS_VERSION=chore_release-8.0.0'"
	docker run -p 31950:31950 --env-file ../robot-server/dev.env opentrons-robot-server:$(OPENTRONS_VERSION)

LIMIT ?= 10
.PHONY: analyze
analyze:
	uv run python -m automation.test_analyze_api --limit $(LIMIT)

.PHONY: generate-analyses
generate-analyses:
	uv run python -m automation.test_gen_analyses --limit $(LIMIT)

.PHONY: gen-chunks
gen-chunks:
	uv run python -m automation.data.collect

CHUNK ?= chunk_0.json
.PHONY: analyze-chunk
analyze-chunk:
	uv run python -m automation.analyze_from_chunk --chunk $(CHUNK)

.PHONY: install-ot
install-ot:
	@echo "Installing the opentrons package from the local codebase"
	uv pip install -e ../shared-data/python
	uv pip install -e ../api

.PHONY: create-pl-protocols
create-pl-protocols:
	uv run python -m automation.data.create_pl_protocols

.PHONY: protocol-info
protocol-info: clean-generated-protocols generate-protocols
	uv run python -m automation.data.collect_direct

.PHONY: audit-registry
audit-registry:
	uv run python -m automation.data.audit_registry

.PHONY: clean-ar
clean-ar:
	@echo "Deleting all .json files in analyses-snapshot-testing/analysis_results"
	rm -f analysis_results/*.json

.PHONY: clean-chunks
clean-chunks:
	@echo "Deleting all .json files in analyses-snapshot-testing/chunks"
	rm -f chunks/*.json

.PHONY: clean-generated-protocols
clean-generated-protocols:
	@echo "Deleting all files in analyses-snapshot-testing/files/generated_protocols"
	rm -f files/generated_protocols/*.py

.PHONY: clean
clean: clean-ar clean-chunks clean-generated-protocols

.PHONY: collect-audit
collect-audit: 
	uv run python -m automation.data.collect_audit

.PHONY: prep
prep: format ruff-check clean audit-registry collect-audit

ANALYSIS_REFS := chore_release-8.5.0 v8.4.1 v8.3.2 v8.2.0 v8.0.0

.PHONY: build-matrix
build-matrix: build-base-image
	@echo "Building all stable versions in parallel"
	$(MAKE) -j $(shell nproc) $(foreach ref,$(ANALYSIS_REFS),build-opentrons-analysis-$(ref))
	@echo "All stable versions built successfully."
	docker images | grep $(ANALYZER_IMAGE_NAME)

# pattern rule for each version
.PHONY: build-opentrons-analysis-%
build-opentrons-analysis-%:
	$(MAKE) build-opentrons-analysis ANALYSIS_REF=$*

.PHONY: unit-test
unit-test:
	uv run python -m pytest -m "unit" -vv
