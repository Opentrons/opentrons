# opentrons platform makefile
# https://github.com/Opentrons/opentrons

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell yarn bin):$(PATH)

API_DIR := api
DISCOVERY_CLIENT_DIR := discovery-client
LABWARE_LIBRARY_DIR := labware-library
PROTOCOL_DESIGNER_DIR := protocol-designer
SHARED_DATA_DIR := shared-data
UPDATE_SERVER_DIR := update-server
ROBOT_SERVER_DIR := robot-server

# this may be set as an environment variable to select the version of
# python to run if pyenv is not available. it should always be set to
# point to a python3.6.
OT_PYTHON ?= python

# watch, coverage, and update snapshot variables for tests
watch ?= false
cover ?= true
updateSnapshot ?= false

FORMAT_FILE_GLOB = ".*.@(js|yml)" "**/*.@(js|json|md|yml)"

ifeq ($(watch), true)
	cover := false
endif

# run at usage (=), not on makefile parse (:=)
usb_host=$(shell yarn run -s discovery find -i 169.254 fd00 -c "[fd00:0:cafe:fefe::1]")


# install all project dependencies
.PHONY: install
install: install-js install-py

.PHONY: install-py
install-py:
	$(OT_PYTHON) -m pip install pipenv==2018.10.9
	$(MAKE) -C $(API_DIR) install
	$(MAKE) -C $(UPDATE_SERVER_DIR) install
	$(MAKE) -C $(ROBOT_SERVER_DIR) install

# front-end dependecies handled by yarn
.PHONY: install-js
install-js:
	yarn
	$(MAKE) -j 1 -C $(SHARED_DATA_DIR)
	$(MAKE) -j 1 -C $(DISCOVERY_CLIENT_DIR)

# uninstall all project dependencies
# TODO(mc, 2018-03-22): API uninstall via pipenv --rm in api/Makefile
.PHONY: uninstall
uninstall:
	$(MAKE) -C $(API_DIR) clean uninstall
	shx rm -rf '**/node_modules'

.PHONY: push-api-balena
push-api-balena: export host = $(usb_host)
push-api-balena:
	$(if $(host),@echo "Pushing to $(host)",$(error host variable required))
	$(MAKE) -C $(API_DIR) push-balena
	$(MAKE) -C $(API_DIR) restart

.PHONY: push-api
push-api: export host = $(usb_host)
push-api:
	$(if $(host),@echo "Pushing to $(host)",$(error host variable required))
	$(MAKE) -C $(API_DIR) push

.PHONY: push-api-buildroot
push-api-buildroot: push-api

.PHONY: push-update-server
push-update-server: export host = $(usb_host)
push-update-server:
	$(if $(host),@echo "Pushing to $(host)",$(error host variable required))
	$(MAKE) -C $(UPDATE_SERVER_DIR) push

.PHONY: push
push: export host=$(usb_host)
push:
	$(if $(host),@echo "Pushing to $(host)",$(error host variable required))
	$(MAKE) -C $(API_DIR) push
	sleep 1
	$(MAKE) -C $(UPDATE_SERVER_DIR) push


.PHONY: term
term: export host = $(usb_host)
term:
	$(if $(host),@echo "Connecting to $(host)",$(error host variable required))
	$(MAKE) -C $(API_DIR) term

# all tests
.PHONY: test
test: test-py test-js

.PHONY: test-e2e
test-e2e:
	$(MAKE) -C $(LABWARE_LIBRARY_DIR) test-e2e
	$(MAKE) -C $(PROTOCOL_DESIGNER_DIR) test-e2e

.PHONY: test-py
test-py:
	$(MAKE) -C api test
	$(MAKE) -C robot-server test
	$(MAKE) -C update-server test tests=tests/buildroot/
	$(MAKE) -C update-server test tests=tests/migration/

.PHONY: test-js
test-js:
	jest \
		--coverage=$(cover) \
		--watch=$(watch) \
		--updateSnapshot=$(updateSnapshot) \
		--ci=$(if $(CI),true,false)

# lints and typechecks
.PHONY: lint
lint: lint-py lint-js lint-json lint-css check-js circular-dependencies-js

.PHONY: format
format:
ifeq ($(watch),true)
	onchange $(FORMAT_FILE_GLOB) -- prettier --ignore-path .eslintignore --write {{changed}}
else
	prettier --ignore-path .eslintignore $(if $(CI),--check,--write) $(FORMAT_FILE_GLOB)
endif

.PHONY: lint-py
lint-py:
	$(MAKE) -C $(API_DIR) lint
	$(MAKE) -C $(UPDATE_SERVER_DIR) lint
	$(MAKE) -C $(ROBOT_SERVER_DIR) lint

.PHONY: lint-js
lint-js:
	eslint ".*.js" "**/*.js"

.PHONY: lint-json
lint-json:
	eslint --max-warnings 0 --ext .json .

.PHONY: lint-css
lint-css:
	stylelint "**/*.css" "**/*.js"

.PHONY: check-js
check-js:
	flow $(if $(CI),check,status)

# TODO: Ian 2019-12-17 gradually add components and shared-data
.PHONY: circular-dependencies-js
circular-dependencies-js:
	madge $(and $(CI),--no-spinner --no-color) --circular protocol-designer/src/index.js
	madge $(and $(CI),--no-spinner --no-color) --circular labware-library/src/index.js
	madge $(and $(CI),--no-spinner --no-color) --circular app/src/index.js

# upload coverage reports
.PHONY: coverage
coverage:
	codecov

.PHONY: bump
bump:
	@echo "Bumping versions"
	lerna version $(or $(version),prerelease)
