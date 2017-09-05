# opentrons app makefile

# use bash
SHELL := /bin/bash

# use devDependency CLIs with $(BIN)/command
BIN := node_modules/.bin

# set NODE_ENV for a command with $(ENV)=environment
ENV := $(BIN)/cross-env NODE_ENV

# setup and development
#####################################################################

.PHONY: install build package dev clean

install:
	npm install

ui/dist:
	npm run build-renderer

shell/dist:
	npm run build-main

bin/opentrons-api-server:
	mkdir -p bin && cp ../api/dist/opentrons-api-server bin/

build: shell/dist ui/dist bin/opentrons-api-server

package: build
	export OT_TIME_SUFFIX=$(OT_TIME_SUFFIX) && \
	export OT_BRANCH_SUFFIX=$(OT_BRANCH_SUFFIX) && \
	export OT_COMMIT_SUFFIX=$(OT_COMMIT_SUFFIX) && \
	npm run package

dev:
	npm run build-dev
	npm run dev

clean:
	rm -rf       \
		ui/dist    \
		shell/dist \
		dll        \
		bin        \
		coverage

# test tasks
#####################################################################

.PHONY: test test-e2e test-unit lint lint-js lint-js-fix lint-css lint-css-fix

# watch and coverage arguments for tests
watch ?= false
cover ?= true

ifeq ($(watch), true)
	cover = false
endif

test: test-unit
	$(MAKE) lint

test-unit:
	$(ENV)=test $(BIN)/jest '.*\.test\.js' --coverage=$(cover) --watch=$(watch)

lint:
	$(BIN)/concurrently "$(MAKE) lint-js" "$(MAKE) lint-css"

lint-js:
	$(BIN)/standard --verbose | $(BIN)/snazzy

lint-js-fix:
	$(BIN)/standard --fix

lint-css:
	$(BIN)/stylelint '**/*.css' --verbose

lint-css-fix:
	$(BIN)/stylelint '**/*.css' --fix
