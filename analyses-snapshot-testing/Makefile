.PHONY: black
black:
	python -m pipenv run python -m black .

.PHONY: black-check
black-check:
	python -m pipenv run python -m black . --check

.PHONY: ruff
ruff:
	python -m pipenv run python -m ruff check . --fix

.PHONY: ruff-check
ruff-check:
	python -m pipenv run python -m ruff check .

.PHONY: mypy
mypy:
	python -m pipenv run python -m mypy automation tests citools

.PHONY: lint
lint: black-check ruff-check mypy

.PHONY: format
format: 
	@echo runnning black
	$(MAKE) black
	@echo running ruff
	$(MAKE) ruff
	@echo formatting the readme with yarn prettier
	$(MAKE) format-readme

.PHONY: test-ci
test-ci:
	python -m pipenv run python -m pytest -m "emulated_alpha"

.PHONY: test-protocol-analysis
test-protocol-analysis:
	pipenv run python -m pytest -v tests/protocol_analyze_test.py

.PHONY: setup
setup: install-pipenv
	python -m pipenv install

.PHONY: teardown
teardown:
	python -m pipenv --rm

.PHONY: format-readme
format-readme:
	yarn prettier --ignore-path .eslintignore --write analyses-snapshot-testing/**/*.md

.PHONY: install-pipenv
install-pipenv:
	python -m pip install -U pipenv

ANALYSIS_REF ?= edge
PROTOCOL_NAMES ?= all
OVERRIDE_PROTOCOL_NAMES ?= all

export ANALYSIS_REF
export PROTOCOL_NAMES
export OVERRIDE_PROTOCOL_NAMES

.PHONY: snapshot-test
snapshot-test:
	@echo "ANALYSIS_REF is $(ANALYSIS_REF)"
	@echo "PROTOCOL_NAMES is $(PROTOCOL_NAMES)"
	@echo "OVERRIDE_PROTOCOL_NAMES is $(OVERRIDE_PROTOCOL_NAMES)"
	python -m pipenv run pytest -k analyses_snapshot_test -vv

.PHONY: snapshot-test-update
snapshot-test-update:
	@echo "ANALYSIS_REF is $(ANALYSIS_REF)"
	@echo "PROTOCOL_NAMES is $(PROTOCOL_NAMES)"
	@echo "OVERRIDE_PROTOCOL_NAMES is $(OVERRIDE_PROTOCOL_NAMES)"
	python -m pipenv run pytest -k analyses_snapshot_test --snapshot-update

CACHEBUST := $(shell date +%s)

.PHONY: build-opentrons-analysis
build-opentrons-analysis:
	@echo "Building docker image for $(ANALYSIS_REF)"
	@echo "The image will be named opentrons-analysis:$(ANALYSIS_REF)"
	@echo "If you want to build a different version, run 'make build-opentrons-analysis ANALYSIS_REF=<version>'"
	@echo "Cache is always busted to ensure latest version of the code is used"
	docker build --build-arg ANALYSIS_REF=$(ANALYSIS_REF) --build-arg CACHEBUST=$(CACHEBUST) -t opentrons-analysis:$(ANALYSIS_REF) citools/.

.PHONY: generate-protocols
generate-protocols:
	python -m pipenv run python -m automation.data.protocol_registry


OPENTRONS_VERSION ?= edge
export OPENTRONS_VERSION

.PHONY: build-rs
build-rs:
	@echo "Building docker image for opentrons-robot-server:$(OPENTRONS_VERSION)"
	@echo "Cache is always busted to ensure latest version of the code is used"
	@echo "If you want to build a different version, run 'make build-rs OPENTRONS_VERSION=chore_release-8.0.0'"
	docker build --build-arg OPENTRONS_VERSION=$(OPENTRONS_VERSION) --build-arg CACHEBUST=$(CACHEBUST) -t opentrons-robot-server:$(OPENTRONS_VERSION) -f citools/Dockerfile.server .

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
