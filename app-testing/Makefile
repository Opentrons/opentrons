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
	python -m pipenv run python -m mypy conftest.py automation tests ci-tools

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
