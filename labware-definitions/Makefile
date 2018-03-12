# opentrons app makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell yarn bin):$(PATH)

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
	echo 'no tests for labware-definitions yet!'

.PHONY: clean
clean:
	shx rm -rf build
