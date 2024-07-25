include ../scripts/python.mk
include ../scripts/push.mk

ot_project := $(OPENTRONS_PROJECT)
project_rs_default = $(if $(ot_project),$(ot_project),robot-stack)
project_ir_default = $(if $(ot_project),$(ot_project),ot3)

SHX := npx shx

# Host key location for robot
ssh_key ?= $(default_ssh_key)
# Other SSH args for robot
ssh_opts ?= $(default_ssh_opts) -q
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
	$(python) -m mypy .
	$(python) -m flake8 .

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
	--silent \
    -H "opentrons-version: *" \
    -X POST $(host):31950/settings \
    -H "content-type: application/json" \
    -d '{"id": "enablePerformanceMetrics", "value": true}'

.PHONY: unset-performance-metrics-ff
unset-performance-metrics-ff:
	@curl \
	--silent \
	-H "opentrons-version: *" \
	-X POST $(host):31950/settings \
	-H "content-type: application/json" \
	-d '{"id": "enablePerformanceMetrics", "value": false}'

.PHONY: test
test:
	$(pytest) tests

.PHONY: setup-remote-flex
setup-remote-flex:

	@echo "Setting up remote Flex..."
	@echo "Pushing performance-metrics package to Flex"	

	@$(MAKE) push-no-restart-ot3 host=$(host) ssh_key=$(ssh_key) 2>&1 | grep -v "Permanently added" > /dev/null

	@echo "Pushing api package to Flex"
	@$(MAKE) -C ../api push-no-restart-ot3 host=$(host) ssh_key=$(ssh_key) 2>&1 | grep -v "Permanently added" > /dev/null

	@echo "Pushing robot-server package to Flex and restarting robot server"
	@$(MAKE) -C ../robot-server push-ot3 host=$(host) ssh_key=$(ssh_key) 2>&1 | grep -v "Permanently added" > /dev/null

	@echo "Setting performance metrics feature flag"
	@$(MAKE) set-performance-metrics-ff host=$(host) 2>&1 > /dev/null


.PHONY: start-remote-system-resource-tracker
start-remote-system-resource-tracker:
	@echo "Triggering system resource tracker on host $(host)..."
	@ssh -i $(ssh_key) root@$(host) \
		"cd /opt/opentrons-robot-server; \
		OT_SYSTEM_RESOURCE_TRACKER_ENABLED=true \
		$${refresh_interval:+OT_SYSTEM_RESOURCE_TRACKER_REFRESH_INTERVAL=$$refresh_interval} \
		$${process_filters:+OT_SYSTEM_RESOURCE_TRACKER_PROCESS_FILTERS=$$process_filters} \
		$${storage_dir:+OT_SYSTEM_RESOURCE_TRACKER_STORAGE_DIR=$$storage_dir} \
		$${logging_level:+OT_SYSTEM_RESOURCE_TRACKER_LOGGING_LEVEL=$$logging_level} \
		python3 -m performance_metrics.system_resource_tracker"


.PHONY: setup-system-resource-tracker-systemd-service
setup-system-resource-tracker-systemd-service:
	@echo "Setting up system resource tracker systemd service"
	@$(call push-systemd-unit ,$(host),$(ssh_key),$(ssh_opts),$(FILENAME))


	@echo "Enabling system resource tracker service"
	@ssh -i $(ssh_key) root@$(host) "\
		mount -o remount,rw / && \
		systemctl enable system-resource-tracker --quiet || \
		mount -o remount,ro /"

	@echo "Starting system resource tracker service"
	@$(call restart-service,$(host),$(ssh_key),$(ssh_opts),system-resource-tracker)


.PHONY: setup-prod-system-resource-tracker-systemd-service
setup-prod-system-resource-tracker-systemd-service: FILENAME=system-resource-tracker.service
setup-prod-system-resource-tracker-systemd-service: setup-system-resource-tracker-systemd-service

.PHONY: setup-dev-system-resource-tracker-systemd-service
setup-dev-system-resource-tracker-systemd-service: FILENAME=system-resource-tracker-dev.service
setup-dev-system-resource-tracker-systemd-service: setup-system-resource-tracker-systemd-service


.PHONY: cleanup-remote-flex
# Default value for the data folder path
DATA_FOLDER ?= /data/performance_metrics_data
DEV_DATA_FOLDER ?= /data/performance_metrics_data_dev

cleanup-remote-flex:
	@echo "Cleaning up performance metrics on host $(host)..."
	
	# Note not using || to exit on error because it only looks to see 
	# if the previous command failed, whereas we want to catch any error or a successful exit

	@ssh -i $(ssh_key) root@$(host) "\
		trap 'echo \"Remounting filesystem as read-only\" && mount -o remount,ro /' EXIT ERR && \
		echo 'Configuring remote file system to read/write' && \
		mount -o remount,rw / && \
		echo 'Stopping system-resource-tracker' && \
		systemctl stop system-resource-tracker && \
		echo 'Disabling system-resource-tracker' && \
		systemctl disable system-resource-tracker && \
		echo 'Removing service file, data folders, and performance_metrics package' && \
		rm -rf \
			/etc/systemd/system/system-resource-tracker.service \
			$(DATA_FOLDER) \
			$(DEV_DATA_FOLDER) \
			/opt/opentrons-robot-server/performance_metrics* && \
		echo 'Reloading daemon' && \
		systemctl daemon-reload && \
		echo 'Checking system-resource-tracker status' && \
		if systemctl is-active system-resource-tracker --quiet; then \
			echo 'Error: system-resource-tracker is still active'; \
			exit 1; \
		else \
			echo 'system-resource-tracker is not active'; \
		fi"		

	@echo "Unsetting performance metrics feature flag"
	@$(MAKE) unset-performance-metrics-ff host=$(host) 2>&1 > /dev/null