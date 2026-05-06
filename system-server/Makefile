# makefile for system_server for opentrons robots

include ../scripts/push.mk
include ../scripts/python-uv.mk

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

PATH := $(shell cd .. && pnpm bin):$(PATH)
SHX := npx shx

# add pnpm CLI dev deps to PATH (for cross platform POSIX commands via shx)
PATH := $(shell cd .. && pnpm bin):$(PATH)

# Find the version of the wheel from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
wheel_file = dist/$(call python_get_wheelname,system-server,$(project_rs_default),system_server,$(BUILD_NUMBER))

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,system-server,$(project_rs_default),system_server)

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/system_server/abcd.py would run only the
# specified test
tests ?= tests
test_opts ?=

files_to_check := system_server tests

# Host key location for robot
ssh_key ?= $(default_ssh_key)
# Other SSH args for robot
ssh_opts ?= $(default_ssh_opts)



.PHONY: setup
setup:
	@$(uv_sync_dev)
	@$(UV) pip list

.PHONY: setup-py
setup-py: setup

.PHONY: lock
lock:
	$(UV) lock

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
	$(SHX) rm -rf .venv

.PHONY: test
test:
	$(pytest) $(test_opts) $(tests)

.PHONY: lint
lint:
	$(python) -m mypy $(files_to_check)
	$(ruff) check $(files_to_check)
	$(ruff) format --check $(files_to_check)

.PHONY: format
format:
	$(ruff) format $(files_to_check)
	$(ruff) check --select I --fix $(files_to_check)

.PHONY: wheel
wheel: export OPENTRONS_PROJECT=$(PROJECT)
wheel: export HATCH_VCS_TUNABLE_TAG_PATTERN=$(call git_tag_regex_for_project,$(PROJECT))
wheel: export HATCH_VCS_TUNABLE_RAW_OPTIONS=$(call hatch_raw_options_for_project,$(PROJECT))
wheel: clean
	$(python) -m build --wheel .
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: push
push: wheel
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/usr/lib/python3.10/site-packages/)
	$(call push-systemd-unit,$(host),$(ssh_key),$(ssh_opts),./opentrons-system-server.service)
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),opentrons-system-server)

.PHONY: push-ot3
push-ot3: wheel
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/opt/opentrons-system-server,system_server/)
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),opentrons-system-server)

.PHONY: dev
dev: export OT_SYSTEM_SERVER_DOT_ENV_PATH ?= dev.env
dev:
	$(python) -m system_server --reload --log-level=debug

