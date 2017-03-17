#!/usr/bin/env bash

if [[ $(git diff origin/$STABLE_BRANCH $TRAVIS_BRANCH $1) ]]; then
    eval $2
else
    echo "No changes detected in $1. Not executing command: '$2'"
    exit 0
fi;
