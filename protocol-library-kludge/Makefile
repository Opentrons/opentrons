# opentrons protocol-library-kludge makefile

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)
# ensure PATH is honored when shell invoked (this gets round an issue on macOS)
SHELL := env PATH=$(PATH) /bin/bash

# standard targets
#####################################################################

.PHONY: all
all: clean dist

.PHONY: install
install:
	yarn

.PHONY: clean
clean:
	shx rm -rf dist

# artifacts
#####################################################################

.PHONY: dist
dist: export NODE_ENV := production
dist:
	webpack --profile

# NOTE: Ian 2018-09-07 while this is a one-off OT2 deckmap iframe dealie,
# it should be deployed MANUALLY to protocol-library-kludge/production/ on S3

# development
#####################################################################

.PHONY: dev
dev: export NODE_ENV := development
dev:
	webpack-dev-server --hot
