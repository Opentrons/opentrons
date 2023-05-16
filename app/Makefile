# opentrons app makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# dev server port
PORT ?= 8090

# dependency directories for dev
shell_dir := ../app-shell
shell_odd_dir := ../app-shell-odd
discovery_client_dir := ../discovery-client

# standard targets
#####################################################################

.PHONY: all
all: clean dist

.PHONY: setup
setup:
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

.PHONY: dev-odd
dev-odd: export NODE_ENV := development
dev-odd: export PORT := $(PORT)
dev-odd:
	concurrently --no-color --kill-others --names "server,shell" \
		"$(MAKE) dev-server" \
		"$(MAKE) dev-shell-odd"

.PHONY: dev-server
dev-server:
	webpack-dev-server --hot

.PHONY: dev-shell
dev-shell:
	wait-on http-get://localhost:$(PORT)
	$(MAKE) -C $(shell_dir) dev


.PHONY: dev-shell-odd
dev-shell-odd: export OT_APP_IS_ON_DEVICE := 1
dev-shell-odd: export OT_APP_UI__WIDTH := 1024
dev-shell-odd: export OT_APP_UI__HEIGHT := 600
dev-shell-odd: export OT_APP_ON_DEVICE_DISPLAY_SETTINGS__UNFINISHED_UNBOXING_FLOW_ROUTE := /dashboard
dev-shell-odd: export OT_APP_UI__WIDTH := 1024
dev-shell-odd: export OT_APP_UI__HEIGHT := 600
dev-shell-odd:
	wait-on http-get://localhost:$(PORT)
	$(MAKE) -C $(shell_odd_dir) dev
