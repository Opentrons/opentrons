# opentrons platform makefile
# https://github.com/Opentrons/opentrons

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell yarn bin):$(PATH)

API_DIR := api
API_LIB_DIR := api-server-lib
DISCOVERY_CLIENT_DIR := discovery-client
SHARED_DATA_DIR := shared-data
UPDATE_SERVER_DIR := update-server

# this may be set as an environment variable to select the version of
# python to run if pyenv is not available. it should always be set to
# point to a python3.6.
OT_PYTHON ?= python

# watch, coverage, and update snapshot variables for tests
watch ?= false
cover ?= true
updateSnapshot ?= false

ifeq ($(watch), true)
	cover := false
endif

# install all project dependencies
# front-end dependecies handled by yarn
.PHONY: install
install:
	$(OT_PYTHON) -m pip install pipenv==11.6.8
	$(MAKE) -C $(API_LIB_DIR) install
	$(MAKE) -C $(API_DIR) install
	$(MAKE) -C $(UPDATE_SERVER_DIR) install
	yarn
	$(MAKE) -C $(SHARED_DATA_DIR) build
	$(MAKE) -C $(DISCOVERY_CLIENT_DIR)

# uninstall all project dependencies
# TODO(mc, 2018-03-22): API uninstall via pipenv --rm in api/Makefile
.PHONY: uninstall
uninstall:
	lerna clean

# install flow typed definitions for all JS projects that use flow
# typedefs are commited, so only needs to be run when we want to update
.PHONY: install-types
install-types:
	flow-mono align-versions
	flow-mono install-types --overwrite --flowVersion=0.61.0
	flow-typed install --overwrite --flowVersion=0.61.0

.PHONY: push-api
push-api:
	$(MAKE) -C $(API_LIB_DIR) push
	$(MAKE) -C $(API_DIR) push
	$(MAKE) -C $(API_DIR) restart

.PHONY: api-local-container
api-local-container:
	docker build --no-cache --build-arg base_image=resin/amd64-alpine-python:3.6-slim-20180123 --build-arg running_on_pi=0 --build-arg data_mkdir_path_slash_if_none=/data/system .

# all tests
.PHONY: test
test: test-py test-js

# Use lerna to run test only if anything in update-server has changed
# `--scope @opentrons/update-server` tells lerna to use the package.json that
#   uses this name (e.g.: the one in update-server/otupdate)
# `--since` gives the name of the upstream branch to check against
# `-- ` (with the space after) tells lerna to execute everything after this
# `-C ..` is here because the scope causes the working directory to change to
#   where it finds the package.json specified by --scope, and the Makefile is
#   in the parent of that directory
.PHONY: test-py
test-py:
#	lerna exec --scope @opentrons/update-server --since origin/edge -- $(MAKE) -C .. test
	$(MAKE) -C api test
	$(MAKE) -C api-server-lib test

.PHONY: test-js
test-js:
	jest \
		--runInBand \
		--coverage=$(cover) \
		--watch=$(watch) \
		--updateSnapshot=$(updateSnapshot)

# lints and typechecks
.PHONY: lint
lint: lint-py lint-js lint-css

.PHONY: lint-py
lint-py:
	$(MAKE) -C $(API_DIR) lint
	$(MAKE) -C $(API_LIB_DIR) lint
	$(MAKE) -C $(UPDATE_SERVER_DIR) lint

.PHONY: lint-js
lint-js:
	eslint '**/*.js'
	flow $(if $(CI),check,status)

.PHONY: lint-css
lint-css:
	stylelint '**/*.css'

# upload coverage reports
# uses codecov's bash upload script
# TODO(mc, 2018-08-28): add test as a task dependency once travis is setup to
# use this Makefile for tests
.PHONY: coverage
coverage:
	$(SHELL) <(curl -s https://codecov.io/bash) -X coveragepy

# TODO(mc, 2018-06-06): update publish call and echo note when lerna splits
# version bump and publish: https://github.com/lerna/lerna/issues/961
.PHONY: bump
bump:
	@echo "Bumping versions"
	@echo "(please ignore lerna mentioning 'publish'; publish is disabled)"
	lerna publish $(opts)
