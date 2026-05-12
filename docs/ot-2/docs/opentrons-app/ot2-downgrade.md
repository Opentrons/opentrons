---
title: "Opentrons OT-2: Downgrading Robot Software"
description: "Roll back OT-2 robot and app software from v9.0 or 26.06+ to earlier versions."
---

Start here for information and instructions about how to downgrade your Opentrons OT-2 robot and App software.

!!! note
    Downgrading robot software should only be done at direction of Opentrons Support for troubleshooting or software compliance purposes.

## Software versions

After v9.0 release, Opentrons forked software into separate branches for OT-2 and Flex. This change provides several advantages: it separates OT-2 versioning from Flex (restarting at v26.06), enables robot-specific software releases, and reduces downtime from shared releases that do not benefit OT-2.

Software versions are available on GitHub:

- **v26.06 (and later):** [Opentrons OT-2 releases](https://github.com/Opentrons/opentrons-ot2/releases)
- **v9.0 (and earlier):** [Opentrons releases](https://github.com/Opentrons/opentrons/releases)

## Downgrade paths

Forking OT-2 software creates two downgrade paths:

- **Latest to Legacy:** From v26.06 (or later) to v9.0 (or earlier).
- **Legacy to Legacy:** From v9.0 to an earlier version.

!!! note
    During latest-to-legacy downgrades, newer saved protocols do not migrate automatically. Manually copy files into the downgraded App version directory.

Refer to the following table for the default file storage locations if you need to copy/paste protocol files across the software fork boundary. <div id="protocol-paths"></div>

<table>
  <thead>
    <tr>
      <th>OS</th>
      <th>Legacy path (&le; v9.0)</th>
      <th>Latest path (&ge; v26.06)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>macOS</td>
      <td><code>~/Library/Application Support/Opentrons/protocols</code></td>
      <td><code>~/Library/Application Support/Opentrons OT-2/protocols</code></td>
    </tr>
    <tr>
      <td>Windows</td>
      <td><code>%AppData%\Opentrons\protocols</code></td>
      <td><code>%AppData%\Opentrons OT-2\protocols</code></td>
    </tr>
    <tr>
      <td>Ubuntu</td>
      <td><code>~/.config/Opentrons/protocols</code></td>
      <td><code>~/.config/Opentrons OT-2/protocols</code></td>
    </tr>
  </tbody>
</table>

## Robot downgrade instructions

!!! tip
    - Ensure OT-2 is idle before downgrading. Some required App features are not available while the robot is running a a protocol.
    - Rolling back to the version closest to latest release is recommended.

### Download robot software

<div class="instruction-list" markdown>

1. From GitHub, find the OT-2 software version:
    - v9.0 or earlier: [Opentrons releases](https://github.com/Opentrons/opentrons/releases)
    - v26.06 or later: [Opentrons OT-2 releases](https://github.com/Opentrons/opentrons-ot2/releases)

2. In **Assets** section of a release, click triangle (&rtrif;) to expand the software file list.

    <figure class="screenshot" markdown>
    ![OT-2 software on GitHub](../images/ot2-robot-software-releases.png)
    </figure>

3. Click compressed file named `ot2-system-<version number>.zip` to download. For example, to get OT-2 software version 8.7, click `ot2-system-8.7.0.zip`.

### Install robot software

1. In App **Devices** tab, select the robot.

2. Click three-dot menu (⋮) and select **Robot Settings**.

3. Select **Advanced** tab.

4. Find section labeled "Update robot software manually with a local file."

    <figure class="screenshot" markdown>
    ![App image showing browse button](../images/ot2-robot-software-downgrade.png)
    </figure>

5. Click **Browse file system** and navigate to saved robot software.

6. Select `.zip` file and click **Open**. Software installs automatically and reboots robot (approx. 15 minutes). After restarting, robot will be running earlier operating system version.

</div>

## App version requirements

To run protocols on a downgraded OT-2, Opentrons App version must match robot software version. While you can interact with robot using mismatched software, protocol execution requires identical App and robot software versions.

### App download and installation

To install an earlier Opentrons App version:

<div class="instruction-list" markdown>

1. From GitHub, find Opentrons App version matching downgraded OT-2:
    - v9.0 or earlier: [Opentrons releases](https://github.com/Opentrons/opentrons/releases)
    - v26.06 or later: [Opentrons OT-2 releases](https://github.com/Opentrons/opentrons-ot2/releases)

2. In **Assets** section, click triangle (&rtrif;) to expand software file list.

    <figure class="screenshot" markdown>
    ![App software on GitHub](../images/ot2-app-software-releases.png)
    </figure>

3. Find file with name and extension matching computer operating system. Click file to download. Opentrons supports these operating systems and file types:
    - **Linux:** `.AppImage`
    - **macOS:** `.dmg`
    - **Windows:** `.exe`

3. Navigate to the saved file location and double-click the file to install it.

    !!! tip "Reminder for latest-to-legacy downgrades"
        Downgrading from v26.06 means you must manually copy protocol files into the earlier version of the App. See the [file system storage table](#protocol-paths) for locations.

### Managing multiple App versions

Installing multiple Opentrons App versions may cause system conflicts, particularly on Windows.

- **macOS and Linux:** Systems use software encapsulation. You can typically run different versions by renaming the installed application.
- **Windows:** Software integrates deeply with operating system. Installers will overwrite existing App versions. Installing multiple versions may conflict with shared system and registry files.

To avoid version conflicts:

- Uninstall current Opentrons App before installing downgraded version.
- Consult IT team or Opentrons Support to run multiple software versions.
- Do not attempt to downgrade robot or App software unless directed by Opentrons Support.