# opentrons component library makefile

# use bash
SHELL := bash

# use devDependency CLIs with $(bin)/command
# set NODE_ENV for a command with $(env)=environment
bin := node_modules/.bin
env := $(bin)/cross-env NODE_ENV

# dev server port
port ?= 8081

# watch, coverage, and fix variables for tests and linting
watch ?= false
cover ?= true
updateSnapshot ?= false
fix ?= false
ifeq ($(watch), true)
	cover := false
endif

# stardard targets
#####################################################################

.PHONY: install
install:
	npm install

.PHONY: uninstall
uninstall:
	rm -rf node_modules

# development
#####################################################################



# checks
#####################################################################

.PHONY: test
test:
	$(env)=test $(bin)/jest \
		--coverage=$(cover) \
		--watch=$(watch) \
		--updateSnapshot=$(updateSnapshot)
	$(MAKE) check lint

.PHONY: check
check:
	$(bin)/flow

.PHONY: lint
lint:
	$(bin)/standard --verbose --fix=$(fix) | $(bin)/snazzy
	$(bin)/stylelint '**/*.css' --fix=$(fix) --verbose
