BASE_IMAGE_NAME ?= opentrons-python-base:3.12
CACHEBUST ?= $(shell date +%s)
ANALYSIS_REF ?= edge
PROTOCOL_NAMES ?= all
OVERRIDE_PROTOCOL_NAMES ?= all
LOCAL_IMAGE_TAG ?= local
ANALYZER_IMAGE_NAME ?= opentrons-analysis
VENV_DIR ?= .venv

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
	@echo "Formatting the readme with pnpm exec prettier"
	$(MAKE) format-readme

.PHONY: audit
audit:
	uv run python -m automation.audit_snapshots

.PHONY: test-protocol-analysis
test-protocol-analysis:
	uv run python -m pytest -v tests/protocol_analyze_test.py

.PHONY: setup
setup:
	@echo "You must have uv installed to run this Makefile"
	uv run python bootstrap_uv_env.py

.PHONY: teardown
teardown:
	@echo "Tearing down uv virtual environment at $(VENV_DIR)"
	@if [ -d "$(VENV_DIR)" ]; then \
		rm -rf "$(VENV_DIR)"; \
		echo "Removed $(VENV_DIR)"; \
	else \
		echo "No $(VENV_DIR) directory found; nothing to do"; \
	fi

.PHONY: format-readme
format-readme:
	cd .. && pnpm exec prettier --ignore-path .eslintignore --write analyses-snapshot-testing/**/*.md .github/workflows/analyses-snapshot-test.yaml


.PHONY: snapshot-test
snapshot-test:
	@echo "ANALYSIS_REF is $(ANALYSIS_REF)"
	@echo "PROTOCOL_NAMES is $(PROTOCOL_NAMES)"
	@echo "OVERRIDE_PROTOCOL_NAMES is $(OVERRIDE_PROTOCOL_NAMES)"
	uv run python -m pytest -k analyses_snapshot_test -v --tb=line

.PHONY: snapshot-audit-test
snapshot-audit-test:
	@echo "validate that analysis outcome matches the test intention"
	uv run python -m pytest -k audit_snapshot_test -v --tb=line

.PHONY: ot2-compatibility-test
ot2-compatibility-test:
	@echo "verify OT-2 protocols are rejected with a compatibility error"
	uv run python -m pytest tests/test_ot2_compatibility.py -v --tb=line

.PHONY: snapshot-validation
snapshot-validation: snapshot-audit-test ot2-compatibility-test

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
	@echo "Preparation complete.________________________________"
	@echo "Look above to see if you need to update the snapshot tests."
	@echo "Running format to get protocols in the correct format"
	make format

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

# CLI analysis targets
OUTPUT_DIR ?= analysis_results
PROTOCOLS_DIR ?= files/protocols
LABWARE_DIR ?= files/labware
TEMP_SINGLE_DIR ?= temp_single_protocol
TEMP_SAMPLE_DIR ?= temp_sample_protocols
CLI_MODULE ?= automation.protocol_analysis_cli

SINGLE_OUTPUT_SUBDIR ?= single
SAMPLE_OUTPUT_SUBDIR ?= sample
SAMPLE_PATTERN ?= *Simple*
SAMPLE_LIMIT ?= 5

.PHONY: cli-dry-run
cli-dry-run: cli-clean
	@echo "Running Protocol Analysis CLI in dry-run mode"
	@echo "Protocols directory: $(PROTOCOLS_DIR)"
	@echo "Output directory: $(OUTPUT_DIR)"
	uv run python -m $(CLI_MODULE) \
		--protocols-dir $(PROTOCOLS_DIR) \
		--output-dir $(OUTPUT_DIR) \
		--labware-dir $(LABWARE_DIR) \
		--dry-run

.PHONY: cli-analyze-single
cli-analyze-single: cli-clean
ifndef PROTOCOL
	@echo "Error: PROTOCOL variable must be set"
	@echo "Usage: make cli-analyze-single PROTOCOL=$(PROTOCOLS_DIR)/your_protocol.py"
	@exit 1
endif
	@echo "Running Protocol Analysis CLI on single protocol: $(PROTOCOL)"
	@mkdir -p $(TEMP_SINGLE_DIR)
	@cp $(PROTOCOL) $(TEMP_SINGLE_DIR)/
	uv run python -m $(CLI_MODULE) \
		--protocols-dir $(TEMP_SINGLE_DIR) \
		--output-dir $(OUTPUT_DIR)/$(SINGLE_OUTPUT_SUBDIR) \
		--labware-dir $(LABWARE_DIR) \
		--verbose
	@rm -rf $(TEMP_SINGLE_DIR)

.PHONY: cli-analyze-sample
cli-analyze-sample: cli-clean
	@echo "Running Protocol Analysis CLI on a small sample of protocols"
	@mkdir -p $(TEMP_SAMPLE_DIR)
	@find $(PROTOCOLS_DIR) -name "$(SAMPLE_PATTERN)" -type f \( -name "*.py" -o -name "*.json" \) | head -$(SAMPLE_LIMIT) | xargs -I {} cp {} $(TEMP_SAMPLE_DIR)/
	@echo "Found $$(ls $(TEMP_SAMPLE_DIR)/ | wc -l) sample protocols"
	uv run python -m $(CLI_MODULE) \
		--protocols-dir $(TEMP_SAMPLE_DIR) \
		--output-dir $(OUTPUT_DIR)/$(SAMPLE_OUTPUT_SUBDIR) \
		--labware-dir $(LABWARE_DIR) \
		--verbose
	@rm -rf $(TEMP_SAMPLE_DIR)

.PHONY: cli-clean
cli-clean:
	@echo "Cleaning CLI analysis results"
	@if [ -d "$(OUTPUT_DIR)" ]; then \
		find $(OUTPUT_DIR) -name "*.json" -delete; \
		find $(OUTPUT_DIR) -type d -empty -not -path $(OUTPUT_DIR) -delete; \
		echo "Cleaned analysis JSON files from $(OUTPUT_DIR) (keeping .keep-me files)"; \
	else \
		echo "No $(OUTPUT_DIR) directory found"; \
	fi
	@rm -rf $(TEMP_SAMPLE_DIR) $(TEMP_SINGLE_DIR)
	@echo "Cleaned temporary directories"

# Interactive CLI target
.PHONY: cli-interactive
cli-interactive: cli-clean
	@echo "Starting interactive protocol analysis CLI..."
	uv run python -m $(CLI_MODULE) --interactive
