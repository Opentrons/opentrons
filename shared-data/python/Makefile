# shared-data/python makefile

include ../../scripts/python.mk
include ../../scripts/push.mk

# Host key location for robot
ssh_key ?= $(default_ssh_key)
# Other SSH args for robot
ssh_opts ?= $(default_ssh_opts)

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd ../.. && pnpm bin):$(PATH)

# This may be set as an environment variable (and is by CI tasks that upload
# to test pypi) to add a .dev extension to the python package versions. If
# empty, no .dev extension is appended, so this definition is here only as
# documentation
BUILD_NUMBER ?=

ot_project := $(OPENTRONS_PROJECT)
project_rs_default = $(if $(ot_project),$(ot_project),robot-stack)
project_ot3_default = $(if $(ot_project),$(ot_project),ot3)

# this may be set as an environment variable to select the version of
# python to run if pyenv is not available. it should always be set to
# point to a python3.6.
OT_PYTHON ?= python

BUILD_DIR := dist


wheel_file = $(BUILD_DIR)/$(call python_get_wheelname,shared-data,$(project_rs_default),opentrons_shared_data,$(BUILD_NUMBER),../../scripts/python_build_utils.py)
sdist_file = $(BUILD_DIR)/$(call python_get_sdistname,shared-data,$(project_ot3_default),opentrons_shared_data,,../../scripts/python_build_utils.py)

py_sources = $(filter %.py,$(shell $(SHX) find opentrons_shared_data)) opentrons_shared_data/py.typed
deck_sources = $(wildcard ../deck/definitions/*/*.json) $(wildcard ../deck/schemas/*.json)
labware_sources = $(wildcard ../labware/definitions/*/*.json) $(wildcard ../labware/schemas/*.json)
module_sources = $(wildcard ../module/definitions/*.json) $(wildcard ../module/definitions/*/*.json) $(wildcard ../module/schemas/*.json)
pipette_sources = $(wildcard ../pipette/definitions/*.json) $(wildcard ../pipette/schemas/*.json)
protocol_sources = $(wildcard ../protocol/schemas/*.json)
gripper_sources = $(wildcard ../gripper/definitions/*.json) $(wildcard ../gripper/schemas/*.json)

json_sources = $(deck_sources) $(labware_sources) $(module_sources) $(pipette_sources) $(protocol_sources) $(gripper_sources)

tests ?= tests

twine_auth_args := --username $(pypi_username) --password $(pypi_password)
twine_repository_url ?= $(pypi_test_upload_url)

clean_cmd = $(SHX) rm -rf build $(BUILD_DIR) .coverage coverage.xml '*.egg-info' ' **/__pycache__' '**/*.pyc' 'opentrons_shared_data/**/.mypy_cache'

.PHONY: all
all: clean sdist wheel

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
wheel: export OPENTRONS_PROJECT=$(project_rs_default)
wheel: setup.py $(py_sources) $(json_sources)
	$(SHX) mkdir -p build
	$(python) setup.py $(wheel_opts) bdist_wheel
	$(SHX) ls $(BUILD_DIR)


.PHONY: sdist
sdist: export OPENTRONS_PROJECT=$(project_ot3_default)
sdist: setup.py $(py_sources) $(json_sources)
	$(SHX) mkdir -p build
	$(python) setup.py sdist
	$(SHX) ls $(BUILD_DIR)


.PHONY: lint
lint: $(py_sources)
	$(python) -m mypy opentrons_shared_data tests
	$(python) -m black --check opentrons_shared_data tests setup.py
	$(python) -m flake8 opentrons_shared_data tests setup.py

.PHONY: format
format:
	$(python) -m black opentrons_shared_data tests setup.py

.PHONY: push-no-restart
push-no-restart: wheel
	$(call push-python-package,$(host),$(ssh_key),$(ssh_opts),$(wheel_file))

.PHONY: push
push: push-no-restart
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),opentrons-robot-server)

.PHONY: push-no-restart-ot3
push-no-restart-ot3: sdist
	$(call push-python-sdist,$(host),$(ssh_key),$(ssh_opts),$(sdist_file),/opt/opentrons-robot-server,opentrons_shared_data)

.PHONY: push-ot3
push-ot3: push-no-restart-ot3
	$(call restart-server,$(host),$(ssh_key),$(ssh_opts),opentrons-robot-server)

.PHONY: deploy
deploy: wheel
	$(call python_upload_package,$(twine_auth_args),$(twine_repository_url),$(wheel_file))

.PHONY: test
test:
	$(python) -m pytest --cov=opentrons_shared_data --cov-report xml:coverage.xml $(tests) $(test_opts)


.PHONY: generate-schema
generate-schema:
	$(python) -c "from opentrons_shared_data.$(target) import generate_schema; print(generate_schema())" > ../${target}/schemas/${version}.json

%-schema:
	$(MAKE) generate-schema target=$*
