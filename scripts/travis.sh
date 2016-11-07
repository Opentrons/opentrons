#!/usr/bin/env bash

run_install ()
{
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

  nvm install 6.0.0
  nvm use 6.0.0
  node --version
  npm --version

  sudo pip3 install -r requirements.txt
  npm install && cd app && npm install && cd ..  # Hack until instapp-app-deps works on travis
  # npm i -g mocha
  # npm run unit
  npm run release:posix
  # npm run integration
  ls dist/$1
  ls releases
}

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
    npm install

    brew install python3
    python3 --version
    python3 -c "import struct; print(struct.calcsize('P') * 8)"
    python --version
    echo $PATH

    # Install Python packages (built with Python 3)
    pip3 install pyinstaller
    pyinstaller --version
    pip3 install -r requirements.txt
    cd server && nosetests -s --logging-level WARNING && cd ..
  fi

  if [ "$1" == "install" ]; then
    run_install "mac"
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

    sudo apt-get install g++
    sudo apt-get install gcc
    sudo apt-get install python3-pip
    sudo pip3 install pyinstaller
    sudo apt-get install icnsutils # electron-builder dependency
    sudo apt-get install graphicsmagick # electron-builder dependency

    npm install
    export PATH=$PATH:$(pwd)/node_modules/.bin/
  fi

  if [ "$1" == "install" ]; then
    run_install "linux"
  fi
}

os="$(uname)"

if [ "$os" = "Darwin" ]; then
  execute_mac $1
fi

if [ "$os" = "Linux" ]; then
  execute_linux $1
fi

