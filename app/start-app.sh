#!/usr/bin/env bash

set -e

# STATIC_ASSETS_BASE_URL="http://s3.amazonaws.com/ot-app-builds/assets/"\
PORT=6500
python -m http.server $PORT >/dev/null 2>&1 &

./node_modules/.bin/cross-env ENABLE_VIRTUAL_SMOOTHIE=true\
    NODE_ENV="development"\
    STATIC_ASSETS_BASE_URL="http://localhost:$PORT/"\
    STATIC_ASSETS_BRANCH="release-assets"\
    ./node_modules/.bin/electron app/ --disable-http-cache
