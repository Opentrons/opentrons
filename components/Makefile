# opentrons component library makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

# dev server port
port ?= 8081

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
	$(env)=development styleguidist build

# development
#####################################################################

.PHONY: dev
dev:
	$(env)=development styleguidist server
