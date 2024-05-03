# opentrons ai server makefile
.PHONY: install-pipenv
install-pipenv:
	python -m pip install --user pipenv==2023.12.1

.PHONY: setup
setup: install-pipenv
	python -m pipenv install --dev --python 3.12.3

.PHONY: teardown
teardown:
	python -m pipenv --rm

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
	python -m pipenv run python -m mypy api

.PHONY: format-readme
format-readme:
	yarn prettier --ignore-path .eslintignore --write opentrons-ai-server/**/*.md

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

.PHONY: gen-env
gen-env:
	python -m pipenv run python api/settings.py

.PHONY: unit-test
unit-test:
	python -m pipenv run python -m pytest tests -m unit