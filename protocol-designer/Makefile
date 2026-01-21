# opentrons protocol designer makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

benchmark_output := $(shell node -e 'console.log(new Date());')

# These variables can be overridden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage --pool=threads
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
build: export NODE_OPTIONS := --max-old-space-size=8192
build:
	vite build
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
dev: export NODE_OPTIONS := --max-old-space-size=8192
dev:
	vite serve

# production assets server
.PHONY: serve
serve: export NODE_OPTIONS := --max-old-space-size=8192
serve: all
	vite preview

.PHONY: test
test:
	$(MAKE) -C .. test-js-protocol-designer tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	make -C .. test-js-protocol-designer tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"

# analyze bundle
.PHONY: bundle-analyzer
bundle-analyzer:
	ANALYZE_DEBUG=true make build
