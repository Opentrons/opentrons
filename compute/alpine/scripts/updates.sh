#!/usr/bin/env bash

printf 'HTTP/1.1 200 OK\n\n'

# extract_update.py | base64 -d | gpg -o - --verify > /tmp/update
# chmod +x /tmp/update && /tmp/update

extract_update.py | base64 -d > /tmp/update
pip install --upgrade --no-deps /tmp/update
rm /tmp/update

sleep 1