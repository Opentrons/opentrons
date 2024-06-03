include ../scripts/python.mk

.PHONY: lint
lint:
	$(python) -m black --check .
	$(python) -m flake8 .
	$(python) -m mypy .

.PHONY: format
format:
	$(python) -m black .

.PHONY: setup
setup:
	$(pipenv) sync --dev

.PHONY: teardown
teardown:
	$(pipenv) --rm

.PHONY: clean
clean:
	rm -rf build dist *.egg-info .mypy_cache .pytest_cache src/performance_metrics.egg-info

.PHONY: wheel
wheel:
	$(python) setup.py $(wheel_opts) bdist_wheel
	rm -rf build

.PHONY: test
test:
	$(pytest) tests