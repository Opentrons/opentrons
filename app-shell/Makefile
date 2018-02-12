# opentrons app desktop shell makefile

# use bash
SHELL := bash

# source files
source := $(shell find lib -type f -name '*.js')
ui_dir := ../app

# use devDependency CLIs with $(bin)/command
# set NODE_ENV for a command with $(env)=environment
bin := node_modules/.bin
env := $(bin)/cross-env NODE_ENV

set_package_env := $(bin)/cross-env \
	OT_TIME_SUFFIX=$(OT_TIME_SUFFIX) \
	OT_BRANCH_SUFFIX=$(OT_BRANCH_SUFFIX) \
	OT_COMMIT_SUFFIX=$(OT_COMMIT_SUFFIX)

# standard targets
#####################################################################

.PHONY: all
all: clean package

.PHONY: install
install:
	yarn

.PHONY: uninstall
uninstall:
	rm -rf node_modules

.PHONY: clean
clean:
	rm -rf dist

# artifacts
#####################################################################

.PHONY: ui
ui:
	$(MAKE) -C $(ui_dir)

.PHONY: package
package: $(source) ui
	$(set_package_env) $(bin)/electron-builder --dir

.PHONY: dist-posix
dist-posix: $(source) ui
	$(set_package_env) $(bin)/electron-builder --linux --mac --publish never

.PHONY: dist-osx
dist-osx: $(source) ui
	$(set_package_env) $(bin)/electron-builder --mac --publish never

.PHONY: dist-linux
dist-linux: $(source) ui
	$(set_package_env) $(bin)/electron-builder --linux --publish never

.PHONY: dist-win
dist-win: $(source) ui
	$(set_package_env) $(bin)/electron-builder --win --x64 --publish never

# development
#####################################################################

.PHONY: dev
dev:
	$(env)=development PORT=$(port) $(bin)/electron lib/main.js
