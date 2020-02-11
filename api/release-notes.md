# Robot OS Changes from 3.15.2 to 3.16.0

For more details about this release, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## Module Firmware Updates

After you have updated your OT-2 and Opentrons App to 3.16.0, the next time you
connect a Temperature Module or Magnetic Module you may be prompted to update
its firmware. Until you update the module's firmware, it should not be used.

# API Version 2.2

This release contains a new Python Protocol API version: version 2.2. In version
2.2, we corrected some behaviors around return tip functionality. For more
details, see [the documentation](https://docs.opentrons.com/v2/versioning.html#api-and-ot-2-software-versions)

## Bug Fixes

- Fixed an issue where setting the axis max speeds or head speed very slow might
  result in errors during protocols (issue [#4755](https://github.com/opentrons/opentrons/issues/4755))


## Known Issues (Python Protocol API version 1)

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50 mL" tube in a "15 / 50 mL" tube rack is the same height as the "15 mL" tube
- If the robot is about to initiate a pause and a cancel is issued from the Opentrons App, the cancel may fail. See issue [#4545](https://github.com/Opentrons/opentrons/issues/4545)

