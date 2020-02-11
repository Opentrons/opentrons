# Opentrons App Changes from 3.15.2 to 3.16.0

For more details about this release, please see the full [technical change log][changelog]

**Note for macOS users**: The Opentrons App is no longer compatible with macOS 10.9 Mavericks. If you are using 10.9, please upgrade to a later version of macOS (available for free from Apple) to continue to receive Opentrons updates.

## Custom Labware Folder Customization

You can now click a button to open your custom labware folder directly, and can
easily reset it to its default location.

## Other Changes
- The app now displays a spinner when updating pipette settings

## Bug Fixes
- Fixed an issue where clicking the home button during labware calibration would
  result in errors 
- The OT-2 will now home when labware calibration is complete to allow easier
  access to the deck 

## Known Issues

- The app's run log sometimes displays the wrong current run step ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is executing, but it does not ([#2020][2020])
- When disconnecting and reconnecting to a running OT-2 that doesn't know what time it is, the app's displayed run time will be subtly wrong ([#3872][3872])


[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

[2047]: https://github.com/Opentrons/opentrons/issues/2047
