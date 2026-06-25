---
title: "Opentrons OT-2: Resetting the Robot"
description: "Instructions on performing a full device reset."
---

## Purpose

You may need to reset your OT-2 to fix software errors, calibration problems, unusual behavior, or as part of routine maintenance. The checkboxes in the Device Reset section of the Opentrons OT-2 App let you select data to delete before restarting the robot. Depending on your selections, you may need to [calibrate the OT-2](../calibration/robot-calibration.md) or re-run [Labware Position Check](../calibration/labware-offsets.md#running-labware-position-check) after restarting.

!!! warning
    A full reset clears all stored data from your OT-2. This includes robot calibration data, labware offset data, protocol run history, boot scripts, and any saved SSH keys.

## Steps

Follow these instructions to perform a full reset on your OT-2:

<div class="instruction-list" markdown="1">

1. From the Opentrons OT-2 App, click **Devices** and locate the robot you want to reset.

2. For your selected robot, click the three-dot menu (⋮) and then click **Robot Settings**.

3. Click the **Advanced** tab to open the advanced settings page.

4. In the Device Reset section, click **Choose reset settings**.

5. Select the data categories you want to delete. To perform a full factory reset, select all available checkboxes.

    <figure class="side-by-side">
    <p>
    <img src="../../images/ot2-reset1.png" style="width: 31%; border: 1px solid #888;">
    <img src="../../images/ot2-reset2.png" style="width: 31%; border: 1px solid #888;">
    <img src="../../images/ot2-reset3.png" style="width: 31%; border: 1px solid #888;">
    </p>
    <figcaption>
    Device Reset options in the app.
    </figcaption>
    </figure>

6. Click **Clear data and restart robot**. Your OT-2 will erase the selected data files and restart.

Be sure to perform any required calibrations after the robot reboots.

</div>