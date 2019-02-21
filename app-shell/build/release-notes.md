# Changes from 3.6.5 to 3.7.0

For more details, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

<!-- start:@opentrons/app -->
## Opentrons App

### Bug fixes

- Added a warning message to the app update flow to remind you that you need to update your robot _after_ you update your app

### New features

- The app now sends more detailed robot configuration information automatically to support chat so our Support Team can more efficiently diagnose any issues

### Known issues

- The app's run log is still having problems displaying the current run step, especially if pauses and resumes are involved ([#2047][2047])
- The app should prevent you from starting a pipette swap while a protocol is
executing, but it does not ([#2020][2020])
- If a protocol run encounters an error, the app will suppress the error message instead of displaying it ([#1828][1828])

[2047]: https://github.com/Opentrons/opentrons/issues/2047
[2020]: https://github.com/Opentrons/opentrons/issues/2020
[1828]: https://github.com/Opentrons/opentrons/issues/1828

<!-- end:@opentrons/app -->

<!-- start:@opentrons/api -->
## OT2 and Protocol API

This release includes updated calibrations for the **P10S**, **P10M**, **P50S**, **P50M**, and **P300S** pipettes.

This update is an incremental refinement to aspiration volume accuracy, reflecting extensive additional test data. **After updating, your robot will be configured to use these new calibrations**.

Please note this change may result in materially different aspiration volumes. If you do not wish to use the updated calibrations immediately (for example, if you are in the middle of an experimental run, or if you are already using a custom aspiration method), you can revert these changes by enabling _"Use older pipette calibrations"_ in your robot's _"Advanced Settings"_ menu.

As always, please reach out to our team with any questions.

### Bug fixes

- Updated pipette aspiration functions for increased accuracy
- Fixed the height of the `96-flat` labware definition
    - You will need to reset your robot's labware calibration data to pick up this change
    - This will erase all existing calibrations as well as all custom labware, so only do it if your existing `96-flat` calibration isn't working or if you don't mind re-calibrating your other labware
    - To reset labware calibration, go to "Robots" > your robot > "Advanced Settings" > "Factory Reset", check "Labware Calibration", and then click "Reset"
- Made some general boot reliability improvements

### New features

- Python protocols can now be simulated from your own computer **without needing to clone our entire repository**
    - See the [Opentrons package on PyPI](https://pypi.org/project/opentrons/) for more details

    ```
    pip install opentrons
    opentrons_simulate /path/to/protocol.py
    ```

- Made some underlying architectural improvements for future user-facing features

### Known issues

- Skipping optional parameters in certain protocol methods (e.g. `pipette.dispense`) in can cause labware to be missing from the calibration list and the run log to display incorrect messages ([#3105][3105])
    - The protocol will still execute properly
    - To work around, always specify all properties, even if you need to enter `None` manually

    ```
    # don't do this
    pipette.dispense(trough)

    # do this
    pipette.dispense(None, trough)
    # or even better, use named parameters for clarity
    pipette.dispense(volume=None, location=trough)
    ```

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50ml" tube in a "15/50ml" tuberack is the same height as the "15ml" tube
- Extremely long aspirations and dispenses can incorrectly trigger a serial timeout issue. If you see such an issue, make sure your protocol’s combination of aspirate/dispense speeds and aspirate/dispense volumes does not include a command that will take more than 30 seconds.

[3105]: https://github.com/Opentrons/opentrons/issues/3105

<!-- end:@opentrons/api -->
