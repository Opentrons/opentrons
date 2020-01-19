# opentrons protocol designer makefile

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)
# ensure PATH is honored when shell invoked (this gets round an issue on macOS)
SHELL := env PATH=$(PATH) /bin/bash

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
	webpack --profile
	git rev-parse HEAD > dist/.commit

# development
#####################################################################

.PHONY: dev
dev: export NODE_ENV := development
dev:
	webpack-dev-server --hot

# production assets server
.PHONY: serve
serve: all
	node ../scripts/serve-static dist
