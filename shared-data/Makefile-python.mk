# shared-data python code makefile

include ../scripts/python-uv.mk
include ../scripts/push.mk

# Host key location for robot
ssh_key ?= $(default_ssh_key)
# Other SSH args for robot
ssh_opts ?= $(default_ssh_opts)

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd ../ && pnpm bin):$(PATH)

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


wheel_file = $(BUILD_DIR)/$(call python_get_wheelname,shared-data,$(PROJECT),opentrons_shared_data,$(BUILD_NUMBER),../scripts/python_build_utils.py)
sdist_file = $(BUILD_DIR)/$(call python_get_sdistname,shared-data,$(PROJECT),opentrons_shared_data,,../scripts/python_build_utils.py)

py_sources = $(filter %.py,$(shell $(SHX) find python/opentrons_shared_data)) python/opentrons_shared_data/py.typed
deck_sources = $(wildcard deck/definitions/*/*.json) $(wildcard deck/schemas/*.json)
labware_sources = $(wildcard labware/definitions/*/*.json) $(wildcard labware/schemas/*.json)
module_sources = $(wildcard module/definitions/*.json) $(wildcard module/definitions/*/*.json) $(wildcard module/schemas/*.json)
pipette_sources = $(wildcard pipette/definitions/*.json) $(wildcard pipette/schemas/*.json)
protocol_sources = $(wildcard protocol/schemas/*.json)
gripper_sources = $(wildcard gripper/definitions/*.json) $(wildcard gripper/schemas/*.json)

json_sources = $(deck_sources) $(labware_sources) $(module_sources) $(pipette_sources) $(protocol_sources) $(gripper_sources)

files_to_check := python/opentrons_shared_data python_tests tools

tests ?= python_tests

twine_auth_args := --username $(pypi_username) --password $(pypi_password)
twine_repository_url ?= $(pypi_test_upload_url)

clean_cmd = $(SHX) rm -rf build $(BUILD_DIR) .coverage coverage.xml '*.egg-info'
clean_cache_cmd	 = $(SHX) rm -rf '**/__pycache__' '**/*.pyc' '**/.mypy_cache'

.PHONY: all
all: clean sdist wheel



.PHONY: setup
setup: setup-py

.PHONY: setup-py
setup-py:
	@$(uv_sync_dev)
	@$(UV) pip list

.PHONY: lock-py
lock-py:
	@$(UV) lock

.PHONY: teardown
teardown: teardown-py

.PHONY: teardown-py
teardown-py:
	$(SHX) rm -rf .venv


.PHONY: clean
clean:
	$(clean_cmd)
	$(clean_cache_cmd)

.PHONY: wheel
wheel: export OPENTRONS_PROJECT=$(PROJECT)
wheel: export HATCH_VCS_TUNABLE_TAG_PATTERN=$(call git_tag_regex_for_project,$(PROJECT))
wheel: export HATCH_VCS_TUNABLE_RAW_OPTIONS=$(call hatch_raw_options_for_project,$(PROJECT))
wheel: $(py_sources) $(json_sources)
	$(python) -m build --wheel $(build_wheel_opts) .
	$(SHX) ls $(BUILD_DIR)


.PHONY: sdist
sdist: export OPENTRONS_PROJECT=$(PROJECT)
sdist: export HATCH_VCS_TUNABLE_TAG_PATTERN=$(call git_tag_regex_for_project,$(PROJECT))
sdist: export HATCH_VCS_TUNABLE_RAW_OPTIONS=$(call hatch_raw_options_for_project,$(PROJECT))
sdist: $(py_sources) $(json_sources)
	$(python) -m build --sdist .
	$(SHX) ls $(BUILD_DIR)


.PHONY: lint
lint: $(py_sources)
	$(python) -m mypy $(files_to_check)
	$(ruff) check $(files_to_check)
	$(ruff) format --check $(files_to_check)

.PHONY: format
format:
	$(ruff) format $(files_to_check)
	$(ruff) check --select I --fix $(files_to_check)

.PHONY: push-no-restart
push-no-restart: wheel
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/usr/lib/python3.10/site-packages/)

.PHONY: push
push: push-no-restart
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),opentrons-robot-server)

.PHONY: push-no-restart-ot3
push-no-restart-ot3: wheel
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/opt/opentrons-robot-server/)
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/opt/opentrons-audit-server/)

.PHONY: push-ot3
push-ot3: push-no-restart-ot3
	$(call stop-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-robot-server")
	$(call stop-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-audit-server")
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-pyro-nameserver opentrons-hardware-api")
	$(call start-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-audit-server")
	$(call start-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-robot-server")

.PHONY: deploy
deploy: wheel sdist
	$(call python_upload_package,$(twine_auth_args),$(twine_repository_url),$(wheel_file),$(sdist_file))

.PHONY: test
test:
	$(pytest) --cov=opentrons_shared_data --cov-report xml:coverage.xml $(tests) $(test_opts)


.PHONY: generate-schema
generate-schema:
	$(python) -c "from opentrons_shared_data.$(target) import generate_schema; print(generate_schema())" > ./${target}/schemas/${version}.json

%-schema:
	$(MAKE) generate-schema target=$*
