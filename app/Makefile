# opentrons app makefile

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)
# ensure PATH is honored when shell invoked (this gets round an issue on macOS)
SHELL := env PATH=$(PATH) /bin/bash

# dev server port
PORT ?= 8090

# dependency directories for dev
shell_dir := ../app-shell
discovery_client_dir = ../discovery-client

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

# development
#####################################################################

.PHONY: dev
dev: export NODE_ENV := development
dev: export PORT := $(PORT)
dev:
	concurrently --no-color --kill-others --names "server,shell" \
		"$(MAKE) dev-server" \
		"$(MAKE) dev-shell"

.PHONY: dev-server
dev-server:
	webpack-dev-server --hot

.PHONY: dev-shell
dev-shell:
	wait-on http-get://localhost:$(PORT)
	$(MAKE) -C $(shell_dir) dev

