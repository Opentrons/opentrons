# shared-data makefile
include ../scripts/python.mk
include ../scripts/push.mk

# Host key location for buildroot robot
br_ssh_key ?= $(default_ssh_key)
# Other SSH args for buildroot robots
ssh_opts ?= $(default_ssh_opts)


# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# TODO(mc, 2018-10-25): use dist to match other projects
BUILD_DIR := build

wheel_file = $(BUILD_DIR)/$(call python_get_wheelname,shared-data,opentrons_shared_data)

py_sources = $(filter %.py,$(shell $(SHX) find python/opentrons_shared_data))

twine_auth_args := --username $(pypi_username) --password $(pypi_password)

#######################################

.PHONY: all
all: clean dist

.PHONY: install-js
install-js:
	yarn
	$(MAKE) dist

.PHONY: install-py
install-py:
	$(pipenv_envvars) pipenv sync $(pipenv_opts)
	$(pipenv_envvars) pipenv run pip freeze

.PHONY: install
install: install-py install-js


.PHONY: dist
dist:
	@shx mkdir -p $(BUILD_DIR)
	node js/scripts/build.js $(BUILD_DIR)

.PHONY: clean
clean:
	shx rm -rf $(BUILD_DIR)


.PHONY: wheel
wheel: $(wheel_file)

$(BUILD_DIR)/opentrons_shared_data-%-py2.py3-none-any.whl: python/setup.py $(py_sources)
	$(SHX) cd python && $(python) setup.py $(wheel_opts) bdist_wheel
	$(SHX) mv python/dist/$(notdir $(wheel_file)) $(BUILD_DIR)/
	$(SHX) rm -rf python/build python/dist *.egg_info
	$(SHX) ls $(BUILD_DIR)

.PHONY: lint-py
lint-py: $(py_sources)
	$(SHX) cd python && $(python) -m mypy opentrons_shared_data
	$(SHX) cd python && $(python) -m pylama opentrons_shared_data

.PHONY: push-no-restart
push-no-restart: $(wheel_file)
	$(call push-python-package,$(host),$(br_ssh_key),$(ssh_opts),$(wheel_file))

.PHONY: push
push: push-no-restart
	$(call restart-service,$(host),$(br_ssh_key),$(ssh_opts),opentrons-robot-server)

.PHONY: deploy-staging
deploy-staging: wheel
	-$(python) -m twine upload --repository-url "https://test.pypi.org/legacy/"\
                             $(twine_auth_args)\
                             $(wheel_file)

.PHONY: deploy
deploy: wheel
	$(python) -m twine upload $(twine_auth_args)\
                            $(wheel_file)
