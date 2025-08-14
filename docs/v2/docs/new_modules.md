# Hardware Modules

Hardware modules are powered and unpowered deck-mounted peripherals. The Flex and OT-2 are aware of deck-mounted powered modules when they're attached via a USB connection and used in an uploaded protocol. The robots do not know about unpowered modules until you use one in a protocol and upload it to the Opentrons App.

Powered modules include the Absorbance Plate Reader Module, Heater-Shaker Module, Magnetic Module, Temperature Module, and Thermocycler Module. The 96-well Magnetic Block is an unpowered module.

Pages in this section of the documentation cover:

- [Setting up modules and their labware](modules/setup.md)
- Working with the module contexts for each type of module:
    - [Absorbance Plate Reader Module](modules/absorbance_plate_reader.md)
    - [Heater-Shaker Module](modules/heater_shaker.md)
    - [Magnetic Block](modules/magnetic_block.md)
    - [Magnetic Module](modules/magnetic_module.md)
    - [Temperature Module](modules/temperature_module.md)
    - [Thermocycler Module](modules/thermocycler.md)
- Working with [multiple modules of the same type](modules/multiple_same_type.md) in a single protocol.

> [!note]
> Throughout these pages, most code examples use coordinate deck slot locations (e.g. "D1", "D2"), like those found on Flex. If you have an OT-2 and are using API version 2.14 or earlier, replace the coordinate with its numeric OT-2 equivalent. For example, slot D1 on Flex corresponds to slot 1 on an OT-2. See [Deck Slots](deck_slots.md) for more information.
