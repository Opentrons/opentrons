# Changes from 3.9.0 to 3.10.0

For more details about this release, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

<!-- start:@opentrons/app -->

## Opentrons App

We've got a big update for you! In conjunction with this release, we've launched our completely new [Labware Library][labware-library], powered by a set of completely new labware definitions. This site should make discovering your OT-2's built-in labware much easier. Please let us know what you think!

[labware-library]: https://labware.opentrons.com

### New features

- Rebuilt the deck map render from the ground up in order to support...
- ...rendering the new [Labware Library][labware-library] definitions

### Bug fixes

- Fixed an issue with the app not shutting down properly, leaving phantom processes running in the background
- Ensure long labware names don't break and overflow the UI

### Known issues

- The app's run log displays the wrong current run step, especially when pauses and resumes are involved ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is executing, but it does not ([#2020][2020])
- If a protocol run encounters an error, the app will suppress the error message instead of displaying it ([#1828][1828])

[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2020]: https://github.com/Opentrons/opentrons/issues/2020
[1828]: https://github.com/Opentrons/opentrons/issues/1828

<!-- end:@opentrons/app -->

<!-- start:@opentrons/api -->

## OT-2 and Protocol API

This update includes a set of all new, high-quality labware definitions! The older definitions are still on your robot and will continue to work, but we **highly** recommend you switch your protocols over to the new definitions as soon as you are able. If you're Protocol Designer user, the latest Protocol Designer will use these new definitions automatically. If you're a Python API user, please see the latest [Labware API docs][labware-api] for details about how to switch.

The new definitions are highly accurate and based on actual engineering data from labware manufacturers. Because the format of labware definitions has changed drastically under-the-hood, calibration data will not transfer between legacy definitions and library definitions. Please plan your protocol updates accordingly.

[labware-library]: https://labware.opentrons.com
[labware-api]: https://docs.opentrons.com/labware.html

### New Features

- Added support for new labware definitions! See the Opentrons [Labware Library][labware-library] and the [Labware API docs][labware-api] for more details
- Added support for newer pipette models

### Bug fixes

- Increased the height of the pipette in the first step of deck calibration to better account for tip length
- Improved the legacy labware database boot-up process to avoid lost definitions
- Removed usage of an old built-in Python method that was causing a protocol cancellation issue

### Known issues

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50ml" tube in a "15/50ml" tube rack is the same height as the "15ml" tube
- When attaching or detaching a pipette from the left mount, the robot homes twice in the X direction
  <!-- end:@opentrons/api -->
