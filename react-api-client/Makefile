# opentrons react-api-client makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
# TODO(mc, 2021-02-12): this may be unnecessary by using `pnpm run` instead
SHELL := bash

# These variables can be overriden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage=true --ci=true --collectCoverageFrom='react-api-client/src/**/*.(js|ts|tsx)'
test_opts ?=

# standard targets
#####################################################################

.PHONY: all
all: clean build

.PHONY: clean
clean:
	pnpm shx rm -rf dist

.PHONY: build
build:
	rollup --config rollup.config.js

.PHONY: test
test:
	$(MAKE) -C .. test-js-react-api-client tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	make -C .. test-js-react-api-client tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"
