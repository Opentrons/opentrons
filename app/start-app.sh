#!/usr/bin/env bash

set -e

./node_modules/.bin/cross-env ENABLE_VIRTUAL_SMOOTHIE=true\
    NODE_ENV=development\
    STATIC_ASSETS_BASE_URL="https://s3.amazonaws.com/ot-app-builds/assets/"\
    ./node_modules/.bin/electron app/ --disable-http-cache
