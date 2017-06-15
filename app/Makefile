SHELL:=/bin/bash
NVM_DIR:=$(shell pwd)/.nvm

.PHONY: test clean install config 

config: .nvm

.nvm:
	NVM_DIR=$(NVM_DIR) bash -c 'wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash'
	source '$(NVM_DIR)/nvm.sh' && nvm install --lts

install: 
	source '$(NVM_DIR)/nvm.sh' && nvm use --lts && npm i --production

test:
	source '$(NVM_DIR)/nvm.sh' && nvm use --lts && npm run unit

build:
	source '$(NVM_DIR)/nvm.sh' && nvm use --lts && npm run build

clean:
	rm -rf \
		.nvm \
		build \
		node_modules \
		.coverage
