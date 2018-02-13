# opentrons app desktop shell makefile

# add node_modules/.bin to PATH
PATH := $(shell yarn bin):$(PATH)

# ui directory for production build
ui_dir := ../app

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

# standard targets
#####################################################################

.PHONY: all
all: clean package

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

.PHONY: package
package: ui
	electron-builder --dir

.PHONY: dist-posix
dist-posix: clean ui
	electron-builder --linux --mac --publish never
	$(MAKE) _dist-collect-artifacts

.PHONY: dist-osx
dist-osx: clean ui
	electron-builder --mac --publish never
	$(MAKE) _dist-collect-artifacts

.PHONY: dist-linux
dist-linux: clean ui
	electron-builder --linux --publish never
	$(MAKE) _dist-collect-artifacts

.PHONY: dist-win
dist-win: clean ui
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
