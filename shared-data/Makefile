# opentrons app makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

# TODO(mc, 2018-10-25): use dist to match other projects
BUILD_DIR := build

#######################################

.PHONY: all
all: clean dist

.PHONY: install
install:
	yarn
	$(MAKE) dist

.PHONY: dist
dist:
	@shx mkdir -p $(BUILD_DIR)
	node js/scripts/build.js $(BUILD_DIR)

.PHONY: clean
clean:
	shx rm -rf $(BUILD_DIR)
