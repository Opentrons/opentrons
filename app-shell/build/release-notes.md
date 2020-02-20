# Opentrons App Changes from 3.16.0 to 3.16.1-beta.0

For more details about this release, please see the full [technical change log][changelog]

There are no changes in the Opentrons App between 3.16.0 and 3.16.1-beta.0; it
exists to support the robot software release which now correctly includes pandas.

## Known Issues

- The app's run log sometimes displays the wrong current run step ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is executing, but it does not ([#2020][2020])
- When disconnecting and reconnecting to a running OT-2 that doesn't know what time it is, the app's displayed run time will be subtly wrong ([#3872][3872])


[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md
[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2020]: https://github.com/Opentrons/opentrons/issues/2020
[3872]: https://github.com/Opentrons/opentrons/issues/3872
