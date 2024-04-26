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
sdist_file = dist/$(call python_get_sdistname,performance_metrics,$(project_rs_default),performance_metrics)


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
	$(call push-python-sdist,$(host),$(ssh_key),$(ssh_opts),$(sdist_file),"/opt/opentrons-robot-server","performance_metrics",,,$(version_file))

.PHONY: push-ot3
push-ot3: push-no-restart-ot3
	$(call restart-server,$(host),$(ssh_key),$(ssh_opts),"opentrons-robot-server")

.PHONY: set-debug-log-level
set-debug-log-level:
	@echo "Setting log level to debug on robot"
	curl \
	  -X POST\
	  -H "opentrons-version: *" \
	  -H "Content-Type: application/json" \
	  -d '{"log_level": "debug"}' \
	  http://$(host):31950/settings/log_level/local | jq

.PHONY: add-performance-metrics-ff
add-performance-metrics-ff:
	@echo "Adding performance metrics feature flag to robot"
	ssh -i $(ssh_key) $(ssh_opts) root@$(host) "touch /data/robot.env && \
		grep -q 'OT_API_FF_enablePerformanceMetrics' /data/robot.env && \
		sed -i 's/OT_API_FF_enablePerformanceMetrics=false/OT_API_FF_enablePerformanceMetrics=true/' /data/robot.env || \
		echo 'OT_API_FF_enablePerformanceMetrics=true' \
		>> /data/robot.env"


.PHONY: get-logs
get-logs:
	@echo "Creating logs directory"
	mkdir -p .logs

	@echo "Getting logs from robot"
	ssh -i $(ssh_key) $(ssh_opts) root@$(host) "journalctl \
		--no-pager \
		--boot \
		--catalog \
		--unit opentrons-robot-server.service" \
		> .logs/robot-server.log


.PHONY: test
test:
	$(pytest) tests