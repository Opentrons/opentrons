# opentrons platform makefile
# https://github.com/OpenTrons/opentrons

SHELL := /bin/bash

API_DIR := api
COMPONENTS_DIR := components
APP_DIR := app
APP_SHELL_DIR := app-shell
PROTOCOL_DESIGNER_DIR := protocol-designer

# install project dependencies for both api and app
# front-end dependecies handled by yarn
# TODO(mc, 2018-01-06): remove separate install for app-shell when
#   electron-builder can resolve yarn workspace deps
#   https://github.com/electron-userland/electron-builder/issues/2222
.PHONY: install
install:
	$(MAKE) -C $(API_DIR) install
	yarn
	$(MAKE) -C $(APP_SHELL_DIR) install

# run api and app tests
.PHONY: test
test:
	$(MAKE) -C $(API_DIR) test
	$(MAKE) -C $(COMPONENTS_DIR) test
	$(MAKE) -C $(APP_DIR) test
	$(MAKE) -C $(PROTOCOL_DESIGNER_DIR) test

# upload coverage reports
# uses codecov's bash upload script
# TODO(mc, 2018-08-28): add test as a task dependency once travis is setup to
# use this Makefile for tests
.PHONY: coverage
coverage:
	$(SHELL) <(curl -s https://codecov.io/bash) -X coveragepy
