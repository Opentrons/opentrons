# opentrons platform makefile
# https://github.com/Opentrons/opentrons

# make OT_PYTHON available
include ./scripts/python.mk

API_CLIENT_DIR := api-client
API_DIR := api
APP_DIR := app
APP_SHELL_DIR := app-shell
APP_SHELL_ODD_DIR := app-shell-odd
AUTH_SERVER_DIR := auth-server
COMPONENTS_DIR := components
DISCOVERY_CLIENT_DIR := discovery-client
G_CODE_TESTING_DIR := g-code-testing
HARDWARE_DIR := hardware
LABWARE_LIBRARY_DIR := labware-library
NODE_USB_BRIDGE_CLIENT_DIR := usb-bridge/node-client
PROTOCOL_DESIGNER_DIR := protocol-designer
REACT_API_CLIENT_DIR := react-api-client
ROBOT_SERVER_DIR := robot-server
SERVER_UTILS_DIR := server-utils
SHARED_DATA_DIR := shared-data
STEP_GENERATION_DIR := step-generation
SYSTEM_SERVER_DIR := system-server
UPDATE_SERVER_DIR := update-server
USB_BRIDGE_DIR := usb-bridge

PYTHON_DIRS := $(API_DIR) $(AUTH_SERVER_DIR) $(G_CODE_TESTING_DIR) $(HARDWARE_DIR) $(ROBOT_SERVER_DIR) $(SERVER_UTILS_DIR) $(SHARED_DATA_DIR) $(SYSTEM_SERVER_DIR) $(UPDATE_SERVER_DIR) $(USB_BRIDGE_DIR)

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

FORMAT_FILE_GLOB = ".*.@(js|ts|tsx|yml|mjs|mts)" "**/*.@(ts|tsx|js|mts|mjs|json|md|yml)"

ifeq ($(watch), true)
	cover := false
endif

# run at usage (=), not on makefile parse (:=)
# todo(mm, 2021-03-17): Deduplicate with scripts/python.mk.
usb_host=$(shell yarn -s discovery find -i 169.254)

# install all project dependencies
.PHONY: setup
setup: setup-js setup-py

# front-end dependencies handled by yarn
.PHONY: setup-js
setup-js:
	yarn config set network-timeout 60000
	yarn
	$(MAKE) -C $(APP_SHELL_DIR) setup
	$(MAKE) -C $(APP_SHELL_ODD_DIR) setup

PYTHON_SETUP_TARGETS := $(addsuffix -py-setup, $(PYTHON_DIRS))

.PHONY: setup-py
setup-py:
	$(MAKE) $(PYTHON_SETUP_TARGETS)

%-py-setup:
	$(MAKE) -C $* setup

$(SHARED_DATA_DIR)-py-setup:
	$(MAKE) -C $(SHARED_DATA_DIR) setup-py

# uninstall all project dependencies
# tear down JS after Python, because Python cleanup depends on JS dep shx
.PHONY: teardown
teardown:
	$(MAKE) teardown-py
	$(MAKE) teardown-js

.PHONY: teardown-js
teardown-js: clean-js
	yarn shx rm -rf "**/node_modules"

PYTHON_TEARDOWN_TARGETS := $(addsuffix -py-teardown, $(PYTHON_DIRS))

.PHONY: teardown-py
teardown-py: $(PYTHON_TEARDOWN_TARGETS)

%-py-teardown: %-py-clean
	$(MAKE) -C $* teardown

# Specialize the %-py-teardown pattern rule above to account for the Makefile duopoly in shared-data.
$(SHARED_DATA_DIR)-py-teardown: $(SHARED_DATA_DIR)-py-clean
	$(MAKE) -C $(SHARED_DATA_DIR) teardown-py

# clean all project output
.PHONY: clean
clean: clean-js clean-py

.PHONY: clean-js
clean-js: clean-ts
	$(MAKE) -C $(DISCOVERY_CLIENT_DIR) clean
	$(MAKE) -C $(NODE_USB_BRIDGE_CLIENT_DIR) clean
	$(MAKE) -C $(COMPONENTS_DIR) clean

PYTHON_CLEAN_TARGETS := $(addsuffix -py-clean, $(PYTHON_DIRS))

.PHONY: clean-py
clean-py: $(PYTHON_CLEAN_TARGETS)

%-py-clean:
	$(MAKE) -C $* clean

# Specialize the %-py-clean pattern rule above to account for the Makefile duopoly in shared-data.
$(SHARED_DATA_DIR)-py-clean:
	$(MAKE) -C $(SHARED_DATA_DIR) clean-py

PYTHON_LOCK_TARGETS := $(addsuffix -py-lock, $(PYTHON_DIRS))

.PHONY: lock-py
lock-py: $(PYTHON_LOCK_TARGETS)

%-py-lock:
	$(MAKE) -C $* lock

# Specialize the %-py-lock pattern rule above to account for the Makefile duopoly in shared-data.
$(SHARED_DATA_DIR)-py-lock:
	$(MAKE) -C $(SHARED_DATA_DIR) lock-py

.PHONY: deploy-py
deploy-py: export twine_repository_url = $(twine_repository_url)
deploy-py: export pypi_username = $(pypi_username)
deploy-py: export pypi_password = $(pypi_password)
deploy-py:
	$(MAKE) -C $(API_DIR) deploy
	$(MAKE) -C $(SHARED_DATA_DIR) deploy

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
	$(MAKE) -C $(SHARED_DATA_DIR) push-no-restart
	sleep 1
	$(MAKE) -C $(API_DIR) push-no-restart
	sleep 1
	$(MAKE) -C $(SERVER_UTILS_DIR) push
	sleep 1
	$(MAKE) -C $(SYSTEM_SERVER_DIR) push
	sleep 1
	$(MAKE) -C $(ROBOT_SERVER_DIR) push
	sleep 1
	$(MAKE) -C $(UPDATE_SERVER_DIR) push

.PHONY: push-folder
PUSH_HELPER := abr-testing/abr_testing/tools/make_push.py
push-folder:
	$(OT_PYTHON) $(PUSH_HELPER)

.PHONY: push-ot3
push-ot3:
	$(if $(host),@echo "Pushing to $(host)",$(error host variable required))
	$(MAKE) -C $(SHARED_DATA_DIR) push-no-restart-ot3
	$(MAKE) -C $(HARDWARE_DIR) push-no-restart-ot3
	$(MAKE) -C $(API_DIR) push-no-restart-ot3
	$(MAKE) -C $(SERVER_UTILS_DIR) push-ot3
	$(MAKE) -C $(AUTH_SERVER_DIR) push-ot3
	$(MAKE) -C $(ROBOT_SERVER_DIR) push-ot3
	$(MAKE) -C $(SYSTEM_SERVER_DIR) push-ot3
	$(MAKE) -C $(UPDATE_SERVER_DIR) push-ot3
	$(MAKE) -C $(USB_BRIDGE_DIR) push-ot3


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

PYTHON_TEST_TARGETS := $(addsuffix -py-test, $(PYTHON_DIRS))
WINDOWS_PYTHON_TEST_TARGETS := $(addsuffix -py-test, $(HARDWARE_DIR) $(API_DIR) $(SHARED_DATA_DIR)/python)

.PHONY: test-py
test-py: $(PYTHON_TEST_TARGETS)

.PHONY: test-py-windows
test-py-windows: $(WINDOWS_PYTHON_TEST_TARGETS)

%-py-test:
	$(MAKE) -C $* test

$(SHARED_DATA_DIR)-py-test:
	$(MAKE) -C $(SHARED_DATA_DIR) test-py

.PHONY: test-js
test-js: test-js-internal

# lints and typechecks
.PHONY: lint
lint: lint-py lint-js lint-json lint-css check-js check-css circular-dependencies-js

PYTHON_LINT_TARGETS  = $(addsuffix -py-lint, $(PYTHON_DIRS))

.PHONY: lint-py
lint-py: $(PYTHON_LINT_TARGETS)

%-py-lint:
	$(MAKE) -C $* lint

$(SHARED_DATA_DIR)-py-lint:
	$(MAKE) -C $(SHARED_DATA_DIR) lint-py

.PHONY: lint-js
lint-js: lint-js-eslint lint-js-prettier

.PHONY: lint-js-eslint
lint-js-eslint:
	yarn eslint --quiet=$(quiet) --ignore-pattern "node_modules/" ".*.@(js|ts|tsx)" "**/*.@(js|ts|tsx)"

.PHONY: lint-js-prettier
lint-js-prettier:
	yarn prettier --ignore-path .eslintignore --check $(FORMAT_FILE_GLOB)


.PHONY: lint-json
lint-json:
	yarn eslint --ignore-pattern "abr-testing/protocols/" --max-warnings 0 --ext .json .

.PHONY: lint-css
lint-css:
	yarn stylelint "**/*.css" "**/*.js"

.PHONY: format
format: format-js format-py format-css

PYTHON_FORMAT_TARGETS := $(addsuffix -py-format, $(PYTHON_DIRS))

.PHONY: format-py
format-py: $(PYTHON_FORMAT_TARGETS)

%-py-format:
	$(MAKE) -C $* format

$(SHARED_DATA_DIR)-py-format:
	$(MAKE) -C $(SHARED_DATA_DIR) format-py

.PHONY: format-js
format-js:
	yarn prettier --ignore-path .eslintignore --write $(FORMAT_FILE_GLOB)

.PHONY: format-css
format-css:
	yarn stylelint "**/*.css" --fix

.PHONY: check-js
check-js: build-ts

.PHONY: build-ts
build-ts:
	yarn tsc --build

.PHONY: clean-ts
clean-ts:
	yarn tsc --build --clean

# TODO: Ian 2019-12-17 gradually add components and shared-data
JS_CIRCULAR_DEPENDENCIES_ROOTS := \
	$(PROTOCOL_DESIGNER_DIR)/src/index.tsx \
	$(STEP_GENERATION_DIR)/src/index.ts \
	$(LABWARE_LIBRARY_DIR)/src/index.tsx \
	$(APP_DIR)/src/index.tsx \
	$(COMPONENTS_DIR)/src/index.ts

JS_CIRCULAR_DEPENDENCIES_TARGETS := $(addsuffix -circular-dependencies-js, $(JS_CIRCULAR_DEPENDENCIES_ROOTS))

.PHONY: circular-dependencies-js
circular-dependencies-js: $(JS_CIRCULAR_DEPENDENCIES_TARGETS)

%-circular-dependencies-js:
	yarn madge $(and $(CI),--no-spinner --no-color) --circular $*

.PHONY: test-js-internal
test-js-internal:
	yarn vitest $(tests) $(test_opts) $(cov_opts)

.PHONY: test-js-%
test-js-%: 
	$(MAKE) test-js-internal tests="$(if $(tests),$(foreach test,$(tests),$*/$(test)),$*)" test_opts="$(test_opts)" cov_opts="$(cov_opts)"

.PHONY: validate-codecov-yml
validate-codecov-yml:
	curl --data-binary @.codecov.yml https://codecov.io/validate
