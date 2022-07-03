files_to_check = ./*.py src tests

.PHONY: black
black:
	pipenv run python -m black $(files_to_check)

.PHONY: black-check
black-check:
	pipenv run python -m black $(files_to_check) --check

.PHONY: flake8
flake8:
	pipenv run python -m flake8 $(files_to_check)

# What mypy ignores is managed in pyproject.toml
.PHONY: mypy
mypy:
	pipenv run python -m mypy ./

.PHONY: isort
isort:
	pipenv run python -m isort $(files_to_check)

.PHONY: isort-check
isort-check:
	pipenv run python -m isort $(files_to_check) --check-only


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

.PHONY: test
test:
	pipenv run python -m pytest

.PHONY: setup
setup:
	pipenv install

.PHONY: teardown
teardown:
	pipenv --rm
