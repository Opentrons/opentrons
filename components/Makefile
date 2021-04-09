# opentrons component library makefile

# dev server port
port ?= 8081

# type definitions
typedefs := $(shell yarn -s shx find "lib/**/*.d.ts")
flow_out := $(patsubst lib/%.d.ts,flow-types/%.js.flow,$(typedefs))

# standard targets
#####################################################################

.PHONY: all
all: clean dist

.PHONY: setup
setup:
	yarn

.PHONY: clean
clean:
	yarn shx rm -rf ../storybook-static

# artifacts
#####################################################################

.PHONY: dist
dist: export NODE_ENV := development
dist:
	(cd .. && yarn build-storybook)

.PHONY: flow-types
flow-types: $(flow_out)

flow-types/%.js.flow: lib/%.d.ts
	yarn flowgen $< --add-flow-header --interface-records --no-inexact --output-file $@

# development
#####################################################################

.PHONY: dev
build: export NODE_ENV := development
dev:
	(cd .. && yarn storybook)
