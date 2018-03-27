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

# cross-platform noop command
noop := cd .

# build and publish options
# TODO(mc, 2018-03-27): move all this to some sort of envfile
mainline_branches := master edge $(OT_TAG)
feature_branch := $(filter-out $(mainline_branches),$(OT_BRANCH))

dist_files := "dist/**/Opentrons-v*"
update_files := "dist/@(alpha|beta|latest)*.@(yml|json)"
publish_dir := dist/publish

# build suffix to add to artifacts
# if branch is master or edge -> b$(BUILD_NUMBER)
# if branch is something else -> b$(BUILD_NUMBER)-$(BRANCH_NAME)
# else -> dev
branch_suffix := $(and $(feature_branch),-$(feature_branch))
build := $(or $(and $(OT_BUILD),b$(OT_BUILD)$(branch_suffix)),dev)

# only copy update files publish directory on tagged builds
publish_update := $(OT_TAG)

builder := $(env)=production BUILD=$(build) electron-builder \
	--publish=never \
	-c.publish.bucket=$(OT_BUCKET_APP) \
	-c.publish.path=$(OT_FOLDER_APP)

# standard targets
#####################################################################

.PHONY: all
all: package

.PHONY: install
install:
	yarn

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
dev:
	$(env)=development PORT=$(port) electron lib/main.js
