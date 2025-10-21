# opentrons component library makefile

# dev server port
port ?= 6060

# These variables can be overriden when make is invoked to customize the
# behavior of jest
tests ?= src
cov_opts ?= --coverage=true
test_opts ?=

# standard targets
#####################################################################

.PHONY: all
all: clean dist

.PHONY: clean
clean:
	cd .. && yarn shx rm -rf storybook-static

# artifacts
#####################################################################

.PHONY: dist
dist:
	cd .. && yarn sb build

.PHONY: lib
lib: export NODE_ENV := production
lib:
	yarn vite build

.PHONY: build-ts
build-ts:
	yarn tsc --build --emitDeclarationOnly

# development
#####################################################################

.PHONY: dev
dev:
	cd .. && yarn sb dev --port $(port)

.PHONY: test
test:
	$(MAKE) -C .. test-js-components tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	make -C .. test-js-components tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"
