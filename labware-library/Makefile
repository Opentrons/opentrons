# opentrons labware-library makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

.PHONY: all
all: clean dist

.PHONY: clean
clean:
	shx rm -rf dist

# production assets
.PHONY: dist
dist: export NODE_ENV := production
dist:
	webpack --profile

# development assets server
.PHONY: dev
dev: export NODE_ENV := development
dev:
	webpack-dev-server --hot

# production assets server
.PHONY: serve
serve: all
	node ../scripts/serve-static dist
