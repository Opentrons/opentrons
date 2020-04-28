# Robot OS Changes from 3.17.0 to 3.17.1

For more details about this release, please see the full [technical change
log][changelog]


[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

## Bugfixes

- You can now reduce the speed of a `touch_tip` command to 1 mm/s
- Motion in the `touch_tip` command has been slightly changed; the robot will
  now move to the center of the well in between touching each side, and will
  move to the appropriate height before moving to the well sides to avoid
  diagonal movement
- Fix an issue that could lead to corrupt deck calibration if the deck
  calibration process was ended early (issue [#5469](https://github.com/Opentrons/opentrons/pull/5469))
  
## New Features

- Add [NEST's deep well
 plate](https://labware.opentrons.com/nest_96_wellplate_2ml_deep/)
 as `nest_96_wellplate_2ml_deep`
 
