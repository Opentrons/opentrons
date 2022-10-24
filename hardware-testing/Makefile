# makefile

include ../scripts/push.mk
include ../scripts/python.mk

SHX := npx shx

sdist_file = dist/hardware_testing-0.0.1.tar.gz
wheel_file = dist/hardware_testing-0.0.1-py3-none-any.whl


# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/opentrons/tools/test_pipette_memory.py would run only the
# specified test
tests ?= tests
cov_opts ?= --cov=hardware_testing --cov-report term-missing:skip-covered --cov-report xml:coverage.xml
test_opts ?=

# Host key location for buildroot robot
br_ssh_key ?= $(default_ssh_key)
# Other SSH args for buildroot robots
ssh_opts ?= $(default_ssh_opts)

# Source discovery
# For the python sources
ot_py_sources := $(filter %.py,$(shell $(SHX) find hardware_testing/))
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
	$(pipenv) --rm

.PHONY: clean
clean:
	$(clean_cmd)

$(sdist_file): setup.py $(ot_sources) clean
	$(python) setup.py sdist
	$(SHX) rm -rf build
	$(SHX) ls dist

$(wheel_file): setup.py $(ot_sources) clean
	$(python) setup.py bdist_wheel
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: sdist
sdist: $(sdist_file)

.PHONY: wheel
wheel: $(wheel_file)

.PHONY: test
test:
	$(pytest) $(tests) $(test_opts)

.PHONY: test-cov
test-cov:
	$(pytest) $(tests) $(test_opts) $(cov_opts)

.PHONY: test-integration
test-integration:
	$(python) protocols/ot2_p300_single_channel_gravimetric.py --simulate

.PHONY: lint
lint:
	$(python) -m mypy hardware_testing tests protocols
	$(python) -m black --check hardware_testing tests protocols setup.py
	$(python) -m flake8 hardware_testing tests protocols setup.py

.PHONY: format
format:
	$(python) -m black hardware_testing tests protocols setup.py

define move-plot-webpage
ssh -i $(2) $(3) root@$(1) \
"function cleanup () { mount -o remount,ro / ; } ;\
mount -o remount,rw / &&\
mv /data/plot/index.html /usr/lib/python3.7/site-packages/hardware_testing/tools/plot &&\
mv /data/plot/index.js /usr/lib/python3.7/site-packages/hardware_testing/tools/plot &&\
cleanup || cleanup"
endef

.PHONY: push-plot-webpage
push-plot-webpage:
	scp -r hardware_testing/tools/plot root@$(host):/data
	$(call move-plot-webpage,$(host),$(br_ssh_key),$(ssh_opts))

.PHONY: restart
restart:
	$(call restart-service,$(host),$(br_ssh_key),$(ssh_opts),"opentrons-robot-server")

.PHONY: push-no-restart
push-no-restart:
	$(call push-python-package,$(host),$(br_ssh_key),$(ssh_opts),$(wheel_file))

.PHONY: push
push: push-no-restart restart

.PHONY: restart-ot3
restart-ot3:
	$(call restart-server,$(host),,$(ssh_opts),"opentrons-robot-server")

.PHONY: push-no-restart-ot3
push-no-restart-ot3: sdist Pipfile.lock
	$(call push-python-sdist,$(host),,$(ssh_opts),$(sdist_file),/opt/opentrons-robot-server,"hardware_testing")

.PHONY: push-ot3
push-ot3: push-no-restart-ot3 restart-ot3

.PHONY: push-protocols
push-protocols:
	scp -r protocols root@$(host):/data/user_storage/opentrons_data

.PHONY: push-all
push-all: clean wheel push-no-restart push-plot-webpage push-protocols

.PHONY: term
term:
	ssh -i $(br_ssh_key) $(ssh_opts) root@$(host)

.PHONY: push-all-and-term
push-all-and-term: push-all term

.PHONY: pull-data
pull-data-ot3:
	mkdir -p ./.pulled-data
	scp -r root@$(host):/data/testing_data/$(test) ./.pulled-data
