For more details about this release, please see the full [technical changelog][].
[technical change log]: https://github.com/Opentrons/opentrons/releases

---

# Internal Release 0.11.0

This is 0.11.0, an internal release for the app supporting the Opentrons Flex.

This is still pretty early in the process, so some things are known not to work, and are listed below. Some things that may surprise you do work, and are also listed below. There may also be some littler things of note, and those are at the bottom.

## Update Notes

- ⚠️ After upgrading your robot to 0.11.0, you'll need to factory-reset its run history before you can use it.

  1. From the robot's 3-dot menu (⋮), go to **Robot settings.**
  2. Under **Advanced > Factory reset**, select **Choose reset settings.**
  3. Choose **Clear protocol run history,** and then select **Clear data and restart robot.**

  Note that this will remove all of your saved labware offsets.

  You will need to follow these steps if you subsequently downgrade back to a prior release, too.

## New Stuff In This Release

- The HTTP API will now accept both styles of deck slot name: coordinates like "C2", and integers like "5". Flexes will now return the "C2" style, and OT-2s will continue to return the "5" style.

# Internal Release 0.9.0

This is 0.9.0, an internal release for the app supporting the Opentrons Flex.

This is still pretty early in the process, so some things are known not to work, and are listed below. Some things that may surprise you do work, and are also listed below. There may also be some littler things of note, and those are at the bottom.

## Smaller Known Issues In This Release
- Gripper calibration occasionally seems like it "skipped a step", going straight from front to rear calibration. If this happens, exit and rerun. This is because of a server error that isn't getting properly reported. We're working on both fixing the error and its reporting, but in the meantime exiting and rerunning the process should fix it. This is RQA-844.

## New Stuff In This Release
- USB connectivity improvements: the app will display a nice big icon in the network settings page for a USB robot, USB robots will disappear properly when disconnected, things of this nature.
- 96-channel detach improvements
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

