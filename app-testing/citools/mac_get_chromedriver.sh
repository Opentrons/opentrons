set -eo pipefail

VERSION=$1
PLATFORM=$(uname -m)
if [[ "$PLATFORM" == "x86_64" ]]
then 
    PLATFORM=x64
fi
CHROMEAPP="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
wget -c -nc --retry-connrefused --tries=0 https://github.com/electron/electron/releases/download/v${VERSION}/chromedriver-v${VERSION}-darwin-${PLATFORM}.zip
unzip -o -q chromedriver-v${VERSION}-darwin-${PLATFORM}.zip
sudo mv chromedriver /usr/local/bin/chromedriver

rm chromedriver-v${VERSION}-darwin-${PLATFORM}.zip
wget -c -nc --retry-connrefused --tries=0 https://github.com/electron/electron/releases/download/v${VERSION}/ffmpeg-v${VERSION}-darwin-${PLATFORM}.zip
unzip -o -q ffmpeg-v${VERSION}-darwin-${PLATFORM}.zip
sudo mv libffmpeg.dylib /usr/local/bin/libffmpeg.dylib
rm ffmpeg-v${VERSION}-darwin-${PLATFORM}.zip
