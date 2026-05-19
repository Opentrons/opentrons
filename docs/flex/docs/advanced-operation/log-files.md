---
title: "Opentrons Flex: Log Files"
description: "Where to find and how to use Flex run logs and system logs."
---

All Flex robots keep records of their movements and system processes. During normal operation, there's no need to download or examine these files. However, if a failure or malfunction occurs, Opentrons Support may request these files, as they provide detailed information that helps identify and resolve problems with the robot. This article summarizes each log file and explains how to download them using the Opentrons App.


## Understanding Flex log files

In an idle state or during a protocol run, your Flex constantly writes data to several different *log files*. Each of these files tracks the activities specific to different parts of the robot and its attachments. The following table summarizes the data captured in each file.


| Log type | Description |
|---|---|
| API | The `api.log` records all movement and system activities performed by the robot. |
| CAN Bus | The `can_bus.log` records communications among the robot's motor controller boards. |
| Serial | The `serial.log` records communication between a Flex and its attached instruments and modules. |
| Server | The `server.log` records the HTTP requests (e.g., `GET`, `POST`, `DELETE`) sent and received by the robot server. |
| Touchscreen | The `touchscreen.log` records the status of the front display panel. |
| Update Server | The `update_server.log` records activity related to robot software system updates. |

The records in these log files can be difficult to interpret and understand but they're valuable for troubleshooting purposes. If you ever need to download the log files, the following instructions will step you through that process.

## Downloading Flex log files

Follow these instructions to download the Flex log files:

<div class="instruction-list" markdown>

1. From the Opentrons App, click **Devices** and locate the robot that you want the logs from.

2. For your selected robot, click the three-dot menu ( ⋮ ) and then click **Robot settings**.

3. Click the **Advanced** tab to open the advanced settings page.

4. Click **Download logs**. You’ll be prompted to choose a save location when the log files are ready to download.

    !!!note
        Flex produces a single `.zip` file that contains the logs. The file name includes the robot’s name followed by `_logs.zip`. For example, if your robot is called “Flex1," the log file will be named `Flex1_logs.zip`.

5. _(Optional)_ To read the logs, double-click the downloaded file to decompress it. The individual logs will expand into a new folder in the same location as the downloaded file. Any text editor should be able to open these files.

</div>