# makefile for usb-tcp bridge for OT-3

include ../scripts/push.mk
include ../scripts/python.mk

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

PATH := $(shell cd .. && yarn bin):$(PATH)
SHX := npx shx

# add yarn CLI dev deps to PATH (for cross platform POSIX commands via shx)
PATH := $(shell cd .. && yarn bin):$(PATH)

ot_project := $(OPENTRONS_PROJECT)
project_ot3_default = $(if $(ot_project),$(ot_project),ot3)

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/ot3usb/abcd.py would run only the
# specified test
tests ?= tests
test_opts ?=
sdist_file = $(call python_get_sdistname,usb-bridge,$(project_ot3_default),ot3usb)

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,usb-bridge,$(project_ot3_default),ot3usb)

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
	$(python) -m mypy ot3usb tests
	$(python) -m black --check ./ot3usb ./tests
	$(python) -m flake8 ot3usb tests

.PHONY: format
format:
	$(python) -m black ot3usb tests

.PHONY: sdist
sdist: export OPENTRONS_PROJECT=$(project_ot3_default)
sdist: clean
	$(python) setup.py sdist
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: push-ot3
push-ot3: sdist
	$(call push-python-sdist,$(host),,$(br_ssh_opts),dist/$(sdist_file),/opt/ot3usb,ot3usb,,,$(version_file))
	$(call restart-service,$(host),,$(br_ssh_opts),opentrons-usb-bridge)
