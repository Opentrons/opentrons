#!/usr/bin/env bash

echo "Got here..."


# mkdir -p ~/.nvm && export NVM_DIR=~/.nvm && source $(brew --prefix nvm)/nvm.sh && nvm alias default 6.0.0
npm config set python /usr/bin/python
virtualenv -p python3 venv && source venv/bin/activate
./scripts/with-nodenv-linux "make app"
make api-exe
./scripts/with-nodenv-linux "make app-shell"
