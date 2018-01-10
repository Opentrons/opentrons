# opentrons protocol designer makefile

# add node_modules/.bin to the path
PATH := $(shell yarn bin):$(PATH)

# dev server port
port ?= 8080

# watch, coverage, and fix variables for tests and linting
watch ?= false
cover ?= true
updateSnapshot ?= false
fix ?= false
ifeq ($(watch), true)
	cover := false
endif

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

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

# TODO(mc, 2018-01-09): use html-webpack-plugin for index.html
.PHONY: build
build:
	$(env)=production webpack -p
	cp index.html dist/

# development
#####################################################################



# checks
#####################################################################

.PHONY: test
test:
	$(env)=test jest \
		--coverage=$(cover) \
		--watch=$(watch) \
		--updateSnapshot=$(updateSnapshot)
	$(MAKE) check lint

.PHONY: check
check:
	flow

.PHONY: install-types
install-types:
	flow-typed install --ignoreDeps dev

# TODO(mc, 2018-01-09): rm -rf is not cross-platform
.PHONY: uninstall-types
uninstall-types:
	rm -rf flow-typed

.PHONY: lint
lint:
	standard --verbose --fix=$(fix) | snazzy
	stylelint '**/*.css' --fix=$(fix) --verbose
