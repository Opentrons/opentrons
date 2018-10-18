# opentrons discovery-client makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# source and output directories for main process code
src_dir := src
lib_dir := lib
src_ignore := "**/__@(tests|mocks|fixtures)__/**"
babel := babel $(src_dir) --ignore $(src_ignore) --out-dir $(lib_dir)
flow_copy := flow-copy-source --ignore $(src_ignore) $(src_dir) $(lib_dir)

# standard targets
#####################################################################

.PHONY: all
all: dist

.PHONY: install
install:
	yarn

.PHONY: clean
clean:
	shx rm -rf lib dist

# artifacts
#####################################################################

.PHONY: lib
lib: export NODE_ENV := production
lib:
	$(babel)
	$(flow_copy)

.PHONY: dist
dist: clean lib
	@shx mkdir -p dist
	npm pack
	shx mv '*.tgz' dist
