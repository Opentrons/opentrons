set -eo pipefail

VERSION=$1

CHROMEAPP=google-chrome
if ! type -a google-chrome >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install -y google-chrome
fi
wget -c -nc --retry-connrefused --tries=0 https://chromedriver.storage.googleapis.com/${VERSION}/chromedriver_linux64.zip
unzip -o -q chromedriver_linux64.zip
sudo mv chromedriver /usr/local/bin/chromedriver
rm chromedriver_linux64.zip
