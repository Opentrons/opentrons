
# opentrons app desktop shell makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)
PATH := $(shell yarn bin):$(PATH)


# development
#####################################################################

.PHONY: test
test: export NODE_ENV := development
test: export PWDEBUG := console
test: export DEBUG := pw:api
test:
	playwright test --workers 1

.PHONY: docker-emulator
docker-emulator:
	cd .. && docker-compose down
	cd .. && docker-compose up --build

.PHONY: dev-server
dev-server:
	cd ../app && webpack-dev-server --hot

.PHONY: up
up:
	concurrently --kill-others --names "emulator,app" \
		"$(MAKE) docker-emulator" \
		"$(MAKE) dev-server" \
