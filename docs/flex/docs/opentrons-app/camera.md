---
title: "Opentrons Flex: Using the Camera"
---

Every Flex comes equipped with a built-in 2-megapixel camera that can capture full HD still images and provides video of the deck and working area. Starting in robot software version 8.8, you can control the camera in the Opentrons App and from the touchscreen. When enabled, the camera provides:

- Live, in-app viewing during protocol runs.
- Automatic image capture at protocol-defined intervals.
- Automatic image capture in response to a crash or runtime error.
- The ability to download all still images in a single, compressed file (`.zip` format) after a protocol run.

## Turning the camera on and off

The camera is off by default. To turn the camera on and access its features:

<div class="instruction-list" markdown>

1. From the Opentrons App, click **Devices** and locate your robot.
2. For your selected robot, click the three-dot menu (⋮) and then click **Robot settings**.
3. Click the **Camera** tab to open the camera settings.
4. Click the **Camera Status** slider to enable or disable the camera. Turning the camera on exposes other camera features and image controls.

</div>

You can also turn the camera on and off from the Peripherals section of the robot's details page.

<figure class="screenshot side-by-side" markdown>
![Camera off](../images/camera_disabled.png)
![Camera on](../images/camera_enabled.png)
<figcaption>Enable or disable the camera and adjust image settings</figcaption>
</figure>

## Other camera settings

These settings and controls are located under the **Camera** tab on the Robot Settings screen for your Flex.

### Usage Settings

These settings and image capture options let you:

- Stream real-time video from the deck while running a protocol.
- Automatically capture a deck image when an error occurs.

<figure class="screenshot" markdown>
![Other camera settings for video, image capture, and color/contrast adjustments](../images/camera_settings.png){ width="80%" }
<figcaption>Available when the camera is enabled.</figcaption>
</figure>

### Camera Controls

These controls let you zoom in on the deck and provide image correction features that adjust brightness, contrast, and color saturation. Click **Edit settings** from the Camera Controls section to access these features.

<figure class="screenshot" markdown>
![Image brightness, saturation, contrast, and zoom settings](../images/camera_controls.png){ width="80%" }
</figure>

## Watching real-time video

Live video streaming is available in the Opentrons App when the camera is enabled and when the robot is running a protocol. To watch video from the camera, start your protocol run and click the **Live camera** button in the app. This opens a small window that streams live video as the robot works through the steps in the protocol. The video stream turns itself off when the protocol ends.

<figure class="screenshot" markdown>
![Enable live camera video feed](../images/camera_live_stream.png){ width="80%" }
</figure>

Flex is unable to save live video streamed during a protocol run. It can, however, save still images if you [add a camera step](../../protocol-designer/steps/camera.md) to your protocol.

## Downloading images

All protocol images are available for download in the Recent Protocol Runs section of the robot details page.