# shared-data makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# These variables can be overriden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage=true
test_opts ?=

# warning suppression variables for tests and linting
quiet ?= false

FORMAT_FILE_GLOB = "**/*.@(ts|tsx|js|json|md|yml)"

# Top level targets

.PHONY: all
all: clean dist

.PHONY: setup
setup: setup-py

.PHONY: dist
dist: dist-py

.PHONY: clean
clean: clean-py

.PHONY: format
format: format-js format-py

.PHONY: lint
lint: lint-js lint-py

# JavaScript targets

.PHONY: lib-js
lib-js: export NODE_ENV := production
lib-js:
	pnpm vite build

.PHONY: build-ts
build-ts:
	pnpm tsc --build --emitDeclarationOnly

.PHONY: format-js
format-js:
	pnpm exec prettier --ignore-path ../.eslintignore --write $(FORMAT_FILE_GLOB)

.PHONY: lint-js
lint-js: lint-js-eslint lint-js-prettier

.PHONY: lint-js-eslint
lint-js-eslint:
	pnpm eslint --ignore-path ../.eslintignore --quiet=$(quiet) "**/*.@(js|ts|tsx)"

.PHONY: lint-js-prettier
lint-js-prettier:
	pnpm exec prettier --ignore-path ../.eslintignore --check $(FORMAT_FILE_GLOB)


# Python targets

.PHONY: setup-py
setup-py:
	$(MAKE) -f Makefile-python.mk setup-py

.PHONY: lock-py
lock-py:
	$(MAKE) -f Makefile-python.mk lock-py

.PHONY: dist-py
dist-py:
	$(MAKE) -f Makefile-python.mk sdist wheel

.PHONY: clean-py
clean-py:
	$(MAKE) -f Makefile-python.mk clean

.PHONY: teardown-py
teardown-py:
	$(MAKE) -f Makefile-python.mk teardown

.PHONY: lint-py
lint-py:
	$(MAKE) -f Makefile-python.mk lint

.PHONY: format-py
format-py:
	$(MAKE) -f Makefile-python.mk format

.PHONY: push-no-restart
push-no-restart:
	$(MAKE) -f Makefile-python.mk push-no-restart

.PHONY: push
push:
	$(MAKE) -f Makefile-python.mk push

.PHONY: push-no-restart-ot3
push-no-restart-ot3:
	$(MAKE) -f Makefile-python.mk push-no-restart-ot3

.PHONY: push-ot3
push-ot3:
	$(MAKE) -f Makefile-python.mk push-ot3

# NOTE: This Python-only recipe is intentionally generically named "deploy" as opposed
# to something like "deploy-py". Our GitHub Actions workflows for Python projects
# currently hard-code "deploy". If we add a JS deploy recipe to this Makefile, we
# should probably rename this to "deploy-py" to avoid confusion, and reconsider the way
# the GitHub Actions stuff works.
.PHONY: deploy
deploy:
	$(MAKE) -f Makefile-python.mk deploy

.PHONY: test-py
test-py:
	$(MAKE) -f Makefile-python.mk test

.PHONY: test
test:
	$(MAKE) -C .. test-js-shared-data tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	$(MAKE) -C .. test-js-shared-data tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"

.PHONY: pack
pack: build-ts lib-js
	pnpm pack
