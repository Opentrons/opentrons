# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
include ../scripts/push.mk
include ../scripts/python.mk

SHELL := bash

PATH := $(shell cd .. && yarn bin):$(PATH)
SHX := npx shx

# add yarn CLI dev deps to PATH (for cross platform POSIX commands via shx)
PATH := $(shell cd .. && yarn bin):$(PATH)


port ?= 34000
tests ?= tests
test_opts ?=
wheel_file = $(call python_get_wheelname,update-server,otupdate)
# Host key location for buildroot robot
br_ssh_key ?= $(default_ssh_key)
# Other SSH args for buildroot robots
br_ssh_opts ?= $(default_ssh_opts)


.PHONY: install
install:
	$(pipenv_envvars) pipenv sync $(pipenv_opts)

.PHONY: dev
dev: export ENABLE_VIRTUAL_SMOOTHIE := true
dev:
	$(python) -m otupdate --debug --port $(port)

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

.PHONY: test
test:
	$(python) -m pytest $(test_opts) $(tests)

.PHONY: lint
lint:
	$(python) -m pylama otupdate tests
	$(python) -m mypy otupdate

.PHONY: wheel
wheel: clean
	$(python) setup.py bdist_wheel
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
