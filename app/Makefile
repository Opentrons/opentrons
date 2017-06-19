SHELL:=/bin/bash
NVM_DIR:=$(shell pwd)/.nvm

.PHONY: test clean install config package

config:
	NVM_DIR=$(NVM_DIR) bash -c 'wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash'
	source '$(NVM_DIR)/nvm.sh' && nvm install --lts

install:
	source '$(NVM_DIR)/nvm.sh' && nvm use --lts && npm i

package:
	source '$(NVM_DIR)/nvm.sh' && nvm use --lts && mkdir -p bin && cp ../api/dist/opentrons-api-server bin/ && npm run package

test:
	source '$(NVM_DIR)/nvm.sh' && nvm use --lts && npm run test

clean:
	rm -rf \
		.nvm \
		ui/dist \
		shell/dist \
		dll \
		node_modules \
		bin \
		.coverage
