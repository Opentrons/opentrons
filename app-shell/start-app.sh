#!/usr/bin/env bash

set -e

# STATIC_ASSETS_BASE_URL="http://s3.amazonaws.com/ot-app-builds/assets/"\
PORT=8000

if [[ $1 == "remote" ]]; then
    # Upload data to S3 and run app off of S3 data
    echo "Uploading assets to S3"
    python scripts/build_app_assets.py
    STATIC_ASSETS_BRANCH=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')"-$USER"
    STATIC_ASSETS_BASE_URL="http://s3.amazonaws.com/ot-app-builds/assets/"
else
    STATIC_ASSETS_BRANCH="assets"
    STATIC_ASSETS_BASE_URL="http://localhost:$PORT/"
fi;

# Start App
./node_modules/.bin/cross-env ENABLE_VIRTUAL_SMOOTHIE=true\
    NODE_ENV="development"\
    STATIC_ASSETS_BASE_URL="$STATIC_ASSETS_BASE_URL"\
    STATIC_ASSETS_BRANCH="$STATIC_ASSETS_BRANCH"\
    ./node_modules/.bin/electron app/ --disable-http-cache
