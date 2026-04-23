---
title: "Python API: Hardware Modules"
description: "Load and control Temperature, Heater-Shaker, Thermocycler, and other modules."
---

Hardware modules are powered and unpowered deck-mounted peripherals. The Flex and OT-2 are aware of deck-mounted powered modules when they're attached via a USB connection and used in an uploaded protocol. The robots do not know about unpowered modules until you use one in a protocol and upload it to the Opentrons App.

Powered modules include the Absorbance Plate Reader Module, Heater-Shaker Module, Magnetic Module, Temperature Module, and Thermocycler Module. The 96-well Magnetic Block is an unpowered module.

Pages in this section of the documentation cover:

- [Setting up modules and their labware](setup.md)
- Working with the module contexts for each type of module:
    - [Absorbance Plate Reader Module](absorbance-plate-reader.md)
    - [Flex Stacker Module](flex-stacker.md)
    - [Heater-Shaker Module](heater-shaker.md)
    - [Magnetic Block](magnetic-block.md)
    - [Magnetic Module](magnetic-module.md)
    - [Temperature Module](temperature-module.md)
    - [Thermocycler Module](thermocycler.md)
- Using [concurrent module actions](concurrent.md) to run modules while the robot performs other protocol steps, like pipetting, gripper, and other module actions. 
- Loading [multiple modules of the same type](multiple-same-type.md) in a single protocol.

!!! note
    Throughout these pages, most code examples use coordinate deck slot locations (e.g. "D1", "D2"), like those found on Flex. If you have an OT-2 and are using API version 2.14 or earlier, replace the coordinate with its numeric OT-2 equivalent. For example, slot D1 on Flex corresponds to slot 1 on an OT-2. See [Deck Slots](../deck-slots.md) for more information.
