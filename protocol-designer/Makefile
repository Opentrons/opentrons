# opentrons protocol designer makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

benchmark_output := $(shell node -e 'console.log(new Date());')

# These variables can be overriden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage=true --ci=true --collectCoverageFrom='protocol-designer/src/**/*.(js|ts|tsx)'
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
	webpack --profile
	git rev-parse HEAD > dist/.commit

# development
#####################################################################

.PHONY: benchmarks
benchmarks: export NODE_ENV := test
benchmarks:
	shx mkdir -p benchmarks/output
	node ../scripts/runBenchmarks "./benchmarks/*.js" | \
	ntee "./benchmarks/output/$(benchmark_output)"

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
	concurrently --no-color --kill-others --success first --names "protocol-designer-server,protocol-designer-tests" \
	"$(MAKE) dev CYPRESS=1" \
	"wait-on http://localhost:8080/ && cypress run --browser chrome --headless --record false"

.PHONY: test
test:
	$(MAKE) -C .. test-js-protocol-designer tests="$(tests)" test_opts="$(test_opts)"


.PHONY: derek-test
derek-test:
	concurrently \
	"$(MAKE) dev CYPRESS=1" \
	"wait-on http://localhost:8080/ && cypress run --browser chrome --record false --spec 'cypress/integration/import.spec.js'"

.PHONY: open-cypress
open-cypress:
	wait-on http://localhost:8080/ && cypress open --browser chrome --env host=0.0.0.0port=8080

.PHONY: test-cov
test-cov:
	make -C .. test-js-protocol-designer tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"