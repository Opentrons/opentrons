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

py_sources = $(filter %.py,$(shell $(SHX) find opentrons_shared_data))
json_sources = $(filter %.json,$(shell $(SHX) find ..))

twine_auth_args := --username $(pypi_username) --password $(pypi_password)
twine_repository_url ?= $(pypi_test_upload_url)

.PHONY: setup-py
setup-py:
	$(pipenv_envvars) pipenv sync $(pipenv_opts)
	$(pipenv_envvars) pipenv run pip freeze


.PHONY: clean
clean:
	shx rm -rf $(BUILD_DIR)


.PHONY: wheel
wheel: $(wheel_file)


$(BUILD_DIR)/opentrons_shared_data-%-py2.py3-none-any.whl: setup.py $(py_sources)
	$(SHX) mkdir -p build
	$(python) setup.py $(wheel_opts) bdist_wheel
	$(SHX) rm -rf build *.egg_info
	$(SHX) ls $(BUILD_DIR)


.PHONY: lint
lint: $(py_sources)
	$(python) -m mypy opentrons_shared_data
	$(python) -m pylama opentrons_shared_data

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
