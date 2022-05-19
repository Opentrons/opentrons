# makefile

include ../../scripts/push.mk
include ../../scripts/python.mk

SHX := npx shx

# Find the version of the sdist from package.json using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the sdist.
sdist_file = dist/ot3-gravimetric-test-0.0.1-py2.py3-none-any.whl


# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/opentrons/tools/test_pipette_memory.py would run only the
# specified test
tests ?= tests
cov_opts ?= --cov=opentrons_hardware --cov-report term-missing:skip-covered --cov-report xml:coverage.xml
test_opts ?=

# Host key location for buildroot robot
br_ssh_key ?= $(default_ssh_key)
# Other SSH args for buildroot robots
ssh_opts ?= $(default_ssh_opts)

# Source discovery
# For the python sources
ot_py_sources := $(filter %.py,$(shell $(SHX) find gravimetric_test/))
ot_sources := $(ot_py_sources)

# Defined separately than the clean target so the wheel file doesn’t have to
# depend on a PHONY target
clean_cmd = $(SHX) rm -rf build dist .coverage coverage.xml '*.egg-info' '**/__pycache__' '**/*.pyc' '**/.mypy_cache'

.PHONY: all
all: clean wheel

.PHONY: setup
setup:
	$(pipenv) sync $(pipenv_opts)
	$(pipenv) run pip freeze

.PHONY: teardown
teardown:
	$(pipenv) --rm

.PHONY: clean
clean:
	$(clean_cmd)

$(sdist_file): setup.py $(ot_sources)
	$(python) setup.py sdist
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: sdist
sdist: $(sdist_file)

.PHONY: test
test:
	$(pytest) -m $(tests) $(test_opts)

.PHONY: test-cov
test-cov:
	$(pytest) -m $(tests) $(test_opts) $(cov_opts)

.PHONY: lint
lint:
	$(python) -m mypy gravimetric_test tests protocols
	$(python) -m black --check gravimetric_test tests protocols setup.py
	$(python) -m flake8 gravimetric_test tests protocols setup.py

.PHONY: format
format:
	$(python) -m black gravimetric_test tests protocols


.PHONY: push-no-restart
push-no-restart: sdist Pipfile.lock
	$(call push-python-sdist,$(host),,$(ssh_opts),$(sdist_file),/opt/opentrons-robot-server,"opentrons_hardware")

.PHONY: push
push-ot3: push-no-restart
	$(call restart-server,$(host),,$(ssh_opts),"opentrons-robot-server")
