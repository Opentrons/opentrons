# opentrons robot server makefile

include ../scripts/push.mk
include ../scripts/python-uv.mk

SHX := npx shx
REDOC := npx @redocly/cli

# Path of source package
SRC_PATH = robot_server
SCRIPTS_PATH = scripts
TESTS_PATH = tests

# Find the version of the wheel from git using a helper script. We
# use python here so we can use the same version normalization that will be
# used to create the wheel.
wheel_file = dist/$(call python_get_wheelname,robot-server,$(project_rs_default),robot_server,$(BUILD_NUMBER))

# Find the branch, sha, version that will be used to update the VERSION.json file
version_file = $(call python_get_git_version,robot-server,$(project_rs_default),robot_server)

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

# When the env has BEHIND_DEV_PROXY=1 (or any non-empty string), switch the `make dev` port
# from 31950 to 31951, to support coexisting with other dev servers (auth-server, etc.)
# behind a reverse proxy on 31950. See `make dev-proxy` in the top-level Makefile.
BEHIND_DEV_PROXY ?=
dev_port_when_running_alone ?= "31950"
dev_port_when_behind_dev_proxy ?= "31951"
dev_port ?= $(if $(BEHIND_DEV_PROXY), $(dev_port_when_behind_dev_proxy), $(dev_port_when_running_alone))
dev_host ?= "localhost"
# todo(mm, 2021-07-08): Figure out how to run the server with Python development
# mode enabled, to expose more errors and warnings.
#   * Using a Makefile target-specific variable to set PYTHONDEVMODE=1
#     doesn't work because it applies the variable to the whole `uv run`
#     command, and we only want our inner server process running under dev mode,
#     not the outer uv process.
#   * Adding PYTHONDEVMODE=1 to the .env file specified by
#     OT_ROBOT_SERVER_DOT_ENV_PATH doesn't work because that's read too late.
#   * Doing `uv run env PYTHONDEVMODE=1 uvicorn ...` works, except it's
#     probably POSIX-only.
run_dev ?= uvicorn "robot_server.app:app" --host $(dev_host) --port $(dev_port) --ws wsproto --reload --reload-dir robot_server

.PHONY: all
all: clean wheel



.PHONY: setup
setup:
	@$(uv_sync_dev)
	@$(UV) pip list

.PHONY: setup-py
setup-py: setup

.PHONY: setup-ot2
setup-ot2:
	@$(uv_sync_dev)
	@$(UV) pip uninstall python-can
	@$(UV) pip list

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

.PHONY: test-unit-cov
test-unit-cov:
	$(pytest) $(tests) $(test_opts) -m 'not integration' $(cov_opts)

.PHONY: test-integration-cov
test-integration-cov:
	$(pytest) tests/integration $(test_opts) $(cov_opts)

.PHONY: test-fast
test-fast:
	$(pytest) $(tests) $(test_opts) -m 'not slow'

.PHONY: lint
lint:
	$(python) -m mypy $(SRC_PATH) $(SCRIPTS_PATH) $(TESTS_PATH)
	$(ruff) check .
	$(ruff) format --check .

.PHONY: format
format:
	$(ruff) format .
	$(ruff) check --select I --fix .

.PHONY: _dev
_dev:
	$(UV) run $(run_dev)

.PHONY: dev
dev: dev-ot2

.PHONY: dev-flex
dev-flex: export OT_ROBOT_SERVER_DOT_ENV_PATH ?= dev-flex.env
dev-flex: _dev

.PHONY: dev-ot2
dev-ot2: export OT_ROBOT_SERVER_DOT_ENV_PATH ?= dev.env
dev-ot2: _dev


.PHONY: dev-with-emulator
dev-with-emulator: export OT_ROBOT_SERVER_DOT_ENV_PATH ?= emulator.env
dev-with-emulator:
	$(UV) run $(run_dev)


.PHONY: dev-with-ot3-emulator
dev-with-ot3-emulator: export OT_ROBOT_SERVER_DOT_ENV_PATH ?= emulator_ot3.env
dev-with-ot3-emulator:
	$(UV) run $(run_dev)


.PHONY: local-shell
local-shell:
	$(UV) shell

.PHONY: push
push: wheel
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/usr/lib/python3.10/site-packages/)
	$(call push-systemd-unit,$(host),$(ssh_key),$(ssh_opts),./opentrons-robot-server.service)
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),opentrons-robot-server)

.PHONY: push-ot3
push-ot3: wheel
	$(call push-python,$(host),$(ssh_key),$(ssh_opts),$(wheel_file),/opt/opentrons-robot-server/)
	$(call stop-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-robot-server")
	$(call restart-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-pyro-nameserver opentrons-hardware-api")
	$(call start-service,$(host),$(ssh_key),$(ssh_opts),"opentrons-robot-server")

.PHONY: install-key
install-key:
	curl -X POST $(host):31950/server/ssh_keys\
		-H "Content-Type: application/json"\
		-d "{\"key\":\"$(shell cat $(ssh_pubkey))\"}"

.PHONY: restart
restart:
	curl -X POST http://$(host):31950/server/restart

.PHONY: change-right
change-right:
	curl -X POST \
		-H "Content-Type: application/json" \
		-d '{"target": "mount", "mount": "right", "point": [65, 40, 30]}' \
		http://$(host):31950/robot/move
	curl -X POST \
		-H "Content-Type: application/json" \
		-d '{"axes": ["c"]}' \
		http://$(host):31950/motors/disengage


.PHONY: change-left
change-left:
	curl -X POST \
		-H "Content-Type: application/json" \
		-d '{"target": "mount", "mount": "left", "point": [325, 40, 30]}' \
		http://$(host):31950/robot/move
	curl -X POST \
		-H "Content-Type: application/json" \
		-d '{"axes": ["b"]}' \
		http://$(host):31950/motors/disengage

# User must currently specify host, e.g.: `make term host=169.254.202.176`
.PHONY: term
term:
	ssh -i $(ssh_key) $(ssh_opts) root@$(host)


.PHONY: docs
docs:
	$(SHX) mkdir -p docs/build/
	$(python) ./scripts/spec_generator.py docs/build/openapi.json
	$(SHX) mkdir -p docs/dist/http
	$(REDOC) build-docs docs/build/openapi.json -o docs/dist/http/api_reference.html
