.PHONY: black
black:
	pipenv run python -m black .

.PHONY: black-check
black-check:
	pipenv run python -m black . --check

.PHONY: flake8
flake8:
	pipenv run python -m flake8

.PHONY: mypy
mypy:
	pipenv run python -m mypy conftest.py automation tests

.PHONY: isort
isort:
	pipenv run python -m isort .

.PHONY: isort-check
isort-check:
	pipenv run python -m isort . --check-only

.PHONY: lint
lint:
	$(MAKE) black
	$(MAKE) isort
	$(MAKE) flake8
	$(MAKE) mypy

.PHONY: format
format:
	$(MAKE) black
	$(MAKE) isort

.PHONY: test-ci
test-ci:
	pipenv run python -m pytest -m "emulated_alpha"

.PHONY: setup
setup:
	pipenv install

.PHONY: teardown
teardown:
	pipenv --rm

.PHONY: format-readme
format-readme:
	yarn prettier --write README.md
