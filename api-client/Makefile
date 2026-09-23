# opentrons api-client makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
# TODO(mc, 2021-02-12): this may be unnecessary by using `pnpm run` instead
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && pnpm bin):$(PATH)

# These variables can be overriden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage=true
test_opts ?=

# standard targets
#####################################################################

.PHONY: all
all: clean build

.PHONY: clean
clean:
	tsc --build --clean && pnpm exec shx rm -rf \"dist\"

.PHONY: build
build: export NODE_ENV := production
build:
	vite build

.PHONY: test
test:
	$(MAKE) -C .. test-js-api-client tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	$(MAKE) -C .. test-js-api-client tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"
