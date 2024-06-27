include ../scripts/push.mk
include ../scripts/python.mk

SHX := npx shx

ot_project := $(OPENTRONS_PROJECT)
project_rs_default = $(if $(ot_project),$(ot_project),robot-stack)
project_ir_default = $(if $(ot_project),$(ot_project),ot3)

package_name = abr_testing
package_version = $(call python_package_version,abr-testing,$(project_rs_default))
wheel_file = dist/$(call python_get_wheelname,abr-testing,$(project_rs_default),$(package_name),$(BUILD_NUMBER))
sdist_file = dist/$(call python_get_sdistname,abr-testing,$(project_rs_default),$(package_name))

tests ?= tests
test_opts ?=

# Host key location for robot
ssh_key ?= $(default_ssh_key)
# Other SSH args for robot
ssh_opts ?= $(default_ssh_opts)
# Helper to safely bundle ssh options
ssh_helper = $(if $(ssh_key),-i $(ssh_key)) $(ssh_opts)
ssh_helper_ot3 = $(ssh_helper) -o HostkeyAlgorithms=+ssh-rsa -o PubkeyAcceptedAlgorithms=+ssh-rsa

# Source discovery
# For the python sources
ot_py_sources := $(filter %.py,$(shell $(SHX) find abr_testing/))
ot_sources := $(ot_py_sources)

# Defined separately than the clean target so the wheel file doesn’t have to
# depend on a PHONY target
clean_cmd = $(SHX) rm -rf build dist .coverage coverage.xml '*.egg-info' '**/__pycache__' '**/*.pyc' '**/.mypy_cache'


.PHONY: all
all: clean sdist wheel

.PHONY: setup
setup:
	$(pipenv) sync $(pipenv_opts)
	$(pipenv) run pip freeze

.PHONY: teardown
teardown:
	$(pipenv) --rm

.PHONY: clean
clean:
	$(clean_cmd)

.PHONY: wheel
wheel: export OPENTRONS_PROJECT=$(project_rs_default)
wheel:
	rm -rf dist/*.whl
	$(python) setup.py $(wheel_opts) bdist_wheel
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: sdist
sdist: export OPENTRONS_PROJECT=$(project_rs_default)
sdist:
	$(clean_cmd)
	$(python) setup.py sdist
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: lint
lint:
	$(python) -m mypy abr_testing tests
	$(python) -m black --check abr_testing tests setup.py
	$(python) -m flake8 abr_testing tests setup.py

.PHONY: format
format:
	$(python) -m black abr_testing tests setup.py

.PHONY: test
test:
	@echo "No tests yet"
