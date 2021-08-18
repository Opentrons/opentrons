.PHONY: pylint
pylint:
	pipenv run python -m pylint conftest.py src/ tests/

.PHONY: black
black:
	pipenv run python -m black conftest.py src/ tests/

.PHONY: flake8
flake8:
	pipenv run python -m flake8 conftest.py src/ tests/

.PHONY: flint
flint:
	$(MAKE) black
	$(MAKE) pylint
	$(MAKE) flake8

.PHONY: test
test:
	pipenv run python -m pytest

.PHONY: setup
setup:
	pipenv install

.PHONY: teardown
teardown:
	pipenv -rm
