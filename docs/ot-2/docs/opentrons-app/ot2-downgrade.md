---
title: "Opentrons OT-2: Software Downgrade"
description: "Roll back OT-2 software to an earlier version for troubleshooting or compliance."
---

Downgrading OT-2 software should only be done at the direction of Opentrons Support for troubleshooting or software compliance purposes. The instructions in this section take you through the robot software downgrade process.

Previous versions of the OT-2 robot operating system (and Opentrons App) are available on Github at <https://github.com/Opentrons/opentrons/releases>.

!!! tip
    Make sure your OT-2 is idle before downgrading. Some required App features are not available while the robot is running a protocol.

## Part 1: Downloading an earlier software version

<div class="instruction-list" markdown>

1. On the Github releases page, find an earlier version of the OT-2 software you want to use. We recommend rolling back to the version closest to the latest release.

2. In the Assets section of a release, click the small triangle (&rtrif;) to expand a list of compressed software files available for download.

<font color="red">PLACEHOLDER FOR IMAGE</font>

3. Click the compressed file named `ot2-system-<version number>.zip` to download and save it to your computer. For example, to get OT-2 software version 8.7, you'd click the file `ot2-system-8.7.0.zip`.

    !!! note
        File names that start with `ot3` refer to Flex. See [Downgrading Flex Software](../../flex/opentrons-app/flex-downgrade.md) if you need to perform a robot software downgrade on that robot model.

</div>