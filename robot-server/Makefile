# opentrons robot server makefile

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
SRC_PATH = robot_server

# Find the version of the wheel from package.json using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
wheel_file = dist/$(call python_get_wheelname,robot-server,robotserver,$(BUILD_NUMBER))


# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/opentrons/tools/test_qc_scripts.py would run only the
# specified test
tests ?= tests
test_opts ?=  --cov=$(SRC_PATH) --cov-report term-missing:skip-covered --cov-report xml:coverage.xml

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
clean_cmd = $(SHX) rm -rf build dist .coverage coverage.xml '*.egg-info' '**/__pycache__' '**/*.pyc'

.PHONY: all
all: clean wheel

.PHONY: setup
setup:
	$(pipenv_envvars) pipenv sync $(pipenv_opts)
	$(pipenv_envvars) pipenv run pip freeze

.PHONY: clean
clean:
	$(clean_cmd)

.PHONY: teardown
teardown:
	$(pipenv_envvars)	pipenv --rm

dist/robotserver-%-py2.py3-none-any.whl: setup.py $(ot_sources)
	$(clean_cmd)
	$(python) setup.py $(wheel_opts) bdist_wheel
	$(SHX) rm -rf build
	$(SHX) ls dist

wheel: $(wheel_file)

.PHONY: test
test:
	$(pytest) $(tests) $(test_opts)

.PHONY: lint
lint: $(ot_py_sources)
	$(python) -m mypy $(SRC_PATH)
	$(python) -m pylama $(SRC_PATH) tests

.PHONY: dev
dev: export OT_ROBOT_SERVER_DOT_ENV_PATH := dev.env
dev:
	$(python) -m robot_server.main

.PHONY: local-shell
local-shell:
	$(pipenv_envvars) pipenv shell

.PHONY: push
push: wheel
	$(call push-python-package,$(host),$(br_ssh_key),$(ssh_opts),$(wheel_file))
	$(call push-systemd-unit,$(host),$(br_ssh_key),$(ssh_opts),./opentrons-robot-server.service)
	$(call restart-service,$(host),$(br_ssh_key),$(ssh_opts),opentrons-robot-server)

.PHONY: install-key
install-key:
	curl -X POST $(host):31950/server/ssh_keys\
		-H "Content-Type: application/json"\
		-d "{\"key\":\"$(shell cat $(br_ssh_pubkey))\"}"

.PHONY: restart
restart:
	curl -X POST http://$(host):31950/server/restart

.PHONY: change-right
change-right:
	curl -X POST \
		-H "Content-Type: application/json" \
		-d '{"target": "mount", "mount": "right", "point": [65, 40, 30]}' \
		http://$(host):31950/robot/move
	curl -X POST \
		-H "Content-Type: application/json" \
		-d '{"axes": ["c"]}' \
		http://$(host):31950/motors/disengage


.PHONY: change-left
change-left:
	curl -X POST \
		-H "Content-Type: application/json" \
		-d '{"target": "mount", "mount": "left", "point": [325, 40, 30]}' \
		http://$(host):31950/robot/move
	curl -X POST \
		-H "Content-Type: application/json" \
		-d '{"axes": ["b"]}' \
		http://$(host):31950/motors/disengage

# User must currently specify host, e.g.: `make term host=169.254.202.176`
.PHONY: term
term:
	ssh -i $(br_ssh_key) $(ssh_opts) root@$(host)

.PHONY: docs
docs: settings_schema.json

settings_schema.json: robot_server/settings.py
	$(python) -m scripts.settings_schema $@
