# opentrons protocol-library-kludge makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

# standard targets
#####################################################################

.PHONY: all
all: clean build

.PHONY: install
install:
	yarn

.PHONY: clean
clean:
	shx rm -rf dist

# artifacts
#####################################################################

.PHONY: build
build:
	$(env)=production webpack -p
	shx cp index.html dist/

# NOTE: Ian 2018-09-07 while this is a one-off OT2 deckmap iframe dealie,
# it should be deployed MANUALLY to protocol-library-kludge/production/ on S3

# development
#####################################################################

.PHONY: dev
dev:
	$(env)=development webpack-dev-server --hot
