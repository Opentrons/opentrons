# Opentrons App Changes from 3.14.1 to 3.15.0

For more details about this release, please see the full [technical change log][changelog]

**Note for macOS users**: The Opentrons App is no longer compatible with macOS 10.9 Mavericks. If you are using 10.9, please upgrade to a later version of macOS (available for free from Apple) to continue to receive Opentrons updates.

## Custom Labware Support in the Opentrons App

You can now upload custom labware definitions generated with the [Labware Creator](https://labware.opentrons.com/create) tool by navigating to the
"More" tab. To get started using custom labware, please read [this support article](https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions).

## Other Changes
- If a protocol does not have any executable steps, the Opentrons App will raise an error.
- Make Opentrons App logs more accessible via the "Help" drop-down.
- The Opentrons App will now detect the protocol API version supported by the robot and selected in the protocol. A modal will appear if there is a mismatch.

## Bug Fixes
- Fixed more issues with app and robot version sync.

[electron-6]: https://electronjs.org/releases/stable?version=6

## Known Issues

- The app's run log sometimes displays the wrong current run step ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is executing, but it does not ([#2020][2020])
- When disconnecting and reconnecting to a running OT-2 that doesn't know what time it is, the app's displayed run time will be subtly wrong ([#3872][3872])


[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2020]: https://github.com/Opentrons/opentrons/issues/2020
[2676]: https://github.com/Opentrons/opentrons/issues/2676
[3121]: https://github.com/Opentrons/opentrons/issues/3121
[3872]: https://github.com/Opentrons/opentrons/issues/3872
[4202]: https://github.com/Opentrons/opentrons/issues/4202
