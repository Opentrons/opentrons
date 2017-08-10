# app makefile

# use bash
SHELL := /bin/bash

# use devDependency CLIs with $(BIN)/command
BIN := node_modules/.bin

# set NODE_ENV for a command with $(ENV)=environment
ENV := $(BIN)/cross-env NODE_ENV

# tasks
#####################################################################

.PHONY: test test-ui clean install package

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

# test tasks
#####################################################################

# watch argument for tests
watch ?= false

test: build
	npm run test

test-e2e: build
	npm run test-e2e

test-ui:
	$(ENV)=test $(BIN)/jest './ui/.*\.test\.js' --watch=$(watch)

dev:
	npm run build-dev
	npm run dev

clean:
	rm -rf \
		ui/dist \
		shell/dist \
		dll \
		bin \
		.coverage
