set -eo pipefail

VERSION=$1

CHROMEAPP="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
wget -c -nc --retry-connrefused --tries=0 https://github.com/electron/electron/releases/download/v${VERSION}/chromedriver-v${VERSION}-darwin-x64.zip
unzip -o -q chromedriver-v${VERSION}-darwin-x64.zip
sudo mv chromedriver /usr/local/bin/chromedriver
rm chromedriver-v${VERSION}-darwin-x64.zip
