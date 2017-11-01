# TeamCity Build Script
# source scripts/install-${TRAVIS_OS_NAME} # OS-specific installs
# pip install pyyaml coveralls

eval "$(pyenv init -)"
mkdir -p ~/.nvm && export NVM_DIR=~/.nvm && source $(brew --prefix nvm)/nvm.sh
nvm install $OT_NODE_VERSION && nvm use $OT_NODE_VERSION

cd api && make clean install && cd ..
cd app && make clean install && cd ..

export OT_TIME_SUFFIX=-$(date '+%Y-%m-%d_%H-%M')
export OT_BRANCH_SUFFIX=-$(git branch | grep \* | cut -d ' ' -f2)
TC_COMMIT=$(git rev-parse HEAD)
export OT_COMMIT_SUFFIX=-${TC_COMMIT:0:7}

cd api && make test exe && cd ..
cd app && make -j 2 build test test-e2e && make package && cd ..

# Clean up. This will leave only single-file build artifacts
find ./app/dist/** ! -name 'opentrons-v*' -exec rm -rf {} +
