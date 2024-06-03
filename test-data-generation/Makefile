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
	rm -rf build dist *.egg-info .mypy_cache .pytest_cache src/test_data_generation.egg-info

.PHONY: wheel
wheel:
	$(python) setup.py $(wheel_opts) bdist_wheel
	rm -rf build

.PHONY: debug-test
debug-test:
	$(pytest) ./tests \
	-vvv \
	--tb=long \
	-s \
	--hypothesis-show-statistics \
	--hypothesis-explain \
	--hypothesis-profile=dev

.PHONY: exploratory-test
exploratory-test:
	$(pytest) ./tests \
	--numprocesses=auto \
	-s \
	--hypothesis-show-statistics \
	--hypothesis-explain \
	--hypothesis-profile=exploratory

.PHONY: test
test:
	$(pytest) ./tests \
	--numprocesses=auto \
	-s \
	--hypothesis-show-statistics \
	--hypothesis-explain \
	--hypothesis-profile=ci