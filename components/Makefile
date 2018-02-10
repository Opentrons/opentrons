# opentrons component library makefile

# use bash
SHELL := bash

# use devDependency CLIs with $(bin)/command
# set NODE_ENV for a command with $(env)=environment
bin := node_modules/.bin
env := $(bin)/cross-env NODE_ENV

# dev server port
port ?= 8081

# watch, coverage, and update snapshot variables for tests
watch ?= false
cover ?= true
updateSnapshot ?= false

ifeq ($(watch), true)
	cover := false
endif

# standard targets
#####################################################################

.PHONY: install
install:
	yarn

.PHONY: uninstall
uninstall:
	rm -rf node_modules

# artifacts
#####################################################################

.PHONY: build
build:
	$(env)=development $(bin)/styleguidist build

# development
#####################################################################

.PHONY: dev
dev:
	$(env)=development $(bin)/styleguidist server

# checks
#####################################################################

.PHONY: test
test:
	$(env)=test $(bin)/jest \
		--coverage=$(cover) \
		--watch=$(watch) \
		--updateSnapshot=$(updateSnapshot)

.PHONY: install-types
install-types:
	$(bin)/flow-typed install --ignoreDeps=dev --packageDir=..
