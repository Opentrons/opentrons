# Robot OS Changes from 3.20.0 to 3.20.1

## Bugfixes
- Fix an issue introduced in 3.20.1 where protocol uploads might fail if the robot had been upgraded from Robot Software version 3.18.0 or previous ([#6394](https://github.com/Opentrons/opentrons/issues/6394))

# Robot OS Changes from 3.19.0 to 3.20.0

## Note

This robot software update contains an update to the motor controller board. Your OT-2 will take longer than normal to connect to the Opentrons App during this update.

## Features
- New Python Protocol API Version: 2.6. In API Version 2.6, P1000 Single GEN2, P300 Single GEN2, and P20 Single GEN2 pipettes perform all operations twice as fast by default. Protocols creaated in Protocol Designer, and protocols using API Version 2.5 or earlier, are unchanged.
- Flow rates are now displayed in the runlog directly, in units of µL/s, rather than as a multiplier of the default rate. Thank you to Benedict Carling (https://github.com/Benedict-Carling) for this change!
  
  
## Bugfixes
- Instrument offsets (the calibration values saved from Pipette Calibration before protocol runs) are now cleared before running Deck Calibration, through either the in-app or CLI tools. This fixes an issue where incorrect instrument offsets would cause deck calibrations to be incorrect.
- Fix an issue where an OT-2 might disconnect from a connected USB interface after an unpredictable amount of time. While the OT-2 will still take a while to be detected on a USB interface, it should no longer spuriously disconnect.
- Fix an issue where the OT-2 would home its Z-axis twice after some pick up tip operations. The robot should now only home once (note - there will be two vertical movements, since the homing procedure requires two passes).
- Fix an issue where uploading large protocols, or connecting to a robot that was running a large protocol, would result in an error in the Opentrons App with the message "ACK error".
- Fix an issue with improper spacing in run log messages for Thermocycler block temperatures. Thank you to Benedict Carling (https://github.com/Benedict-Carling) for this change!
- Update an unclear warning message when using Jupyter Notebook to interact with the OT-2. Thank you to Theo Sanderson (https://github.com/theosanderson) for this change!



For more details about this release, please see the full [technical change
log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

