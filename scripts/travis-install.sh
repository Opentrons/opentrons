#!/usr/bin/env bash

# install node.js
nvm install

# install osx dependencies
if [ "$TRAVIS_OS_NAME" = "osx" ]; then
  brew update
  brew upgrade pyenv
  brew install yarn --without-node
  pyenv install --skip-existing
  eval "$(pyenv init -)"
fi

# upgrade yarn
curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version 1.9.4
export PATH=$HOME/.yarn/bin:$PATH

# report versions for sanity
echo "make --version"
make --version

echo "python --version"
python --version

echo "pip --version"
pip --version

echo "node --version"
node --version

echo "yarn --version"
yarn --version
