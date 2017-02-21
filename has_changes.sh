#!/usr/bin/env bash

if [[ $(git diff origin/master $TRAVIS_BRANCH $1) ]]; then
    exit 0
else
    exit 1
fi;
