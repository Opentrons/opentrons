# opentrons component library makefile

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)
# ensure PATH is honored when shell invoked (this gets round an issue on macOS)
SHELL := env PATH=$(PATH) /bin/bash

# dev server port
port ?= 8081

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
dist: export NODE_ENV := development
dist:
	styleguidist build

# development
#####################################################################

.PHONY: dev
build: export NODE_ENV := development
dev:
	styleguidist server
