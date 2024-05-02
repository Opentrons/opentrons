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
	python -m pipenv run python -m mypy conftest.py automation tests citools

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
	yarn prettier --ignore-path .eslintignore --write app-testing/**/*.md

.PHONY: install-pipenv
install-pipenv:
	python -m pip install -U pipenv

.PHONY: snapshot-test
snapshot-test:
	python -m pipenv run pytest -k analyses_snapshot_test -vv

.PHONY: snapshot-test-update
snapshot-test-update:
	python -m pipenv run pytest -k analyses_snapshot_test --snapshot-update

TARGET ?= edge
CACHEBUST := $(shell date +%s)

.PHONY: build-opentrons-analysis
build-opentrons-analysis:
	@echo "Building docker image for $(TARGET)"
	@echo "If you want to build a different version, run 'make build-opentrons-analysis TARGET=<version>'"
	@echo "Cache is always busted to ensure latest version of the code is used"
	docker build --build-arg OPENTRONS_VERSION=$(TARGET) --build-arg CACHEBUST=$(CACHEBUST) -t opentrons-analysis:$(TARGET) citools/.

.PHONY: generate-protocols
generate-protocols:
	python -m pipenv run python -m automation.data.protocol_registry
