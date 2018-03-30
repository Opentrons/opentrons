#!/usr/bin/env bash

app_os_target=$TRAVIS_OS_NAME

# note: \b regex only works on Linux (not BSD-like macOS)
branch_re=\\b$TRAVIS_BRANCH\\b

# if os is linux and osx won't run, build both linux and osx
# osx runs on tags and mainline (master, edge) branches
if [[
  $TRAVIS_OS_NAME = linux &&
  ! $TRAVIS_TAG &&
  ! "master edge" =~ $branch_re
]]; then
  # TODO(mc, 2018-03-27): remove posix target in favor of individual
  #   build_$(OS) variables
  app_os_target="posix"
fi

export APP_OS_TARGET=$app_os_target
