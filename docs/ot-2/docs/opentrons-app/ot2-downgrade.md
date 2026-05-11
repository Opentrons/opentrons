---
title: "Opentrons OT-2: Downgrading Robot Software"
description: "Roll back OT-2 robot and app software from v9.0 an earlier version."
---

These instructions explain how to downgrade the Opentrons App and OT-2 robot software.

!!! note
    Downgrading your robot's software version should only be done at the direction of Opentrons Support for troubleshooting or software compliance purposes.

<!-- maybe too much? The jump from 9 to 26.06 might leave people wondering what happened between 10 and 25. An attempt at context. -->

## Software versions

After the v9.0 release, Opentrons split its software into separate branches for OT-2 and Flex. This change restarts OT-2 software versioning at 26.06, enables robot-specific software releases, and reduces downtime from shared releases that don't benefit the OT-2.

Forking OT-2 software creates two downgrade paths:

- **Latest to Legacy**: From v26.06 (or later) to v9.0 (or earlier).
- **Legacy to Legacy**: From v9.0 to an earlier version.

!!! note
    Saved protocols are not migrated automatically during a "latest to legacy" downgrade. You have to find move those files manually.

The following table provides information about software versions, repositories, and App directories that store saved protocols.

| Feature | Legacy software | Latest software |
|----|----|----|
| **Versions** | v9.0 and earlier | v26.06 and later |
| **Software repository** | [Opentrons releases](https://github.com/Opentrons/opentrons/releases) | [Opentrons OT-2 releases](https://github.com/Opentrons/opentrons-ot2/releases) |
| **Saved protocols location** | `.../Opentrons/protocols/` | `.../Opentrons OT-2/protocols/` |

## Robot downgrade instructions

!!! tip
    Make sure your OT-2 is idle before downgrading. Some required App features are not available while the robot is running a protocol.

### Download robot software

<div class="instruction-list" markdown>

1. On the [Github releases page](https://github.com/Opentrons/opentrons/releases), find an earlier version of the OT-2 software you want to use. We recommend rolling back to the version closest to the latest release.

2. In the Assets section of a release, click the small triangle (&rtrif;) to expand a list of compressed software files available for download.

    <figure class="screenshot" markdown>
    ![OT-2 software on GitHub](../images/ot2-robot-software-releases.png)
    </figure>

3. Click the compressed file named `ot2-system-<version number>.zip` to download and save it to your computer. For example, to get OT-2 software version 8.7, you'd click the file `ot2-system-8.7.0.zip`.

### Install robot software

1. From the **Devices** tab in the App, find the robot you want to work with.

2. Click the three-dot menu (⋮) and then click **Robot Settings**.

3. Click the **Advanced** tab.

4. In the Advanced settings, find the section labeled "Update robot software manually with a local file."

    <figure class="screenshot" markdown>
    ![App image showing browse button](../images/ot2-robot-software-downgrade.png)
    </figure>

5. Click **Browse file system** and navigate to the location where you saved the downloaded robot software.

6. Select the `.zip` file containing the robot software and click **Open**. The software installs automatically and reboots the robot, which takes about 15 minutes. After restarting, the robot will be running the earlier operating system version.

</div>

## App version requirements

To run protocols on a downgraded OT-2, the Opentrons App version must match the robot software version. While you can interact with the robot using mismatched software, you cannot run protocols until the robot software and App software versions are identical.

### App download and installation

To install an earlier version of the Opentrons App:

<div class="instruction-list" markdown>

1. On the [Github releases page](https://github.com/Opentrons/opentrons/releases), find the Opentrons App version matching your downgraded OT-2. This software will be in the same location as the robot operating system software.

2. In the Assets section of a release, click the small triangle (&rtrif;) to expand a list of compressed software files available for download.

    <figure class="screenshot" markdown>
    ![App software on GitHub](../images/ot2-app-software-releases.png)
    </figure>

3. Find the file with the name and extension that matches the operating system of your computer. Click the file to download it. The Opentrons App supports these operating systems and file types:

    - **Linux:** `.AppImage`
    - **macOS:** `.dmg`
    - **Windows:** `.exe`

3. Browse to the download location of the downloaded software and double-click the file to install the App.

<!-- Avoid detailed explanations of how to manage multiple versions, particularly on Windows. -->
<!-- Document a best practice only. Let others get creative with hosting/switching versions, particularly Windows. -->
### Managing multiple App versions

Installing multiple versions of the Opentrons App may cause system conflicts, particularly on Windows.

- **macOS and Linux:** Software for these systems is encapsulated. You can typically run different versions by renaming the previously installed application.

- **Windows:** Software integrates deeply with the operating system. This means an installer will overwrite existing App versions. Running multiple versions of the same software may create conflicts with shared registry files.

To avoid problems with multiple versions of the Opentrons App:

- Uninstall the current Opentrons App before installing a downgraded version.
- Get help from your IT team or Opentrons Support if you must run multiple versions of the Opentrons App.
- Do not attempt to downgrade the robot or App software unless directed by Opentrons Support.
