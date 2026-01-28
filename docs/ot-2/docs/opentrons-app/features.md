---
title: "Opentrons OT-2: Opentrons App Feature Summary"
---

You will operate and interact with the OT-2 from a computer running the Opentrons App. This section provides an high-level overview of the features provided by the Protocols, Labware, and Devices sections of the app.

## Devices tab summary

The Devices tab lists all the Opentrons OT-2 and Flex robots on a network. The list displays robots alphabetically by name. Each device summary also shows you how a robot is connected to a network (eithernet, USB, or WiFi), what hardware components are attached, if a software update is available, and other information. You can use this section for an at-a-glance overview of the state of your OT-2 and other networked robots.

<figure class="screenshot" markdown>
![Devices tab showing list of robots](../images/app-devices-tab.png)
</figure>

!!! tip
    If you're using a WiFi connection and the OT-2 you want to use is unavailable, check your WiFi settings. Your OT-2 may be on a different wireless network.

### Robot details

You can click on any robot summary tile to expand it for more information about a particular robot. In each section, three-dot (⋮) menus provide context-specific controls for the robot, any attached instruments and modules.

<figure class="screenshot" markdown>
![Device 3-dot menus for robot hardware controls](../images/app-device-details-hardware.png)
</figure>

### Recent protocol runs

The robot details page also keeps records of up to 20 recent protocol runs.

<figure class="screenshot" markdown>
![Recent protocol runs section](../images/recent-protocol-runs.png)
</figure>

Each entry in the recent protocol runs list includes the protocol name, its timestamp, whether the run was canceled or completed, and the duration of the run. Click the disclosure triangle next to any run to show its associated labware offset data. Click the three-dot menu (⋮) for related actions:

- **View protocol run record**: Show the protocol run screen as it appeared when the protocol ended (succeeded, failed, or was canceled), including all performed steps.

- **Rerun protocol now**: The same as choosing Start setup on the corresponding protocol.

- **Download run log**: Save to your computer a JSON file containing information about the protocol run, including all performed steps.

- **Delete protocol run record**: Delete all information about this protocol run from Flex, including labware offset data. When you choose this option, it's as though the protocol run never happened.

!!! note
    If you need to maintain a comprehensive record of all runs performed on your Flex, you must use the **Download run log** feature to save this information to your computer.

- **Download image files**: Save to your computer a `.zip` file containing all the still images taken during a protocol run, if the camera was enabled.## Recent protocol runs

The robot details page lists up to 20 recent protocol runs. This provides additional information compared to the touchscreen, which only shows the most recent run for each unique protocol.

Each entry in the recent protocol runs list includes the protocol name, its timestamp, whether the run was canceled or completed, and the duration of the run. Click the disclosure triangle next to any run to show its associated labware offset data. Click the three-dot menu (⋮) for related actions:

- **View protocol run record**: Show the protocol run screen as it appeared when the protocol ended (succeeded, failed, or was canceled), including all performed steps.

- **Rerun protocol now**: The same as choosing Start setup on the corresponding protocol.

- **Download run log**: Save to your computer a JSON file containing information about the protocol run, including all performed steps.

- **Delete protocol run record**: Delete all information about this protocol run from Flex, including labware offset data. When you choose this option, it's as though the protocol run never happened.

!!! tip
    If you need to maintain a comprehensive record of all runs performed on your OT-2, you must use the **Download run log** feature to save this information to your computer.

- **Download image files**: Save to your computer a `.zip` file containing all the still images taken during a protocol run, if the camera was enabled.

## Labware tab

## Protocols tab

This section provides an overview of the Protocols tab. The Protocols tab is selected by default when you first launch the app. It includes controls that let you import protocol files and manage saved files.

### Protocol features and settings

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



<figure class="screenshot" markdown>
![Protocols tab showing uploaded protocols](../images/app-protocol-list.png){ width="80%" }
</figure>

You can click on any listed protocol summary to expand it. An expanded tile shows you more information about the protocol.

<figure class="screenshot" markdown>
![Protocol details tile](../images/app-protocol-details.png){ width="80%" }
</figure>

Click the **Protocols** tab to return to the default summary list view.
