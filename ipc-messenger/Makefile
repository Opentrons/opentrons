# makefile for ipc-messenger

include ../scripts/push.mk
include ../scripts/python.mk

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

PATH := $(shell cd .. && yarn bin):$(PATH)
SHX := npx shx

# add yarn CLI dev deps to PATH (for cross platform POSIX commands via shx)
PATH := $(shell cd .. && yarn bin):$(PATH)

ot_project := $(OPENTRONS_PROJECT)
project_rs_default = $(if $(ot_project),$(ot_project),robot-stack)
project_ot3_default = $(if $(ot_project),$(ot_project),ot3)

# Find the version of the wheel from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
wheel_file = dist/$(call python_get_wheelname,ipc-messenger,$(project_rs_default),ipc_messenger,$(BUILD_NUMBER))

# Find the version of the sdist from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the sdist.
sdist_file = $(call python_get_sdistname,ipc-messenger,$(project_ot3_default),ipc_messenger)

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/ipc_messenger/abcd.py would run only the
# specified test
tests ?= tests
test_opts ?=

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,ipc-messenger,$(project_ot3_default),ipc_messenger)

# Host key location for robot
ssh_key ?= $(default_ssh_key)
# Other SSH args for robot
ssh_opts ?= $(default_ssh_opts)

# Source discovery
# For the python sources
ot_py_sources := $(filter %.py,$(shell $(SHX) find $(SRC_PATH)))
ot_sources := $(ot_py_sources)

.PHONY: all
all: clean sdist wheel

.PHONY: setup
setup:
	$(pipenv) sync $(pipenv_opts)
	$(pipenv) run pip freeze

.PHONY: clean
clean:
	$(SHX) rm -rf \
		build \
		dist \
		.coverage \
		coverage.xml \
		'*.egg-info' \
		'**/__pycache__' \
		'**/*.pyc'

.PHONY: teardown
teardown:
	$(pipenv) --rm

.PHONY: test
test:
	$(python) -m pytest $(test_opts) $(tests)

.PHONY: lint
lint:
	$(python) -m mypy ipc_messenger tests
	$(python) -m black --check ./ipc_messenger ./tests
	$(python) -m flake8 ipc_messenger tests

.PHONY: format
format:
	$(python) -m black ipc_messenger tests

.PHONY: wheel
wheel: export OPENTRONS_PROJECT=$(project_rs_default)
wheel: setup.py $(ot_sources)
	$(clean_wheel_cmd)
	$(python) setup.py $(wheel_opts) bdist_wheel
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: sdist
sdist: export OPENTRONS_PROJECT=$(project_ot3_default)
sdist: clean
	$(python) setup.py sdist
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: push
push: wheel
	$(call push-python-package,$(host),$(ssh_key),$(ssh_opts),$(wheel_file))

.PHONY: push-ot3
push-ot3: sdist
	$(call push-python-sdist,$(host),$(ssh_key),$(ssh_opts),dist/$(sdist_file),/opt/opentrons-robot-server,ipc_messenger,,,$(version_file))
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),opentrons-robot-server)
