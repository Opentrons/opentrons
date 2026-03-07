---
title: "Python API: Magnetic Block"
description: "Use the Magnetic Block with the Flex Gripper in protocols."
---

!!! note "Flex only"
    The Magnetic Block is compatible with Opentrons Flex only. If you have an OT-2, use the [Magnetic Module](magnetic-module.md).

The Magnetic Block is an unpowered, 96-well plate that holds labware close to its high-strength neodymium magnets. This module is suitable for many magnetic bead-based protocols, but does not move beads up or down in solution.

Because the Magnetic Block is unpowered, neither your robot nor the Opentrons App is aware of this module. You "control" it via protocols to load labware onto the module and use the Opentrons Flex Gripper to move labware on and off the module. See [Moving Labware](../moving-labware.md) for more information.

The Magnetic Block is represented by a [`MagneticBlockContext`][opentrons.protocol_api.MagneticBlockContext] object which lets you load labware on top of the module.

```python
# Load the Magnetic Block in deck slot D1
magnetic_block = protocol.load_module(
    module_name="magneticBlockV1", location="D1"
)

# Load a 96-well plate on the magnetic block
mag_plate = magnetic_block.load_labware(
    name="biorad_96_wellplate_200ul_pcr"
)

# Use the gripper to move labware
protocol.move_labware(mag_plate, new_location="B2", use_gripper=True)
```
*New in version 2.15*
