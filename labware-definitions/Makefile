# opentrons app makefile

SHELL := /bin/bash

# add node_modules/.bin to PATH
PATH := $(shell yarn bin):$(PATH)

.PHONY: build
build:
	node build.js

.PHONY: clean
clean:
	shx rm -rf build
