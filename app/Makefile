# opentrons app makefile

# use bash
SHELL := bash

# source files
source := $(shell find src -type f -name '*')
shell_dir := ../app-shell

# use devDependency CLIs with $(bin)/command
# set NODE_ENV for a command with $(env)=environment
bin := node_modules/.bin
env := $(bin)/cross-env NODE_ENV

# dev server port
port ?= 8090

# watch and coverage variables for tests
watch ?= false
cover ?= true

ifeq ($(watch), true)
	cover := false
endif

# standard targets
#####################################################################

.PHONY: all
all: clean dist

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

.PHONY: dist
dist: $(source)
	$(env)=production $(bin)/webpack --profile

# development
#####################################################################

.PHONY: dev
dev:
	$(bin)/concurrently \
		"$(MAKE) dev-server" \
		"$(MAKE) dev-mdns" \
		"sleep 3 && $(MAKE) -C $(shell_dir) dev port=$(port)"

.PHONY: dev-server
dev-server:
	$(env)=development PORT=$(port) $(bin)/webpack-dev-server --hot

# TODO(mc, 2017-10-31): remove when API is capable of advertising itself
.PHONY: dev-mdns
dev-mdns:
	$(env)=development node scripts/advertise-local-api.js

# checks
#####################################################################

.PHONY: test
test:
	$(env)=test $(bin)/jest '.*\.test\.js' --coverage=$(cover) --watch=$(watch)

.PHONY: install-types
install-types:
	$(bin)/flow-typed install --ignoreDeps=dev --packageDir=..
