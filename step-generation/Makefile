# step-generation makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# These variables can be overridden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage --pool=threads
test_opts ?=

# standard targets
#####################################################################

.PHONY: all
all: lib

.PHONY: clean
clean:
	pnpm shx rm -rf lib

# artifacts
#####################################################################

# Declarations go to lib/ via tsc; JS entrypoints are lib/index.mjs and lib/index.cjs from Vite.
.PHONY: build-ts
build-ts:
	cd .. && pnpm tsc --build --force step-generation/tsconfig.json

.PHONY: lib
lib: export NODE_ENV := production
lib:
	$(MAKE) clean
	$(MAKE) build-ts
	pnpm vite build

.PHONY: pack
pack: lib
	pnpm pack

.PHONY: test
test:
	$(MAKE) -C .. test-js-step-generation tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	$(MAKE) -C .. test-js-step-generation tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"
