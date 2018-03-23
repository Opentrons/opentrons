# opentrons platform makefile
# https://github.com/OpenTrons/opentrons

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell yarn bin):$(PATH)

API_DIR := api
COMPONENTS_DIR := components
APP_DIR := app
APP_SHELL_DIR := app-shell
LABWARE_DEFINITIONS_DIR := labware-definitions
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
	$(MAKE) -C $(API_DIR) install
	yarn
	$(MAKE) -C $(LABWARE_DEFINITIONS_DIR) build
	$(MAKE) install-types

# uninstall all project dependencies
# TODO(mc, 2018-03-22): API uninstall via pipenv --rm in api/Makefile
.PHONY: uninstall
uninstall:
	shx rm -rf '**/node_modules'

.PHONY: install-types
install-types:
	flow-typed install --flowVersion=0.61.0
	# install type definitions for all projects, project-by-project
	$(MAKE) -C $(APP_DIR) install-types
	$(MAKE) -C $(COMPONENTS_DIR) install-types
	$(MAKE) -C $(LABWARE_DEFINITIONS_DIR) install-types
	$(MAKE) -C $(PROTOCOL_DESIGNER_DIR) install-types

# all tests
.PHONY: test
test: test-api test-js

.PHONY: test-api
test-api:
	$(MAKE) -C $(API_DIR) test

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
