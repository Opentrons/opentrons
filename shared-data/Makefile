# shared-data makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# TODO(mc, 2018-10-25): use dist to match other projects
BUILD_DIR := build

# Top level targets

.PHONY: all
all: clean dist

.PHONY: setup
setup: setup-py setup-js

.PHONY: dist
dist: dist-js dist-py

.PHONY: clean
clean: clean-js clean-py

# JavaScript targets

.PHONY: setup-js
setup-js: dist-js

.PHONY: dist-js
dist-js:
	@yarn shx mkdir -p $(BUILD_DIR)
	node js/scripts/build.js $(BUILD_DIR)

.PHONY: clean-js
clean-js:
	yarn shx rm -rf $(BUILD_DIR)

# Python targets

.PHONY: setup-py
setup-py:
	$(MAKE) -C python setup-py

.PHONY: dist-py
dist-py:
	$(MAKE) -C python wheel

.PHONY: clean-py
clean-py:
	$(MAKE) -C python clean

.PHONY: teardown-py
teardown-py:
	$(MAKE) -C python teardown

.PHONY: lint-py
lint-py:
	$(MAKE) -C python lint

.PHONY: push-no-restart
push-no-restart:
	$(MAKE) -C python push-no-restart

.PHONY: push
push:
	$(MAKE) -C python push

.PHONY: push-no-restart-ot3
push-no-restart-ot3:
	$(MAKE) -C python push-no-restart-ot3

.PHONY: push-ot3
push-ot3:
	$(MAKE) -C python push-ot3

.PHONY: deploy-py
deploy-py:
	$(MAKE) -C python deploy

.PHONY: test-py
test-py:
	$(MAKE) -C python test
