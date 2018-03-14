# opentrons app desktop shell makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell yarn bin):$(PATH)

# ui directory for production build
ui_dir := ../app

# api directory for robot API update bundled in production build
api_dir := ../api

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

# standard targets
#####################################################################

.PHONY: all
all: package

.PHONY: install
install:
	yarn

.PHONY: uninstall
uninstall:
	shx rm -rf node_modules

.PHONY: clean
clean:
	shx rm -rf dist

# artifacts
#####################################################################

.PHONY: ui
ui:
	$(MAKE) -C $(ui_dir)

.PHONY: api
api:
	$(MAKE) -C $(api_dir) wheel

.PHONY: package-deps
package-deps: clean ui api

.PHONY: package
package: package-deps
	electron-builder --dir

.PHONY: dist-posix
dist-posix: package-deps
	electron-builder --linux --mac --publish never
	$(MAKE) _dist-collect-artifacts

.PHONY: dist-osx
dist-osx: package-deps
	electron-builder --mac --publish never
	$(MAKE) _dist-collect-artifacts

.PHONY: dist-linux
dist-linux: package-deps
	electron-builder --linux --publish never
	$(MAKE) _dist-collect-artifacts

.PHONY: dist-win
dist-win: package-deps
	electron-builder --win --x64 --publish never
	$(MAKE) _dist-collect-artifacts

# copy distributable artifacts to the publish directory
.PHONY: _dist-collect-artifacts
_dist-collect-artifacts:
	shx mkdir -p dist/publish && shx cp dist/**/opentrons-v* dist/publish

# development
#####################################################################

.PHONY: dev
dev:
	$(env)=development PORT=$(port) electron lib/main.js
