---
title: "Opentrons Flex: Settings"
---

The Settings screen provides additional controls you can use to customize the behavior of your Flex.

<figure class="screenshot" markdown>
![Sample of touchscreen settings](../images/touchscreen-settings-fade.png)
<figcaption>Examples of some setting options and features.</figcaption>
</figure>


The Settings screen will shows all available features in a single list. Tap a setting to toggle it on or off, or to open a another screen that displays related adjustment controls.

## Setup

All of these settings are covered when you [first set up your Flex](../installation/first-run.md). However, you can change them at any time.

### Network Settings

View the status of or set up a Wi-Fi, Ethernet, or USB connection. Multiple connections can be active simultaneously.

### Robot Name

Change the name of your Flex. The robot name appears on the touchscreen dashboard and in the Opentrons App.

### Robot System Version

See the current version of the robot software or check for updates. If Flex has already automatically checked for updates and found one, this item will have an "Update available" badge in the settings list.

### Language

Set the language used by the touchscreen to Chinese or English. You can also change the language at any time.

## Display

These settings let you control how the robot displays information about its working status and operation.

### Status Light

The [status light][status-light-flex] is a strip of LEDs along the top front of the Flex. It provides at-a-glance information about the robot. Different colors and patterns of illumination can communicate various success, failure, or idle states.

### Touchscreen Sleep

Set how long the touchscreen should remain on when idle. When the screen is asleep, tap it once to wake it. Sleep options are:

- Never (default)
- 3 minutes
- 5 minutes
- 10 minutes
- 15 minutes
- 30 minutes
- 1 hour

### Touchscreen Brightness

Set the screen's brightness to one of six levels by tapping **−** or **+**.

<font color="red">IMAGE PLACEHOLDER SIDE BY SIDE</font>

<!-- figma https://www.figma.com/design/AoTLAYuWawlaWItB1umOjr/Release--Opentrons-Flex-Touchscreen?node-id=1-212&p=f&t=O227PPOuuPfdQdcX-0 -->

## Privacy

Choose what data you want Flex to share with Opentrons. This information is always anonymized and we only use it to improve our products.

Flex records what it's doing in several log files that are stored on the robot. These logs are grouped into two categories for privacy opt-in purposes:

- **Robot Logs:** Data about robot server activities, executed API commands, and interactions with attached modules.

- **Display Usage:** Data about how the touchscreen draws its graphics.

If you opt out of automatic data sharing, you can still download Flex log files for your own use or to send them to Opentrons Support for troubleshooting. See [Downloading Flex Log Files](../advanced-operation/log-files.md#downloading-flex-log-files) for instructions.

!!! note
    There are separate privacy controls in the Opentrons App. Turning sharing on or off from the touchscreen only affects data collected and sent by the robot. Your laptop or desktop computer will still automatically share data if this feature is enabled in the Opentrons App.

## Camera

Every Flex comes equipped with a [built-in camera][camera-features-and-controls], which is off by default. Camera options include on/off settings for still photograph, video, and on-error image capture.

## Advanced

You shouldn't need these settings for everyday operation, but they may be useful for troubleshooting or testing pre-release features.

- **Apply Labware Offsets:** Choose whether to use saved offset data from Labware Position Check in subsequent protocol runs. This setting is on by default. Opentrons recommends running Labware Position Check before every run, and applying previous labware offsets at the beginning of Labware Position Check can make the process quicker.

- **Device Reset:** Batch delete certain types of information from the robot, such as calibrations, run history, or protocols.

- **Home Gantry on Restart:** By default, the gantry moves to its home position any time you turn on Flex. Only disable this behavior if you have a reason that the gantry must remain stationary after powering on.

- **Update Channel:** Choose whether to receive stable or beta software updates.

- **Developer Tools:** Enable additional tools and features designed for developers. Not recommended unless instructed by Opentrons Support.
