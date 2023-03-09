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
	$(MAKE) lint-other
	$(MAKE) check-protocols

.PHONY: format
format:
	$(MAKE) black
	$(MAKE) ruff
	$(MAKE) format-other

.PHONY: test-ci
test-ci:
	pipenv run python -m pytest -m "emulated_alpha"

.PHONY: setup
setup:
	pipenv install

.PHONY: teardown
teardown:
	pipenv --rm

.PHONY: print-protocols
print-protocols:
	pipenv run python print_protocols.py

.PHONY: check-protocols
check-protocols:
	pipenv run python print_protocols.py --check

FORMAT_FILE_GLOB = "app-testing/**/*.@(json|md|yml|yaml)"

.PHONY: format-other
format-other:
	yarn prettier --ignore-path .eslintignore --write $(FORMAT_FILE_GLOB)

.PHONY: lint-other
lint-other:
	yarn prettier --check --ignore-path .eslintignore $(FORMAT_FILE_GLOB)

