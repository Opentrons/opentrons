# opentrons platform makefile
# https://github.com/OpenTrons/opentrons

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell yarn bin):$(PATH)

API_DIR := api
API_LIB_DIR := api-server-lib
COMPONENTS_DIR := components
APP_DIR := app
APP_SHELL_DIR := app-shell
LABWARE_DEFINITIONS_DIR := shared-data
PROTOCOL_DESIGNER_DIR := protocol-designer

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
	pip install pipenv==11.6.8
	$(MAKE) -C $(API_LIB_DIR) install
	$(MAKE) -C $(API_DIR) install
	yarn
	$(MAKE) -C $(LABWARE_DEFINITIONS_DIR) build

# uninstall all project dependencies
# TODO(mc, 2018-03-22): API uninstall via pipenv --rm in api/Makefile
.PHONY: uninstall
uninstall:
	shx rm -rf '**/node_modules'

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

# all tests
.PHONY: test
test: test-api test-js

.PHONY: test-api
test-api:
	$(MAKE) -C $(API_DIR) test
	$(MAKE) -C $(API_LIB_DIR) test

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

.PHONY: lint-js
lint-js:
	eslint '**/*.js'
	flow check

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
