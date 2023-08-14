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

# Other SSH args for robots
ssh_opts ?= $(default_ssh_opts)

builder := yarn electron-builder \
	--config electron-builder.config.js \
	--publish never
  
electron := yarn electron . \
	--devtools \
	--log.level.console="debug" \
	--disable_ui.webPreferences.webSecurity \
	--ui.url.protocol="http:" \
	--ui.url.path="localhost:$(PORT)" \

OPENTRONS_PROJECT ?= robot-stack

# standard targets
#####################################################################

.PHONY: all
all: package

.PHONY: setup
# must be wrapped in yarn run otherwise `prebuild-install` will fail silently
# due to how `electron-rebuild` calls `prebuild-install`
setup:
	yarn rebuild

.PHONY: clean
clean:
	shx rm -rf lib dist

# artifacts
#####################################################################

.PHONY: lib
lib: export NODE_ENV := production
lib:
	OPENTRONS_PROJECT=$(OPENTRONS_PROJECT) webpack --profile

.PHONY: deps
deps:
	$(MAKE) -C $(ui_dir) OPENTRONS_PROJECT=$(OPENTRONS_PROJECT)

.PHONY: package-deps
package-deps: clean lib deps

.PHONY: dist-ot3
dist-ot3: package-deps
	NO_USB_DETECTION=true OT_APP_DEPLOY_BUCKET=opentrons-app OT_APP_DEPLOY_FOLDER=builds OPENTRONS_PROJECT=$(OPENTRONS_PROJECT) $(builder) --linux --arm64

.PHONY: push-ot3
push-ot3: dist-ot3
	tar -zcvf opentrons-robot-app.tar.gz -C ./dist/linux-arm64-unpacked/ ./
	scp -r $(ssh_opts) ./opentrons-robot-app.tar.gz root@$(host):
	ssh $(ssh_opts) root@$(host) "mount -o remount,rw / && systemctl stop opentrons-robot-app && rm -rf /opt/opentrons-app && mkdir -p /opt/opentrons-app"
	ssh $(ssh_opts) root@$(host) "tar -xvf opentrons-robot-app.tar.gz -C /opt/opentrons-app/ &&  mount -o remount,ro / && systemctl start opentrons-robot-app && rm -rf opentrons-robot-app.tar.gz"
	rm -rf opentrons-robot-app.tar.gz

# development
#####################################################################

.PHONY: dev
dev: export NODE_ENV := development
dev:
	webpack
	$(electron)
