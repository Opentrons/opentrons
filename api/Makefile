# opentrons api makefile

include ../scripts/push.mk
include ../scripts/python.mk

SHX := npx shx

# make push wheel file (= rather than := to expand at every use)
firmware = $(wildcard smoothie/*.hex)

# python and pipenv config
sphinx_build := $(pipenv) run sphinx-build


# Find the version of the wheel from package.json using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
wheel_file = dist/$(call python_get_wheelname,api,opentrons,$(BUILD_NUMBER))

# These variables are for simulating python protocols
sim_log_level ?= info
simfile ?=

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/opentrons/tools/test_qc_scripts.py would run only the
# specified test
tests ?= tests
test_opts ?=  --cov=src/opentrons --cov-report term-missing:skip-covered --cov-report xml:coverage.xml

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
ot_py_sources := $(filter %.py,$(shell $(SHX) find src/opentrons/))
# And the out of tree shared data
ot_shared_data_sources := $(filter %.json,$(shell $(SHX) find ../shared-data/))
# And the arbitrary stuff in resources
ot_resources := $(filter %,$(shell $(SHX) find src/opentrons/resources))
ot_sources := $(ot_py_sources) $(ot_shared_data_sources) $(ot_resources)

# test modules to typecheck
# TODO(mc, 2021-07-23): expand this to all tests
ot_tests_to_typecheck := \
	tests/opentrons/protocol_api_experimental \
	tests/opentrons/protocol_engine \
	tests/opentrons/motion_planning \
	tests/opentrons/file_runner

# files and modules to format
# TODO(mc, 2021-07-23): expand this to all files until we can format `.`
ot_files_to_format := \
	src/opentrons/file_runner \
	src/opentrons/motion_planning \
	src/opentrons/protocol_api_experimental \
	src/opentrons/protocol_engine \
	tests/opentrons/file_runner \
	tests/opentrons/motion_planning  \
	tests/opentrons/protocol_api_experimental \
	tests/opentrons/protocol_engine

# Defined separately than the clean target so the wheel file doesn’t have to
# depend on a PHONY target
clean_cmd = $(SHX) rm -rf build dist .coverage coverage.xml '*.egg-info' '**/__pycache__' '**/*.pyc' 'src/**/.mypy_cache'

plot_type ?=

.PHONY: all
all: clean wheel

.PHONY: setup
setup:
	$(pipenv) sync $(pipenv_opts)
	$(pipenv) run pip freeze

.PHONY: clean
clean: docs-clean
	$(clean_cmd)

.PHONY: teardown
teardown:
	$(pipenv) --rm

dist/opentrons-%-py2.py3-none-any.whl: setup.py $(ot_sources)
	$(clean_cmd)
	$(python) setup.py $(wheel_opts) bdist_wheel
	$(SHX) rm -rf build
	$(SHX) ls dist

wheel: $(wheel_file)

.PHONY: test
test:
	$(pytest) $(tests) $(test_opts)

.PHONY: lint
lint:
	$(python) -m mypy src/opentrons $(ot_tests_to_typecheck)
	$(python) -m black --check $(ot_files_to_format)
	$(python) -m flake8 setup.py src/opentrons tests

.PHONY: format
format:
	$(python) -m black $(ot_files_to_format)

docs/build/html/v%: docs/v%
	$(sphinx_build) -b html -d docs/build/doctrees -n $< $@
	$(SHX) cp docs/img/lightbulb.jpg $@/_images/ # sphinx wont automatically do this because it's only in a template

docs/build/html/hardware: docs/hardware src/opentrons/hardware_control
	$(sphinx_build) -b html -d docs/build/doctrees -n $< $@
	$(SHX) mkdir $@/_images/
	$(SHX) cp docs/img/lightbulb.jpg $@/_images/

docs/build/pdf/OpentronsPythonAPIV%.pdf: docs/v%
	$(sphinx_build) -b latex -d docs/build/doctrees $< $(@D)
	$(MAKE) -C $(@D) all-pdf $(if $(CI),>/dev/null,|| $(SHX) echo "latex build failed (pdflatex not installed?)")
	$(SHX) ls $(@D)/*.pdf $(if $(CI),,|| $(SHX) echo "no pdf produced")

docs/build/pdf/OT2HardwareControl.pdf: docs/hardware
	$(sphinx_build) -b latex -d docs/build/doctrees $< $(@D)
	$(MAKE) -C $(@D) all-pdf $(if $(CI),>/dev/null,|| $(SHX) echo "latex build failed (pdflatex not installed)")

docs/dist/v%: docs/build/html/v% docs/build/pdf/OpentronsPythonAPIV%.pdf
	$(SHX) mkdir -p $@
	$(SHX) cp -R $^ $(@D) $(if $(CI),,|| true)

docs/dist/hardware: docs/build/html/hardware docs/build/pdf/OT2HardwareControl.pdf
	$(SHX) mkdir -p $@
	$(SHX) cp -R $^ $(@D) $(if $(CI),,|| true)

docs/dist/ot1: docs/ot1
	$(SHX) mkdir -p $@
	$(SHX) cp -R $< $(@D)

docs/dist/%: docs/root/%
	$(SHX) mkdir -p $(@D)
	$(SHX) cp -R docs/root/* docs/dist/

.PHONY: docs
docs: docs/dist/index.html docs/dist/v1 docs/dist/v2 docs/dist/ot1 docs/dist/hardware

.PHONY: docs-clean
docs-clean:
	$(SHX) rm -rf docs/dist docs/build

.PHONY: dev
dev:
	echo "Command will be deprecated. Use \"make -C robot-server dev\""
	$(MAKE) -C ../robot-server dev

.PHONY: local-shell
local-shell:
	$(pipenv) shell

.PHONY: push-no-restart
push-no-restart: wheel
	$(call push-python-package,$(host),$(br_ssh_key),$(ssh_opts),$(wheel_file))

.PHONY: push
push: push-no-restart
	$(call restart-service,$(host),$(br_ssh_key),$(ssh_opts),"jupyter-notebook opentrons-robot-server")

.PHONY: simulate
simulate:
	-$(python) -m opentrons.simulate -l $(sim_log_level) $(simfile)

# Launch the emulator application.
.PHONY: emulator
emulator:
	-$(python) -m opentrons.hardware_control.emulation.app

.PHONY: deploy
deploy: wheel
	$(call python_upload_package,$(twine_auth_args),$(twine_repository_url),$(wheel_file))

# User must currently specify host, e.g.: `make term host=169.254.202.176`
.PHONY: term
term:
	ssh -i $(br_ssh_key) $(ssh_opts) root@$(host)

.PHONY: plot-session
plot-session:
	$(python) util/plot_session.py $(plot_type) $(plot_type).pdf

###########################
# G-Code Parsing Commands #
###########################

# NOTE: The following 2 AWS commands `g-code-s3-pull` and `g-code-s3-push` expect you to have the following environment
# variables defined:  `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_DEFAULT_REGION `

# Pull objects from S3 and output it's content to STDOUT
# "object_name" is a required parameter
# "object_name" is the name of the S3 object you want to pull from the g-code-comparison bucket
# Example:
#	make g-code-s3-pull object_name='smoothie-protocol-output.json'
.PHONY: g-code-s3-pull
g-code-s3-pull:
	@aws s3 cp s3://g-code-comparison/$(object_name) -

# Push local file to S3
# "source_file_path" and "object_name" are required parameters
# "source_file_path" is the local path to the file you want to upload
# "object_name" is what you want your file to be called in S3
# Example:
#	make g-code-s3-push \
#	source_file_path=./api/tests/opentrons/data/g_code_validation_protocols/smoothie_protocol.py \
#	object_name='smoothie-protocol-output.json'
.PHONY: g-code-s3-push
g-code-s3-push:
	@aws s3 cp $(source_file_path) s3://g-code-comparison/$(object_name)
