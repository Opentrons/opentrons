# Robot OS Changes from 3.14.1 to 3.15.2

For more details about this release, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## Python Protocol API V2 Release

We're happy to announce the full release of our Python Protocol API Version 2! We’ve designed version 2 of the Python Protocol API to be easier to learn and use.

Robots updated to 3.15 will support both Python Protocol API version 1 and version 2 protocols. Please note that this update will NOT affect your existing protocols.

To read more about the version 2 update, please go to our [documentation](https://docs.opentrons.com/v2/index.html).

## Thermocycler Module Software Release

We're also happy to announce that software support for our new [Thermocycler Module](https://shop.opentrons.com/products/thermocycler-module?_pos=2&_sid=d5579276c&_ss=r) is complete!

## Other Changes

- If you are running a Python Protocol API version 2 protocol, you must now specify the version level. Please go to the [documentation](https://docs.opentrons.com/v2/index.html#metadata-and-version-selection) to read more.
- You can now upload Python Protocol API version 1 and API version 2 protocols without changing a feature flag.
- You can specify starting volumes for Thermocycler Module temperature commands. Please read the documentation on [setting block temperature](http://sandbox.docs.opentrons.com/edge/v2/new_modules.html#block-temperature-control) and [executing temperature profiles](http://sandbox.docs.opentrons.com/edge/v2/new_modules.html#thermocycler-module-profiles) for more information.

## Bug Fixes
- Reduce logging noise
- When a protocol with modules is canceled, ensure the protocol is able to reset. Previously, a cancel with a module temperature hold or set would cause the server to hang and require a robot power-cycle to recover.
- The robot will now always calibrate to the top of tipracks in Protocol API Version 2 even if the calibrate to bottom advanced setting is set ([#4417](https://github.com/Opentrons/opentrons/issues/4417)). Thanks to Theo Sanderson (GitHub: @theosanderson) for the issue documentation and contribution of the fix!
- Use a more efficient way to check whether a motor is moving in a given command, resulting in about a 10% speedup in protocol simulation for Protocol API Version 1 protocols and a 5% speedup for Protocol API Version 2 protocols (#4482). Thanks to Robert Atkinson (GitHub: @rgatkinson) for discovering the issue and suggesting a fix!
- Fix an issue where you could not specify location within wells for transfers using a multichannel pipette in Protocol API v2
- Fix an issue where resetting labware calibration would not reset the calibration for old-style labware like `96-flat`
- Fix an issue where accessing Magnetic Module status in a Protocol API version 1 protocol would fail simulation
- Fix X axis double-homing issue (#4554).
- Fix Thermocycler Module calibration issues (#4614).
- Allow labels for labware on modules in Python Protocol API v1 (#4608).
- Allow labeling and versioning for labware on modules in Python Protocol API v2 (#4605).
- Allow for a pause at the end of protocols (#4603).
- Fix touch tip in 15x50ml tuberack (#4585).
- Disallow connecting to the robot in Python Protocol API v1 during upload to the Run App (#4589).
- Limit air gap in Python Protocol API v1 to max volume of the pipette (#4588).
- Use correct pipette settings which sometimes caused drop tip to mis-behave (#4611).


## Known Issues (Python Protocol API version 1)

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50 mL" tube in a "15 / 50 mL" tube rack is the same height as the "15 mL" tube
- If the robot is about to initiate a pause and a cancel is issued from the Opentrons App, the cancel may fail. See issue [#4545](https://github.com/Opentrons/opentrons/issues/4545)


[419]: https://github.com/Opentrons/opentrons/issues/419
[labware-versioning-docs]: https://docs.opentrons.com/v1/labware.html#labware-versions
[docs-v2-root]: https://docs.opentrons.com//v2/index.html
[apiv2-form]: https://opentrons-ux.typeform.com/to/jhccYV
[4288]: https://github.com/Opentrons/opentrons/issues/4288
