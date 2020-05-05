# Opentrons App Changes from 3.17.0 to 3.17.1

For more details about this release, please see the full [technical change
log][changelog]

## Bugfixes

- Fix a set of issues in the Windows app that could prevent developer tools from installing or, in the worst case, cause the app to fail to launch

## New Features

- Guide the user through leveling GEN2 Multichannel pipettes

## Known Issues

- The app's run log sometimes displays the wrong current run step ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is executing, but it does not ([#2020][2020])
- When disconnecting and reconnecting to a running OT-2 that doesn't know what time it is, the app's displayed run time will be subtly wrong ([#3872][3872])

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md
[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2020]: https://github.com/Opentrons/opentrons/issues/2020
[3872]: https://github.com/Opentrons/opentrons/issues/3872
