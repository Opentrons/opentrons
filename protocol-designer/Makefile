# opentrons protocol designer makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell yarn bin):$(PATH)

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

# dev server port
port ?= 8080

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

# development
#####################################################################

.PHONY: dev
dev:
	$(env)=development webpack-dev-server --hot
