# opentrons api-client makefile

# using bash instead of /bin/bash in SHELL prevents macOS optimizing away our PATH update
# TODO(mc, 2021-02-12): this may be unnecessary by using `pnpm run` instead
SHELL := bash

# standard targets
#####################################################################

.PHONY: all
all: clean build

.PHONY: clean
clean:
	tsc --build --clean && pnpm shx rm -rf \"dist\"

.PHONY: build
build:
	rollup --config rollup.config.js

.PHONY: test
test:
	$(MAKE) -C .. test-js-api-client
