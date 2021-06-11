# opentrons step generation makefile

# type definitions
typedefs := $(shell yarn -s shx find "lib/**/*.d.ts")
flow_out := $(patsubst lib/%.d.ts,flow-types/%.js.flow,$(typedefs))

# artifacts
#####################################################################

.PHONY: flow-types
flow-types: $(flow_out)

flow-types/%.js.flow: lib/%.d.ts
	yarn flowgen $< --add-flow-header --interface-records --no-inexact --output-file $@

