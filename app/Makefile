# opentrons app makefile

# add node_modules/.bin to the path
PATH := $(shell yarn bin):$(PATH)

# desktop shell directory for running the app in development
shell_dir := ../app-shell

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

# dev server port
port ?= 8090

# test and lint options
watch ?= false
cover ?= true
fix ?= false

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
dist:
	$(env)=production webpack --profile

# development
#####################################################################

.PHONY: dev
dev:
	concurrently \
		"$(MAKE) dev-server" \
		"$(MAKE) dev-mdns" \
		"wait-on http-get://localhost:$(port) && $(MAKE) -C $(shell_dir) dev port=$(port)"

.PHONY: dev-server
dev-server:
	$(env)=development PORT=$(port) webpack-dev-server --hot

# TODO(mc, 2017-10-31): remove when API is capable of advertising itself
.PHONY: dev-mdns
dev-mdns:
	$(env)=development node scripts/advertise-local-api.js

# checks
#####################################################################

.PHONY: test
test: test-unit
	$(MAKE) check lint

.PHONY: test-unit
test-unit:
	$(env)=test jest '.*\.test\.js' --coverage=$(cover) --watch=$(watch)

.PHONY: check
check:
	flow

.PHONY: lint
lint:
	standard --verbose --fix=$(fix) | snazzy
	stylelint '**/*.css' --fix=$(fix) --verbose

.PHONY: install-types
install-types:
	flow-typed install --ignoreDeps dev

# TODO(mc, 2018-01-09): rm -rf is not cross-platform
.PHONY: uninstall-types
uninstall-types:
	rm -rf flow-typed
