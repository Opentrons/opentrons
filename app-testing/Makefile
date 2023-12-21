.PHONY: black
black:
	pipenv run python -m black .

.PHONY: black-check
black-check:
	pipenv run python -m black . --check

.PHONY: ruff
ruff:
	pipenv run python -m ruff . --fix

.PHONY: ruff-check
ruff-check:
	pipenv run python -m ruff .

.PHONY: mypy
mypy:
	pipenv run python -m mypy conftest.py automation tests

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
	pipenv run python -m pytest -m "emulated_alpha"

.PHONY: test-protocol-analysis
test-protocol-analysis:
	pipenv run python -m pytest -v tests/protocol_analyze_test.py

.PHONY: setup
setup:
	pipenv install

.PHONY: teardown
teardown:
	pipenv --rm

.PHONY: format-readme
format-readme:
	yarn prettier --ignore-path .eslintignore --write app-testing/**/*.md

.PHONY: print-protocols
print-protocols:
	pipenv run python print_protocols.py
