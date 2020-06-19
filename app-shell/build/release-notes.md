# Opentrons App Changes from 3.18.1 to 3.19.0

## Features
- Add Robot Calibration Check, a new tool to help troubleshoot robot accuracy
  problems
- Add support for automatically pausing protocols when the OT-2's door is open
  or top window is removed. To enable this feature, select it in the robot
  Advanced Settings page.
- Add a setting to disable robot caching, which prevents robots from staying
  visible in the robot list when you move between networks. To enable this
  feature, select it in the Network Settings screen.


## Bugfixes
- Automatically scan for robots when the computer's network devices change,
  which should speed up detecting OT-2s after they are connected via usb
  ([#5343](https://github.com/opentrons/opentrons/issues/5343))
- Fix an issue where after uploading a protocol, clicking the upload button
  again would do nothing ([#5781](https://github.com/opentrons/opentrons/issues/5781))
  This alpha release primarily is meant to support User Acceptance Testing of the Robot Calibration Check feature.

For more details about this release, please see the full [technical change
log][changelog]

[changelog]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md


