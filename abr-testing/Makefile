
include ../scripts/push.mk
include ../scripts/python.mk

SHX := npx shx
slack_sdk_version := 3.39.0

package_name = abr_testing
package_version = $(call python_package_version,abr-testing,$(project_rs_default))

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,abr-testing,$(project_rs_default),abr-testing)

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
wheel_file = $(call python_get_wheelname,abr-testing,$(project_rs_default),abr_testing)

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
	$(clean_cmd)

.PHONY: wheel
wheel: export OPENTRONS_PROJECT=$(PROJECT)
wheel: export HATCH_VCS_TUNABLE_TAG_PATTERN=$(call git_tag_regex_for_project,$(PROJECT))
wheel: export HATCH_VCS_TUNABLE_RAW_OPTIONS=$(call hatch_raw_options_for_project,$(PROJECT))
wheel:
	rm -rf dist/*.whl
	$(python) -m build --wheel .
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: lint
lint:
	$(python) -m mypy abr_testing tests
	$(python) -m black --check abr_testing tests
	$(python) -m flake8 abr_testing tests

.PHONY: format
format:
	$(python) -m black abr_testing tests

.PHONY: test
test:
	@echo "No tests yet"

.PHONY: push-no-restart-ot3
push-no-restart-ot3: wheel Pipfile.lock
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),dist/$(wheel_file),/opt/opentrons-robot-server/)
	ssh $(ssh_helper_ot3) root@$(host) \
		'set -e; mount -o remount,rw /; pip3 config --global unset install.root; \
		pip3 install --upgrade --ignore-installed -t /opt/opentrons-robot-server/ "slack-sdk==$(slack_sdk_version)"; \
		pip3 config --global set install.root /var/user-packages; mount -o remount,ro /'

.PHONY: push-ot3
push-ot3: push-no-restart-ot3

.PHONY: abr-setup
abr-setup:
	$(python) abr_testing/tools/abr_setup.py

.PHONY: simulate
PROTOCOL_DIR := abr_testing/protocols
SIMULATION_TOOL := abr_testing/protocol_simulation/abr_sim_check.py
EXTENSION := .py
simulate:
	$(python) $(SIMULATION_TOOL)

# Create a double-clickable shortcut that runs robot_fleet_error against an
# Errors folder. Requires robot_fleet_error.env beside the Errors folder with
# ABR_* configuration including ABR_ROBOT_IPS in robot_fleet_error.env.
opentrons_dir := $(abspath $(CURDIR)/..)
parent_dir := $(abspath $(CURDIR)/../..)
repo_name := $(notdir $(opentrons_dir))
errors_dir ?= $(parent_dir)/Errors
shortcut_base ?= robot_fleet_error

.PHONY: desktop-shortcut
ifeq ($(OS),Windows_NT)
shortcut_path ?= $(parent_dir)/$(shortcut_base).bat
desktop-shortcut:
	@printf '%s\r\n' \
		'@echo off' \
		'setlocal' \
		'rem Resolve the folder this script lives in (sibling of the $(repo_name) folder)' \
		'set "HERE=%~dp0"' \
		'set "ABR=%HERE%$(repo_name)\abr-testing"' \
		'rem Run inside the project pipenv environment so all deps are available' \
		'cd /d "%ABR%"' \
		'py -m pipenv run python -m abr_testing.data_collection.robot_fleet_error --env-file "%HERE%robot_fleet_error.env"' \
		'echo.' \
		'pause' \
		> "$(shortcut_path)"
	@mkdir -p "$(errors_dir)"
	@echo "Created shortcut: $(shortcut_path)"
	@echo "Errors folder: $(errors_dir)"
else
shortcut_path ?= $(parent_dir)/$(shortcut_base).command
desktop-shortcut:
	@printf '%s\n' \
		'#!/bin/zsh' \
		'' \
		'# Resolve the folder this script lives in (sibling of the $(repo_name) folder)' \
		'HERE="$${0:A:h}"' \
		'ABR="$$HERE/$(repo_name)/abr-testing"' \
		'' \
		'# Run inside the project pipenv environment so all deps are available' \
		'cd "$$ABR"' \
		'pipenv run python -m abr_testing.data_collection.robot_fleet_error --env-file "$$HERE/robot_fleet_error.env"' \
		'' \
		'# Keep the terminal window open so you can see the results' \
		'echo ""' \
		'read -k 1 "?Press any key to close..."' \
		> "$(shortcut_path)"
	@chmod +x "$(shortcut_path)"
	@mkdir -p "$(errors_dir)"
	@echo "Created shortcut: $(shortcut_path)"
	@echo "Errors folder: $(errors_dir)"
endif
