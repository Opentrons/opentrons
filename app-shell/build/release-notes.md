# Changes from 3.10.3 to 3.11.4

This update includes support for the new Opentrons Robot OS 3.11, which provides more comprehensive updates without requiring internet connectivity. It also allows you to calibrate labware placed on a module separately from labware placed on the deck.

## Opentrons App

### New features

- Separate calibration for labware placed on modules. For instance, a well plate placed on a Temperature Module can now be calibrated separately from a well plate placed on the deck.

### Bug Fixes

- Fixed an issue where unexpected problems with the app’s configuration file handling could cause the app to crash
- Fixed a bug that would cause the "remove trash" warning before tip probe to be permanently hidden

### Known issues

- The app's run log sometimes displays the wrong current run step ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is executing, but it does not ([#2020][2020])

[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2020]: https://github.com/Opentrons/opentrons/issues/2020
