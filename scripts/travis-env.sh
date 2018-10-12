#!/usr/bin/env bash

app_os_target=$TRAVIS_OS_NAME

# if os is linux and osx won't run, build both linux and osx
# osx runs on tags and mainline/RC (edge, release_*) branches
if [[
  $TRAVIS_OS_NAME = linux &&
  ! $TRAVIS_TAG &&
  ! $TRAVIS_BRANCH =~ ^(edge|release_.+)$
]]; then
  # TODO(mc, 2018-03-27): remove posix target in favor of individual
  #   build_$(OS) variables
  app_os_target="posix"
fi

export APP_OS_TARGET=$app_os_target
