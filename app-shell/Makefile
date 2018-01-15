# opentrons app desktop shell makefile

# add node_modules/.bin to the path
PATH := $(shell yarn bin):$(PATH)

# ui directory to build bundle for app shell distributable
ui_dir := ../app

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

set_package_env := cross-env \
	NODE_ENV=production \
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
package: ui
	$(set_package_env) electron-builder --dir

.PHONY: dist-posix
dist-posix: ui
	$(set_package_env) electron-builder --linux --mac --publish never

.PHONY: dist-osx
dist-osx: ui
	$(set_package_env) electron-builder --mac --publish never

.PHONY: dist-linux
dist-linux: ui
	$(set_package_env) electron-builder --linux --publish never

.PHONY: dist-win
dist-win: $(source) ui
	$(set_package_env) electron-builder --win --x64 --publish never

# development
#####################################################################

.PHONY: dev
dev:
	$(env)=development PORT=$(port) electron lib/main.js

# checks
#####################################################################

.PHONY: lint
lint:
	standard --verbose --fix=$(fix) | snazzy
