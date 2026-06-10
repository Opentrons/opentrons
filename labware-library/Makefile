# opentrons labware-library makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && pnpm bin):$(PATH)

# These variables can be overriden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage=true
test_opts ?=

# Vite server configuration (override at invocation time)
HOST ?= ::
PORT ?=


.PHONY: all
all: clean dist

.PHONY: clean
clean:
	pnpm exec shx rm -rf dist

# production assets
.PHONY: dist
dist: export NODE_ENV := production
dist:
	vite build

# development assets server
.PHONY: dev
dev: export NODE_ENV := development
dev:
	vite serve --host=$(HOST) $(if $(PORT),--port $(PORT),)

# production assets server
.PHONY: serve
serve: all
	vite preview --host=$(HOST) $(if $(PORT),--port $(PORT),)

# unit tests
.PHONY: test
test:
	$(MAKE) -C .. test-js-labware-library

.PHONY: test
test:
	$(MAKE) -C .. test-js-labware-library tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	$(MAKE) -C .. test-js-labware-library tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"
