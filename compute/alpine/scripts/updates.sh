#!/usr/bin/env bash

printf 'HTTP/1.1 200 OK\n\n'

# extract_update.py | base64 -d | gpg -o - --verify > /tmp/update
# chmod +x /tmp/update && /tmp/update

UPDATE_DIR=$(mktemp -d)
extract_update.py | base64 -d | tar -xv -C $UPDATE_DIR
pip install --upgrade --no-deps $(ls $UPDATE_DIR/*.whl)
rm -rf $UPDATE_DIR

sleep 1