# opentrons discovery-client makefile

# adding the -c to SHELL prevents macOS optimizing away our PATH update
SHELL := /bin/bash -c

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# standard targets
#####################################################################

.PHONY: all
all: clean lib

.PHONY: install
install:
	yarn

.PHONY: clean
clean:
	shx rm -rf lib dist

# artifacts
#####################################################################

.PHONY: lib
lib: export NODE_ENV := production
lib:
	webpack

