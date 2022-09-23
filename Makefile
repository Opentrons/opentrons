# opentrons platform makefile
# https://github.com/Opentrons/opentrons

# make OT_PYTHON available
include ./scripts/python.mk

APP_SHELL_DIR := app-shell
COMPONENTS_DIR := components
DISCOVERY_CLIENT_DIR := discovery-client
LABWARE_LIBRARY_DIR := labware-library
PROTOCOL_DESIGNER_DIR := protocol-designer

SHARED_DATA_DIR := shared-data

API_DIR := api
UPDATE_SERVER_DIR := update-server
ROBOT_SERVER_DIR := robot-server
HARDWARE_DIR := hardware
G_CODE_TESTING_DIR := g-code-testing
HARDWARE_TESTING_DIR := hardware-testing
NOTIFY_SERVER_DIR := notify-server
ENVIRONMENTS := environments

PYTHON_SETUP_DIRS := $(ENVIRONMENTS) $(G_CODE_TESTING_DIR) $(HARDWARE_TESTING_DIR)
PYTHON_CLEAN_DIRS := $(API_DIR) $(UPDATE_SERVER_DIR) $(NOTIFY_SERVER_DIR) $(ROBOT_SERVER_DIR) $(SHARED_DATA_DIR)/python $(HARDWARE_DIR) $(G_CODE_TESTING_DIR) $(HARDWARE_TESTING_DIR)
PYTHON_TEARDOWN_DIRS := $(PYTHON_SETUP_DIRS)

# This may be set as an environment variable (and is by CI tasks that upload
# to test pypi) to add a .dev extension to the python package versions. If
# empty, no .dev extension is appended, so this definition is here only as
# documentation
BUILD_NUMBER ?=

# watch, coverage, update snapshot, and warning suppresion variables for tests and linting
watch ?= false
cover ?= true
updateSnapshot ?= false
quiet ?= false

FORMAT_FILE_GLOB = ".*.@(js|ts|tsx|yml)" "**/*.@(ts|tsx|js|json|md|yml)"

ifeq ($(watch), true)
	cover := false
endif

# run at usage (=), not on makefile parse (:=)
# todo(mm, 2021-03-17): Deduplicate with scripts/python.mk.
usb_host=$(shell yarn run -s discovery find -i 169.254)

# install all project dependencies
.PHONY: setup
setup: setup-js setup-py

# front-end dependecies handled by yarn
.PHONY: setup-js
setup-js:
	yarn config set network-timeout 60000
	yarn
	$(MAKE) -C $(APP_SHELL_DIR) setup
	$(MAKE) -C $(SHARED_DATA_DIR) setup-js

# If pyenv is setup as expected, these resolve.
.PHONY: install-pipenv
install-pipenv:
	python3.8 -m pip install pipenv==2021.5.29
	python3.10 -m pip install pipenv==2021.5.29

PYTHON_SETUP_TARGETS := $(addsuffix -py-setup, $(PYTHON_SETUP_DIRS))

%-py-setup:
	$(MAKE) -C $* setup

.PHONY: setup-py
setup-py:
	$(MAKE) install-pipenv
	$(MAKE) $(PYTHON_SETUP_TARGETS)

# uninstall all project dependencies
# tear down JS after Python, because Python cleanup depends on JS dep shx
.PHONY: teardown
teardown:
	$(MAKE) teardown-py
	$(MAKE) teardown-js

.PHONY: teardown-js
teardown-js: clean-js
	yarn shx rm -rf "**/node_modules"

.PHONY: teardown-py
teardown-py:
	$(MAKE) install-pipenv
	$(MAKE) $(PYTHON_TEARDOWN_TARGETS)
	$(MAKE) $(PYTHON_CLEAN_TARGETS)

PYTHON_TEARDOWN_TARGETS := $(addsuffix -py-teardown, $(PYTHON_TEARDOWN_DIRS))

%-py-teardown:
	$(MAKE) -C $* teardown

# clean all project output
.PHONY: clean
clean: clean-js clean-py

.PHONY: clean-js
clean-js: clean-ts
	$(MAKE) -C $(DISCOVERY_CLIENT_DIR) clean
	$(MAKE) -C $(COMPONENTS_DIR) clean

PYTHON_CLEAN_TARGETS := $(addsuffix -py-clean, $(PYTHON_CLEAN_DIRS))

.PHONY: clean-py
clean-py: $(PYTHON_CLEAN_TARGETS)

%-py-clean:
	$(MAKE) -C $* clean

.PHONY: deploy-py
deploy-py: export twine_repository_url = $(twine_repository_url)
deploy-py: export pypi_username = $(pypi_username)
deploy-py: export pypi_password = $(pypi_password)
deploy-py:
	$(MAKE) -C $(API_DIR) deploy
	$(MAKE) -C $(SHARED_DATA_DIR) deploy-py

.PHONY: push-api
push-api: export host = $(usb_host)
push-api:
	$(if $(host),@echo "Pushing to $(host)",$(error host variable required))
	$(MAKE) -C $(API_DIR) push

.PHONY: push-update-server
push-update-server: export host = $(usb_host)
push-update-server:
	$(if $(host),@echo "Pushing to $(host)",$(error host variable required))
	$(MAKE) -C $(UPDATE_SERVER_DIR) push

.PHONY: push
push: export host=$(usb_host)
push:
	$(if $(host),@echo "Pushing to $(host)",$(error host variable required))
	# TODO (amit, 2021-09-28): re-enable when opentrons-hardware is worth deploying.
	# $(MAKE) -C $(HARDWARE_DIR) push-no-restart
	# sleep 1
	$(MAKE) -C $(API_DIR) push-no-restart
	sleep 1
	$(MAKE) -C $(SHARED_DATA_DIR) push-no-restart
	sleep 1
	$(MAKE) -C $(UPDATE_SERVER_DIR) push
	sleep 1
	$(MAKE) -C $(NOTIFY_SERVER_DIR) push
	sleep 1
	$(MAKE) -C $(ROBOT_SERVER_DIR) push


.PHONY: push-ot3
push-ot3:
	$(if $(host),@echo "Pushing to $(host)",$(error host variable required))
	$(MAKE) -C $(API_DIR) push-no-restart-ot3
	$(MAKE) -C $(HARDWARE_DIR) push-no-restart-ot3
	$(MAKE) -C $(SHARED_DATA_DIR) push-no-restart-ot3
	$(MAKE) -C $(NOTIFY_SERVER_DIR) push-no-restart-ot3
	$(MAKE) -C $(ROBOT_SERVER_DIR) push-ot3
	$(MAKE) -C $(UPDATE_SERVER_DIR) push-ot3


.PHONY: term
term: export host = $(usb_host)
term:
	$(if $(host),@echo "Connecting to $(host)",$(error host variable required))
	$(MAKE) -C $(API_DIR) term

# all tests
.PHONY: test
test: test-py test-js

# tests that may be run on windows
.PHONY: test-windows
test-windows: test-js test-py-windows

.PHONY: test-e2e
test-e2e:
	$(MAKE) -C $(LABWARE_LIBRARY_DIR) test-e2e
	$(MAKE) -C $(PROTOCOL_DESIGNER_DIR) test-e2e

.PHONY: test-py-windows
test-py-windows:
	$(MAKE) -C $(HARDWARE_DIR) test
	$(MAKE) -C $(API_DIR) test
	$(MAKE) -C $(SHARED_DATA_DIR) test-py

.PHONY: test-py
test-py: test-py-windows
	$(MAKE) -C $(UPDATE_SERVER_DIR) test
	$(MAKE) -C $(ROBOT_SERVER_DIR) test
	$(MAKE) -C $(NOTIFY_SERVER_DIR) test
	$(MAKE) -C $(G_CODE_TESTING_DIR) test

.PHONY: test-js
test-js:
	yarn jest \
		--coverage=$(cover) \
		--watch=$(watch) \
		--updateSnapshot=$(updateSnapshot) \
		--ci=$(if $(CI),true,false)

# lints and typechecks
.PHONY: lint
lint: lint-py lint-js lint-json lint-css check-js circular-dependencies-js

PYTHON_LINT_TARGETS  = $(addsuffix -py-lint, $(PYTHON_DIRS))

.PHONY: lint-py
lint-py: $(PYTHON_LINT_TARGETS)

%-py-lint:
	$(MAKE) -C $* lint

.PHONY: lint-js
lint-js:
	yarn eslint --quiet=$(quiet) ".*.@(js|ts|tsx)" "**/*.@(js|ts|tsx)"
	yarn prettier --ignore-path .eslintignore --check $(FORMAT_FILE_GLOB)

.PHONY: lint-json
lint-json:
	yarn eslint --max-warnings 0 --ext .json .

.PHONY: lint-css
lint-css:
	yarn stylelint "**/*.css" "**/*.js"

.PHONY: format
format: format-js format-py

PYTHON_FORMAT_TARGETS := $(addsuffix -py-format, $(PYTHON_DIRS))

.PHONY: format-py
format-py: $(PYTHON_FORMAT_TARGETS)

%-py-format:
	$(MAKE) -C $* format

.PHONY: format-js
format-js:
	yarn prettier --ignore-path .eslintignore --write $(FORMAT_FILE_GLOB)

.PHONY: check-js
check-js: build-ts

.PHONY: build-ts
build-ts:
	yarn tsc --build

.PHONY: clean-ts
clean-ts:
	yarn tsc --build --clean

# TODO: Ian 2019-12-17 gradually add components and shared-data
.PHONY: circular-dependencies-js
circular-dependencies-js:
	yarn madge $(and $(CI),--no-spinner --no-color) --circular protocol-designer/src/index.tsx
	yarn madge $(and $(CI),--no-spinner --no-color) --circular step-generation/src/index.ts
	yarn madge $(and $(CI),--no-spinner --no-color) --circular labware-library/src/index.tsx
	yarn madge $(and $(CI),--no-spinner --no-color) --circular app/src/index.tsx

.PHONY: bump
bump:
	@echo "Bumping versions"
	yarn lerna version $(or $(version),prerelease)
