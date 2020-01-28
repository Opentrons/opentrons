# opentrons app makefile

# adding the -c to SHELL prevents macOS optimizing away our PATH update
SHELL := /bin/bash -c

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

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
