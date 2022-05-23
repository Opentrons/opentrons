# Gravimetric Tests for the OT3

The gravimetric tests for the OT3 are python protocols. They will be run on specialized rigs using the Opentrons app.

## Project Layout

### gravimetric_test

A package that contains support code for running gravimetric tests. There are drivers for external sensors and other utilities that can be shared between protocols.

This package will be built on a PC/Mac and pushed to an OT3 using `make push`.

### protocols

Contains the actual protocols the operators will run to perform gravimetric tests.

The aim is that the protocols are as small as possible. Most of what they do is make calls into methods in `gravimetric_test`.

## Requirements

- An OT3 with usual set of Opentrons software installed.
- An installed version of `gravimetric_test` on the OT3.
- The Opentrons app.
