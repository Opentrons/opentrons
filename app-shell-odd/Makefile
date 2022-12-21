# opentrons app desktop shell makefile

include ../scripts/push.mk

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# dev server port
PORT ?= 8090

# dep directories for production build
# TODO(mc, 2018-08-07): figure out a better way to do this
ui_dir := ../app

# cross-platform noop command
noop := cd .

# build and publish options
dist_files := "dist/**/Opentrons-v*"
update_files := "dist/@(alpha|beta|latest)*.@(yml|json)"
publish_dir := dist/publish

# Other SSH args for buildroot robots
ssh_opts ?= $(default_ssh_opts)

# TODO(mc, 2018-03-27): move all this to some sort of envfile
# build id suffix to add to artifacts
# if no build number -> dev
# if tagged build (tag ~= ^v.+) -> b$(BUILD_NUMBER)
# if branch exists -> b$(BUILD_NUMBER)-$(BRANCH_NAME)
# only copy update files publish directory on tagged builds
publish_update := $(filter v%,$(OT_TAG))
branch_suffix := $(if $(publish_update),,-$(subst /,-,$(OT_BRANCH)))
build_id := $(or $(and $(OT_BUILD),b$(OT_BUILD)$(branch_suffix)),dev)

# set this to anything on command-line invocations of this makefile to skip bundling
# standalone python, as is necessary for on-device app builds:
# make dist no_python_bundle=true or =1 or whatever
no_python_bundle ?=

builder := yarn electron-builder \
	--config electron-builder.config.js \
	--publish never


electron := yarn electron . \
	--devtools \
	--log.level.console="debug" \
	--disable_ui.webPreferences.webSecurity \
	--ui.url.protocol="http:" \
	--ui.url.path="localhost:$(PORT)" \
	--python.pathToPythonOverride=$(shell cd ../api && pipenv --venv)

# standard targets
#####################################################################

.PHONY: branch-suffix
branch-suffix:
	echo $(branch_suffix)

.PHONY: all
all: package

.PHONY: setup
# must be wrapped in yarn run otherwise `prebuild-install` will fail silently
# due to how `electron-rebuild` calls `prebuild-install`
setup:
	yarn rebuild

.PHONY: clean
clean:
	shx rm -rf lib dist python

# artifacts
#####################################################################

.PHONY: lib
lib: export NODE_ENV := production
lib:
	webpack --profile

.PHONY: deps
deps:
	$(MAKE) -C $(ui_dir)

.PHONY: package-deps
package-deps: clean lib deps

package dist-posix dist-osx dist-linux dist-win: export NODE_ENV := production
package dist-posix dist-osx dist-linux dist-win: export BUILD_ID := $(build_id)
package dist-posix dist-osx dist-linux dist-win: export NO_PYTHON := $(if $(no_python_bundle),true,false)

.PHONY: package
package: package-deps
	$(builder) --dir

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

.PHONY: dist-ot3
dist-ot3: package-deps
	NO_PYTHON=true NO_USB_DETECTION=true OT_APP_DEPLOY_BUCKET=opentrons-app OT_APP_DEPLOY_FOLDER=builds $(builder) --linux --arm64 --dir
	cd dist/linux-arm64-unpacked

.PHONY: push-ot3
push-ot3: dist-ot3
	ssh $(ssh_opts) root@$(host) "systemctl stop opentrons-robot-app && rm -rf /opt/opentrons-app && mkdir -p /opt/opentrons-app"
	scp -r $(ssh_opts) ./dist/linux-arm64-unpacked/* root@$(host):/opt/opentrons-app
	ssh $(ssh_opts) root@$(host) "systemctl start opentrons-robot-app"

# Aliases matching github actions OS names for easier calling in
# workflows
.PHONY: dist-macos-latest
dist-macos-latest: dist-osx

.PHONY: dist-ubuntu-latest
dist-ubuntu-latest: dist-linux

.PHONY: dist-ubuntu-22.04
dist-ubuntu-22.04: dist-linux

.PHONY: dist-windows-2022
dist-windows-2022: dist-win

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
dev: export NODE_ENV := development
dev:
	webpack
	$(electron)
