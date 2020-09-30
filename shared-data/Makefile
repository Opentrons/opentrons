# shared-data makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
SHELL := bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# TODO(mc, 2018-10-25): use dist to match other projects
BUILD_DIR := build


#######################################

.PHONY: all
all: clean dist dist-py

.PHONY: setup-js
setup-js:
	$(MAKE) dist

.PHONY: setup-py
setup-py:
	$(MAKE) -C python setup-py


.PHONY: setup
setup: setup-py setup-js


.PHONY: dist
dist:
	@shx mkdir -p $(BUILD_DIR)
	node js/scripts/build.js $(BUILD_DIR)


.PHONY: dist-py
dist-py:
	$(MAKE) -C python wheel


.PHONY: clean-py
clean-py:
	$(MAKE) -C python clean


.PHONY: clean
clean: clean-py
	shx rm -rf $(BUILD_DIR)



.PHONY: lint-py
lint-py:
	$(MAKE) -C python lint

.PHONY: push-no-restart
push-no-restart:
	$(MAKE) -C python push-no-restart


.PHONY: push
push:
	$(MAKE) -C python push

.PHONY: deploy-py
deploy-py:
	$(MAKE) -C python deploy


.PHONY: test-py
test-py:
	$(MAKE) -C python test
