---
title: "Opentrons Flex: Modules"
description: "Flex-compatible modules: Heater-Shaker, HEPA/UV, Temperature Module, Thermocycler, and more."
---

Opentrons Flex integrates with several Opentrons hardware modules that add features and capabilities to the robot. Modules can occupy deck slots or are external, frame-mounted components. Flex communicates with and controls most modules via a USB connection.

This chapter summarizes the functions and physical specifications of modules that are compatible with Opentrons Flex. It also covers the caddy attachment system and module calibration.

!!! tip
    - For complete instructions on module installation and use, refer to the quickstart guide that shipped with your unit or find its manual in the [Modules category](../../modules/index.md) of the Opentrons Documentation website.

    - For details on integrating modules into your protocols, see the [Protocol Designer section](../protocols/designer.md) of the Protocol Development chapter or the [Hardware Modules section](../../python-api/modules/index.md) of our Python API documentation.


## Supported modules

Opentrons Flex is compatible with the following Opentrons modules:

- The [**Absorbance Plate Reader**](absorbance-plate-reader.md) is a fully automated spectrophotometer that uses light absorbance to determine sample concentrations. This module is optimized for a variety of applications, including protein quantification, sample normalization, cell viability assays, and monitoring bacterial growth.

- The [**Heater-Shaker Module**](heater-shaker.md) provides on-deck heating and orbital shaking. The module can be heated to 95 °C, and can shake samples from 200 to 3000 rpm.

- The [**HEPA/UV Module**](hepa-uv.md) is a positive-pressure clean air and ultraviolet disinfectant accessory for Opentrons Flex. A single 15-minute filtration and UV cycle is sufficient to create an ISO-5 clean bench environment within the Flex enclosure.

- The [**Magnetic Block**](magnetic-block.md) is a passive device that holds labware close to its high-strength neodymium magnets. The OT-2 Magnetic Module GEN1 and GEN2, which actively move their magnets up and down relative to labware, are not supported on Opentrons Flex.

- The [**Stacker Module**](stacker.md) is an externally mounted device that provides automated, high-capacity storage and delivery for ANSI/SLAS compatible labware such as well plates, tip racks, and reservoirs.

- The [**Temperature Module**](temperature.md) is a hot and cold plate module that is able to maintain steady state temperatures between 4 and 95 °C.

- The [**Thermocycler Module**](thermocycler.md) provides on-deck, fully automated thermocycling, enabling automation of upstream and downstream workflow steps. Thermocycler GEN2 is fully compatible with the gripper. Thermocycler GEN1 cannot be used with the gripper, and is therefore not supported on Opentrons Flex.

Certain module tasks, like heating from an ambient temperature to a high temperature or executing a Thermocycler profile, take more time than others. Starting with API version 2.27, you can use [concurrent commands](../../python-api/modules/concurrent.md) to continue pipetting and other steps in your Flex protocols. 

Some modules originally designed for the OT-2 are compatible with Flex, as summarized in the table below. A checkmark :material-check-bold:{ .opentrons-blue } indicates compatibility, and an :octicons-x-12:{ .red } indicates incompatibility.


| Device type and generation | OT-2 | Flex |
|:---------------------------|:----:|:----:|
| Absorbance Plate Reader    | :octicons-x-12:{ .red } | :material-check-bold:{ .opentrons-blue } |
| Heater-Shaker Module GEN1  | :material-check-bold:{ .opentrons-blue } | :material-check-bold:{ .opentrons-blue } |
| HEPA Module                | :material-check-bold:{ .opentrons-blue } | :octicons-x-12:{ .red } |
| HEPA/UV Module             | :octicons-x-12:{ .red } | :material-check-bold:{ .opentrons-blue } |
| Magnetic Block GEN1        | :octicons-x-12:{ .red } | :material-check-bold:{ .opentrons-blue } |
| Magnetic Module GEN1       | :material-check-bold:{ .opentrons-blue } | :octicons-x-12:{ .red } |
| Magnetic Module GEN2       | :material-check-bold:{ .opentrons-blue } | :octicons-x-12:{ .red } |
| Stacker Module GEN1        | :octicons-x-12:{ .red } | :material-check-bold:{ .opentrons-blue } |
| Temperature Module GEN1    | :material-check-bold:{ .opentrons-blue } | :octicons-x-12:{ .red } |
| Temperature Module GEN2    | :material-check-bold:{ .opentrons-blue } | :material-check-bold:{ .opentrons-blue } |
| Thermocycler Module GEN1   | :material-check-bold:{ .opentrons-blue } | :octicons-x-12:{ .red } |
| Thermocycler Module GEN2   | :material-check-bold:{ .opentrons-blue } | :material-check-bold:{ .opentrons-blue } |
