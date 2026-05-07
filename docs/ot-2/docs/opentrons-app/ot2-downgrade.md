---
title: "Opentrons OT-2: Software Downgrade"
description: "Roll back OT-2 robot and app software to an earlier version for troubleshooting or compliance."
---

These instructions explain how to downgrade OT-2 robots running software version 9.0 or earlier. If your robot is running version 26.06 or later, see <font color="red">PLACEHOLDER TO TBD</font> to roll back to version 9.0 or earlier.

For Flex, see [Downgrading Flex Software](../../flex/opentrons-app/flex-downgrade.md).

!!! note
    Downgrading your robot's software version should only be done at the direction of Opentrons Support for troubleshooting or software compliance purposes.

## Operating system versions

After robot software v9.0, Opentrons forked its software into separate repositories for the OT-2 and Flex robots. This split helps us provide targeted updates and reduces downtime from shared releases that don't benefit the OT-2. Software for this downgrade procedure is available on GitHub at <https://github.com/Opentrons/opentrons/releases>.

Forking the robot software also significantly changes the OT-2 operating system version. After v9.0, OT-2 versioning restarts with v26.06. This newer OT-2 software is available on GitHub at <https://github.com/Opentrons/opentrons-ot2/releases>.

## Robot downgrade instructions

!!! tip
    Make sure your OT-2 is idle before downgrading. Some required App features are not available while the robot is running a protocol.

### Download robot software

<div class="instruction-list" markdown>

1. On the Github releases page, find an earlier version of the OT-2 software you want to use. We recommend rolling back to the version closest to the latest release.

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

6. Select the `.zip` file containing the robot software and click **Open**. The robot automatically installs the software and reboots, which takes about 15 minutes. After restarting, the robot will be running the earlier operating system version.

</div>

## App version requirements

To run protocols on a downgraded OT-2, your version of the Opentrons App must match the robot software version. While you can interact with the robot using mismatched software, you cannot run protocols until the robot software and app software versions are identical.

### App download and installation

To install an earlier version of the Opentrons App:

<div class="instruction-list" markdown>

1. On the [Github releases page](https://github.com/Opentrons/opentrons/releases), find the Opentrons App version matching your downgraded OT-2. This software will be in the same location as the robot operating system software.

    <figure class="screenshot" markdown>
    ![App software on GitHub](../images/ot2-app-software-releases.png)
    </figure>

2. In the Assets section of a release, click the small triangle (&rtrif;) to expand a list of compressed software files available for download.

3. Find the file with a name and extension that matches the operating system of your computer and click to download. Opentrons supports these operating systems and file types:

    - **Linux:** `.AppImage`
    - **MacOS:** `.dmg`
    - **Windows:** `.exe`

3. Browse to the download location of the downloaded software and double-click the file to install the App.

<!-- Let's avoid explaining how to manage multiple versions, particularly on Windows -->
### Managing multiple App versions

Installing multiple versions of the Opentrons App may cause system conflicts, particularly on Windows.

- **macOS and Linux:** Software for these systems is encapsulated. You can typically run different versions by renaming the previously installed application.

- **Windows:** Software integrates deeply with the operating system. This means an installer will overwrite existing App versions or create conflicts with shared registry files.

To avoid problems with multiple versions of the Opentrons App:

- Uninstall the current App before installing a downgraded version.
- Get help from your IT team or Opentrons Support if you must run multiple versions of Opentrons software.
- Don't perform _any_ robot or App software downgrades unless directed by Opentrons Support.


