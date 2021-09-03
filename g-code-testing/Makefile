# opentrons g-code-testing makefile

include ../scripts/python.mk
include ./g_code_parsing.mk

SHX := npx shx

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/opentrons/tools/test_pipette_memory.py would run only the
# specified test
tests ?= tests
test_opts ?=  --cov=g_code_parsing --cov-report term-missing:skip-covered --cov-report xml:coverage.xml

# test modules to typecheck
# TODO(mc, 2021-07-23): expand this to all tests
tests_to_typecheck := \
	tests/g_code_parsing

# Defined separately than the clean target so the wheel file doesn’t have to
# depend on a PHONY target
clean_cmd = $(SHX) rm -rf build dist .coverage coverage.xml '*.egg-info' '**/__pycache__' '**/*.pyc' '**/.mypy_cache'

.PHONY: setup
setup:
	$(pipenv) sync $(pipenv_opts)
	$(pipenv) run pip freeze

.PHONY: clean
clean:
	$(clean_cmd)

.PHONY: teardown
teardown:
	$(pipenv) --rm

.PHONY: test
test:
	$(pytest) $(tests) $(test_opts)

.PHONY: lint
lint:
	$(python) -m mypy g_code_parsing $(tests_to_typecheck)
	$(python) -m black --check g_code_parsing tests setup.py
	$(python) -m flake8 g_code_parsing tests setup.py

.PHONY: format
format:
	$(python) -m black g_code_parsing tests setup.py