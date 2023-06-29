# opentrons robot server makefile

include ../scripts/push.mk
include ../scripts/python.mk

SHX := npx shx

# Path of source package
SRC_PATH = server_utils

# Project to get the version for
ot_project := $(OPENTRONS_PROJECT)
project_rs_default = $(if $(ot_project),$(ot_project),robot-stack)
project_ot3_default = $(if $(ot_project),$(ot_project),ot3)


# Find the version of the wheel from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
wheel_file = dist/$(call python_get_wheelname,server-utils,$(project_rs_default),server_utils,$(BUILD_NUMBER))

# Find the version of the sdist from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the sdist.
sdist_file = dist/$(call python_get_sdistname,server-utils,$(project_ot3_default),server_utils)

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,server-utils,$(project_ot3_default),server_utils)

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
clean_cmd = $(SHX) rm -rf build .coverage coverage.xml '*.egg-info' '**/__pycache__' '**/*.pyc' 'server_utils/**/.mypy_cache'
clean_wheel_cmd = $(clean_cmd) dist/*.whl
clean_sdist_cmd = $(clean_cmd) dist/*.tar.gz
clean_all_cmd = $(clean_cmd) dist

.PHONY: all
all: clean sdist wheel

.PHONY: setup
setup:
	$(pipenv) sync $(pipenv_opts)
	$(pipenv) run pip freeze

.PHONY: clean
clean:
	$(clean_all_cmd)

.PHONY: teardown
teardown:
	$(pipenv) --rm

.PHONY: wheel
wheel: export OPENTRONS_PROJECT=$(project_rs_default)
wheel: setup.py $(ot_sources)
	$(clean_wheel_cmd)
	$(python) setup.py $(wheel_opts) bdist_wheel
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: sdist
sdist: export OPENTRONS_PROJECT=$(project_ot3_default)
sdist: setup.py $(ot_sources)
	$(clean_sdist_cmd)
	$(python) setup.py sdist
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
	$(python) -m black --check .
	$(python) -m flake8 $(SRC_PATH) $(tests) setup.py

.PHONY: format
format:
	$(python) -m black .


.PHONY: local-shell
local-shell:
	$(pipenv) shell

.PHONY: push
push: wheel
	$(call push-python-package,$(host),$(br_ssh_key),$(ssh_opts),$(wheel_file))

.PHONY: push-ot3
push-ot3: sdist
	$(call push-python-sdist,$(host),,$(ssh_opts),$(sdist_file),"/opt/opentrons-system-server","server_utils",,,$(version_file))
	$(call push-python-sdist,$(host),,$(ssh_opts),$(sdist_file),"/opt/opentrons-robot-server","server_utils")
