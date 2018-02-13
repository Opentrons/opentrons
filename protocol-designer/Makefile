# opentrons protocol designer makefile

# add node_modules/.bin to PATH
PATH := $(shell yarn bin):$(PATH)

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

# dev server port
port ?= 8080

# watch, coverage, and update snapshot variables for tests
watch ?= false
cover ?= true
updateSnapshot ?= false

ifeq ($(watch), true)
	cover := false
endif

# standard targets
#####################################################################

.PHONY: all
all: clean build

.PHONY: install
install:
	yarn

.PHONY: clean
clean:
	shx rm -rf dist

# artifacts
#####################################################################

.PHONY: build
build:
	$(env)=production webpack -p
	shx cp index.html dist/

# development
#####################################################################

.PHONY: dev
dev:
	$(env)=development webpack-dev-server --hot

# checks
#####################################################################

.PHONY: test
test:
	$(env)=test jest \
		--coverage=$(cover) \
		--watch=$(watch) \
		--updateSnapshot=$(updateSnapshot)

.PHONY: install-types
install-types:
	flow-typed install --ignoreDeps=dev --packageDir=..
