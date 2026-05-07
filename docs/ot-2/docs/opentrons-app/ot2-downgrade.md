---
title: "Opentrons OT-2: Software Downgrade"
description: "Roll back OT-2 robot and app software to an earlier version for troubleshooting or compliance."
---

These instructions explain how to downgrade OT-2 robots running software version 9.0 or earlier. If your robot is running version 26.06 or later, see <font color="red">PLACEHOLDER TO TBD</font> to roll back to version 9.0 or earlier.

For Flex, see [Downgrading Flex Software](../../flex/opentrons-app/flex-downgrade.md).

!!! note
    Downgrading your robot's software version should only be done at the direction of Opentrons Support for troubleshooting or software compliance purposes.

## Operating system versions

Following the release of robot software v9.0, Opentrons is forking its robot operating system and Opentrons App into separate repositories for the OT-2 and Flex robots. The software for the downgrade procedure described here is available on GitHub at <https://github.com/Opentrons/opentrons/releases>.

This change also introduces a significant increment in operating system versions number for the OT-2. After v9.0, the robot software version for the OT-2 jumps to v26.06. Version 26.06 starts a dedicated OT-2 track to provide targeted updates and reduce unnecessary downtime associated with unnecessary upgrades associated with shared software.

## Robot downgrade instructions

!!! tip
    Make sure your OT-2 is idle before downgrading. Some required App features are not available while the robot is running a protocol.

### Download robot software

<div class="instruction-list" markdown>

1. On the Github releases page, find an earlier version of the OT-2 software you want to use. We recommend rolling back to the version closest to the latest release.

2. In the Assets section of a release, click the small triangle (&rtrif;) to expand a list of compressed software files available for download.

<font color="red">PLACEHOLDER FOR IMAGE</font>

3. Click the compressed file named `ot2-system-<version number>.zip` to download and save it to your computer. For example, to get OT-2 software version 8.7, you'd click the file `ot2-system-8.7.0.zip`.

### Install robot software

1. From the **Devices** tab in the App, find the robot you want to work with.

2. Click the three-dot menu (⋮) and then click **Robot Settings**.

3. Click the **Advanced** tab.

4. In the Advanced settings, find the section labeled "Update robot software manually with a local file."

<font color="red">PLACEHOLDER FOR IMAGE</font>

5. Click **Browse file system** and navigate to the location where you saved the downloaded robot software.

6. Select the `.zip` file containing the robot software and click **Open**. The robot automatically installs the software and reboots, which takes about 15 minutes. After restarting, the robot will be running the earlier operating system version.

</div>

## App downgrade instructions

TBD instructions here. Match App software to robot software version.
