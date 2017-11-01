SHELL:=/bin/bash

.PHONY: test clean install package

install:
	npm install

ui/dist:
	npm run build-renderer

shell/dist:
	npm run build-main

bin/opentrons-api-server:
	mkdir -p bin && cp ../api/dist/opentrons-api-server bin/

build: shell/dist ui/dist bin/opentrons-api-server

package: build
	export OT_TIME_SUFFIX=$(OT_TIME_SUFFIX) && \
	export OT_BRANCH_SUFFIX=$(OT_BRANCH_SUFFIX) && \
	export OT_COMMIT_SUFFIX=$(OT_COMMIT_SUFFIX) && \
	npm run package

test: build
	npm run test

test-e2e: build
	npm run test-e2e

dev:
	npm run build-dev
	npm run dev

clean:
	rm -rf \
		ui/dist \
		shell/dist \
		dll \
		bin \
		.coverage
