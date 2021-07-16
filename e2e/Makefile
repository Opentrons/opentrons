
# opentrons app desktop shell makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)
PATH := $(shell yarn bin):$(PATH)

# dev server port
PORT ?= 8090

electron := electron ../app/. \
	--devtools \
	--log.level.console="debug" \
	--disable_ui.webPreferences.webSecurity \
	--ui.url.protocol="http:" \
	--ui.url.path="localhost:$(PORT)" \
	--discovery.candidates=localhost

# development
#####################################################################

.PHONY: dev
dev: export NODE_ENV := development
dev:
	webpack
	$(electron)

.PHONY: tes
tes: export NODE_ENV := development
tes: export PWDEBUG := console
tes: export DEBUG := pw:api
tes:
	playwright test