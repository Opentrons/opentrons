# hardware makefile

include ../scripts/push.mk
include ../scripts/python.mk

SHX := npx shx

ot_project := $(OPENTRONS_PROJECT)
project_rs_default = $(if $(ot_project),$(ot_project),robot-stack)
project_ot3_default = $(if $(ot_project),$(ot_project),ot3)

# Find the version of the wheel from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
wheel_file = dist/$(call python_get_wheelname,hardware,$(project_rs_default),opentrons_hardware,$(BUILD_NUMBER))


# Find the version of the sdist from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the sdist.
sdist_file = dist/$(call python_get_sdistname,hardware,$(project_ot3_default),opentrons_hardware)

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,hardware,$(project_ot3_default),opentrons_hardware)

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/opentrons/tools/test_pipette_memory.py would run only the
# specified test
tests ?= tests
cov_opts ?= --cov=opentrons_hardware --cov-report term-missing:skip-covered --cov-report xml:coverage.xml
test_opts ?=

# These variables must be overridden when make deploy or make deploy-staging is run
# to set the auth details for pypi
pypi_username ?=
pypi_password ?=

# Host key location for buildroot robot
br_ssh_key ?= $(default_ssh_key)
# Other SSH args for buildroot robots
ssh_opts ?= $(default_ssh_opts)

twine_auth_args := --username $(pypi_username) --password $(pypi_password)
twine_repository_url ?= $(pypi_test_upload_url)

# Source discovery
# For the python sources
ot_py_sources := $(filter %.py,$(shell $(SHX) find opentrons_hardware/))
ot_sources := $(ot_py_sources)

# Defined separately than the clean target so the wheel file doesn’t have to
# depend on a PHONY target
clean_cmd = $(SHX) rm -rf build dist .coverage coverage.xml '*.egg-info' '**/__pycache__' '**/*.pyc' '**/.mypy_cache'

.PHONY: all
all: clean wheel

.PHONY: setup
setup:
	$(pipenv) sync $(pipenv_opts)
	$(pipenv) run pip freeze

.PHONY: teardown
teardown:
	-$(pipenv) --rm

.PHONY: clean
clean:
	-$(clean_cmd)

dist/opentrons_hardware-%-py2.py3-none-any.whl: export OPENTRONS_PROJECT=$(project_rs_default)
dist/opentrons_hardware-%-py2.py3-none-any.whl: setup.py $(ot_sources)
	$(python) setup.py $(wheel_opts) bdist_wheel
	$(SHX) rm -rf build
	$(SHX) ls dist

wheel: $(wheel_file)

$(sdist_file): export OPENTRONS_PROJECT=$(project_ot3_default)
$(sdist_file): setup.py $(ot_sources)
	$(python) setup.py sdist
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: sdist
sdist: $(sdist_file)

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
	$(python) -m mypy opentrons_hardware tests
	$(python) -m black --check opentrons_hardware tests setup.py
	$(python) -m flake8 opentrons_hardware tests setup.py

.PHONY: format
format:
	$(python) -m black opentrons_hardware tests setup.py

# launch hardware controller in dev mode
.PHONY: dev
dev:
	echo "Nothing here yet"


.PHONY: push-no-restart
push-no-restart: wheel
	$(call push-python-package,$(host),$(br_ssh_key),$(ssh_opts),$(wheel_file))

.PHONY: push
push: push-no-restart
	$(call restart-service,$(host),$(br_ssh_key),$(ssh_opts),"jupyter-notebook opentrons-robot-server")

.PHONY: push-no-restart-ot3
push-no-restart-ot3: sdist Pipfile.lock
	$(call push-python-sdist,$(host),,$(ssh_opts),$(sdist_file),/opt/opentrons-robot-server,"opentrons_hardware",,,$(version_file))

.PHONY: push-ot3
push-ot3: push-no-restart-ot3
	$(call restart-server,$(host),,$(ssh_opts),"opentrons-robot-server")


# Launch the emulator application.
.PHONY: emulator
emulator:
	echo "Nothing here yet"

.PHONY: deploy
deploy: wheel
	$(call python_upload_package,$(twine_auth_args),$(twine_repository_url),$(wheel_file))
