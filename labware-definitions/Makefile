# opentrons app makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell yarn bin):$(PATH)

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

BUILD_DIR := build

#######################################

.PHONY: install
install:
	yarn
	$(MAKE) build

.PHONY: build
build:
	shx mkdir -p $(BUILD_DIR) && node js/scripts/build.js $(BUILD_DIR)

.PHONY: clean
clean:
	shx rm -rf $(BUILD_DIR)
