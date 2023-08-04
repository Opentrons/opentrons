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
	-$(MAKE) apply-patches-gravimetric
	$(pytest) $(tests) $(test_opts)
	-$(MAKE) remove-patches-gravimetric

.PHONY: test-cov
test-cov:
	-$(MAKE) apply-patches-gravimetric
	$(pytest) $(tests) $(test_opts) $(cov_opts)
	-$(MAKE) remove-patches-gravimetric

.PHONY: test-photometric
test-photometric:
	$(python) -m hardware_testing.gravimetric --photometric --simulate --pipette 1000 --channels 96 --tip 50 --trials 5
	$(python) -m hardware_testing.gravimetric --photometric --simulate --pipette 1000 --channels 96 --tip 200 --trials 5

.PHONY: test-gravimetric-single
test-gravimetric-single:
	$(python) -m hardware_testing.gravimetric --simulate --pipette 1000 --channels 1 --tip 1000 --trials 1
	$(python) -m hardware_testing.gravimetric --simulate --pipette 1000 --channels 1 --tip 200 --trials 1
	$(python) -m hardware_testing.gravimetric --simulate --pipette 1000 --channels 1 --tip 50 --trials 1
	$(python) -m hardware_testing.gravimetric --simulate --pipette 50 --channels 1 --tip 50 --trials 1
	$(python) -m hardware_testing.gravimetric --simulate --pipette 1000 --channels 1 --tip 1000 --trials 1 --increment

.PHONY: test-gravimetric-multi
test-gravimetric-multi:
	$(python) -m hardware_testing.gravimetric --simulate --pipette 50 --channels 8 --tip 50 --trials 1
	$(python) -m hardware_testing.gravimetric --simulate --pipette 50 --channels 8 --tip 50 --trials 1 --increment
	$(python) -m hardware_testing.gravimetric --simulate --pipette 1000 --channels 8 --tip 1000 --trials 1
	$(python) -m hardware_testing.gravimetric --simulate --pipette 1000 --channels 8 --tip 200 --trials 1
	$(python) -m hardware_testing.gravimetric --simulate --pipette 1000 --channels 8 --tip 50 --trials 1

.PHONY: test-gravimetric
test-gravimetric:
	-$(MAKE) apply-patches-gravimetric
	$(MAKE) test-gravimetric-single
	$(MAKE) test-gravimetric-multi
	-$(MAKE) remove-patches-gravimetric

.PHONY: test-production-qc
test-production-qc:
	$(python) -m hardware_testing.production_qc.pipette_current_speed_qc_ot3 --simulate
	$(python) -m hardware_testing.production_qc.pipette_assembly_qc_ot3 --operator test --simulate
	$(python) -m hardware_testing.production_qc.robot_assembly_qc_ot3 --simulate
	$(python) -m hardware_testing.production_qc.gripper_assembly_qc_ot3 --simulate
	$(python) -m hardware_testing.production_qc.ninety_six_assembly_qc_ot3 --simulate

.PHONY: test-examples
test-examples:
	$(python) -m hardware_testing.examples.csv_report
	$(python) -m hardware_testing.examples.custom_axis_settings_ot3 --simulate
	$(python) -m hardware_testing.examples.pick_up_tip_ot3 --simulate
	$(python) -m hardware_testing.examples.plunger_ot3 --simulate
	$(python) -m hardware_testing.examples.capacitive_probe_ot3 --simulate

.PHONY: test-scripts
test-scripts:
	$(python) -m hardware_testing.scripts.bowtie_ot3 --simulate

.PHONY: test-integration
test-integration: test-production-qc test-examples test-scripts test-gravimetric

.PHONY: lint
lint:
	-$(MAKE) apply-patches-gravimetric
	$(python) -m mypy hardware_testing tests
	$(python) -m black --check hardware_testing tests setup.py
	$(python) -m flake8 hardware_testing tests setup.py
	-$(MAKE) remove-patches-gravimetric

.PHONY: format
format:
	$(python) -m black hardware_testing tests setup.py

define move-plot-webpage-ot3
ssh -i $(2) $(3) root@$(1) \
"function cleanup () { mount -o remount,ro / ; } ;\
mount -o remount,rw / &&\
mv /data/plot/index.html /opt/opentrons-robot-server/hardware_testing/tools/plot &&\
mv /data/plot/index.js /opt/opentrons-robot-server/hardware_testing/tools/plot &&\
rm -rf /data/plot &&\
cleanup || cleanup"
endef

.PHONY: push-plot-webpage-ot3
push-plot-webpage-ot3:
	scp -r hardware_testing/tools/plot root@$(host):/data
	$(call move-plot-webpage-ot3,$(host),$(br_ssh_key),$(ssh_opts))

.PHONY: push-description-ot3
push-description-ot3:
	$(python) -c "from hardware_testing.data import create_git_description_file; create_git_description_file()"
	scp ./.hardware-testing-description root@$(host):/data/.hardware-testing-description

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
push-ot3: push-no-restart-ot3 push-plot-webpage-ot3 push-description-ot3

.PHONY: push-all
push-all: clean wheel push-no-restart push-plot-webpage

.PHONY: term
term:
	ssh -i $(br_ssh_key) $(ssh_opts) root@$(host)

.PHONY: list-ports
list-ports:
	$(python) -m serial.tools.list_ports

.PHONY: miniterm
miniterm:
	$(python) -m serial.tools.miniterm $(port) 115200 --eol LF

.PHONY: push-all-and-term
push-all-and-term: push-all term

.PHONY: pull-data-ot3
pull-data-ot3:
	mkdir -p "./.pulled-data"
	scp -r "root@$(host):/data/testing_data/$(test)" "./.pulled-data"

define delete-test-data-cmd
ssh -i $(2) $(3) root@$(1) \
"rm -rf /data/testing_data/$(4)"
endef

.PHONY: delete-data-ot3
delete-data-ot3:
	$(call delete-test-data-cmd,$(host),$(br_ssh_key),$(ssh_opts),$(test))

define push-and-update-fw
scp $(2) root@$(1):/tmp
ssh root@$(1) \
"function cleanup () { (rm -rf /tmp/$(2) || true) && mount -o remount,ro / ; } ;\
mount -o remount,rw / &&\
(unzip -o /tmp/$(2) -d /usr/lib/firmware || cleanup) &&\
python3 -m json.tool /usr/lib/firmware/opentrons-firmware.json &&\
cleanup"
endef

.PHONY: sync-sw-ot3
sync-sw-ot3:
	cd ../hardware && $(MAKE) push-ot3 host=$(host)
	cd ../api && $(MAKE) push-ot3 host=$(host)
	cd ../shared-data && $(MAKE) all push-ot3 host=$(host)
	cd ../robot-server && $(MAKE) push-ot3 host=$(host)
	cd ../hardware-testing && $(MAKE) push-ot3 host=$(host)

.PHONY: sync-fw-ot3
sync-fw-ot3:
	$(call push-and-update-fw,$(host),$(zip))

.PHONY: sync-ot3
sync-ot3: sync-sw-ot3 sync-fw-ot3

.PHONY: push-ot3-gravimetric
push-ot3-gravimetric:
	$(MAKE) apply-patches-gravimetric
	-$(MAKE) sync-sw-ot3
	$(MAKE) remove-patches-gravimetric

.PHONY: apply-patches-gravimetric
apply-patches-gravimetric:
	cd ../ && git apply ./hardware-testing/hardware_testing/gravimetric/overrides/*.patch --allow-empty

.PHONY: remove-patches-gravimetric
remove-patches-gravimetric:
	cd ../ && git apply ./hardware-testing/hardware_testing/gravimetric/overrides/*.patch --reverse --allow-empty

upstream ?= origin/edge
.PHONY: update-patches-gravimetric
update-patches-gravimetric:
	rm ./hardware_testing/gravimetric/overrides/*.patch
	cd ../ && git diff $(upstream) ./hardware/** > ./hardware-testing/hardware_testing/gravimetric/overrides/hardware.patch
	cd ../ && git diff $(upstream) ./api/** > ./hardware-testing/hardware_testing/gravimetric/overrides/api.patch
	cd ../ && git diff $(upstream) ./shared-data/** > ./hardware-testing/hardware_testing/gravimetric/overrides/shared-data.patch
	cd ../ && git diff $(upstream) ./robot-server/** > ./hardware-testing/hardware_testing/gravimetric/overrides/robot-server.patch
	$(MAKE) remove-patches-gravimetric

.PHONY: push-photometric-ot2
push-photometric-ot2:
	scp -r -O photometric-ot2/photometric_ot2 root@$(host):/data/user_storage
