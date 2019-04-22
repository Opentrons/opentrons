# Changes from 3.8.1 to 3.8.2

For more details, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

<!-- start:@opentrons/app -->
## Opentrons App

### New features

- You can now manually add robots by IP address from the settings page
- Pause and delay command reasons, if any, will now appear in the run log
- Added support for more upcoming pipette hardware revisions

### Bug fixes

- Render the correct image for vial and tube racks for certain labwares

### Known issues

- The app's run log is still having problems displaying the current run step, especially if pauses and resumes are involved ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is
executing, but it does not ([#2020][2020])
- If a protocol run encounters an error, the app will suppress the error message instead of displaying it ([#1828][1828])


[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2020]: https://github.com/Opentrons/opentrons/issues/2020
[1828]: https://github.com/Opentrons/opentrons/issues/1828

<!-- end:@opentrons/app -->

<!-- start:@opentrons/api -->
## OT2 and Protocol API

### New Features

- Validate json protocols before executing them based on our json schema
- Define and execute V3 json protocols
- Added support for more upcoming pipette hardware revisions


### Known issues
- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50ml" tube in a "15/50ml" tuberack is the same height as the "15ml" tube
- Extremely long aspirations and dispenses can incorrectly trigger a serial timeout issue. If you see such an issue, make sure your protocol’s combination of aspirate/dispense speeds and aspirate/dispense volumes does not include a command that will take more than 30 seconds.

<!-- end:@opentrons/api -->
