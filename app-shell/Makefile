# opentrons app desktop shell makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# source and output directories for main process code
src_dir := src
lib_dir := lib
babel := babel $(src_dir) --out-dir $(lib_dir)

# dep directories for production build
# TODO(mc, 2018-08-07): figure out a better way to do this
ui_dir := ../app
discovery_client_dir := ../discovery-client

# directories for robot API update bundled in production build
api_dir := ../api
api_lib_dir := ../api-server-lib

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

# cross-platform noop command
noop := cd .

# build and publish options
dist_files := "dist/**/Opentrons-v*"
update_files := "dist/@(alpha|beta|latest)*.@(yml|json)"
publish_dir := dist/publish

# TODO(mc, 2018-03-27): move all this to some sort of envfile
# build id suffix to add to artifacts
# if no build number -> dev
# if tagged build (branch == tag) -> b$(BUILD_NUMBER)
# if branch exists -> b$(BUILD_NUMBER)-$(BRANCH_NAME)
branch := $(filter-out $(OT_TAG),$(OT_BRANCH))
branch_suffix := $(and $(branch),-$(branch))
build_id := $(or $(and $(OT_BUILD),b$(OT_BUILD)$(branch_suffix)),dev)

# only copy update files publish directory on tagged builds
publish_update := $(OT_TAG)

builder := $(env)=production BUILD_ID=$(build_id) electron-builder -p never

electron := electron . \
	--devtools \
	--log.level.console="debug" \
	--disable_ui.webPreferences.webSecurity \
	--ui.url.protocol="http:" \
	--ui.url.path="localhost:$(port)"

# standard targets
#####################################################################

.PHONY: all
all: package

.PHONY: install
install:
	yarn

.PHONY: clean
clean:
	shx rm -rf lib dist

# artifacts
#####################################################################

.PHONY: lib
lib:
	$(babel)

.PHONY: deps
deps:
	$(MAKE) -C $(ui_dir)
	$(MAKE) -C $(discovery_client_dir)

.PHONY: api-deps
api-deps:
	$(MAKE) -C $(api_dir) wheel
	$(MAKE) -C $(api_lib_dir) wheel

.PHONY: package-deps
package-deps: clean lib deps api-deps

.PHONY: package
package: package-deps
	$(builder) --dir

# TODO(mc, 2018-03-27): remove posix target in favor of individual
#   build_$(OS) variables
.PHONY: dist-posix
dist-posix: package-deps
	$(builder) --linux --mac
	$(MAKE) _dist-collect-artifacts

.PHONY: dist-osx
dist-osx: package-deps
	$(builder) --mac
	$(MAKE) _dist-collect-artifacts

.PHONY: dist-linux
dist-linux: package-deps
	$(builder) --linux
	$(MAKE) _dist-collect-artifacts

.PHONY: dist-win
dist-win: package-deps
	$(builder) --win --x64
	$(MAKE) _dist-collect-artifacts

# copy distributable artifacts to the publish directory
# update files will not exist for all OSs, so noop if cp errors
.PHONY: _dist-collect-artifacts
_dist-collect-artifacts:
	shx mkdir -p dist/publish
	shx cp $(dist_files) $(publish_dir)
	$(and $(publish_update),shx cp $(update_files) $(publish_dir) || $(noop))

# development
#####################################################################

.PHONY: dev
dev: lib
	$(env)=development $(electron)
