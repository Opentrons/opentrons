.PHONY: ruff-check
ruff-check:
	pipenv run python -m ruff check . 

.PHONY: mypy
mypy:
	pipenv run python -m mypy --pretty .

.PHONY: ruff-fix
ruff-fix:
	pipenv run python -m ruff check . --fix

.PHONY: format-readme
format-readme:
	pipenv run python -m mdformat README.md

.PHONY: lint
lint:
	$(MAKE) ruff-check
	$(MAKE) mypy

.PHONY: format
format:
	$(MAKE) ruff-fix
	$(MAKE) format-readme

.PHONY: setup
setup:
	pipenv sync --dev

.PHONY: teardown
teardown:
	pipenv --dev --rm