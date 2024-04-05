include ../scripts/python.mk

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

.PHONY: clean
clean:
	rm -rf build dist *.egg-info .mypy_cache .pytest_cache src/performance_metrics.egg-info

.PHONY: wheel
wheel:
	pipenv run python setup.py $(wheel_opts) bdist_wheel
	rm -rf build