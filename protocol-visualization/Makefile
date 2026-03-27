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
	yarn vite build

.PHONY: build-ts
build-ts:
	yarn tsc --build --emitDeclarationOnly

# Same lint surface as monorepo JS checks (see root Makefile).
.PHONY: lint
lint:
	$(MAKE) -C .. lint-js lint-css lint-json

.PHONY: check-ts
check-ts:
	cd .. && yarn tsc --build protocol-visualization/tsconfig.json

.PHONY: test
test:
	$(MAKE) -C .. test-js-protocol-visualization tests="$(tests)" test_opts="$(test_opts)"

cov_opts ?= --coverage=true

.PHONY: test-cov
test-cov:
	$(MAKE) -C .. test-js-protocol-visualization tests="$(tests)" test_opts="$(test_opts)" cov_opts="$(cov_opts)"

.PHONY: pack
pack: build-ts lib
	yarn pack
