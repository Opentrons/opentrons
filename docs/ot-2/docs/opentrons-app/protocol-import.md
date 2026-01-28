---
title: "Opentrons OT-2: Importing Protocols"
---

Every protocol will begin as a file on your computer, regardless of what method of protocol development you use. You need to import the protocol into the Opentrons App and then transfer it to your OT-2.

## The Protocols screen

The Opentrons App opens the Protocols screen on launch. If you have a new robot and are opening the app for the first time, or you've deleted your saved protocols, the app shows you the protocol upload screen. If you've already uploaded a protocol, the app shows you a summary list.

<figure class="side-by-side" markdown>
![Protocol tab screen with no protocols](../images/app-no-protocol.png)
![Protocol tab screen with a protocol](../images/app-imported-protocol.png)
<figcaption>The Protocols screen (empty vs populated).</figcaption>
</figure>

!!! tip
    Use the [Opentrons Protocol Designer](https://designer.opentrons.com/) to create a protocol. See the [Protocol Designer Instruction Manual](https://docs.opentrons.com/protocol-designer/) to get started or for more information.

## Uploading a new protocol

If there are no protocols saved in the app, you can either:

- Click **Upload** and browse through your computer files to find the protocol you want to upload.
- Drag and drop a protocol onto the upload screen.

## Uploading additional protocols

If you've uploaded protocols already, and you need to add another, click **Import** in the top right corner of the screen. This opens a file picker that lets you browse to the protocol file and import it into the app.

## Protocol analysis

The Opentrons App will analyze your protocol as soon as you import it. _Protocol analysis_ is the process of taking the JSON object or Python code contained in the protocol file and turning it into a series of commands that the robot can execute in order. If there are any errors in your protocol file, the app shows a warning. Correct the errors and re-import the protocol. If the analysis completes without errors, the protocol is ready to run on your OT-2.

## Additional features

See the [Features Summary section](features.md) for more information about other protocol controls and settings in the Opentrons App.