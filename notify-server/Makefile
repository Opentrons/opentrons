# opentrons notify server makefile

include ../scripts/push.mk
include ../scripts/python.mk

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add yarn CLI dev deps to PATH (for cross platform POSIX commands via shx)
# and also make an explicit version for shx for use in the shell function,
# where PATH won’t be propagated
PATH := $(shell cd .. && yarn bin):$(PATH)
SHX := npx shx

# Path of source package
SRC_PATH = notify_server

ot_project := $(OPENTRONS_PROJECT)
project_rs_default = $(if $(ot_project),$(ot_project),robot-stack)
project_ot3_default = $(if $(ot_project),$(ot_project),ot3)


# Find the version of the wheel from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
wheel_file = dist/$(call python_get_wheelname,notify-server,$(project_rs_default),notify_server,$(BUILD_NUMBER))

# Find the version of the sdist from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the sdist.
sdist_file = dist/$(call python_get_sdistname,notify-server,$(project_ot3_default),notify_server)

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,notify-server,$(project_ot3_default),notify_server)

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/opentrons/tools/test_qc_scripts.py would run only the
# specified test
tests ?= tests
cov_opts ?= --cov=$(SRC_PATH) --cov-report term-missing:skip-covered --cov-report xml:coverage.xml
test_opts ?=

# Host key location for buildroot robot
br_ssh_key ?= $(default_ssh_key)
# Pubkey location for buildroot robot to install with install-key
br_ssh_pubkey ?= $(br_ssh_key).pub
# Other SSH args for buildroot robots
ssh_opts ?= $(default_ssh_opts)

# Source discovery
# For the python sources
ot_py_sources := $(filter %.py,$(shell $(SHX) find $(SRC_PATH)))
ot_sources := $(ot_py_sources)

# Defined separately than the clean target so the wheel file doesn’t have to
# depend on a PHONY target
clean_cmd = $(SHX) rm -rf build dist .coverage coverage.xml '*.egg-info' '**/__pycache__' '**/*.pyc' 'notify_server/**/.mypy_cache'

.PHONY: all
all: clean wheel

.PHONY: setup
setup:
	$(pipenv) sync $(pipenv_opts)
	$(pipenv) run pip freeze

.PHONY: setup-ot2
setup-ot2:
	$(pipenv) sync $(pipenv_opts)
	$(pipenv) run pip uninstall -y opentrons_hardware
	$(pipenv) run pip freeze

.PHONY: clean
clean:
	$(clean_cmd)

.PHONY: teardown
teardown:
	$(pipenv) --rm

$(wheel_file): export OPENTRONS_PROJECT=$(project_rs_default)
$(wheel_file): setup.py $(ot_sources)
	$(clean_cmd)
	$(python) setup.py $(wheel_opts) bdist_wheel --universal
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: wheel
wheel: $(wheel_file)

$(sdist_file): export OPENTRONS_PROJECT=$(project_ot3_default)
$(sdist_file): setup.py $(ot_sources)
	$(clean_cmd)
	$(python) setup.py sdist
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: sdist
sdist: $(sdist_file)

.PHONY: test
test:
	$(pytest) $(tests) $(test_opts)

.PHONY: test-cov
test-cov:
	$(pytest) $(tests) $(test_opts) $(cov_opts)

.PHONY: lint
lint: $(ot_py_sources)
	$(python) -m mypy $(SRC_PATH) $(tests)
	$(python) -m black --check notify_server tests setup.py
	$(python) -m flake8 $(SRC_PATH) $(tests)

.PHONY: format
format:
	$(python) -m black notify_server tests setup.py

.PHONY: dev
dev: export OT_NOTIFY_SERVER_PRODUCTION := 0
dev:
	$(python) -m notify_server.main

.PHONY: local-shell
local-shell:
	$(python) shell

.PHONY: push
push: wheel
	$(call push-python-package,$(host),$(br_ssh_key),$(ssh_opts),$(wheel_file))
	$(call push-systemd-unit,$(host),$(br_ssh_key),$(ssh_opts),./opentrons-notify-server.service)
	$(call restart-service,$(host),$(br_ssh_key),$(ssh_opts),opentrons-notify-server)


.PHONY: push-no-restart-ot3
push-no-restart-ot3: sdist
	$(call push-python-sdist,$(host),,$(ssh_opts),$(sdist_file),"/opt/opentrons-robot-server","notify_server",,,$(version_file))


.PHONY: push-ot3
push-ot3: push-no-restart-ot3
	$(call restart-server,$(host),,$(ssh_opts),"opentrons-robot-server")


.PHONY: install-key
install-key:
	curl -X POST $(host):31950/server/ssh_keys\
		-H "Content-Type: application/json"\
		-d "{\"key\":\"$(shell cat $(br_ssh_pubkey))\"}"

# User must currently specify host, e.g.: `make term host=169.254.202.176`
.PHONY: term
term:
	ssh -i $(br_ssh_key) $(ssh_opts) root@$(host)
