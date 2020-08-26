# Opentrons App Changes from 3.20.0 to 3.20.1

## Bugfixes
- Fix an issue where calibration data might not be properly viewable in the File Info and Calibration pages when a protocol using a piece of labware for the first time is uploaded.


# Opentrons App Changes from 3.19.0 to 3.20.0

## Features
- Display labware calibration offsets in the File Info and Calibration pages


## Bugfixes
- Do not force a robot restart after deck calibration is complete
- Properly display error messages if the robot disconnects
- Fix an issue where protocols created in Protocol Designer version 4.0.0 and subsequent did not have correct information displayed in the File Info screen, and would not properly render custom labware

For more details about this release, please see the full [technical change
log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md


