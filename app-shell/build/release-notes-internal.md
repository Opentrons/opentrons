For more details about this release, please see the full [technical changelog][].
[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 0.8.0

This is 0.8.0, an internal release for the app supporting the Opentrons Flex.

This is still pretty early in the process, so some things are known not to work, and are listed below. Some things that may surprise you do work, and are also listed below. There may also be some littler things of note, and those are at the bottom.

## New Stuff In This Release
- USB connectivity! If you connect your Flex via USB, it should show up.
- LPC supports custom labware again
- Visual fixes and improvements

## Big Things That Don't Work Yet So Don't Report Bugs About Them
- Attach, detach, and calibration flows for anything from the protocol setup page
- Pipette/gripper firmware update on attach: if you need to attach a new instrument, attach it and then power-cycle the robot

## Big Things That Do Work Please Do Report Bugs About Them
- Connecting to a Flex, including via USB
- Running protocols on those Flexs including simulate, play/pause, labware position check
  - Except for gripper; no LPC for gripper
- Attach, detach, and calibration flows for pipettes and gripper  when started from the device page
- Automatic updates of app and robot when new internal-releases are created

## Smaller Interesting New Features
- If you click on the wifi or network symbol next to a robot's name in the devices page you'll jump right to the network settings

