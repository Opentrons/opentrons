---
title: "Opentrons Flex: App Installation and Management"
---

Start here for step-by-step instructions for downloading and installing the Opentrons App on a computer. It also includes instructions for manually downgrading your robot and App software, which may be required for troubleshooting issues or maintaining regulatory compliance.

## App installation

Download the Opentrons App from <https://opentrons.com/ot-app/>. The latest version of the app requires Windows 10, macOS 10.16, or Ubuntu 20.04 or later. The app may run on other Linux distributions, but Opentrons does not officially support them.

### Windows

The Windows version of the Opentrons App is packaged as an installer. To use it:

<div class="instruction-list" markdown>

1. Open the .exe file you downloaded from opentrons.com.

2. Follow the instructions in the installer. You can install the app for a single user or all users of the computer.

</div>

The app opens automatically once installed. Grant the app security or firewall permissions, if prompted, to make sure it can launch and communicate with Flex over your network.

### macOS

The macOS version of the Opentrons App is packaged as a disk image. To use it:

<div class="instruction-list" markdown>

1.  Open the .dmg file you downloaded from opentrons.com. A window for the disk image will open in Finder.

2.  Drag the Opentrons icon onto the Applications icon in the window.

3.  Double-click on the Applications icon.

4.  Double-click on the Opentrons icon in the Applications folder.

</div>

Grant the app security or firewall permissions, if prompted, to make sure it can launch and communicate with Flex over your network.

### Ubuntu

The Ubuntu version of the Opentrons App is packaged as an AppImage. To use it:

<div class="instruction-list" markdown>

1.  Move the .AppImage file you downloaded from opentrons.com to your Desktop or Applications folder.

2.  Right-click the .AppImage file and choose **Properties**.

3.  Click the **Permissions** tab. Then check **Allow executing file as a program**. Close the Properties window.

4.  Double-click the .AppImage file.

!!! note
    Do not use third-party AppImage launchers with the Opentrons App. They may interfere with app updates. Opentrons does not support using third-party launchers to control Opentrons robots.

</div>

## Downgrading Flex software

Previous versions of the Flex operating system (and App software) are available on Github at <https://github.com/Opentrons/opentrons/releases>.

Reinstalling an earlier version of the robot software on your Flex should only be done as directed by Opentrons Support. The instructions in this section take you through the Flex downgrade process.

!!! tip
    Make sure your robot is idle before downgrading. Some required App features are not available while the robot is running a protocol.

### Part 1: Downloading an earlier software version

<div class="instruction-list" markdown>

1. On the Github releases page, find an earlier version of the robot software you want to use. We recommend only rolling back to the version closest to the latest release.

2. In the Assets section of a release, click the small triangle (&rtrif;) to expand a list of compressed software files available for download.

    <figure class="screenshot" markdown>
    ![Image showing expanded section with software versions](../images/robot-software-releases.png)
    </figure>

3. Click the compressed file named `ot3-system-<version number>.zip` to download and save it to your computer. For example, to get robot software version 8.7, you'd click the file `ot3-system-8.7.0.zip`. In the file name, `ot3` refers to Flex.

### Part 2: Installing the earlier version

4. From the **Devices** tab in the App, find the robot you want to work with.

5. Click the three-dot menu (⋮) and then click **Robot Settings**.

6. Click the **Advanced** tab.

7. In the Advanced settings, find the section labelled "Update robot software manually with a local file."

    <figure class="screenshot" markdown>
    ![Update software settings under the Advanced tab](../images/robot-software-downgrade.png)
    </figure>

8. Click **Browse file system** and navigate to the location where you saved the previously downloaded version of the robot software.

9. Select the downloaded `.zip` file that contains the operating system software and then click **Open**. This starts the automatic software installation process, which can take about 15 minutes to complete.

</div>

### Part 3: After downgrading

The App will notify you after the installation successfully completes. You should also check the touchscreen on the Flex before using it. The touchscreen might show your Flex going through additional firmware checks and updates that the App does not. The Flex will restart after it completes its firmware checks and any other update processes. After restarting, your Flex will be running on an earlier version of the robot operating system and ready for use.

## Downgrading App software

Previous versions of the App software (and Flex operating system) are available on Github at <https://github.com/Opentrons/opentrons/releases>.

You will not be able to execute protocols on a Flex with a version of the App that is newer than the robot's operating system. However, as with downgrading robot software, you may need to install an earlier version of the App for troubleshooting or software compliance purposes. The instructions in this section take you through the App software downgrade process.

<div class="instruction-list" markdown>

1. Uninstall the current version of the Opentrons App according to the process used by your computer's operating system.

2. On the Github releases page, find an earlier version of the App software you want to use. Only roll back to an App version that matches your robot's operating system.

3. In the Assets section of a release, click the small triangle (&rtrif;) to expand a list of compressed software files available for download.

    <figure class="screenshot" markdown>
    ![Software files for the App](../images/app-software-releases.png)
    </figure>

4. Click the compressed file with an extension that corresponds to the operating system of your computer.

    | Operating system | File extension | File example |
    |----|----|----|
    | Windows | `.exe` | `Opentrons-v8.7.0-win-b62711.exe` |
    | macOS | `.dmg` | `Opentrons-v8.7.0-mac-b62711.dmg` |
    | Linux | `.AppImage` | `Opentrons-v8.7.0-linux-b62711.AppImage` |

5. Follow the instructions on your computer to complete the installation.

</div>

When the App version matches the robot software version, you can resume using the App and running protocols on your robot.

As a final reminder, downgrading your Flex or App software isn't recommended unless at the direction of Opentrons Support.