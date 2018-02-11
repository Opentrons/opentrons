# opentrons platform makefile
# https://github.com/OpenTrons/opentrons

# add node_modules/.bin to PATH
PATH := $(shell yarn bin):$(PATH)

SHELL := /bin/bash

API_DIR := api
COMPONENTS_DIR := components
APP_DIR := app
APP_SHELL_DIR := app-shell
PROTOCOL_DESIGNER_DIR := protocol-designer

# install all project dependencies
# front-end dependecies handled by yarn
# TODO(mc, 2018-01-06): remove separate install for app-shell when
#   electron-builder can resolve yarn workspace deps
#   https://github.com/electron-userland/electron-builder/issues/2222
.PHONY: install
install:
	pip install pipenv
	$(MAKE) -C $(API_DIR) install
	yarn
	$(MAKE) -C $(APP_SHELL_DIR) install

# all tests
.PHONY: test
test: test-api test-components test-app test-pd

.PHONY: test-api
test-api:
	$(MAKE) -C $(API_DIR) test

.PHONY: test-components
test-components:
	$(MAKE) -C $(COMPONENTS_DIR) test

.PHONY: test-app
test-app:
	$(MAKE) -C $(APP_DIR) test

.PHONY: test-pd
test-pd:
	$(MAKE) -C $(PROTOCOL_DESIGNER_DIR) test

# lints and typechecks
.PHONY: lint
lint: lint-py lint-js lint-css

.PHONY: lint-py
lint-py:
	$(MAKE) -C $(API_DIR) lint

.PHONY: lint-js
lint-js:
	eslint '**/*.js'
	flow

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
