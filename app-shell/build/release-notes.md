# Opentrons App Changes from 3.20.0 to 3.20.1

For more details about this release, please see the full [technical change
log][]. For a list of currently known issues, please see the [Opentrons issue tracker][].

[technical change log]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md
[opentrons issue tracker]: https://github.com/Opentrons/opentrons/issues?q=is%3Aopen+is%3Aissue+label%3Abug

## Fixes

- Properly enable / disable the "Update robot software from file" button
  - This button was sometimes enabled and disabled at improper times
  - That logic has been fixed and a tooltip has been added whenever it is disabled
- Better support for updating your OT-2's software while offline
  - The Opentrons App will now save the latest robot software update in a cache
  - After the app has downloaded the robot update, you will be able to tell the app to update an OT-2 even if your computer doesn't have internet at the time
- Remove an errant "Exit" button on the last page of the Deck Calibration Check wizard
- Ensure modules render correctly in the deck map when loaded in slot 3, 6, or 9
- Ensure "Last Updated" times for custom labware are correct

## Features

- Automatically sync the OT-2's clock with the App on connect
  - When the App connects to an OT-2 running v3.21.0, it will sync the OT-2's clock with your computer's clock
  - This should fix issues with incorrectly displayed protocol run times
- Open Jupyter Notebook directly from to the Robot's page in the app
  - The Opentrons App now has a button in a given robot's "Advanced Settings" section to open that OT-2's Jupyter Notebook in your computer's browser
