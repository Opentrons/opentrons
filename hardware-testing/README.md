# Hardware Testing Library

A python package that can be installed on an OT3 to support hardware tests implemented as protocols.

This package will be built on a PC/Mac and pushed to an OT3 using `make push`.

# Project Layout

## hardware_testing

The root of the package

### drivers

There are external sensors and other hardware that can be shared between tests. This will be home of drivers to third party hardware used in testing.

### gravimetric_test

A package that contains support code for running gravimetric tests. The gravimetric tests for the OT3 are python protocols. They will be run on specialized rigs using the Opentrons app.

## protocols

Contains the actual protocols the operators will run to perform various tests.

The aim is that the protocols are as small as possible. Most of what they do is make calls into methods in `gravimetric_test`.

## Requirements

- An OT3 with usual set of Opentrons software installed.
- An installed version of `hardware_testing` on the OT3.
- The Opentrons app.
