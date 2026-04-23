# makefile for usb-tcp bridge for OT-3

include ../scripts/push.mk
include ../scripts/python-uv.mk

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

PATH := $(shell cd .. && pnpm bin):$(PATH)
SHX := npx shx

# add pnpm CLI dev deps to PATH (for cross platform POSIX commands via shx)
PATH := $(shell cd .. && pnpm bin):$(PATH)

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/ot3usb/abcd.py would run only the
# specified test
tests ?= tests
test_opts ?=

files_to_check := ot3usb tests

wheel_file = $(call python_get_wheelname,usb-bridge,$(project_rs_default),ot3usb)

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,usb-bridge,$(project_rs_default),ot3usb)

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
wheel: export OPENTRONS_PROJECT=$(project_rs_default)
wheel: export HATCH_VCS_TUNABLE_TAG_PATTERN=$(call git_tag_regex_for_project,$(PROJECT))
wheel: export HATCH_VCS_TUNABLE_RAW_OPTIONS=$(call hatch_raw_options_for_project,$(PROJECT))
wheel: clean
	$(python) -m build --wheel .
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: push-ot3
push-ot3: wheel
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),dist/$(wheel_file),/opt/ot3usb/)
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),opentrons-usb-bridge)
