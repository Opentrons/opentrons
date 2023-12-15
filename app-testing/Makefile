.PHONY: black
black:
	python -m pipenv run python -m black .

.PHONY: black-check
black-check:
	python -m pipenv run python -m black . --check

.PHONY: ruff
ruff:
	python -m pipenv run python -m ruff . --fix --unsafe-fixes

.PHONY: ruff-check
ruff-check:
	python -m pipenv run python -m ruff .

.PHONY: mypy
mypy:
	python -m pipenv run python -m mypy conftest.py automation tests citools

.PHONY: lint
lint:
	$(MAKE) black-check
	$(MAKE) ruff-check
	$(MAKE) mypy

.PHONY: format
format:
	$(MAKE) black
	$(MAKE) ruff
	$(MAKE) format-readme

.PHONY: test-ci
test-ci:
	python -m pipenv run python -m pytest -m "emulated_alpha"

.PHONY: test-protocol-analysis
test-protocol-analysis:
	pipenv run python -m pytest -v tests/protocol_analyze_test.py

.PHONY: setup
setup:
	$(MAKE) install-pipenv
	python -m pipenv install

.PHONY: teardown
teardown:
	python -m pipenv --rm

.PHONY: format-readme
format-readme:
	yarn prettier --ignore-path .eslintignore --write app-testing/**/*.md

.PHONY: print-protocols
print-protocols:
	python -m pipenv run python print_protocols.py

.PHONY: install-pipenv
install-pipenv:
	python -m pip install -U pipenv

.PHONY: snapshot-test
snapshot-test:
	python -m pipenv run pytest -k analyses_snapshot_test -vv

.PHONY: snapshot-test-update
snapshot-test-update:
	python -m pipenv run pytest -k analyses_snapshot_test --snapshot-update

TARGET ?= v7.1.0-alpha.9

.PHONY: build-opentrons-analysis
build-opentrons-analysis:
	@echo "Building docker image for $(TARGET)"
	@echo "If you want to build a different version, run 'make build-docker TARGET=<version>'"
	docker build --build-arg OPENTRONS_VERSION=$(TARGET) -t opentrons-analysis:$(TARGET) citools/.
