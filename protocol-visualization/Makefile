# protocol-visualization package makefile

tests ?= src
test_opts ?=

.PHONY: all
all: clean dist

.PHONY: clean
clean:
	@:

.PHONY: dist
dist: lib

.PHONY: lib
lib: export NODE_ENV := production
lib:
	pnpm exec vite build

.PHONY: build-ts
build-ts:
	pnpm exec tsc --build --emitDeclarationOnly

.PHONY: test
test:
	$(MAKE) -C .. test-js-protocol-visualization tests="$(tests)" test_opts="$(test_opts)"

cov_opts ?= --coverage=true

.PHONY: test-cov
test-cov:
	$(MAKE) -C .. test-js-protocol-visualization tests="$(tests)" test_opts="$(test_opts)" cov_opts="$(cov_opts)"

.PHONY: pack
pack: build-ts lib
	pnpm pack
