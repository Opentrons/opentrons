---
title: "Opentrons OT-2: Protocols Tab"
---

This section provides an overview of the Protocols tab in the [Opentrons App](https://opentrons.com/ot-app). The Protocols tab is selected by default when you first launch the app.

## Protocol tab summary

The Protocols tab includes controls that let you import protocol files and manage saved files.

<figure class="screenshot" markdown>
![Protocols tab showing uploaded protocols](../images/app-protocol-list.png){ width="80%" }
</figure>

You can click on any listed protocol summary to expand it. An expanded tile shows you more information about the protocol.

<figure class="screenshot" markdown>
![Protocol details tile](../images/app-protocol-details.png){ width="80%" }
</figure>

Click the **Protocols** tab to return to the default summary list view.

## Importing protocols

If you have a new robot and are launching the Opentrons App for the first time, or you've deleted your saved protocols, the app shows you the protocol upload screen.

<figure class="screenshot" markdown>
![Protocol upload features in the app](../images/app-protocol-upload.png){ width="80%" }
</figure>

 To upload a protocol, you can either:

- Click **Choose file** and browse through your computer files to find the protocols you want to upload.
- Drag and drop a protocol onto this screen to upload it.

!!! tip
    If your list already contains protocols, and you need to add another, click **Import** in the top right corner of the screen. This opens a file picker that lets you navigate to a new protocol file and bring it into the app.

## Analyzing protocols

The Opentrons App will analyze your protocol as soon as you import it. _Protocol analysis_ is the process of taking the JSON object or Python code contained in the protocol file and turning it into a series of commands that the robot can execute in order. If there are any errors in your protocol file, or if you're missing custom labware definitions, the app shows a warning. Correct the errors and re-import the protocol. If protocol analysis imports the file without errors, it is ready to run on your OT-2.

## Other features and settings

The basic protocol screen displays a summary list of all the protocols stored on your computer. Other screen elements and actions let you sort protocols, assign a protocol to a robot, and expand the protocol summary to see more information about each protocol.

<table>
  <thead>
    <tr>
      <th>Feature</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Sort by</td>
      <td>Opens a drop-down menu that offers protocol sorting options which include:
        <ul>
            <li><strong>Alphabetical</strong></li>
            <li><strong>Reverse alphabetical</strong></li>
            <li><strong>Most recent updates</strong></li>
            <li><strong>Oldest updates</strong></li>
            <li><strong>Flex protocols first</strong></li>
            <li><strong>OT-2 protocols first</strong></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td><strong>Import</strong> button</td>
      <td>Opens a file picker that lets you browse to and upload other saved protocols.</td>
    </tr>
    <tr>
        <td>Three-dot (⋮) menu</td>
        <td>Opens a pop-up menu that includes these options:
            <ul>
                <li><strong>Start setup</strong>: choose a networked Opentrons robot to run a protocol.</li>
                <li><strong>Reanalyze</strong>: runs protocol analysis on a saved or revised protocol.</li>
                <li><strong>Show in folder</strong>: opens the file location for stored protocols.</li>
                <li><strong>Delete</strong>: deletes a protocol. Tip: Use the "Show in folder" option to delete protocols in bulk.</li>
            </ul>
        </td>
    </tr>
    <tr>
        <td>Create or download a new protocol</td>
        <td>Links to the <a href="https://library.opentrons.com/">Protocol Library</a>, <a href="https://designer.opentrons.com/">Protocol Designer</a>, and the <a href="https://docs.opentrons.com/python-api/">Python API</a>.</td>
    </tr>
  </tbody>
</table>
