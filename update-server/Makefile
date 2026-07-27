include ../scripts/push.mk
include ../scripts/python-uv.mk

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

SHX := npx shx

# add pnpm CLI dev deps to PATH (for cross platform POSIX commands via shx)
PATH := $(shell cd .. && pnpm bin):$(PATH)

port ?= 34000
tests ?= tests
test_opts ?=

files_to_check := otupdate tests

wheel_file = $(call python_get_wheelname,update-server,$(project_rs_default),otupdate)
# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,update-server,$(project_rs_default),update-server)
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

.PHONY: dev-flex
dev-flex:
	$(python) -m otupdate.openembedded --log-level debug --port $(port)

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

.PHONY: bootstrap
bootstrap: wheel
	curl -X POST \
		-H "Content-Type: multipart/form-data" \
		-F "whl=@$(wheel_file)" \
		http://$(host):31950/server/update/bootstrap

.PHONY: restart
restart:
	curl -X POST http://$(host):31950/server/restart

.PHONY: push-ot3
push-ot3: wheel
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),dist/$(wheel_file),/opt/opentrons-update-server/)
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),opentrons-update-server)
