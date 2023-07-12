For more details about this release, please see the full [technical changelog][].
[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 0.13.0

This is 0.13.0, an internal release for the app supporting the Opentrons Flex.

This is still pretty early in the process, so some things are known not to work, and are listed below. Some things that may surprise you do work, and are also listed below. There may also be some littler things of note, and those are at the bottom.


## New Stuff In This Release
- Pipette and gripper firmware updates occur during the attach flow now if necessary (!)
- Many (many) visual and workflow fixes and improvements from design QA for the app
- The 96 shouldn't fall down when you attach it now


## Big Things That Don't Work Yet So Don't Report Bugs About Them
- Attach, detach, and calibration flows for anything from the protocol setup page

## Big Things That Do Work Please Do Report Bugs About Them
- Connecting to a Flex, including via USB
- Running protocols on those Flexs including simulate, play/pause, labware position check
  - Except for gripper; no LPC for gripper
- Attach, detach, and calibration flows for pipettes and gripper  when started from the device page
- Automatic updates of app and robot when new internal-releases are created

## Smaller Interesting New Features
- If you click on the wifi or network symbol next to a robot's name in the devices page you'll jump right to the network settings

