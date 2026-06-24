# hardware makefile

include ../scripts/push.mk
include ../scripts/python-uv.mk

SHX := npx shx

# Find the version of the wheel from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
wheel_file = dist/$(call python_get_wheelname,hardware,$(PROJECT),opentrons_hardware,$(BUILD_NUMBER))


# Find the version of the sdist from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the sdist.
sdist_file = dist/$(call python_get_sdistname,hardware,$(PROJECT),opentrons_hardware)

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,hardware,$(PROJECT),opentrons_hardware)

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/opentrons/tools/test_pipette_memory.py would run only the
# specified test
tests ?= tests
cov_opts ?= --cov=opentrons_hardware --cov-report term-missing:skip-covered --cov-report xml:coverage.xml
test_opts ?=

files_to_check := opentrons_hardware tests

# These variables must be overridden when make deploy or make deploy-staging is run
# to set the auth details for pypi
pypi_username ?=
pypi_password ?=

# Host key location for robot
ssh_key ?= $(default_ssh_key)
# Other SSH args for robot
ssh_opts ?= $(default_ssh_opts)
# Helper to safely bundle ssh options
ssh_helper = $(if $(ssh_key),-i $(ssh_key)) $(ssh_opts)

twine_auth_args := --username $(pypi_username) --password $(pypi_password)
twine_repository_url ?= $(pypi_test_upload_url)

# Source discovery
# For the python sources
ot_py_sources := $(filter %.py,$(shell $(SHX) find opentrons_hardware/))
ot_sources := $(ot_py_sources)

# Defined separately than the clean target so the wheel file doesn’t have to
# depend on a PHONY target
clean_cmd = $(SHX) rm -rf build dist .coverage coverage.xml '*.egg-info'
clean_cache_cmd = $(SHX) rm -rf '**/__pycache__' '**/*.pyc' '**/.mypy_cache'

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

.PHONY: teardown
teardown:
	$(SHX) rm -rf .venv

.PHONY: clean
clean:
	$(clean_cmd)
	$(clean_cache_cmd)

dist/opentrons_hardware-%-py3-none-any.whl: export OPENTRONS_PROJECT=$(PROJECT)
dist/opentrons_hardware-%-py3-none-any.whl: export HATCH_VCS_TUNABLE_TAG_PATTERN=$(call git_tag_regex_for_project,$(PROJECT))
dist/opentrons_hardware-%-py3-none-any.whl: export HATCH_VCS_TUNABLE_RAW_OPTIONS=$(call hatch_raw_options_for_project,$(PROJECT))
dist/opentrons_hardware-%-py3-none-any.whl: $(ot_sources)
	$(python) -m build --wheel .
	$(SHX) rm -rf build
	$(SHX) ls dist

# Only resolve the wheel filename when we actually build it so `make teardown`
# (and similar targets) do not spin up a uv environment unnecessarily. Reinvoking
# `$(MAKE)` with `$(wheel_file)` defers the python_get_wheelname call until the
# recipe runs, keeping parse-time side effects away from unrelated targets.
.PHONY: wheel
wheel:
	$(MAKE) $(wheel_file)

dist/opentrons_hardware-%.tar.gz: export OPENTRONS_PROJECT=$(project_rs_default)
dist/opentrons_hardware-%.tar.gz: export HATCH_VCS_TUNABLE_TAG_PATTERN=$(call git_tag_regex_for_project,$(PROJECT))
dist/opentrons_hardware-%.tar.gz: export HATCH_VCS_TUNABLE_RAW_OPTIONS=$(call hatch_raw_options_for_project,$(PROJECT))
dist/opentrons_hardware-%.tar.gz: $(ot_sources)
	$(python) -m build --sdist .
	$(SHX) rm -rf build
	$(SHX) ls dist

# Same lazy trick for sdist so python_get_sdistname only runs when we actually
# ask for the source distribution (avoids uv spins during unrelated targets).
.PHONY: sdist
sdist:
	$(MAKE) $(sdist_file)

.PHONY: test
test:
	$(pytest) -m 'not requires_emulator' $(tests) $(test_opts)

.PHONY: test-cov
test-cov:
	$(pytest) -m 'not requires_emulator' $(tests) $(test_opts) $(cov_opts)

.PHONY: test-with-emulator
test-with-emulator:
	$(pytest) $(tests) $(test_opts)


.PHONY: test-with-opentrons-sock-emulator
test-with-opentrons-sock-emulator: export OT3_CAN_DRIVER_INTERFACE ?= opentrons_sock
test-with-opentrons-sock-emulator: test-with-emulator

.PHONY: lint
lint:
	$(python) -m mypy $(files_to_check)
	$(ruff) check $(files_to_check)
	$(ruff) format --check $(files_to_check)

.PHONY: format
format:
	$(ruff) format $(files_to_check)
	$(ruff) check --select I --fix $(files_to_check)

# launch hardware controller in dev mode
.PHONY: dev
dev:
	echo "Nothing here yet"


.PHONY: push-no-restart
push-no-restart: wheel
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/usr/lib/python3.10/site-packages/)

.PHONY: push
push: push-no-restart
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),"jupyter-notebook opentrons-robot-server")

.PHONY: push-no-restart-ot3
push-no-restart-ot3: wheel
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/opt/opentrons-robot-server/)

.PHONY: push-ot3
push-ot3: push-no-restart-ot3
	$(call stop-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-robot-server")
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-pyro-nameserver opentrons-hardware-api")
	$(call start-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-robot-server")


# Launch the emulator application.
.PHONY: emulator
emulator:
	echo "Nothing here yet"

.PHONY: deploy
deploy: wheel sdist
	$(call python_upload_package,$(twine_auth_args),$(twine_repository_url),$(wheel_file),$(sdist_file))
