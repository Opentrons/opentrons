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

#### 96-channel tip pickup lifetime

[`hardware_testing/scripts/96ch_tip_pickup_lifetime.py`](./hardware_testing/scripts/96ch_tip_pickup_lifetime.py)
is a direct hardware-API script for repeating a full 96-tip pickup and return
cycle. It uses the left mount, the Flex 96-channel tip rack adapter in D2, and
the A1 position of the rack. The default pipette is T1000; T200 is also
supported.

Run it on an OT-3/Flex from the `hardware-testing` environment, for example:

```bash
python -m hardware_testing.scripts.96ch_tip_pickup_lifetime \
  --pipette 1000 --cycles 15000
```

Use `--simulate` for a hardware simulator run. Each run creates a CSV and a
text log below the testing-data directory.

Coordinates are loaded automatically from
`<testing-data>/96ch-tip-pickup-lifetime/calibration/p1000_96_D2.json`
(or `p200_96_D2.json` for T200). The testing-data root is `TESTING_DATA_DIR`
when set, otherwise the robot configuration directory's `testing_data` folder.
If the file does not exist or contains no `position`, the system's nominal D2
A1 position, including the adapter, is used. Invalid coordinates, malformed
JSON, and mismatched rack/pipette metadata stop the run before connecting to
hardware. Earlier files containing only `slot` and `position` are supported.
`--calibration-file <path>` overrides the default file for both reading and
writing; use the same override on subsequent runs.

To calibrate without starting an aging test:

```bash
python -m hardware_testing.scripts.96ch_tip_pickup_lifetime \
  --pipette 1000 --calibrate-only
```

The pipette must have no tips attached. The script approaches 10 mm above the
saved (or nominal) reference. Jog the **bare A1 nozzle to the top of the A1
tip**, then finish the jog operation; the pickup API applies the engagement
movement itself. The resulting coordinates replace the calibration file
atomically. Subsequent runs load that position without calibration flags.
Use `--calibrate` to calibrate and then run the requested cycles. Manual
calibration is rejected with `--simulate`, so a simulated approach position
cannot overwrite a real calibration.

Pickup uses the standard hardware `pick_up_tip(..., prep_after=False)` API.
Effective tip length uses the rack definition and the installed pipette's
latest supported overlap configuration. The API's built-in Z retract is
supplemented to preserve a minimum total retract of 25 mm. Return uses the
configured return-height fraction of the full tip length and `drop_tip()`.
Moves at the same XY position go directly in Z; XY travel retains an arched
path. This is a dry mechanical cycling test; it does not aspirate or dispense.

Tip presence is checked once before the first pickup and after every pickup
and return (`2 * cycles + 1` checks). `--fast` and `--no-tip-presence-check`
both disable these checks. Checks move and home the 96-channel tip motor, so
the fast and checked modes have different mechanical workloads. Sensor
presence does not verify all 96 tips individually or verify seal quality.

The first failure stops the test. A failed cycle is recorded as `FAIL`, and
an interrupted cycle as `ABORTED`. The script closes the hardware connection
without automatic tip ejection or homing after a failure or interruption;
inspect the pipette and rack before recovering. Successful runs home and
close the connection before writing the final `PASS` summary. Calibration-only
runs end with `CALIBRATED` instead of a cycle-test `PASS`.

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
