---
title: "Opentrons Flex: Labware Concepts"
---

# Labware concepts 

Labware encompasses more than just the objects placed on the deck and used in a protocol. For the Opentrons Flex, labware includes:

- The physical items in your lab that you place on the deck.
- Data that Opentrons has prepared that defines the characteristics of each piece of labware. These definitions are available in our [Labware Library](https://labware.opentrons.com/).
- Data that defines custom labware. These definitions conform to the same schema as Opentrons-verified labware definitions.

## Labware as hardware 

One way to think of labware is as the durable components and consumable items that you work with, reuse, or discard while running a protocol. Single-use items like well plates, reservoirs, tubes, tip racks, and lids are labware. So are reusable items like aluminum blocks. Other items that go on or in the deck, like modules, staging areas, and the standard deck slots themselves, are not considered labware in the Flex robot software.

## Opentrons-verified labware 

Opentrons has prepared information about common labware for our Labware Library. This information is stored in Javascript object notation (JSON) files with .json file extensions. A JSON file includes spatial dimensions (length, width, height), volumetric capacity (µL, mL), and other metrics that define the labware's surface features, their shapes, and locations. Newer labware definitions also include information about the internal shapes of wells within labware. When running a protocol, the Flex reads these .json files to know what labware is on the deck and how to work with it. 

## Custom labware

Custom labware is labware that is not included in the Labware Library or was created with our [Custom Labware Creator](https://labware.opentrons.com/create/). However, sometimes the idea of custom labware comes burdened by notions of complexity, expense, or difficulty. But, custom labware shouldn't be hard to understand or create.

Let's take a moment to unpack the concept of custom labware. 

As an example, the Opentrons Labware Library includes 96-well plates (200 µL) from Corning and Bio-Rad, but other manufacturers make these well plates too. And, thanks to commonly accepted industry standards, the differences among these ubiquitous lab items are minor. However, an ordinary 200 μL, 96-well plate from Stellar Scientific, Oxford Lab, or Krackeler Scientific (or any other supplier for that matter) is "custom labware" for the Flex because it isn't pre-defined in our Labware Library. Additionally, minor differences in labware dimensions can have a drastic impact on the success of your protocol run. For this reason, it's important to have an accurate labware definition for each labware you want to use in your protocol. 

Also, while custom labware could be an esoteric, one-off piece of kit, most of the time it's just the tips, plates, tubes, and racks used every day in labs all over the world. Again, the only difference between Opentrons labware and custom labware is that the custom labware is not predefined in the software that powers the robot. The Flex can, and does, work with other basic labware items or something unique, but you need to record that item's characteristics in a labware definition JSON file and import that data into the Opentrons App. See the [Labware Definitions section][labware-definitions] below for more information. 

To sum up, labware includes:

- Everything in the Opentrons Labware Library. 
- Custom labware, which are items that aren't included in the Labware Library. 
- Labware definitions: data in a JSON file that defines shapes, sizes, and capabilities of individual items like well plates, tips, reservoirs, etc. 
