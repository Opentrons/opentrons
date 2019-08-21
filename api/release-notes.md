# Robot OS Changes from 3.10.3 to 3.11.1

This update migrates the Opentrons Robot OS to a new underlying technology - buildroot. This change allows us to better control the robot's system and provide better updates without requiring internet connectivity.

Updating your robot to 3.11.1 will take up to 10 minutes, and your Opentrons App must stay connected to the robot the entire time. If you have manually installed Python packages on your robot, you will have to reinstall them after this update.

For more details about this release, please see the full [technical change log][changelog]

## New Features

- Added support for setting the flow rate of the pipette during blowout operations. `set_flow_rate` and `set_speed` now take a `blow_out` parameter. See the [API Docs][blowoutflowrate] for more details.
- Store labware calibration separately if a labware is placed on a module. For instance, a well plate on a Temperature Module can now be calibrated separately from a well plate placed on the deck.
- Added support for filter tips in [200 ul][filter-200], [1000 ul][filter-1k], and [10ul][filter-10] sizes; when the 200 ul tips are used with a P300 Single or Multi pipette, the pipette's maximum volume will be reduced to 200 ul.

## Bug fixes

- Fixed an incorrect mix after a blowout during a transfer when `mix_after` and `blow_out` are both specified
- Fixed incorrect handling of transfers involving volumes too large for a single aspirate
- Fixed an issue where clicking pause during a protocol could lead to the runlog being out of sync

## Known issues

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50ml" tube in a "15/50ml" tube rack is the same height as the "15ml" tube
- When attaching or detaching a pipette from the left mount, the robot homes twice in the X direction

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md
[blowoutflowrate]: https://docs.opentrons.com/atomic%20commands.html#controlling-speed
[filter-200]: https://labware.opentrons.com/opentrons_96_filtertiprack_200ul
[filter-1k]: https://labware.opentrons.com/opentrons_96_filtertiprack_1000ul
[filter-10]: https://labware.opentrons.com/opentrons_96_filtertiprack_10ul
