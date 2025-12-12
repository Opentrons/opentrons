---
title: "Opentrons Flex: App Installation and Management"
---

Generic intro here.

## App installation

Download the Opentrons App at <https://opentrons.com/ot-app/>. The latest version of the app requires Windows 10, macOS 10.16, or Ubuntu 20.04 or later. The app may run on other Linux distributions, but Opentrons does not officially support them.

### Windows

The Windows version of the Opentrons App is packaged as an installer. To use it:

- Open the .exe file you downloaded from opentrons.com.

- Follow the instructions in the installer. You can install the app for a single user or all users of the computer.

The app opens automatically once installed. Grant the app security or firewall permissions, if prompted, to make sure it can launch and communicate with Flex over your network.

### macOS

The macOS version of the Opentrons App is packaged as a disk image. To use it:

1.  Open the .dmg file you downloaded from opentrons.com. A window for the disk image will open in Finder.

2.  Drag the Opentrons icon onto the Applications icon in the window.

3.  Double-click on the Applications icon.

4.  Double-click on the Opentrons icon in the Applications folder.

Grant the app security or firewall permissions, if prompted, to make sure it can launch and communicate with Flex over your network.

### Ubuntu

The Ubuntu version of the Opentrons App is packaged as an AppImage. To use it:

1.  Move the .AppImage file you downloaded from opentrons.com to your Desktop or Applications folder.

2.  Right-click the .AppImage file and choose **Properties**.

3.  Click the **Permissions** tab. Then check **Allow executing file as a program**. Close the Properties window.

4.  Double-click the .AppImage file.

!!! note
    Do not use third-party AppImage launchers with the Opentrons App. They may interfere with app updates. Opentrons does not support using third-party launchers to control Opentrons robots.

## Downgrading Flex software

Reinstalling an earlier version of the robot software on your Flex should be a rare event. You should only do this when directed to by Opentrons Support. You can [download previously released Opentrons software](https://github.com/Opentrons/opentrons/releases) from Github.
<!-- not sure where to put the Github link -->

!!!tip
    Make sure your Flex is idle before starting the software downgrade process. Some required App features are not available while the robot is running a protocol.

### Part 1: Downloading the earlier software version

1. On the Github releases page, find the earlier version of the robot software you want to use. We recommend only rolling back to a version that's as closest to the latest release as possible.

2. In the Assets section of a release, click the small triangle (&rtrif;) to expand a list of compressed software files available for download.

    ![Image showing expanded section with software versions](../images/app-software-releases.png)

3. Click the compressed file named `ot3-system-<version number>.zip` to download and save it to your computer. For example, to get robot software version 8.6, you'd click the file `ot3-system-8.6.0.zip`. In this file naming convention, `ot3` refers to Flex.

### Part 2: Installing the earlier version

4. In the App, find the robot you want to work with from the Devices tab.

5. 3 dot menu > robot settings > ???

6. Click **Browse file system** and find the downloaded robot software file.

7. Click the file and then click **Open**. This starts the software upload process. It could take 15–20 minutes to install the previous software version.

### After downgrading

The App will notify you after the installation successfully completes. You should also check the touchscreen on the Flex before using it. The touchscreen might show your Flex going through additional firmware checks and updates that the App does not. The Flex will restart after it completes its firmware checks and any other update processes. After restarting, your Flex will have returned to running on an earlier version of the robot operating system.

## Downgrading App software

check image and anchor links. there are warnings. Need to repoint.

