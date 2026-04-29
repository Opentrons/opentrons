---
title: "Opentrons Flex: Using the Camera"
description: "Live monitoring, automatic image capture, and downloading protocol images."
---

Every Flex comes equipped with a built-in 2-megapixel camera that can capture full HD still images and provide a live video feed of the deck during a protocol run. Beginning with robot software version 8.8, you can control the camera via the Opentrons App or the touchscreen. When enabled, the camera provides:

- Live, in-app viewing during protocol runs.
- Automatic image capture at protocol-defined intervals.
- Automatic image capture in response to a crash or runtime error.
- Consolidated image downloads in a single, compressed (`.zip`) file after a protocol run.

## Turning the camera on and off

The camera is off by default. To turn the camera on and access its features:

<div class="instruction-list" markdown>

1. From the Opentrons App, click **Devices** and locate your robot.
2. For your selected robot, click the three-dot menu (⋮) and then click **Robot Settings**.
3. Click the **Camera** tab to open the camera settings.
4. Click the **Camera Status** slider to enable or disable the camera. Turning the camera on exposes other camera features and image controls.

</div>

You can also turn the camera on and off from the **Peripherals** section of the robot's details page.

<figure class="screenshot side-by-side" markdown>
![Camera off](../images/camera_disabled.png)
![Camera on](../images/camera_enabled.png)
<figcaption>Enable or disable the camera and adjust image settings.</figcaption>
</figure>

## Other camera settings

These settings and controls are located under the **Camera** tab on the **Robot Settings** screen.

### Usage Settings

These settings and image capture options allow you to:

- Stream real-time video from the deck while running a protocol.
- Automatically capture a deck image when an error occurs.

<figure class="screenshot" markdown>
![Other camera settings for video, image capture, and color/contrast adjustments](../images/camera_settings.png){ width="80%" }
<figcaption>Available when the camera is enabled.</figcaption>
</figure>

### Camera Controls

These controls allow you to zoom in on the deck and provide image correction features to adjust brightness, contrast, and color saturation. Click **Edit settings** from the **Camera Controls** section to access these features.

<figure class="screenshot" markdown>
![Image brightness, saturation, contrast, and zoom settings](../images/camera_controls.png){ width="80%" }
</figure>

## Viewing the live camera feed

Live video streaming is available in the Opentrons App when the camera is enabled and the robot is running a protocol. To watch the feed, run your protocol and click the **Live camera** button. This opens a small window that streams live video as the robot works through the protocol steps. The video stream stops automatically when the protocol ends.

<figure class="screenshot" markdown>
![Enable live camera video feed](../images/camera_live_stream.png){ width="80%" }
</figure>

!!! note
    Flex cannot save live video streamed during a protocol run.

## Saving images

To capture still images during a run, [add a camera step](../../protocol-designer/steps/camera.md) in Protocol Designer or use the [`capture_image()` method](../../python-api/building-block-commands/utilities.md#capturing-images) in the Python API. All protocol images are available for download in the **Recent Protocol Runs** section of the robot details page.