---
title: "Opentrons OT-2: Resetting the Robot"
description: "Instructions on performing a full device reset."
---

## Purpose

You may need to perform a full or partial reset on your OT-2 to fix errors, calibration problems, intermittently unusual behavior, or as part of routine maintenance. The settings in the Device Reset section of the Opentrons App let you select the data to delete before restarting the robot. Depending on your selections, after restart you may have to [calibrate the OT-2](../calibration/robot-calibration.md) again and re-run [Labware Position Check](../calibration/labware-offsets.md#running-labware-position-check).

!!! warning
    A full reset clears all stored data from your OT-2. This includes robot calibration data, labware offset data, protocol run history, boot scripts, and any saved SSH keys.

## Procedure

Follow these instructions to perform a full reset on your OT-2:

<div class="instruction-list" markdown>

1. From the Opentrons App, click **Devices** and locate the robot you want to reset.

2. For your selected robot, click the three-dot menu (⋮) and then click **Robot Settings**.

3. Click the **Advanced** tab to open the advanced settings page.

4. Select the data you want to delete before restarting. Checking all available options to resets the OT-2 to its factory defaults.

5. Click **Clear data and restart robot**. Your OT-2 will erase the selected data files and restart. Be sure to perform any required calibrations after the robot reboots.