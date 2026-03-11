---
title: "Opentrons OT-2: Resetting the Robot"
description: "Instructions on performing a full device reset."
---

## Purpose

You may need to perform a full reset to fix errors, calibration problems, intermittently unusual behavior, or as part of routine maintenance. Resetting the robot also means you will have to [calibrate the OT-2](../calibration/robot-calibration.md) and run [Labware Position Check](../calibration/labware-offsets.md#running-labware-position-check) on labware used in your protocols.

!!! warning
    A full reset clears all stored data from your OT-2. This includes robot calibration data, labware offset data, protocol run history, boot scripts, and any saved SSH keys.

## Procedure

Follow these instructions to perform a full reset on your OT-2:

<div class="instruction-list" markdown>

1. From the Opentrons App, click **Devices** and locate the robot you want to reset.

2. For your selected robot, click the three-dot menu (⋮) and then click **Robot Settings**.

3. Click the **Advanced** tab to open the advanced settings page.

