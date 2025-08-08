---
title: "Opentrons Flex: Protocol Library"
---

# Protocol Library

The Opentrons Protocol Library hosts protocols authored either by Opentrons itself or by members of the Opentrons community. To find a protocol that fits your target application, use the search field at the top of the [Protocol Library homepage](https://library.opentrons.com).

You can also browse protocols by categories, like DNA/RNA, cell biology, cell and tissue culture, proteins, commercial assay kits, or molecular biology. There's even a category for protocols that create art by pipetting! Take some time to check out the protocols in our library. Understanding what's available—and making some cool pixel art—is a great way to learn about the features and capabilities of your robot before moving on to using real samples and reagents.

## Searching for protocols

The Protocol Library search returns results as you type. You can select a result from the search list or click **View All Results** to go to the full results page, which shows more details about each protocol and lets you filter them based on several criteria.

Each protocol card will show:

| **Category** | **Description** |
|--------------|-----------------|
| **Protocol name** | The name of the protocol. |
| **Verification** | Badges indicate if the protocol is verified by Opentrons, a third-party manufacturer, or members of the community. |
| **Time estimate** | Approximately how long the protocol takes to run. |
| **Description** | A short summary of what the protocol does. |
| **Robot model** | Which Opentrons robots the protocol is compatible with. |
| **Protocol editability** | JSON protocols are editable in Protocol Designer, with no coding required. Python protocols are editable in any text editor, using the Python Protocol API. |
| **Modules** | Any hardware modules that are required. |

In addition to these categories, in the sidebar you can filter results by:

- **Pipettes:** Which pipettes the protocol uses (you can usually change a protocol's pipettes, but it may affect the run time and the number of tips consumed).

- **Categories:** Target applications, like DNA/RNA, cell biology, proteins, etc.

- **Protocol version:** Show or hide older versions of protocols.

## Protocol details

Click on a protocol to go to its detail page, which provides even more information. In addition to what is shown in search, here you can see:

- **Supporting data:** Additional data, explanations, or links to outside sources provided by the protocol author.

- **What you'll need:** A complete list of all equipment needed for the protocol, including the robot, modules, labware, pipettes, and third-party kits.

- **Protocol steps:** A list of steps written by the protocol author, as well as a visual deck map and list of liquids specified in the protocol file.

The details page also provides basic instructions for downloading and running the protocol. For more information on importing a protocol to the Opentrons App and setting up a run, see the [Transferring Protocols to Flex section][transferring-protocols-to-flex] in the Software and Operation chapter.
