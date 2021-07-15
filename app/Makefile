# opentrons app makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# dev server port
PORT ?= 8090

# dependency directories for dev
shell_dir := ../app-shell
discovery_client_dir = ../discovery-client

# standard targets
#####################################################################

.PHONY: all
all: clean dist

.PHONY: setup
setup:
	yarn

.PHONY: clean
clean:
	shx rm -rf dist

# artifacts
#####################################################################

.PHONY: dist
dist: export NODE_ENV := production
dist:
	webpack --profile

# development
#####################################################################

.PHONY: dev
dev: export NODE_ENV := development
dev: export PORT := $(PORT)
dev:
	concurrently --no-color --kill-others --names "server,shell" \
		"$(MAKE) dev-server" \
		"$(MAKE) dev-shell"

.PHONY: dev-server
dev-server:
	webpack-dev-server --hot

.PHONY: dev-shell
dev-shell:
	wait-on http-get://localhost:$(PORT)
	$(MAKE) -C $(shell_dir) dev

# end-to-end tests
#####################################################################

.PHONY: docker-emulator
docker-emulator:
	docker-compose down
	docker-compose up --build

.PHONY: external-browser-app
external-browser-app:
	$(MAKE) dev OT_APP_UI__EXTERNAL_BROWSER=1

.PHONY: test-cypress
test-cypress:
	wait-on http://localhost:$(PORT) && \
	wait-on http-get://localhost:31950/openapi.json && \
	cypress run --browser electron --record false

.PHONY: test-e2e
test-e2e:
	concurrently --kill-others --names "emulator,app,tests" \
		"$(MAKE) docker-emulator" \
		"$(MAKE) external-browser-app" \
		"$(MAKE) test-cypress"

.PHONY: cypress-visual
cypress-visual:
	cypress open

.PHONY: visual
visual:
	concurrently --kill-others --names "emulator,app,tests" \
		"$(MAKE) docker-emulator" \
		"$(MAKE) external-browser-app" \
		"$(MAKE) cypress-visual"
