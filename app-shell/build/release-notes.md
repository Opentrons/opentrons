# Changes from 3.8.1 to 3.8.2

For more details, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

<!-- start:@opentrons/app -->
## Opentrons App

### New features

- You can now manually add robots by their IP in the app settings (the MORE button in the lower left)
- Added support for more upcoming pipette hardware revisions

### Bug fixes

- Render the correct image for certain vial and tube racks
- Fix an issue where an error in deck calibration could leave the robot unable to do deck calibration again until the app was restarted

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
- The messages given to the `pause` and `delay` commands in protocols are now published in the run log
- Added support for more upcoming pipette hardware revisions


### Known issues
- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50ml" tube in a "15/50ml" tuberack is the same height as the "15ml" tube
- Extremely long aspirations and dispenses can incorrectly trigger a serial timeout issue. If you see such an issue, make sure your protocol’s combination of aspirate/dispense speeds and aspirate/dispense volumes does not include a command that will take more than 30 seconds.

[schema-v3]: https://github.com/Opentrons/opentrons/blob/edge/shared-data/protocol-json-schema/protocolSchemaV3.json
<!-- end:@opentrons/api -->
