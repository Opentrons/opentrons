For more details about this release, please see the full [technical change
log][]. For a list of currently known issues, please see the [Opentrons issue tracker][].

[technical change log]: https://github.com/Opentrons/opentrons/blob/edge/CHANGELOG.md
[opentrons issue tracker]: https://github.com/Opentrons/opentrons/issues?q=is%3Aopen+is%3Aissue+label%3Abug

---

## OT-2 Software Changes in 4.0.0-beta.0

OT-2 Software 4.0.0 has two major changes.

1. Deprecation of Python Protocol API Version 1. APIv1 protocols are no longer supported on the OT-2. This is a big change, but it allows us to make changes and fix problems that go too deep to be supported by APIv1.
2. The first of those big changes is a massive overhaul of the robot calibration process. With these changes, you'll calibrate less often; the calibration processes are shorter, easier, and more reliable; and you can finally do things like calibrate multiple kinds of tiprack for use in a protocol.

This release is a beta release for the real 4.0.0. Please make sure you back up robot calibration data by SSHing in to the robot and copying `/data/deck_calibration.json` and `/data/robot_calibration.json` to new locations before applying this update.

## Known Issues

- The return tip position may be slightly incorrect in some calibration flows, but since this is after the flow it doesn't affect calibration outcomes
- If you navigate in the app while a flow is active without cancelling the flow (e.g. clicking the "more" or "calibration" tabs while you're doing deck calibration, pipette offset calibration, or tip length calibration) the robot will get stuck and you'll have to restart it
