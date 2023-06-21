# Hardware Testing Library

A python package that can be installed on an OT3 to support hardware tests implemented as protocols.

This package will be built on a PC/Mac and pushed to an OT3 using `make push`.

## Requirements

- An OT3 with usual set of Opentrons software installed.
- An installed version of `hardware_testing` on the OT3.
- The Opentrons app.

## Project Layout

### protocols

Contains the actual protocols the operators will run to perform various tests.

The aim is that the protocols are as small as possible.

### scripts

Miscellaneous development scripts.

### hardware_testing

The root of the package.

#### [data](./hardware_testing/data/README.md)

Methods for managing data files generated during a test. Includes creating unique folders, file names, and writing/appending to CSV files.

#### [drivers](./hardware_testing/drivers/README.md)

There are external sensors and other hardware that can be shared between tests. This will be home of drivers to third party hardware used in testing.

#### [execute](./hardware_testing/execute/README.md)

Per-test implementation details are stored here. For example, defining number of cycles, samples, volumes, durations, etc.

#### [labware](./hardware_testing/labware/README.md)

Handles the loading and configuring of `opentrons` labware used in each test. Different `LabwareLayouts` are available to be used, each containing a pre-defined set of items used for a given test.

#### [liquid](./hardware_testing/liquid/README.md)

Liquid functionality provides two main benefits: 1) liquid-level tracking, and 2) liquid-class parameterization.

Use `hardware_testing.liquid.height` to automatically tracking volumes and liquid heights throughout a test run, based on the protocol's procedure and its labwares' inner geometries.

Use `hardware_testing.liquid.liquid_class` to define liquid class parameters given a specific liquid-pipette-tip combination.

#### [gravimetric](./hardware_testing/gravimetric/README.md)

Scripts and methods for running gravimetric and photometric tests

#### [measure](./hardware_testing/measure/README.md)

Classes and methods for measuring aspects of a test. Currently just implements a `weight` measurement, but should also include `distance` (eg: dial-indicator), `temperature` (eg: thermocouple), and more.

#### [opentrons_api](./hardware_testing/opentrons_api/README.md)

Helpers and workarounds for when using the `opentrons` Python package.

#### [pipette](./hardware_testing/pipette/README.md)

Handles motion and pipetting logic/commands. Given a liquid class, will pipette according to the liquid class definition.

#### [tools](./hardware_testing/tools/README.md)

Miscellaneous tools. Currently, holds a server which serves the real-time scale visualization script.
