# opentrons labware-designer makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

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
build: export NODE_ENV := production
build:
	webpack -p

# development
#####################################################################

.PHONY: dev
dev: export NODE_ENV := development
dev:
	webpack-dev-server --hot
