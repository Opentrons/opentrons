#!/bin/bash

# Test script to debug the caching logic
RUNNER_OS="Linux"
PLATFORM="linux"
ARCH="x64"

package="cypress"
version="13.7.1"

echo "Testing package: $package $version"
echo "Platform: $PLATFORM-$ARCH"

# Try package-mirror first
mirror_url="https://github.com/Opentrons/package-mirror/releases/download/${package}-${version}/${package}-${version}-${PLATFORM}-${ARCH}.zip"

echo "Checking URL: $mirror_url"

# Test the curl command
response=$(curl -s --head "$mirror_url" | head -n 1)
echo "Response: $response"

# Test the grep
if echo "$response" | grep -qE "(200 OK|302)"; then
    echo "✅ URL is accessible - should use cached version"
else
    echo "❌ URL is not accessible - will use official source"
fi
