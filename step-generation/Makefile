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
	yarn shx rm -rf lib

# artifacts
#####################################################################

# Declarations go to lib/ via tsc; JS entrypoints are lib/index.mjs and lib/index.cjs from Vite.
.PHONY: build-ts
build-ts:
	cd .. && yarn tsc --build step-generation/tsconfig.json

.PHONY: lib
lib: export NODE_ENV := production
lib:
	$(MAKE) clean
	$(MAKE) build-ts
	yarn vite build

.PHONY: pack
pack: lib
	yarn pack

.PHONY: test
test:
	$(MAKE) -C .. test-js-step-generation tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	make -C .. test-js-step-generation tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"

