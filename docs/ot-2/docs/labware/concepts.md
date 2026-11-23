---
title: "Opentrons OT-2: Labware Concepts"
description: "Physical labware, Opentrons-verified definitions, and custom labware concepts."
---

Labware encompasses more than just the objects placed on the deck and used in a protocol. For the OT-2, labware includes:

- The physical items in your lab that you place on the deck.

- Data that Opentrons has prepared that defines the characteristics of each piece of labware. These definitions are available in our [Labware Library](https://labware.opentrons.com/).

- Data that defines custom labware. These definitions conform to the same schema as Opentrons-verified labware definitions.

## Labware as hardware

Think of labware as the durable components and consumable items that you work with, reuse, or discard while running a protocol. Single-use items like well plates, reservoirs, tubes, tip racks, and lids are labware. So are reusable items like aluminum blocks. Other items that go on the deck, like modules, are not considered labware in the robot's software.

## Opentrons-verified labware

Opentrons has prepared information about common labware for our Labware Library. This information is stored in Javascript object notation (JSON) files with `.json` file extensions. A JSON file includes spatial dimensions (length, width, height), volumetric capacity (µL, mL), and other metrics that define the labware's surface features, their shapes, and locations. When running a protocol, the OT-2 reads the data in these files to know what labware is on the deck and how to work with it.

## Custom labware

Custom labware is labware that is not included in the Labware Library or was created with our [Custom Labware Creator](https://labware.opentrons.com/#/create). However, sometimes the idea of custom labware can seem complex, difficult, and expensive. But, custom labware shouldn't be hard to understand or create.

Let's take a moment to unpack the concept of custom labware.

As an example, the Opentrons Labware Library includes 96-well plates from various well-known manufacturers. And, thanks to commonly accepted industry standards, the differences among these ubiquitous lab items are minor. However, an ordinary 200 µL, 96-well plate from manufacturers that aren't in the Labware Library is "custom labware" for the OT-2 because we don't have JSON files that define these items. Additionally, minor differences in labware dimensions can have a drastic impact on the success of your protocol run. For this reason, it's important to have an accurate labware definition for each labware you want to use in your protocol.

Also, while custom labware could be a specialized, single-use item, most of the time it's just the tips, plates, tubes, and racks used every day in labs all over the world. Again, the only difference between Opentrons labware and custom labware is that the custom labware is not predefined in the software that powers the robot. The OT-2 can, and does, work with other basic labware items or something unique, but you need to record that item's characteristics in a labware definition JSON file and import that data into the Opentrons OT-2 App. See the [Labware Definitions section](./definitions.md) for more information.

To sum up, labware includes:

- Everything in the Opentrons Labware Library.

- Custom labware, which are items that aren't included in the Labware Library.

- Labware definitions, which are the data in a JSON file that defines shapes, sizes, and capabilities of individual items like well plates, tips, reservoirs, etc.