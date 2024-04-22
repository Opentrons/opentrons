# opentrons ai client makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

benchmark_output := $(shell node -e 'console.log(new Date());')

# These variables can be overriden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage=true
test_opts ?=

# standard targets
#####################################################################

.PHONY: all
all: clean build

.PHONY: setup
setup:
	yarn

.PHONY: clean
clean:
	shx rm -rf dist

# artifacts
#####################################################################

.PHONY: build
build: export NODE_ENV := production
build:
	vite build
	git rev-parse HEAD > dist/.commit

# development
#####################################################################

.PHONY: dev
dev: export NODE_ENV := development
dev:
	vite serve

# production assets server
.PHONY: serve
serve: all
	node ../scripts/serve-static dist

.PHONY: test
test:
	$(MAKE) -C .. test-js-ai-client tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	make -C .. test-js-ai-client tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"
