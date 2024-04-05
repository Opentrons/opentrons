.PHONY: lint
lint:
	pipenv run python -m black --check .
	pipenv run python -m flake8 .
	pipenv run python -m mypy .

.PHONY: format
format:
	pipenv run python -m black .

.PHONY: setup
setup:
	pipenv sync --dev

.PHONY: teardown
teardown:
	pipenv --rm