# Changes from 3.9.0 to 3.10.2

This update includes a set of all new, high-quality labware definitions! The older definitions are still on your robot and will continue to work, but we **highly** recommend you switch to the new ones.

These new labware definitions are based on engineering data from labware manufacturers. They can be viewed using our new [Labware Library][labware-library], where you can browse and search for labware definitions in order to use them in your protocols. Please let us know what you think!

## Updating your protocols

In order to benefit from these new definitions, you'll need to update your protocols to use them. However, because the labware definition format has changed under-the-hood, calibration data will not transfer between legacy definitions and library definitions. Please plan your protocol updates accordingly.

### Python Protocol API users

See the latest [Labware API docs][labware-api] for details about how to switch your protocols to the new definitions.

### Protocol Designer users

The [Protocol Designer][pd] will switch to using these new definitions automatically. Your older protocols will continue to run, but you will no longer be able to edit or create new protocols using the old definitions. Please see the [Protocol Designer Help Center][pd-help] for more information about migrating your existing protocols.

For more details about this release, please see the full [technical change log][changelog]

[labware-library]: https://labware.opentrons.com
[labware-api]: https://docs.opentrons.com/labware.html
[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md
[pd]: https://designer.opentrons.com
[pd-help]: https://intercom.help/opentrons-protocol-designer/
[pipette-docs]: https://docs.opentrons.com/pipettes.html#plunger-flow-rates

<!-- start:@opentrons/app -->

## Opentrons App

### New features

- Rebuilt the deck map render from the ground up in order to support...
- ...rendering the new [Labware Library][labware-library] definitions

### Bug fixes

- Fixed an issue with the app not shutting down properly, leaving phantom processes running in the background
- Ensured long labware names don't break and overflow the UI
- Added an error banner to let you know if your protocol run errors out

### Known issues

- The app's run log displays the wrong current run step, especially when pauses and resumes are involved ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is executing, but it does not ([#2020][2020])

[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2020]: https://github.com/Opentrons/opentrons/issues/2020

<!-- end:@opentrons/app -->

<!-- start:@opentrons/api -->

## OT-2 Software and Protocol API

### New Features

- Added support for new labware definitions! See the [Labware Library][labware-library] and the [Labware API docs][labware-api] for more details
- Added support for newer pipette models
- Added support for setting the flow rate of the pipette during blowout. See the [Pipette documentation][pipette-docs] for more details.

### Bug fixes

- Increased the height of the pipette in the first step of deck calibration to better account for tip length
- Improved the legacy labware database boot-up process to avoid lost definitions
- Removed usage of an old built-in Python method that was causing a protocol cancellation issue
- Improved the reliability of the run cancellation response to the UI
- Fixed an issue that could cause the robot to fail to boot if its previous boot was interrupted
 
### Known issues

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50ml" tube in a "15/50ml" tube rack is the same height as the "15ml" tube
- When attaching or detaching a pipette from the left mount, the robot homes twice in the X direction
  <!-- end:@opentrons/api -->
