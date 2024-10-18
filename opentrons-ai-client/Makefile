# opentrons ai client makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# dev server port
PORT ?= 5173

benchmark_output := $(shell node -e 'console.log(new Date());')

# These variables can be overriden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage=true
test_opts ?=

# This variable is for all command
target ?= production

# standard targets
#####################################################################

.PHONY: all
all: clean build-$(target)

.PHONY: setup
setup:
	yarn

.PHONY: clean
clean:
	shx rm -rf dist

# artifacts
#####################################################################

.PHONY: build-production
build-production: export NODE_ENV := production
build-production:
	vite build
	git rev-parse HEAD > dist/.commit

.PHONY: build-staging
build-staging: export NODE_ENV := staging
build-staging:
	vite build
	git rev-parse HEAD > dist/.commit

# development
#####################################################################

.PHONY: dev
dev: export NODE_ENV := development
dev: export PORT := $(PORT)
dev:
	vite serve

# production assets server
.PHONY: serve
serve: all
	node ../scripts/serve-static dist

.PHONY: test
test:
	$(MAKE) -C .. test-js-ai-client tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	make -C .. test-js-ai-client tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"

.PHONY: staging-deploy
staging-deploy:
	aws s3 sync ./dist s3://staging-opentrons-ai-front-end/ --delete

.PHONY: prod-deploy
prod-deploy:
	aws s3 sync ./dist s3://prod-opentrons-ai-front-end/ --delete

.PHONY: format-md-json
format-md-json:
	yarn prettier --ignore-path .eslintignore --write **/*.md **/*.json
