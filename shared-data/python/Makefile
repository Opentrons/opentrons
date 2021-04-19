# shared-data/python makefile

include ../../scripts/python.mk
include ../../scripts/push.mk

# Host key location for buildroot robot
br_ssh_key ?= $(default_ssh_key)
# Other SSH args for buildroot robots
ssh_opts ?= $(default_ssh_opts)

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd ../.. && yarn bin):$(PATH)

# This may be set as an environment variable (and is by CI tasks that upload
# to test pypi) to add a .dev extension to the python package versions. If
# empty, no .dev extension is appended, so this definition is here only as
# documentation
BUILD_NUMBER ?=

# this may be set as an environment variable to select the version of
# python to run if pyenv is not available. it should always be set to
# point to a python3.6.
OT_PYTHON ?= python

BUILD_DIR := dist


wheel_file = $(BUILD_DIR)/$(call python_get_wheelname,shared-data,opentrons_shared_data,$(BUILD_NUMBER),../../scripts/python_build_utils.py)

py_sources = $(filter %.py,$(shell $(SHX) find opentrons_shared_data)) opentrons_shared_data/py.typed
deck_sources = $(wildcard ../deck/definitions/*/*.json) $(wildcard ../deck/schemas/*.json)
labware_sources = $(wildcard ../labware/definitions/*/*.json) $(wildcard ../labware/schemas/*.json)
module_sources = $(wildcard ../module/definitions/*.json) $(wildcard ../module/definitions/*/*.json) $(wildcard ../module/schemas/*.json)
pipette_sources = $(wildcard ../pipette/definitions/*.json) $(wildcard ../pipette/schemas/*.json)
protocol_sources = $(wildcard ../protocol/schemas/*.json)

json_sources = $(deck_sources) $(labware_sources) $(module_sources) $(pipette_sources) $(protocol_sources)



twine_auth_args := --username $(pypi_username) --password $(pypi_password)
twine_repository_url ?= $(pypi_test_upload_url)

clean_cmd = $(SHX) rm -rf build $(BUILD_DIR) .coverage coverage.xml '*.egg-info' ' **/__pycache__' '**/*.pyc' 'opentrons_shared_data/**/.mypy_cache'

.PHONY: setup
setup: setup-py

.PHONY: setup-py
setup-py:
	$(pipenv) sync $(pipenv_opts)
	$(pipenv) run pip freeze

.PHONY: teardown
teardown: teardown-py

.PHONY: teardown-py
teardown-py:
	$(pipenv) --rm


.PHONY: clean
clean:
	$(clean_cmd)


.PHONY: wheel
wheel: $(wheel_file)


$(BUILD_DIR)/opentrons_shared_data-%-py2.py3-none-any.whl: setup.py $(py_sources) $(json_sources)
	$(SHX) mkdir -p build
	$(python) setup.py $(wheel_opts) bdist_wheel
	$(SHX) ls $(BUILD_DIR)


.PHONY: lint
lint: $(py_sources)
	$(python) -m mypy opentrons_shared_data
	$(python) -m flake8 opentrons_shared_data tests setup.py

.PHONY: push-no-restart
push-no-restart: $(wheel_file)
	$(call push-python-package,$(host),$(br_ssh_key),$(ssh_opts),$(wheel_file))

.PHONY: push
push: push-no-restart
	$(call restart-service,$(host),$(br_ssh_key),$(ssh_opts),opentrons-robot-server)

.PHONY: deploy
deploy: wheel
	$(call python_upload_package,$(twine_auth_args),$(twine_repository_url),$(wheel_file))

.PHONY: test
test:
	$(python) -m pytest tests
