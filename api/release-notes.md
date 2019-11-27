# Robot OS Changes from 3.14.1 to 3.15.0

For more details about this release, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## Python Protocol API V2 Release

We're happy to announce the full release version 2 of our Python protocol API! To read more, please go to our [documentation]: https://docs.opentrons.com/v2/index.html.

## Thermocycler Release

We're also happy to announce that software support for our new Thermocycler module is complete!

## Other Changes

- If you are running an API v2 protocol, you must now specify the version level. Please go to this [link][https://docs.opentrons.com/v2/index.html#metadata-and-version-selection] to read more.
- You can now upload API v1 and API v2 protocols without changing a feature flag.
- You can specify starting volumes for Thermocycler temperature commands. Read [here][] for more information.


## Bug Fixes
- Reduce logging noise
- Fix calibrate to bottom feature in API v2 for tipracks
- Fix module behavior upon protocol cancel


## Known Issues API v1

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50 mL" tube in a "15 / 50 mL" tube rack is the same height as the "15 mL" tube
- When attaching or detaching a pipette from the left mount, the robot homes twice in the X direction


[419]: https://github.com/Opentrons/opentrons/issues/419
[labware-versioning-docs]: https://docs.opentrons.com/v1/labware.html#labware-versions
[docs-v2-root]: https://docs.opentrons.com//v2/index.html
[apiv2-form]: https://opentrons-ux.typeform.com/to/jhccYV
[4288]: https://github.com/Opentrons/opentrons/issues/4288
