# Robot OS Changes from 3.17.0 to 3.17.1

For more details about this release, please see the full [technical change
log][changelog]


[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## Bugfixes


- In API Level 2.4, motion in the `touch_tip` command is slightly different; the OT-2 will
  now move to the center of the well in between touching each side, and will
  move to the appropriate height before moving to the well sides to avoid
  diagonal movement
- Fix an issue that could lead to corrupt deck calibration if the deck
  calibration process was ended early (issue [#5469](https://github.com/Opentrons/opentrons/pull/5469))
  
## New Features

- Add [NEST's deep well
 plate](https://labware.opentrons.com/nest_96_wellplate_2ml_deep/)
 as `nest_96_wellplate_2ml_deep`
 - New api level: 2.4. Set `'apiLevel': '2.4'` in your protocol's metadata to
 take advantage of the `touch_tip`-related changes. See [the
 documentation](https://docs.opentrons.com/v2/versioning.html#version-2-4) for
 more detailed information.
- In API Level 2.4, you can now reduce the speed of a `touch_tip` command to 1 mm/s
- In API Level 2.4, `touch_tip` will now touch only 3 sides of a well if
  touching the fourth side would cause a collision with an adjacent module or
  the side of the OT-2. For instance, using the left pipette to `touch_tip` in
  column 12 of a 96-well plate in slot 2 with a Magnetic Module in slot 3 will
  touch only the top, left, and bottom sides of the well. 
 
 
