# opentrons labware-library makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# These variables can be overriden when make is invoked to customize the
# behavior of jest
tests ?=
cov_opts ?= --coverage=true
test_opts ?=


.PHONY: all
all: clean dist

.PHONY: clean
clean:
	shx rm -rf dist

# production assets
.PHONY: dist
dist: export NODE_ENV := production
dist:
	vite build
	node ./renderStatic.js

# development assets server
.PHONY: dev
dev: export NODE_ENV := development
dev:
	vite serve --host=::

# production assets server
.PHONY: serve
serve: all
	node ../scripts/serve-static dist

# end to end tests
# this is the value in cypress.config.js
LOCAL_BASE_URL ?= http://localhost:5179
.PHONY: test-e2e
test-e2e:
	concurrently --no-color --kill-others --success first --names "labware-library-server,labware-library-tests" \
	"$(MAKE) dev CYPRESS=1 GTM_ID=''" \
	"wait-on $(LOCAL_BASE_URL)/ && echo \"Running cypress at $(date)\" && cypress run --browser chrome --headless --record false"

REMOTE_BASE_URL ?= https://labware.opentrons.com
.PHONY: test-e2e-remote
test-e2e-remote:
	@echo "Running cypress tests against $(CYPRESS_BASE_URL)"
	@echo "example: make test-e2e-remote REMOTE_BASE_URL='https://labware.opentrons.com'"
	@echo
	cypress run --browser chrome --headless --config "baseUrl=$(REMOTE_BASE_URL)"

# unit tests
.PHONY: test
test:
	$(MAKE) -C .. test-js-labware-library

.PHONY: test
test:
	$(MAKE) -C .. test-js-labware-library tests="$(tests)" test_opts="$(test_opts)"

.PHONY: test-cov
test-cov:
	make -C .. test-js-labware-library tests=$(tests) test_opts="$(test_opts)" cov_opts="$(cov_opts)"
