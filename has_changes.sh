#!/usr/bin/env bash

if [[ $(git diff HEAD master $1) ]]; then
    exit 0
else
    exit 1
fi;
