# Changes from 3.10.3 to 3.11.0

This update includes support for the new Opentrons Robot OS 3.11.0, which provides more comprehensive updates without requiring internet connectivity. It also allows you to calibrate labware placed on a module separately from labware placed on the deck.

<!-- start:@opentrons/app -->

## Opentrons App

### New features

- Separate calibration for labware placed on modules. For instance, a well plate placed on a Temperature Module can now be calibrated separately from a well plate placed on the deck.

### Known issues

- The app's run log displays the wrong current run step, especially when pauses and resumes are involved ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is executing, but it does not ([#2020][2020])

### Bug Fixes

- Fixed an issue where unexpected problems with the app’s configuration file handling could cause the app to crash

[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2020]: https://github.com/Opentrons/opentrons/issues/2020

<!-- end:@opentrons/app -->

<!-- start:@opentrons/api -->

## OT-2 Software and Protocol API

### New Features

- Added support for setting the flow rate of the pipette during blowout operations. `set_flow_rate` and `set_speed` now take a `blow_out` parameter. See the [API Docs][blowoutflowrate] for more details.
- Store labware calibration separately if a labware is placed on a module. For instance, a well plate on a Temperature Module can now be calibrated separately from a well plate placed on the deck.

### Bug fixes

- Fixed an incorrect mix after a blowout during a transfer when `mix_after` and `blow_out` are both specified

### Known issues

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50ml" tube in a "15/50ml" tube rack is the same height as the "15ml" tube
- When attaching or detaching a pipette from the left mount, the robot homes twice in the X direction
  <!-- end:@opentrons/api -->
