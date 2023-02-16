# opentrons node-usb-bridge-client makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
# TODO(mc, 2021-02-12): this may be unnecessary by using `yarn run` instead
SHELL := bash

# outputs
main_out := lib/index.js lib/index.js.map
cli_out := lib/cli.js lib/cli.js.map

# standard targets
#####################################################################

.PHONY: all
all: clean lib

.PHONY: clean
clean:
	yarn shx rm -rf $(main_out) $(cli_out)

# artifacts
#####################################################################

.PHONY: lib
lib: export NODE_ENV := production
lib: $(main_out) $(cli_out)

$(main_out) $(cli_out): src/index.ts src/usb-agent.ts src/cli.ts webpack.config.js tsconfig.json Makefile
	yarn webpack
