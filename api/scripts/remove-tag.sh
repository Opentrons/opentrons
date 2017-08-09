#!/bin/bash
set -ev # Exit with nonzero exit code if anything fails

git push origin :$1
git tag -d $1
