# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

PATH := $(shell cd .. && pnpm exec bin):$(PATH)

PORT ?= 5173

# These variables can be overriden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage=true
test_opts ?=

target ?= production

.PHONY: all
all: clean build-$(target)

.PHONY: setup
setup:
	pnpm install

.PHONY: clean
clean:
	pnpm exec shx rm -rf dist

.PHONY: build-production
build-production: export NODE_ENV := production
build-production:
	pnpm exec vite build
	git rev-parse HEAD > dist/.commit

.PHONY: build-staging
build-staging: export NODE_ENV := staging
build-staging:
	pnpm exec vite build
	git rev-parse HEAD > dist/.commit

.PHONY: build
build:
	pnpm exec vite build

.PHONY: dev
dev: export NODE_ENV := development
dev: export PORT := $(PORT)
dev:
	pnpm exec vite serve

.PHONY: serve
serve: all
	pnpm exec vite preview

.PHONY: test
test:
	$(MAKE) -C .. test-js-opentrons-ai-client tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	$(MAKE) -C .. test-js-opentrons-ai-client tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"

.PHONY: staging-deploy
staging-deploy:
	aws s3 sync ./dist s3://staging-opentrons-ai-front-end/ --delete

.PHONY: prod-deploy
prod-deploy:
	aws s3 sync ./dist s3://prod-opentrons-ai-front-end/ --delete

.PHONY: format-md-json
format-md-json:
	pnpm exec oxfmt --write **/*.md **/*.json
