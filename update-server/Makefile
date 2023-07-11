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

port ?= 34000
tests ?= tests
test_opts ?=
wheel_file = $(call python_get_wheelname,update-server,$(project_rs_default),otupdate)
sdist_file = $(call python_get_sdistname,update-server,$(project_ot3_default),otupdate)
# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,update-server,$(project_ot3_default),update-server)
# Host key location for buildroot robot
br_ssh_key ?= $(default_ssh_key)
# Other SSH args for buildroot robots
br_ssh_opts ?= $(default_ssh_opts)


.PHONY: setup
setup:
	$(pipenv) sync $(pipenv_opts)
	$(pipenv) run pip freeze

.PHONY: dev
dev: export ENABLE_VIRTUAL_SMOOTHIE := true
dev:
	$(python) -m otupdate --log-level debug --port $(port)

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
	$(python) -m mypy otupdate tests
	$(python) -m black --check ./otupdate ./tests
	$(python) -m flake8 otupdate tests

.PHONY: format
format:
	$(python) -m black otupdate tests

.PHONY: wheel
wheel: export OPENTRONS_PROJECT=$(project_rs_default)
wheel: clean
	$(python) setup.py bdist_wheel
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: sdist
sdist: export OPENTRONS_PROJECT=$(project_ot3_default)
sdist: clean
	$(python) setup.py sdist
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

.PHONY: push
push: wheel
	$(call push-python-package,$(host),$(br_ssh_key),$(br_ssh_opts),dist/$(wheel_file))
	$(call push-systemd-unit,$(host),$(br_ssh_key),$(br_ssh_opts),./opentrons-update-server.service)
	$(call restart-service,$(host),$(br_ssh_key),$(br_ssh_opts),opentrons-update-server)


.PHONY: push-ot3
push-ot3: sdist
	$(call push-python-sdist,$(host),,$(br_ssh_opts),dist/$(sdist_file),/opt/opentrons-update-server,"otupdate",,,$(version_file))
	$(call restart-service,$(host),,$(br_ssh_opts),opentrons-update-server)
