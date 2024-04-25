For more details about this release, please see the full [technical changelog][].
[technical change log]: https://github.com/Opentrons/opentrons/releases

## Internal Release 1.5.0-alpha.1

This internal release is from the `edge` branch to contain rapid dev on new features for 7.3.0. This release is for internal testing purposes and if used may require a factory reset of the robot to return to a stable version.

<https://github.com/Opentrons/opentrons/compare/ot3@1.5.0-alpha.0...ot3@1.5.0-alpha.1>

---

## Internal Release 1.5.0-alpha.0

This internal release is from the `edge` branch to contain rapid dev on new features for 7.3.0. This release is for internal testing purposes and if used may require a factory reset of the robot to return to a stable version.

<https://github.com/Opentrons/opentrons/compare/ot3@1.4.0-alpha.1...ot3@1.5.0-alpha.0>

---

## Internal Release 1.4.0-alpha.1

This internal release is from the `edge` branch to contain rapid dev on new features for 7.3.0. This release is for internal testing purposes and if used may require a factory reset of the robot to return to a stable version.

### Notable bug fixes

App and robot update prompts should now function properly. However, updating from 1.4.0-alpha.0 to 1.4.0-alpha.1 will still present issues, as the fix is not in 1.4.0-alpha.0. After installing 1.4.0-alpha.1, switch your update channel to "latest" to receive the latest stable internal release prompt, which validates the fix.

### All changes

<https://github.com/Opentrons/opentrons/compare/ot3@1.4.0-alpha.0...ot3@1.4.0-alpha.1>

---

## Internal Release 1.4.0-alpha.0

This internal release is from the `edge` branch to contain rapid dev on new features for 7.3.0. This release is for internal testing purposes and if used may require a factory reset of the robot to return to a stable version.

<https://github.com/Opentrons/opentrons/compare/ot3@1.3.0-alpha.0...ot3@1.4.0-alpha.0>

---

## Internal Release 1.3.0-alpha.0

This internal release is from the `edge` branch to contain rapid dev on new features for 7.3.0. This release is for internal testing purposes and if used may require a factory reset of the robot to return to a stable version.

<https://github.com/Opentrons/opentrons/compare/v7.2.2...ot3@1.3.0-alpha.0>

---

# Internal Release 1.1.0

This is 1.0.0, an internal release for the app supporting the Opentrons Flex.

This is still pretty early in the process, so some things are known not to work, and are listed below. Some things that may surprise you do work, and are also listed below. There may also be some littler things of note, and those are at the bottom.


## New Stuff In This Release

- There is now UI for configuring the loaded deck fixtures such as trash chutes on your Flex.
- Support for analyzing python protocol API 2.16 and JSON protocol V8
- Labware position check now uses the calibration (the same one used for pipette and module calibration) instead of a tip; this should increase the accuracy of LPC.
- Connecting a Flex to a wifi network while the app is connected to it with USB should work now
- The app should generally be better about figuring out what kind of robot a protocol is for, and displaying the correct deck layout accordingly

## Known Issues

- Labware Renders are slightly askew towards the top right.
