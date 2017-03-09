#!/usr/bin/env bash
echo "got here.."
set -e

export DISPLAY=':99.0'
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1

# Setup npm version
nvm use 6.0.0

echo "Exec'ing the cmd: '$1'"
eval $1
