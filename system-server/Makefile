# makefile for system_server for opentrons robots

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
wheel_file = dist/$(call python_get_wheelname,system-server,$(project_rs_default),system_server,$(BUILD_NUMBER))

# Find the version of the sdist from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the sdist.
sdist_file = $(call python_get_sdistname,system-server,$(project_ot3_default),system_server)

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,system-server,$(project_ot3_default),system_server)

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/system_server/abcd.py would run only the
# specified test
tests ?= tests
test_opts ?=
# Host key location for buildroot robot
br_ssh_key ?= $(default_ssh_key)
# Other SSH args for buildroot robots
br_ssh_opts ?= $(default_ssh_opts)

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
	$(python) -m mypy system_server tests
	$(python) -m black --check ./system_server ./tests
	$(python) -m flake8 system_server tests

.PHONY: format
format:
	$(python) -m black system_server tests

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
	$(call push-python-package,$(host),$(br_ssh_key),$(ssh_opts),$(wheel_file))
	$(call push-systemd-unit,$(host),$(br_ssh_key),$(ssh_opts),./opentrons-system-server.service)
	$(call restart-service,$(host),$(br_ssh_key),$(ssh_opts),opentrons-system-server)

.PHONY: push-ot3
push-ot3: sdist
	$(call push-python-sdist,$(host),,$(br_ssh_opts),dist/$(sdist_file),/opt/opentrons-system-server,system_server,,,$(version_file))
	$(call restart-service,$(host),,$(br_ssh_opts),opentrons-system-server)

.PHONY: dev
dev: export OT_SYSTEM_SERVER_DOT_ENV_PATH ?= dev.env
dev:
	$(pipenv) run python -m system_server --reload --log-level=debug

.PHONY: docs
docs: settings_schema.json

settings_schema.json: system_server/settings/settings.py
	$(python) -m scripts.settings_schema $@
