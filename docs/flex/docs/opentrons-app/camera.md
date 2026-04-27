---
title: "Opentrons Flex: Using the Camera"
---

Every Flex comes equipped with a built-in 2-megapixel camera that can capture full HD still images and provides video of the deck and working area. Starting in robot software version 8.8, you can control the camera in the Opentrons App and from the touchscreen. When enabled, the camera provides:

- Live, in-app viewing during protocol runs.
- Automatic image capture at protocol-defined intervals.
- Automatic image capture in response to a crash or runtime error.
- The ability to download all still images in a single, compressed file (`.zip` format) after a protocol run.

## Turning the camera on and off

The camera is turned off by default. To turn on the camera and access its features:

<div class="instruction-list" markdown>

1. From the Opentrons App, click **Devices** and locate your robot.
2. For your selected robot, click the three-dot menu (⋮) and then click **Robot settings**.
3. Click the **Camera** tab to open the camera settings.
4. Click the **Camera Status** slider to enable or disable the camera. Turning the camera on exposes additional settings and image controls.

</div>

You can also turn the camera on and off from the Peripherals section of the robot's details page.

<figure class="screenshot side-by-side" markdown>
![Camera off](../images/camera_disabled.png)
![Camera on](../images/camera_enabled.png)
<figcaption>Enable or disable the camera and adjust image settings</figcaption>
</figure>

Additional menu options give you access to other image and video controls.

## Usage settings and other camera controls




### Downloading images

All protocol images are available for download in the Recent Protocol Runs section of the robot details page.