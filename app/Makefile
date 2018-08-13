# opentrons app makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# desktop shell directory for dev
shell_dir := ../app-shell

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

# dev server port
port ?= 8090

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
	concurrently --no-color --kill-others --names "server,mdns,shell"\
		"$(MAKE) dev-server" \
		"$(MAKE) dev-mdns" \
		"$(MAKE) dev-shell"

.PHONY: dev-server
dev-server:
	$(env)=development PORT=$(port) webpack-dev-server --hot

# TODO(mc, 2017-10-31): remove when API is capable of advertising itself
.PHONY: dev-mdns
dev-mdns:
	$(env)=development node scripts/advertise-local-api.js

.PHONY: dev-shell
dev-shell:
	wait-on http-get://localhost:$(port) && \
	$(MAKE) -C $(shell_dir) lib dev port=$(port)
