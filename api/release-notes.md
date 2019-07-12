# Robot Software Changes from 3.9.0 to 3.10.0

This update includes a set of all new, high-quality labware definitions! The older definitions are still on your robot and will continue to work, but we **highly** recommend you switch your protocols over to the new definitions as soon as you are able. If you're Protocol Designer user, the latest Protocol Designer will use these new definitions automatically. If you're a Python API user, please see the latest [Labware API docs][labware-api] for details about how to switch.

The new definitions are highly accurate and based on actual engineering data from labware manufacturers. Because the format of labware definitions has changed drastically under-the-hood, calibration data will not transfer between legacy definitions and library definitions. Please plan your protocol updates accordingly.

For more details about this release, please see the full [technical change log][changelog]

[labware-library]: https://labware.opentrons.com
[labware-api]: https://docs.opentrons.com/labware.html
[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

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
