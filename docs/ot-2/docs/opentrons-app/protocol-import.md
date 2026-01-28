---
title: "Opentrons OT-2: Importing Protocols"
---

The Opentrons App opens the Protocols screen on launch. If you have a new robot and are opening the app for the first time, or you've deleted your saved protocols, the app shows you the protocol upload screen. If you've already uploaded a protocol, the app shows you a summary list.

<figure class="side-by-side" markdown>
![Protocol tab screen with no protocols](../images/app-no-protocol.png)
![Protocol tab screen with a protocol](../images/app-imported-protocol.png)
<figcaption>The Protocols screen with and without uploaded protocols.</figcaption>
</figure>

!!! tip
    Use the [Opentrons Protocol Designer](https://designer.opentrons.com/) to create a protocol. See the [Protocol Designer Instruction Manual](https://docs.opentrons.com/protocol-designer/)) for more in formation on how to use Protocol Designer.

## Uploading a new protocol

If there are no protocols saved in the app, you can upload one by either:

- Clicking **Upload** and browsing through your computer files to find the protocol you want to upload.
- Dragging and dropping a protocol onto the upload screen.

## Uploading additional protocols

If you've uploaded protocols already, and you need to add another, click **Import** in the top right corner of the screen. This opens a file picker that lets you browse to the protocol file and import it into the app.

## Protocol analysis

The Opentrons App will analyze your protocol as soon as you import it. _Protocol analysis_ is the process of taking the JSON object or Python code contained in the protocol file and turning it into a series of commands that the robot can execute in order. If there are any errors in your protocol file, or if you're missing custom labware definitions, the app shows a warning. Correct the errors and re-import the protocol. If protocol analysis imports the file without errors, it is ready to run on your OT-2.

## Additional features

See the [Features Summary section](features.md) for more information about other protocol controls and settings in the Opentrons App.