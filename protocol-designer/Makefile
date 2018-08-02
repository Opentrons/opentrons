# opentrons protocol designer makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

# dev server port
port ?= 8080

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
dist:
	$(env)=production webpack --profile

# development
#####################################################################

.PHONY: dev
dev:
	$(env)=development webpack-dev-server --hot
