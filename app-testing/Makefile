.PHONY: black
black:
	pipenv run python -m black locators.py conftest.py src/ tests/

.PHONY: flake8
flake8:
	pipenv run python -m flake8 locators.py conftest.py src/ tests/

.PHONY: mypy
mypy:
	pipenv run python -m mypy locators.py conftest.py src/ tests/

.PHONY: check
check:
	$(MAKE) black
	$(MAKE) mypy
	$(MAKE) flake8

.PHONY: test
test:
	pipenv run python -m pytest

.PHONY: setup
setup:
	pipenv install

.PHONY: teardown
teardown:
	pipenv --rm
