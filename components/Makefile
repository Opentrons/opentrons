# opentrons component library makefile

# adding the -c to SHELL prevents macOS optimizing away our PATH update
SHELL := /bin/bash -c

# add node_modules/.bin to PATH
PATH := $(shell cd .. && yarn bin):$(PATH)

# dev server port
port ?= 8081

# standard targets
#####################################################################

.PHONY: all
all: clean dist

.PHONY: install
install:
	yarn

.PHONY: clean
clean:
	shx rm -rf dist

# artifacts
#####################################################################

.PHONY: dist
dist: export NODE_ENV := development
dist:
	styleguidist build

# development
#####################################################################

.PHONY: dev
build: export NODE_ENV := development
dev:
	styleguidist server
