# opentrons labware-designer makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# standard targets
#####################################################################

.PHONY: all
all: clean dist

.PHONY: setup
setup:
	yarn

.PHONY: clean
clean:
	shx rm -rf dist

# artifacts
#####################################################################

.PHONY: dist
dist: export NODE_ENV := production
dist:
	vite build

# development
#####################################################################

.PHONY: dev
dev: export NODE_ENV := development
dev:
	vite serve --host=::

.PHONY: test
test:
	$(MAKE) -C .. test-js-labware-designer
