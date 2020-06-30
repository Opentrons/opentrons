# Robot OS Changes from 3.18.1 to 3.19.0

## Features
- Add support for Robot Calibration Check, a new tool to help troubleshoot robot
  accuracy problems
- Add support for automatically pausing protocols when the OT-2's door is open
  or top window is removed. To enable this feature, select it in the robot
  Advanced Settings page.
- New Python Protocol API level: [2.5](http://docs.opentrons.com/edge/v2/versioning.html#version-2-5)
- In Protocol API level 2.5, you can access new utility commands to control
  robot lights and sense the status of the robot door
- Since using an incorrect tiprack for a pipette (for instance, a 1000ul tiprack
  with a P300 Single GEN2) can cause ``LabwareHeightErrors``,
  ``opentrons_simulate`` will now warn you when you use the wrong standard
  Opentrons tiprack with a pipette, and the ``LabwareHeightError`` text now
  suggests use of the wrong tiprack as a cause for the error.
  
  
## Bugfixes
- Fix a series of issues involving the app freezing around pausing and resuming
  protocols
- Load a more realistic deck transform when simulating protocols via
  `opentrons_simulate` to avoid `LabwareHeightErrors` during command line
  simulation ([#5908](https://github.com/opentrons/opentrons/issues/5908))
  ([03757d9](https://github.com/opentrons/opentrons/commit/03757d9))
- Fix an issue causing plate temperature uniformity errors if the Thermocycler
  lid is opened immediately after a `set_block_temperature` ([#5602](https://github.com/opentrons/opentrons/issues/5602))  
- Fix an issue causing incorrect display of delay times in Protocol Designer
  protocols ([#5414](https://github.com/opentrons/opentrons/issues/5414)) 

For more details about this release, please see the full [technical change
log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

