---
title: "Opentrons OT-2: Modules"
---

Modules are a class of deck- or externally-mounted hardware. You can use an OT-2 with several hardware modules that add features and capabilities to the robot. The OT-2 communicates with and controls most modules through a USB connection.

This chapter summarizes the functions and physical specifications of modules that are compatible with the OT-2.

!!! tip
    - For complete instructions on module installation and use, refer to the quickstart guide that shipped with your unit or find its manual in the [Modules section](https://docs.opentrons.com/modules/) of the Opentrons Documentation website.
    - For information about integrating modules into your protocols, see the [Protocol Designer Instruction Manual](https://docs.opentrons.com/protocol-designer/) or the [Hardware Modules section](https://docs.opentrons.com/v2/new_modules.html) of our Python API documentation.

## Supported modules

- The [Heater-Shaker Module](./heater-shaker.md) provides on-deck heating and orbital shaking. The module can be heated to 95 °C, and can shake samples from 200 to 3000 rpm.

## Compatibility table

Opentrons offers a variety of hardware modules for our liquid handling robots. However, not all modules are compatible with the OT-2. The table below identifies which modules you can use. A :material-check-bold:{ .opentrons-blue } indicates OT-2 compatibility, and a :octicons-x-12:{ .red } indicates the module is incompatible.

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