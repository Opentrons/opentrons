include ../scripts/push.mk
include ../scripts/python.mk

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash


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
# Host key location for buildroot robot
br_ssh_key ?= $(default_ssh_key)
# Other SSH args for buildroot robots
br_ssh_opts ?= $(default_ssh_opts)


.PHONY: setup
setup:
	@echo This target is deprecated; run make -C environments setup instead

.PHONY: dev
dev: export ENABLE_VIRTUAL_SMOOTHIE := true
dev:
	$(call python,dev) -m otupdate --log-level debug --port $(port)

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
test: test-ot2 test-ot3

.PHONY: test-ot2
test-ot2:
	$(call pytest,ot-2) $(test_opts) $(tests)

.PHONY: test-ot3
test-ot3:
	$(call pytest,ot-3/update-server) $(test_opts) $(tests)

.PHONY: lint
lint:
	$(call python,dev) -m black --check ./otupdate ./tests
	$(call python,dev) -m flake8 otupdate tests
	$(call python,ot-3/update-server) $(MYPY_OT3) otupdate tests

.PHONY: format
format:
	$(call python,dev) -m black otupdate tests

.PHONY: wheel
wheel: export OPENTRONS_PROJECT=$(project_rs_default)
wheel: clean
	$(call python,ot-2) setup.py bdist_wheel
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: sdist
sdist: export OPENTRONS_PROJECT=$(project_ot3_default)
sdist: clean
	$(call python,ot-3/update-server) setup.py sdist
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
	$(call push-python-sdist,$(host),,$(br_ssh_opts),dist/$(sdist_file),/opt/opentrons-update-server,otupdate)
	$(call restart-service,$(host),,$(br_ssh_opts),opentrons-update-server)
