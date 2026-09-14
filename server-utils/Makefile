# opentrons robot server makefile

include ../scripts/push.mk
include ../scripts/python-uv.mk

SHX := npx shx

# Path of source package
SRC_PATH = server_utils

# Project to get the version for
ot_project := $(OPENTRONS_PROJECT)
project_rs_default = $(if $(ot_project),$(ot_project),robot-stack)
project_ir_default = $(if $(ot_project),$(ot_project),ot3)


# Find the version of the wheel from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
wheel_file = dist/$(call python_get_wheelname,server-utils,$(project_rs_default),server_utils,$(BUILD_NUMBER))

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,server-utils,$(project_rs_default),server_utils)

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/opentrons/tools/test_qc_scripts.py would run only the
# specified test
tests ?= tests
cov_opts ?= --cov=$(SRC_PATH) --cov-report term-missing:skip-covered --cov-report xml:coverage.xml
test_opts ?=

# Host key location for robot
ssh_key ?= $(default_ssh_key)
# Pubkey location for buildroot robot to install with install-key
br_ssh_pubkey ?= $(ssh_key).pub
# Other SSH args for robot
ssh_opts ?= $(default_ssh_opts)

# Source discovery
# For the python sources
ot_py_sources := $(filter %.py,$(shell $(SHX) find $(SRC_PATH)))
ot_sources := $(ot_py_sources)

# Defined separately than the clean target so the wheel file doesn’t have to
# depend on a PHONY target
clean_cmd = $(SHX) rm -rf build .coverage coverage.xml '*.egg-info'
clean_cache_cmd = $(SHX) rm -rf '**/__pycache__' '**/*.pyc' '**/.mypy_cache'
clean_wheel_cmd = $(clean_cmd) dist/*.whl
clean_all_cmd = $(clean_cmd) dist

.PHONY: all
all: clean wheel



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
	$(clean_all_cmd)
	$(clean_cache_cmd)

.PHONY: teardown
teardown:
	$(SHX) rm -rf .venv

.PHONY: wheel
wheel: export OPENTRONS_PROJECT=$(project_rs_default)
wheel: $(ot_sources)
	$(clean_wheel_cmd)
	$(python) -m build --wheel .
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: test
test:
	$(pytest) $(tests) $(test_opts)

.PHONY: test-cov
test-cov:
	$(pytest) $(tests) $(test_opts) $(cov_opts)

.PHONY: lint
lint:
	$(python) -m mypy $(SRC_PATH) $(tests)
	$(ruff) check .
	$(ruff) format --check .

.PHONY: format
format:
	$(ruff) format .
	$(ruff) check --select I --fix .

.PHONY: push
push: wheel
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/usr/lib/python3.10/site-packages/)

.PHONY: push-ot3
push-ot3: wheel
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/opt/opentrons-audit-server/)
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/opt/opentrons-auth-server/)
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/opt/opentrons-robot-server/)
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/opt/opentrons-system-server/)
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/opt/opentrons-update-server/)
