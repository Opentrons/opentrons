# Opentrons App Changes from 3.11.4 to 3.12.0

**Note for macOS users**: This update is not compatible with macOS 10.9 Mavericks. If you are using 10.9, please upgrade to a later version of macOS (available for free from Apple) to continue to receive Opentrons updates.

For more details about this release, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## New Features

- The app has been updated to support macOS 10.15 Catalina
  - Unfortunately, due to technical requirements, this means we have dropped support for macOS 10.9 Mavericks
- The Windows installer now has the option to install the app for all users

## Bug Fixes

- We updated our underlying Electron app framework from version 3 to version 6, picking up a variety of stability and security improvements
- We fixed various problems with tip probe instructions
  - The incorrect tip types were often displayed in the instructions
  - Tip attachment instructions for multi-channel pipettes were a little too ambiguous
  - Redoing tip probe was arbitrarily blocked by the app in certain instances
  - Tip probe errors were not surfaced to the user
- We fixed some general calibration instruction mistakes
  - Users were given an incorrect warning about calibration data during pipette change
  - Users were not warned to remove tips from pipettes before various calibration procedures
- Workarounds were put in place to correct for completely incorrect run times in the app if the OT-2's software doesn't know what time it is (which can often be the case if the OT-2 is not connected to the internet)
  - There can still be problems when disconnecting and reconnecting to an OT-2 that doesn't know the time; see "Known Issues" below

[electron-6]: https://electronjs.org/releases/stable?version=6

## Known Issues

- The app's run log sometimes displays the wrong current run step ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is executing, but it does not ([#2020][2020])
- The app should prevent you from starting a protocol run if you don't have all your modules connected, but it doesn't ([#2676][2676])
- The app should warn you if you try to simulate a protocol without any valid steps, but it does not ([#3121][3121])
- When disconnecting and reconnecting to a running OT-2 that doesn't know what time it is, the app's displayed run time will be subtly wrong ([#3872][3872])

[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2020]: https://github.com/Opentrons/opentrons/issues/2020
[2676]: https://github.com/Opentrons/opentrons/issues/2676
[3121]: https://github.com/Opentrons/opentrons/issues/3121
[3872]: https://github.com/Opentrons/opentrons/issues/3872
