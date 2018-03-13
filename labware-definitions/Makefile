# opentrons app makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell yarn bin):$(PATH)

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

# watch, coverage, and update snapshot variables for tests
watch ?= false
cover ?= true
updateSnapshot ?= false

ifeq ($(watch), true)
	cover := false
endif

#######################################

.PHONY: install
install:
	yarn
	$(MAKE) build

.PHONY: build
build:
	node js/build.js

# TODO: flow-typed?

.PHONY: test
test:
	$(env)=test jest \
		--coverage=$(cover) \
		--watch=$(watch) \
		--updateSnapshot=$(updateSnapshot)

.PHONY: clean
clean:
	shx rm -rf build
