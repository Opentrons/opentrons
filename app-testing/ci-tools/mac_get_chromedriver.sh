set -eo pipefail

VERSION=$1

CHROMEAPP="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
wget -c -nc --retry-connrefused --tries=0 https://chromedriver.storage.googleapis.com/${VERSION}/chromedriver_mac64.zip
unzip -o -q chromedriver_mac64.zip
sudo mv chromedriver /usr/local/bin/chromedriver
rm chromedriver_mac64.zip