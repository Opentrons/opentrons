---
title: "Opentrons OT-2: Modules"
description: "OT-2-compatible modules: Heater-Shaker, HEPA, Magnetic Module, Temperature Module, Thermocycler."
---

Modules are a class of deck or externally mounted hardware. You can use an OT-2 with several hardware modules that add features and capabilities to the robot. The OT-2 communicates with and controls most modules through a USB connection.

This chapter summarizes the functions and physical specifications of modules that are compatible with the OT-2.

!!! tip
    - For complete instructions on module installation, refer to the guide that shipped with your unit or the [online modules documentation](../../modules/index.md).
    - For information about integrating modules into your protocols, see the [Protocol Designer Instruction Manual](../../protocol-designer/index.md) or the [Hardware Modules section](../../python-api/modules/index.md) of our Python API documentation.

## Supported modules

- The [Heater-Shaker Module](./heater-shaker.md) provides on-deck heating and orbital shaking. The module can be heated to 95 °C and can shake samples from 200 to 3000 rpm.

- The [HEPA Module](./hepa.md) is a positive-pressure clean air system for use with the OT-2 only. It streams purified air into the OT-2 enclosure to help displace airborne contaminants.

- The [Magnetic Module](./magnetic.md) uses high-strength N52 neodymium to help pull particles out of suspension and hold them in a well plate during elution. This module is no longer available.

- The [Temperature Module](./temperature.md) is a hot and cold plate module that is able to maintain steady state temperatures between 4 and 95 °C.

- The [Thermocycler](./thermocycler.md) provides on-deck, fully automated thermocycling, enabling automation of upstream and downstream workflow steps.

## Compatibility table

Opentrons offers a variety of hardware modules for our liquid handling robots. However, not all modules are compatible with the OT-2. The table below identifies which modules you can use with an OT-2. A :material-check-bold:{ .opentrons-blue } indicates OT-2 compatibility, and a :octicons-x-12:{ .red } indicates the module is incompatible.

| Device type and generation | OT-2 | Flex |
|:---------------------------|:----:|:----:|
| Absorbance Plate Reader    | :octicons-x-12:{ .red } | :material-check-bold:{ .opentrons-blue } |
| Heater-Shaker Module GEN1  | :material-check-bold:{ .opentrons-blue } | :material-check-bold:{ .opentrons-blue } |
| HEPA Module                | :material-check-bold:{ .opentrons-blue } | :octicons-x-12:{ .red } |
| HEPA/UV Module             | :octicons-x-12:{ .red } | :material-check-bold:{ .opentrons-blue } |
| Magnetic Block GEN1        | :octicons-x-12:{ .red } | :material-check-bold:{ .opentrons-blue } |
| Magnetic Module GEN1 & GEN2       | :material-check-bold:{ .opentrons-blue } | :octicons-x-12:{ .red } |
| Stacker Module GEN1        | :octicons-x-12:{ .red } | :material-check-bold:{ .opentrons-blue } |
| Temperature Module GEN1    | :material-check-bold:{ .opentrons-blue } | :octicons-x-12:{ .red } |
| Temperature Module GEN2    | :material-check-bold:{ .opentrons-blue } | :material-check-bold:{ .opentrons-blue } |
| Thermocycler Module GEN1   | :material-check-bold:{ .opentrons-blue } | :octicons-x-12:{ .red } |
| Thermocycler Module GEN2   | :material-check-bold:{ .opentrons-blue } | :material-check-bold:{ .opentrons-blue } |