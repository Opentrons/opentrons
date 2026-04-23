include ../scripts/push.mk
include ../scripts/python-uv.mk

SHX := npx shx

# Path of source package
SRC_PATH = key_server
TESTS_PATH = tests

# Find the version of the wheel from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
wheel_file = dist/$(call python_get_wheelname,key-server,$(project_rs_default),key_server,$(BUILD_NUMBER))

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,key-server,$(project_rs_default),key_server)

# These variables can be overriden when make is invoked to customize the
# behavior of pytest. For instance,
# make test tests=tests/opentrons/tools/test_qc_scripts.py would run only the
# specified test
tests ?= tests
cov_opts ?= --cov=$(SRC_PATH) --cov-report term-missing:skip-covered --cov-report xml:coverage.xml
test_opts ?=


# Host key location for robot
ssh_key ?= $(default_ssh_key)
# Pubkey location for robot to install with install-key
ssh_pubkey ?= $(ssh_key).pub
# Other SSH args for robot
ssh_opts ?= $(default_ssh_opts)

# Source discovery
# For the python sources
ot_py_sources := $(filter %.py,$(shell $(SHX) find $(SRC_PATH)))
ot_sources := $(ot_py_sources)

# Defined separately than the clean target so the wheel file doesn’t have to
# depend on a PHONY target
clean_cmd = $(SHX) rm -rf build .coverage coverage.xml '*.egg-info'
clean_cache_cmd = $(SHX) rm -rf '**/__pycache__' '**/*.pyc' '**/.mypy_cache'
clean_wheel_cmd = $(clean_cmd) dist/*.whl
clean_all_cmd = $(clean_cmd) dist
dev_port ?= "33960"

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

.PHONY: clean
clean:
	$(clean_all_cmd)
	$(clean_cache_cmd)

.PHONY: teardown
teardown:
	$(SHX) rm -rf .venv

.PHONY: wheel
wheel: export OPENTRONS_PROJECT=$(PROJECT)
wheel: export HATCH_VCS_TUNABLE_TAG_PATTERN=$(call git_tag_regex_for_project,$(PROJECT))
wheel: export HATCH_VCS_TUNABLE_RAW_OPTIONS=$(call hatch_raw_options_for_project,$(PROJECT))
wheel: $(ot_sources)
	$(clean_wheel_cmd)
	$(python) -m build --wheel .
	$(SHX) rm -rf build
	$(SHX) ls dist

.PHONY: test
test:
	$(pytest) $(tests) $(test_opts)

.PHONY: test-cov
test-cov:
	$(pytest) $(tests) $(test_opts) $(cov_opts)

.PHONY: lint
lint:
	$(python) -m mypy $(SRC_PATH) $(TESTS_PATH)
	$(ruff) check .
	$(ruff) format --check .

.PHONY: format
format:
	$(ruff) format .
	$(ruff) check --select I --fix .

# the dev task is pretty good for running the server just locally for quick tests.
.PHONY: dev
dev:
	OT_KEY_SERVER_dot_env_path=dev.env $(python) -m key_server --port $(dev_port) --reload --log-level=debug

# the dev-mitmproxy task integrates with the whole-backend mode that runs a reverse proxy in
# front of all the servers. don't run it unless you're going to run mitmproxy
.PHONY: dev-mitmproxy
dev-mitmproxy:
	OT_KEY_SERVER_dot_env_path=dev-mitmproxy.env $(python) -m key_server --port $(dev_port) --reload --log-level=debug

# Note: No `push` target, since this project only runs on Flex (OT-3), not OT-2.

.PHONY: push-ot3
push-ot3: wheel
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/opt/opentrons-key-server/)
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),opentrons-key-server)
