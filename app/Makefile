SHELL:=/bin/bash

.PHONY: test clean install package

install:
	npm up

ui/dist:
	npm run build-renderer

shell/dist:
	npm run build-main

build: shell/dist ui/dist

package: build
	mkdir -p bin && cp ../api/dist/opentrons-api-server bin/ && npm run package

test: build
	npm run test && npm run test-e2e

clean:
	rm -rf \
		.nvm \
		ui/dist \
		shell/dist \
		dll \
		node_modules \
		bin \
		.coverage
