# opentrons labware-library makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# override webpack's default hashing algorithm for node 18: https://github.com/webpack/webpack/issues/14532
export NODE_OPTIONS := --openssl-legacy-provider
# These variables can be overriden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage=true --ci=true --collectCoverageFrom='labware-library/src/**/*.(js|ts|tsx)'
test_opts ?=

# --coverage=true --ci=true --collectCoverageFrom="labware-library/src/**/*.(js|ts|tsx)" labware-library/src

.PHONY: all
all: clean dist

.PHONY: clean
clean:
	shx rm -rf dist

# production assets
.PHONY: dist
dist: export NODE_ENV := production
dist:
	webpack --profile
	node ./renderStatic.js

# development assets server
.PHONY: dev
dev: export NODE_ENV := development
dev:
	webpack-dev-server --hot

# production assets server
.PHONY: serve
serve: all
	node ../scripts/serve-static dist

# end to end tests
.PHONY: test-e2e
test-e2e:
	concurrently --no-color --kill-others --success first --names "labware-library-server,labware-library-tests" \
	"$(MAKE) dev CYPRESS=1 GTM_ID=''" \
	"wait-on http://localhost:8080/ && cypress run --browser chrome --headless --record false"
# unit tests
.PHONY: test
test:
	$(MAKE) -C .. test-js-labware-library

.PHONY: test
test:
	$(MAKE) -C .. test-js-labware-library tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	make -C .. test-js-labware-library tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"
