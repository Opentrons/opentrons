# Robot OS Changes from 3.12.0 to 3.13.0

For more details about this release, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## New Features

- Load the magdeck engage height from labware definitions

## Bug Fixes

- Some typos in our documentation were fixed
- Problems with pipette height following deck calibration have been fixed
- Fix was made to hash in SSH key upload response message

## Known Issues

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50 mL" tube in a "15 / 50 mL" tube rack is the same height as the "15 mL" tube
- When attaching or detaching a pipette from the left mount, the robot homes twice in the X direction
