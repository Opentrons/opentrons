# opentrons component library makefile

# dev server port
port ?= 6060

# type definitions
typedefs := $(shell yarn -s shx find "lib/**/*.d.ts")
flow_out := $(patsubst lib/%.d.ts,flow-types/%.js.flow,$(typedefs))

# standard targets
#####################################################################

.PHONY: all
all: clean dist

.PHONY: clean
clean:
	yarn --cwd .. shx rm -rf storybook-static

# artifacts
#####################################################################

.PHONY: dist
dist:
	yarn --cwd .. build-storybook

.PHONY: flow-types
flow-types: $(flow_out)

flow-types/%.js.flow: lib/%.d.ts
	yarn flowgen $< --add-flow-header --interface-records --no-inexact --output-file $@

# development
#####################################################################

.PHONY: dev
dev:
	yarn --cwd .. storybook --port $(port)
