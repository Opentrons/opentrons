# opentrons app desktop shell makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# source and output directories for main process code
src_dir := src
lib_dir := lib
babel := babel $(src_dir) --out-dir $(lib_dir) --ignore '**/__tests__/**'

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
