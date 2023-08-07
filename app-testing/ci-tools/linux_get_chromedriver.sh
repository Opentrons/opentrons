#! /bin/bash

set -eo pipefail

VERSION=$1

CHROMEAPP=google-chrome
if ! type -a google-chrome >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y google-chrome
fi
wget -c -nc --retry-connrefused --tries=0 https://github.com/electron/electron/releases/download/v${VERSION}/chromedriver-v${VERSION}-linux-x64.zip
unzip -o -q chromedriver-v${VERSION}-linux-x64.zip
sudo mv chromedriver /usr/local/bin/chromedriver
rm chromedriver-v${VERSION}-linux-x64.zip
