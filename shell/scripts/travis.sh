#!/usr/bin/env bash

set -e

execute_mac ()
{
  if [ "$1" == "pre-install" ]; then
    export HOMEBREW_CACHE=$HOME/.cache/our-brew
    uname -a
    python --version
    python -c "import struct; print(struct.calcsize('P') * 8)"

    # Update brew
    brew update

    # Install node.js
    brew install nvm
    mkdir -p ~/.nvm && export NVM_DIR=~/.nvm && source $(brew --prefix nvm)/nvm.sh && nvm alias default 6.0.0
    echo "$(brew --prefix nvm)/nvm.sh" >> ~/.bashrc
    nvm install 6.0.0
    nvm use 6.0.0
    node --version
    npm --version

    # NOTE(ahmed): We might not need python 3 explicit installation any more
    brew install scripts/ot_python3.rb
    python3 --version
    python3 -c "import struct; print(struct.calcsize('P') * 8)"
    python --version
    echo $PATH

    # Install Python packages (built with Python 3)
    pip3 install pyinstaller
    pyinstaller --version
  fi
}

execute_linux ()
{
  if [ "$1" == "pre-install" ]; then
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

    nvm install 6.0.0
    nvm use 6.0.0
    node --version
    npm --version
    ls -la ~/virtualenv/python2.7/bin/
    npm config set python ~/virtualenv/python2.7/bin/python
    echo "npm's python is $(npm config get python)"

    # sudo apt-get install g++
    # sudo apt-get install gcc
    # sudo apt-get install python3-pip
    # sudo apt-get install icnsutils # electron-builder dependency
    # sudo apt-get install graphicsmagick # electron-builder dependency
    # sudo apt-get install xvfb

    export PATH=$PATH:$(pwd)/node_modules/.bin/
  fi
}

os="$(uname)"

if [ "$os" = "Darwin" ]; then
  execute_mac $1
fi

if [ "$os" = "Linux" ]; then
    execute_linux $1
fi
