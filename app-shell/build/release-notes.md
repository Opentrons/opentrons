# Opentrons App Changes from 3.17.1 to 3.18.0

For more details about this release, please see the full [technical change
log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## Bugfixes

- Regular maintenance

## New Features

- Messages for protocol "pause" commands are now prominently displayed on the app's run page ([#5522][])
- You may now clear your app's list of saved robots in the "More" > "Network & System" page ([#5629][])
- If your Windows computer has an out-of-date Realtek USB-to-Ethernet adapter driver that could cause connectivity issues, the app will alert you ([#5656][])
- Added requested pipette and module names to the anonymous protocol analytics tracking events to better understand device usage ([#5675][])

[#5522]: https://github.com/Opentrons/opentrons/pull/5512
[#5629]: https://github.com/Opentrons/opentrons/pull/5629
[#5656]: https://github.com/Opentrons/opentrons/pull/5656
[#5675]: https://github.com/Opentrons/opentrons/pull/5675

## Known Issues

- The app's run log sometimes displays the wrong current run step ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is executing, but it does not ([#2020][2020])
- When disconnecting and reconnecting to a running OT-2 that doesn't know what time it is, the app's displayed run time will be subtly wrong ([#3872][3872])

[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2020]: https://github.com/Opentrons/opentrons/issues/2020
[3872]: https://github.com/Opentrons/opentrons/issues/3872
