SHELL:=/bin/bash

.PHONY: test clean install package

install:
	npm up

package:
	mkdir -p bin && cp ../api/dist/opentrons-api-server bin/ && npm run package

test:
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
