include ../scripts/python.mk
include ../scripts/push.mk

ot_project := $(OPENTRONS_PROJECT)
project_rs_default = $(if $(ot_project),$(ot_project),robot-stack)
project_ir_default = $(if $(ot_project),$(ot_project),ot3)

SHX := npx shx

# Host key location for robot
ssh_key ?= $(default_ssh_key)
# Other SSH args for robot
ssh_opts ?= $(default_ssh_opts)
# Helper to safely bundle ssh options
ssh_helper = $(if $(ssh_key),-i $(ssh_key)) $(ssh_opts)

# Defined separately than the clean target so the wheel file doesn’t have to
# depend on a PHONY target

# Find the version of the wheel from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
wheel_file = dist/$(call python_get_wheelname,performance-metrics,$(project_rs_default),performance_metrics,$(BUILD_NUMBER))

# Find the version of the sdist file from git using a helper script.
sdist_file = dist/$(call python_get_sdistname,performance-metrics,$(project_rs_default),performance_metrics)

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,performance-metrics,$(project_rs_default),performance_metrics)


clean_cmd = $(SHX) rm -rf 'build' '**/*.egg-info' '**/__pycache__' **/*.pyc '.mypy_cache' '.pytest_cache'
clean_wheel_cmd = $(clean_cmd) dist/*.whl
clean_sdist_cmd = $(clean_cmd) dist/*.tar.gz
clean_all_cmd = $(clean_cmd) dist

.PHONY: lint
lint:
	$(python) -m black --check .
	$(python) -m flake8 .
	$(python) -m mypy .

.PHONY: format
format:
	$(python) -m black .

.PHONY: setup
setup:
	$(pipenv) sync --dev

.PHONY: teardown
teardown:
	$(pipenv) --rm

.PHONY: clean
clean:
	$(clean_all_cmd)

.PHONY: wheel
wheel:
	$(clean_wheel_cmd)
	$(python) setup.py $(wheel_opts) bdist_wheel
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: sdist
sdist: export OPENTRONS_PROJECT=$(project_rs_default)
sdist:
	$(clean_sdist_cmd)
	$(python) setup.py sdist
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: push-no-restart
push-no-restart: wheel
	$(call push-python-package,$(host),$(ssh_key),$(ssh_opts),$(wheel_file))

.PHONY: push
push: push-no-restart
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-robot-server")

.PHONY: push-no-restart-ot3
push-no-restart-ot3: sdist
	$(call push-python-sdist,$(host),$(ssh_key),$(ssh_opts),$(sdist_file),/opt/opentrons-robot-server,performance_metrics,src,,$(version_file))

.PHONY: push-ot3
push-ot3: push-no-restart-ot3
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-robot-server")

.PHONY: override-robot-version
override-robot-version:
	$(eval update_dict := '{"opentrons_api_version": "$(version)", "update_server_version": "$(version)", "robot_server_version": "$(version)", "server_utils_version": "$(version)", "opentrons_hardware_version": "$(version)"}')
	$(call sync-version-file,$(host),$(ssh_key),$(ssh_opts),'$(update_dict)')
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-robot-server")


.PHONY: set-performance-metrics-ff
set-performance-metrics-ff:
	@curl \
    -H "opentrons-version: *" \
    -X POST $(host):31950/settings \
    -H "content-type: application/json" \
    -d '{"id": "enablePerformanceMetrics", "value": true}'

.PHONY: unset-performance-metrics-ff
unset-performance-metrics-ff:
	@curl \
	-H "opentrons-version: *" \
	-X POST $(host):31950/settings \
	-H "content-type: application/json" \
	-d '{"id": "enablePerformanceMetrics", "value": false}'

.PHONY: test
test:
	$(pytest) tests