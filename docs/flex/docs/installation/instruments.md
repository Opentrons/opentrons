---
title: "Opentrons Flex: Instrument Installation and Calibration"
description: "Attach pipettes and calibrate using the touchscreen or Opentrons App."
---

After initial robot setup, the next step is to attach instruments to the robot and calibrate them.

To install an instrument, first tap on **Instruments** on the touchscreen or go to the **Pipettes and Modules** section of the device detail screen in the Opentrons App. Choose an empty mount and select either **Attach Pipette** or **Attach Gripper**. If the mount you want to use is already occupied, you need to detach the pipette or gripper first.

!!! note
    The overall installation process is the same regardless of whether you use the touchscreen or the Opentrons App. Whatever device you begin on will control the installation process until you complete or cancel it.
    
    If you begin on the touchscreen, the app will show the robot as being “busy”. If you begin in the app, the touchscreen will show a modal indicating that instrument installation is in progress.

The exact installation process varies depending on the instrument you are attaching, as covered in the sections below. All instruments have an automated calibration procedure, which you should perform immediately after installation.

## Pipette installation

When you install a pipette, you will be guided through the following steps on the touchscreen or in the Opentrons App.

1. Choose pipette type

    Choose between **1- or 8-Channel Pipette** and **96-Channel Pipette**. Attaching the 96-Channel Pipette requires a few additional steps because it attaches to a special *mounting plate* that spans both pipette mounts.

2. Prepare for installation

    Remove labware from the deck and clean up the working area to make attachment and calibration easier. Also gather the needed equipment, such as the calibration probe, hex screwdriver, and mounting plate (for the 96-Channel Pipette).

3. Connect and secure the pipette

    The gantry will move to the front of the robot so you can attach the pipette.

    1- and 8-Channel Pipettes connect directly to a pipette mount. The 96-Channel Pipette requires a mounting plate. In order to attach the mounting plate, you must first disconnect the z-axis carriage for the right pipette mount.

    Connect the pipette to the chosen pipette mount and secure its screws.

4. Run automated calibration

    To calibrate the pipette, attach the calibration probe to the appropriate pipette nozzle. The pipette will automatically move to touch certain points on the deck and save these calibration values for future use. Once calibration is complete and you've removed the probe, the pipette will be ready for use in protocols.

## Gripper installation

When you install the gripper, you will be guided through the following steps on the touchscreen or in the Opentrons App.

1. Prepare for installation

    Remove labware from the deck and clean up the working area to make attachment and calibration easier. Also gather the required hex screwdriver and make sure that the calibration pin is in its storage area on the gripper.

2. Connect and secure the gripper

    The gantry will move to the front of the robot so you can attach the gripper. Connect the gripper to the extension mount and secure its screws.

3. Run automated calibration

    To calibrate the gripper, insert the calibration pin in the front jaw. The gripper will automatically move to touch certain points on the deck and save these calibration values for future use. Then repeat the same process with the calibration pin in the back jaw. Once calibration is complete and you've put the pin back in its storage location, the gripper will be ready for use in protocols.