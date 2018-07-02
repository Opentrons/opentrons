# ot2serverlib

A library of shared functionality for server applications running on
Opentrons robots

## Install

This package is a dependency of `opentrons` and provides functionality
used by the Opentrons API server. In the near future, this package will
also be a dependency of the Opentrons update server, and house other
shared functionality between those applications.

For development (to be able to run commands from this module directly,
rather than through another app, and to run make tasks), run `make install`
in the root level of the repo, which will run the `make install` task in
this project.

## Test

Currently, `ot2serverlib` is imported and tested under tests in the
API server project (in particular, the
[server test suite](https://github.com/Opentrons/opentrons/tree/edge/api/tests/opentrons/server))
