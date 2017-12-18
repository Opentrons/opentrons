#!/usr/bin/env bash

read request

while /bin/true; do
    read header
    [ "$header" == $'\r' ] && break;
done

echo -e "HTTP/1.1 200 OK\r"
echo -e "Content-Type: text/plain\r"
echo -e "\r"

echo "Update log: "

echo "Extracting update"
UPDATE_DIR=$(mktemp -d)
extract_update.py | base64 -d | tar -xv -C $UPDATE_DIR

echo "Contents:"
ls -la $UPDATE_DIR

echo "Installing packages"
for wheel in $UPDATE_DIR/*.whl; do
    echo "Extracting $wheel"
    pip install --upgrade --no-deps $wheel
done

rm -rf $UPDATE_DIR

echo "Updates successfully installed"
echo -e "\r"

# Restart container by killing init process
kill 1