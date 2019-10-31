# Robot OS Changes from 3.13.2 to 3.14.0

For more details about this release, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## Python Protocol API V2 Beta

We're happy to announce the public beta of version 2 of our Python protocol API! To learn more about APIv2 or to participate in the beta, please complete [this short form][apiv2-form]. 


## Other Changes

- You can now control your Temperature Module and Thermocycler from the Pipettes & Modules page in the Opentrons App
- Switching between API v2 and API v1 will now prompt you to restart your robot
- The robot software now supports our new generation of pipettes, coming soon.
- You can specify the version of a labware definition to load in `labware.load`. Currently there is only one version of each labware definition, but that may change in the future. See [the documentation][labware-versioning-docs] for more details.


## Bug Fixes
- Fixed an issue where `mix` arguments were not being parsed correctly. All different optional arguments described in the docs now work
- Fixed the definitions for the NEST tuberacks:  `opentrons_24_tuberack_nest_0.5ml_screwcap`, `opentrons_24_tuberack_nest_1.5ml_screwcap`, `opentrons_24_tuberack_nest_1.5ml_snapcap`, `opentrons_24_tuberack_nest_2ml_screwcap`, and `opentrons_24_tuberack_nest_2ml_snapcap`
- If you specify both `touch_tip` and `blow_out` in a `transfer`, `consolidate`, or `distribute` the robot will now touch tip in a well and then blow out in the trash, rather than the reverse ([#419][419])
- Fixed an issue where picking up tips in CLI deck calibration would lead to offsets when using pipettes other than P300 single Gen1 or P50 Single Gen1
- Fixed an issue where the robot's Jupyter notebook would not start if you had previously created notebooks with spaces in their names
- Fixed an issue where calibrating multiple tipracks would cause their calibrations to drift and behave incorrectly when running the protocol [#4288][4288]



## Known Issues

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50 mL" tube in a "15 / 50 mL" tube rack is the same height as the "15 mL" tube
- When attaching or detaching a pipette from the left mount, the robot homes twice in the X direction

Happy Halloween! 🎃

[419]: https://github.com/Opentrons/opentrons/issues/419
[labware-versioning-docs]: https://docs.opentrons.com/v1/labware.html#labware-versions
[docs-v2-root]: https://docs.opentrons.com//v2/index.html
[apiv2-form]: https://opentrons-ux.typeform.com/to/jhccYV
[4288]: https://github.com/Opentrons/opentrons/issues/4288
