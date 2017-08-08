#!/bin/bash
set -ev # Exit with nonzero exit code if anything fails

git tag -a $1 -m "RLS $1"
git push origin $1
