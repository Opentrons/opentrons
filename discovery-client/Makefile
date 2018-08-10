# opentrons app desktop shell makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# source and output directories for main process code
src_dir := src
lib_dir := lib
src_ignore := '**/__@(tests|mocks)__/**'
babel := babel $(src_dir) --ignore $(src_ignore) --out-dir $(lib_dir) 
flow_copy := flow-copy-source --ignore $(src_ignore) $(src_dir) $(lib_dir)

# set NODE_ENV for a command with $(env)=environment
env := cross-env NODE_ENV

# standard targets
#####################################################################

.PHONY: all
all: clean lib

.PHONY: install
install:
	yarn

.PHONY: clean
clean:
	shx rm -rf lib

# artifacts
#####################################################################

.PHONY: lib
lib:
	$(env)=production $(babel)
	$(flow_copy)
