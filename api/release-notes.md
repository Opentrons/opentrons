# Robot OS Changes from 3.12.0 to 3.13.0

For more details about this release, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## New Features

- You can now load the Magnetic Module engage height from labware definitions instead of these values being hardcoded.

## Bug Fixes

- Some typos in our documentation were fixed.
- Problems with pipette height following deck calibration have been fixed. If you ran the command-line variant of deck calibration in 3.12.0, you should rerun it after installing this update.
- Fix was made to SSH key upload response message.
- Fixed issues that could result in the MAC addresses of the robot's network interfaces changing over time. Disconnect from and reconnect to your current wireless network to get this change. Note that on this first disconnect and reconnect, the MAC address may change.
- Fixed a second issue that could result in errors during attach pipette, which would manifest as unexpected homes.
- Fixed an issue preventing the OT-2 from taking pictures

## Known Issues

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50 mL" tube in a "15 / 50 mL" tube rack is the same height as the "15 mL" tube
- When attaching or detaching a pipette from the left mount, the robot homes twice in the X direction
