# TeamCity Build Script
# source scripts/install-${TRAVIS_OS_NAME} # OS-specific installs
# pip install pyyaml coveralls
cd api && make install && cd ..
cd app && make install && cd ..

"export OT_TIME_SUFFIX=-$(date '+%Y-%m-%d_%H-%M')"
"export OT_BRANCH_SUFFIX=-${TRAVIS_BRANCH}"
"export OT_COMMIT_SUFFIX=-${TRAVIS_COMMIT:0:7}"
cd api && make test exe && cd ..
cd app && make -j 2 build test test-e2e && make package && cd ..

# Clean up. This will leave only single-file build artifacts
find ./app/dist/** ! -name 'opentrons-v*' -exec rm -rf {} +
