# opentrons protocol designer makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && pnpm bin):$(PATH)

# These variables can be overridden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage --pool=threads
test_opts ?=

# standard targets
#####################################################################

.PHONY: all
all: clean dist

.PHONY: setup
setup:
	pnpm install

.PHONY: clean
clean:
	pnpm exec shx rm -rf dist

# artifacts
#####################################################################

.PHONY: dist
dist: export NODE_ENV := production
dist: export NODE_OPTIONS := --max-old-space-size=5120
dist:
	vite build
	git rev-parse HEAD > dist/.commit

# development
#####################################################################

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
	$(MAKE) -C .. test-js-protocol-designer tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"

# analyze bundle
.PHONY: bundle-analyzer
bundle-analyzer:
	ANALYZE_DEBUG=true make dist
