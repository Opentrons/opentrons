---
title: "Opentrons OT-2: Software Downgrade"
description: "Roll back OT-2 software to an earlier version for troubleshooting or compliance."
---

These instructions take you through the OT-2 robot software downgrade process. Downgrading your robot's software version should only be done at the direction of Opentrons Support for troubleshooting or software compliance purposes. For Flex instructions, see [Downgrading Flex Software](../../flex/opentrons-app/flex-downgrade.md).

## Operating system versions

Previous versions of the OT-2 robot operating system (and Opentrons App) are available on Github at <https://github.com/Opentrons/opentrons/releases>.

## Downgrade instructions

!!! tip
    Make sure your OT-2 is idle before downgrading. Some required App features are not available while the robot is running a protocol.

### Part 1: Downloading an earlier software version

<div class="instruction-list" markdown>

1. On the Github releases page, find an earlier version of the OT-2 software you want to use. We recommend rolling back to the version closest to the latest release.

2. In the Assets section of a release, click the small triangle (&rtrif;) to expand a list of compressed software files available for download.

<font color="red">PLACEHOLDER FOR IMAGE</font>

3. Click the compressed file named `ot2-system-<version number>.zip` to download and save it to your computer. For example, to get OT-2 software version 8.7, you'd click the file `ot2-system-8.7.0.zip`.

### Part 2: Installing the earlier version

4. From the **Devices** tab in the App, find the robot you want to work with.

5. Click the three-dot menu (⋮) and then click **Robot Settings**.

6. Click the **Advanced** tab.

7. In the Advanced settings, find the section labeled "Update robot software manually with a local file."

<font color="red">PLACEHOLDER FOR IMAGE</font>

8. Click **Browse file system** and navigate to the location where you saved the downloaded robot software.

9. Select the `.zip` file containing the robot software and click **Open**.

    !!! note "Software installation and reboot"
        The robot automatically installs the software and reboots, which takes about 15 minutes. When the restart is complete, the robot will be running the earlier version of the operating system.

</div>

### Part 3: After downgrading

TBD instructions here. Match App software to robot software version.
