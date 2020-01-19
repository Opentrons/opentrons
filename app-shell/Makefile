# opentrons app desktop shell makefile

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)
# ensure PATH is honored when shell invoked (this gets round an issue on macOS)
SHELL := env PATH=$(PATH) /bin/bash

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

# TODO(mc, 2018-03-27): move all this to some sort of envfile
# build id suffix to add to artifacts
# if no build number -> dev
# if tagged build (tag ~= ^v.+) -> b$(BUILD_NUMBER)
# if branch exists -> b$(BUILD_NUMBER)-$(BRANCH_NAME)
# only copy update files publish directory on tagged builds
publish_update := $(filter v%,$(OT_TAG))
branch_suffix := $(if $(publish_update),,-$(OT_BRANCH))
build_id := $(or $(and $(OT_BUILD),b$(OT_BUILD)$(branch_suffix)),dev)

builder := electron-builder \
	--config electron-builder.config.js \
	--publish never

electron := electron . \
	--devtools \
	--log.level.console="debug" \
	--disable_ui.webPreferences.webSecurity \
	--ui.url.protocol="http:" \
	--ui.url.path="localhost:$(PORT)" \
	--discovery.candidates=localhost

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
