# opentrons platform makefile
# https://github.com/Opentrons/opentrons

# make OT_PYTHON available
include ./scripts/python.mk
# make UV available
include ./scripts/python-uv.mk

API_CLIENT_DIR := api-client
API_DIR := api
APP_DIR := app
APP_SHELL_DIR := app-shell
APP_SHELL_ODD_DIR := app-shell-odd
AUDIT_SERVER_DIR := audit-server
AUTH_SERVER_DIR := auth-server
COMPONENTS_DIR := components
DISCOVERY_CLIENT_DIR := discovery-client
DOCS_DIR := docs
G_CODE_TESTING_DIR := g-code-testing
HARDWARE_DIR := hardware
KEY_SERVER_DIR := key-server
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

PYTHON_DIRS := $(API_DIR) $(AUDIT_SERVER_DIR) $(AUTH_SERVER_DIR) $(DOCS_DIR) $(G_CODE_TESTING_DIR) $(HARDWARE_DIR) $(KEY_SERVER_DIR) $(ROBOT_SERVER_DIR) $(SERVER_UTILS_DIR) $(SHARED_DATA_DIR) $(SYSTEM_SERVER_DIR) $(UPDATE_SERVER_DIR) $(USB_BRIDGE_DIR)

# This may be set as an environment variable (and is by CI tasks that upload
# to test pypi) to add a .dev extension to the python package versions. If
# empty, no .dev extension is appended, so this definition is here only as
# documentation
BUILD_NUMBER ?=

# watch, coverage, and warning suppresion variables for tests and linting
watch ?= false
cover ?= true
quiet ?= true

format_file_exts = ts|tsx|js|mts|mjs|json|md|yaml|yml
FORMAT_FILE_GLOB = ".*.@($(format_file_exts))" "**/*.@($(format_file_exts))"

ifeq ($(watch), true)
	cover := false
endif

# run at usage (=), not on makefile parse (:=)
# todo(mm, 2021-03-17): Deduplicate with scripts/python.mk.
usb_host=$(shell pnpm -s discovery find -i 169.254)

# install all project dependencies
.PHONY: setup
setup: setup-js setup-py

# front-end dependencies handled by pnpm
# network-timeout -> fetch-timeout and the default is 60000
.PHONY: setup-js
setup-js:
	pnpm install
	$(MAKE) -C $(APP_SHELL_DIR) setup
	$(MAKE) -C $(APP_SHELL_ODD_DIR) setup

# front-end dependencies install for CI
# network-timeout -> fetch-timeout and the default is 60000
.PHONY: setup-js-ci
setup-js-ci:
	pnpm install --frozen-lockfile
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
	pnpm exec shx rm -rf "**/node_modules"

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
	$(MAKE) -C $(AUDIT_SERVER_DIR) push-ot3
	$(MAKE) -C $(KEY_SERVER_DIR) push-ot3
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
test-js:
	pnpm vitest run $(tests) $(test_opts) $(cov_opts)

.PHONY: test-js-%
test-js-%:
	pnpm vitest run --dir $* $(tests) $(test_opts) $(cov_opts)

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
lint-js: check-mutating-api-client-exports lint-js-eslint lint-js-prettier

# Regenerate the denylist used by opentrons/no-direct-mutating.
.PHONY: generate-mutating-api-client-exports
generate-mutating-api-client-exports:
	node scripts/eslint-plugin-opentrons/generate-mutating-api-client-exports.js

# Fail if the committed denylist is stale vs api-client POST/PUT/PATCH/DELETE exports.
.PHONY: check-mutating-api-client-exports
check-mutating-api-client-exports:
	node scripts/eslint-plugin-opentrons/generate-mutating-api-client-exports.js --check

.PHONY: lint-js-eslint
lint-js-eslint:
# todo(mm, 2026-03-04): Move --report-unused-disable-directives-severity to config file
# when the file supports it (upgrade eslint and/or move away from legacy config format)
	NODE_OPTIONS="--max-old-space-size=8192 $(NODE_OPTIONS)" pnpm exec eslint --quiet=$(quiet) --report-unused-disable-directives-severity error --ignore-pattern "node_modules/" ".*.@(js|ts|tsx)" "**/*.@(js|ts|tsx)"

.PHONY: lint-js-prettier
lint-js-prettier:
	pnpm exec prettier --ignore-path .eslintignore --check $(FORMAT_FILE_GLOB)


.PHONY: lint-json
lint-json:
# todo(mm, 2026-03-04): Move --report-unused-disable-directives-severity to config file
# when the file supports it (upgrade eslint and/or move away from legacy config format)
	NODE_OPTIONS="--max-old-space-size=8192 $(NODE_OPTIONS)" pnpm exec eslint --report-unused-disable-directives-severity error --ignore-pattern "abr-testing/protocols/" --max-warnings 0 --ext .json .

.PHONY: lint-css
lint-css:
	pnpm stylelint "**/*.css" "**/*.js"

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
	pnpm exec prettier --ignore-path .eslintignore --write $(FORMAT_FILE_GLOB)

.PHONY: format-css
format-css:
	pnpm exec stylelint "**/*.css" --fix

.PHONY: check-js
check-js: build-ts

.PHONY: build-ts
build-ts:
	pnpm tsc --build

.PHONY: clean-ts
clean-ts:
	pnpm tsc --build --clean

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
	pnpm madge $(and $(CI),--no-spinner --no-color) --circular $*

# Convenience commands for running all of our servers in dev mode, together,
# behind a reverse proxy listening on port 31950.
#
# This naively amalgamates all of the logs into a single stdout stream.
# If that's a bit much, you can also just manually run these commands in separate terminals.
.PHONY: dev-backend
dev-backend:
	$(python) scripts/run_concurrently.py \
		$(MAKE) -C robot-server dev BEHIND_DEV_PROXY=1 ';' \
		$(MAKE) -C system-server dev ';' \
		$(MAKE) dev-proxy
.PHONY: dev-backend-flex
dev-backend-flex:
	$(python) scripts/run_concurrently.py \
		$(MAKE) -C auth-server dev OT_AUTH_SERVER_audit_server_url=http://localhost:33970 ';' \
		$(MAKE) -C audit-server dev OT_AUDIT_SERVER_key_server_url=http://localhost:33960 OT_AUDIT_SERVER_auth_server_url=http://localhost:31950 OT_AUDIT_SERVER_robot_server_url=http://localhost:31951 ';' \
		$(MAKE) -C robot-server dev-flex OT_ROBOT_SERVER_auth_server_url=http://localhost:31950 OT_ROBOT_SERVER_audit_server_url=http://localhost:33970 BEHIND_DEV_PROXY=1 ';' \
		$(MAKE) -C system-server dev OT_SYSTEM_SERVER_auth_server_url=http://localhost:31950 OT_SYSTEM_SERVER_audit_server_url=http://localhost:33970 ';' \
		$(MAKE) -C key-server dev-mitmproxy ';' \
		$(MAKE) dev-proxy ';' \
		$(MAKE) dev-proxy-tls


# Assuming our dev servers are running separately (make -C robot-server dev, make -C auth-server dev, etc.),
# this sets up a reverse proxy that listens on localhost:31950 and forwards each request
# to the appropriate dev server.
.PHONY: dev-proxy
dev-proxy:
# In this command, the first port (:2) is a placeholder for the origin server's port.
# dev_proxy.py *should* overwrite it in all cases, but in case something goes wrong
# with that, we choose port 2 because it's probably not assigned to anything.
# `connection_strategy=lazy` gives dev_proxy.py a chance to overwrite the port before
# mitmproxy tries use port 2.
#
# The second port (@31950) is where the reverse proxy should listen.
	$(UV) tool run --python $(UV_PYTHON) --from mitmproxy==12.2.1  mitmdump \
	    --mode reverse:http://localhost:2@31950 \
	    --set connection_strategy=lazy \
	    --script scripts/dev_proxy.py

.PHONY: dev-proxy-tls
dev-proxy-tls:
	sleep 1 # give key-server time to prep certs for mitmproxy
	$(UV) tool run --python $(UV_PYTHON) --from mitmproxy==12.2.1 mitmdump \
		--mode reverse:http://localhost:2@32313 \
		--set connection_strategy=lazy \
		--script scripts/dev_proxy.py \
		--certs key-server/.key-server-storage/tls/flex-certs.pem
