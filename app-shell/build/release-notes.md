# Opentrons App Changes from 3.16.1 to 3.17.0

For more details about this release, please see the full [technical change
log][changelog]

## Bug Fixes
- Fix an issue with Python Protocol API V1 protocols that did not supply a
  ``tip_racks`` argument where tip racks would not properly appear in the
  labware calibration list
  ([#5147](https://github.com/opentrons/opentrons/issues/5147))
- Fix an issue where custom labware files or Protocol Designer protocols with
  an all-caps ``.JSON`` extension would not be handled properly
  ([#5151](https://github.com/opentrons/opentrons/issues/5151))
- Because module commands now respect protocol pause, module interaction via the
  Opentrons App is now disabled when the protocol is paused.
  
## New Features
- OT-2s that are on at least version 3.17.0 and connected via USB can now be
  disconnected from the current Wi-Fi network without selecting a different one
  to connect to.
  
## Known Issues

- The app's run log sometimes displays the wrong current run step ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is executing, but it does not ([#2020][2020])
- When disconnecting and reconnecting to a running OT-2 that doesn't know what time it is, the app's displayed run time will be subtly wrong ([#3872][3872])


[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md
[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2020]: https://github.com/Opentrons/opentrons/issues/2020
[3872]: https://github.com/Opentrons/opentrons/issues/3872
