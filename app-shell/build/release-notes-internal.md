For more details about this release, please see the full [technical changelog][].
[technical change log]: https://github.com/Opentrons/opentrons/releases

# Internal Release 1.5.0

This is 1.5.0, an internal release for the Robot Stack.  the primary purpose of the release is to allow science and design to have the earliest stable release possible, given known bugs and workarounds, as we continue to develop features for 7.3.0.

<https://github.com/Opentrons/opentrons/compare/ot3@v1.2.0...ot3@v1.5.0>

## Steps to use this internal release

1. Before making any changes to the app and robot
   1. Reset the run history using the 7.2.2 app on the robot you want to upgrade to the internal release.

## Steps to install the internal release

1. If you have the Opentrons internal release app installed and are on the stable channel you should receive an update prompt.

![image](https://github.com/Opentrons/opentrons/assets/502770/d7b45e27-b020-4f5f-b289-f673af30df52)

1. If you don’t have the Internal release app installed, download the executable for your operating system @Josh McVey Put the link here.
2. Install the app - 1.5.0
3. Update the robot -  1.5.0

## Known Bugs and work arounds

- We do not guarantee any workflows via USB, please use the desktop app via WiFi and/or ODD
- There are multiple firmware updates that will run and you may encounter the ODD stuck on the update gripper modal.
  - Do Not Click, Firmware will update automatically
- Deck maps during module calibration may not render correctly.
- Run log during run and after run may not be correct.
  - Use the download run log and view the JSON file to see the actual run log.
- Modules and fixtures may not be removed via deckmap on ODD.
- Flex run again may not work on first click in the desktop app.
- 96channel detach  flow will fail on confirmation of step 1
- You will receive an stall detection error
  - Go ahead and clear the error
  - Remove the support bracket
  - Home the gantry
  - Enter into attach flow
- If you interact with the gantry while a gripper is attached and you are not in a detach/attach flow it is possible the gripper may fall.
  - Always be in an attach/detach flow when interacting with the gantry.
- Flex out of date protocol on the desktop app will show a white deckmap
  - Most protocols will get the protocol analysis out of date banner
    - Just hit re-analyze protocol

![image](https://github.com/Opentrons/opentrons/assets/502770/41569e6b-aa68-4262-8dfb-fee222d17a5e)

---

## Internal Release 1.5.0-alpha.2

This internal release is from the `edge` branch to contain rapid dev on new features for 7.3.0. This release is for internal testing purposes and if used may require a factory reset of the robot to return to a stable version.

- This release was to address bugs in the update and downgrade flows for the app and robot.

<https://github.com/Opentrons/opentrons/compare/ot3@1.5.0-alpha.1...ot3@1.5.0-alpha.2>

---

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
