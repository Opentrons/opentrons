# Changes from 3.5.1 to 3.6.4

For more details, please see the full [technical change log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md

<!-- start:@opentrons/app -->
## Opentrons App

### Bug fixes

- Lost connection alert messages will no longer trigger when your robot is restarting for normal reasons (e.g. software update or deck calibration). Sorry for the confusion this caused!
- The notification dot for available robot upgrade on the main Robots nav button has been fixed

### New features

- We've put a lot of work into improving the Wi-Fi setup experience of your robot:
    - Most 802.1X enterprise networks (e.g. eduroam) are now supported!
    - Hidden SSID networks are also supported
    - Generally, it should be easier to tell what Wi-Fi network your robot is currently connected to, along with signal strength and whether or not the network is secured
    - The robot settings page now displays the IP and MAC addresses of the Wi-Fi and Ethernet-to-USB interfaces
    - Please see our support documentation for more details
- After tip-probe is completed, the app will now move the pipette out of the way so you have better access to the deck
- App and robot update messages should now be clearer and easier to follow

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

**Important**: This release includes version 3.6.3, which updates the calibration of the P10 single pipette.

This update includes a refinement to the aspiration function of the P10 single-channel pipette based on an expanded data set. The updated configuration is available as an **opt-in** in the "Advanced Settings" section of your robot's settings page.

Please note this is a small but material change to the P10's pipetting performance, in particular decreasing the low-volume µl-to-mm conversion factor to address under-aspiration users have reported.

As always, please reach out to our team with any questions.

### Bug fixes

- **Updated the configuration of the P1000 single based on an expanded dataset**
- Updated the configuration of the P10 single based on an expanded dataset
- Fixed a bug that was overwriting robot configuration with defaults when using the internal USB flash drive for configuration storage
- Fixed the iteration order of labware created with `labware.create` to match documentation

### New features

- Added support for `v1.4` pipette models
- Python protocols can now include arbitrary metadata for display in the app

```
from opentrons import containers, instruments

metadata = {
    'protocolName': 'My Protocol',
    'description': 'This protocol is mine and it is good',
}
```

### Known issues

- While the underlying definition is correct, there is a known API bug that is causing the robot to think a "50ml" tube in a "15/50ml" tuberack is the same height as the "15ml" tube
- The definition of "96-well-plate" has an incorrect height. When calibrating for the first time after a factory reset:
    1. Begin labware calibration with the "96-well-plate" **off the deck**
    2. Jog the pipette up until there is enough room to insert the plate
    3. Insert plate and calibrate normally
        - After the plate has been calibrated once, the issue will not reoccur
- Extremely long aspirations and dispenses can incorrectly trigger a serial timeout issue. If you see such an issue, make sure your protocol’s combination of aspirate/dispense speeds and aspirate/dispense volumes does not include a command that will take more than 30 seconds.
- Python protocols that contain code in the top level assigning to the result of an index, for instance:

```
some_dict = {'hi': 2}
some_dict[0] = True  # This will cause an error
```

If this kind of code is necessary, please structure it in a function:

```
def build_some_dict():
    some_dict = {'hi': 2}
    some_dict[0] = True
    return some_dict
```

which avoids the issue.



<!-- end:@opentrons/api -->
