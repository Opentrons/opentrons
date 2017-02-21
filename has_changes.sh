#!/usr/bin/env bash

if [[ $(git diff $TRAVIS_COMMIT_RANGE $1) ]]; then
    exit 0
else
    exit 1
fi;
