# Changes from 3.7.0 to 3.8.0

For more details, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

<!-- start:@opentrons/app -->
## Opentrons App

### New features

- You can now modify pipette configuration for attached pipettes directly from the Opentrons App. For more information see [our documentation][intercom-pipette-config].

### Known issues

- The app's run log is still having problems displaying the current run step, especially if pauses and resumes are involved ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is
executing, but it does not ([#2020][2020])
- If a protocol run encounters an error, the app will suppress the error message instead of displaying it ([#1828][1828])

[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2020]: https://github.com/Opentrons/opentrons/issues/2020
[1828]: https://github.com/Opentrons/opentrons/issues/1828
[intercom-pipette-config]: http://support.opentrons.com/ot-2/changing-pipette-settings

<!-- end:@opentrons/app -->

<!-- start:@opentrons/api -->
## OT2 and Protocol API


### Bug fixes

- Fixed an issue where labware calibration would get stuck if a labware with only a single well was on the deck
- Fixed an issue where the robot would become unresponsive if the user went to the robot modules page in the Opentrons App while using a Temperature Module in a protocol
- Fixed an issue with simulating protocols that had nested functions on the command line
- Fixed an issue with the CLI deck calibration tool that would crash in certain command sequences and added more help information to it
- Fixed an issue with the run log where some commands might have incorrect or non-displayed values for positions and volumes (This was [#3105][3105])
- Fixed an issue with Temperature Modules where `wait_for_temp` would sometimes return immediately


### Known issues
- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50ml" tube in a "15/50ml" tuberack is the same height as the "15ml" tube
- Extremely long aspirations and dispenses can incorrectly trigger a serial timeout issue. If you see such an issue, make sure your protocol’s combination of aspirate/dispense speeds and aspirate/dispense volumes does not include a command that will take more than 30 seconds.

[3105]: https://github.com/Opentrons/opentrons/issues/3105

<!-- end:@opentrons/api -->
