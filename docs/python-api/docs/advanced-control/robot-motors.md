---
title: "Python API: Robot Motor Control"
description: How to control individual robot components in a protocol using robot motor commands.
---

In a typical protocol, you use commands like [`transfer_with_liquid_class()`][opentrons.protocol_api.InstrumentContext.transfer_with_liquid_class] or [`move_labware()`][opentrons.protocol_api.ProtocolContext.move_labware] to interact with and move hardware attached to the robot, like pipettes or the Flex Gripper. Robot motor control is an advanced feature that allows you to control individual robot components, like the gantry, pipette plunger, and gripper jaws. We'll take a look at robot motor commands in three categories: movement, gripper, and helper commands.

## Movement commands

Movement commands provided by the [`RobotContext`][opentrons.protocol_api.RobotContext] class allow you to move individual robot motors to specific deck positions:

- [`move_to()`][opentrons.protocol_api.RobotContext.move_to]
- [`move_axes_to()`][opentrons.protocol_api.RobotContext.move_axes_to]
- [`move_axes_relative()`][opentrons.protocol_api.RobotContext.move_axes_relative]

Use the [`RobotContext.move_to()`][opentrons.protocol_api.RobotContext.move_to] method to change the position of the gantry or instrument mounts for pipettes or the Flex Gripper. This method accepts a location, like a well `A1` and position (like `top(z=100)`) within a plate.

The other two movement commands change the position of the robot's axes:

- `X` and `Y`: X and Y axis of the gantry
- `Z_L` and `Z_R`: Z axis of the left or right instrument mount
- `Z_G` and `G`: Z axis and jaw motor of the Flex Gripper
- `P_L` and `P_R`: pipette plunger axes in the left or right instrument mount
- `Q`: Flex 96-channel pipette tip pickup motor

The [`move_axes_to()`][opentrons.protocol_api.RobotContext.move_axes_to] and [`move_axes_relative()`][opentrons.protocol_api.RobotContext.move_axes_relative] methods move any axis to an absolute or relative position on the deck, respectively. You can also provide a group of axes to either method to program a diagonal movement on the deck, for example.

This example moves the `Q` axis to drop tips attached to a Flex 96-channel pipette.

```python
from opentrons import protocol_api

requirements = {
    'robotType': 'Flex',
    'apiLevel': '2.25'
}

def run(protocol: protocol_api.ProtocolContext): 
    pipette = protocol.load_instrument("flex_96channel_1000")
    tips = protocol.load_labware("opentrons_flex_96_filtertiprack_1000ul", "D2")

    def drop_tips():
        plunger_distance = -30

        protocol.robot.move_axes_relative(
            axis_map={"q": -1 * plunger_distance},
            speed=5.5
        )
        protocol.robot.move_axes_relative(
            axis_map={"q": plunger_distance},
            speed=5.5
        )
    pipette.home()
    pipette.move_to(tips['A1'].top(z=130))
    drop_tips()
    pipette.home()
```

*New in version 2.25.*

Here, the 96-channel pipette moves to a specific position above the tip rack, including a `z` height. Then, the tip pickup motor moves -30 mm relative to its current position to drop attached tips. Before and after these movements, the instrument mount the pipette is attached to returns to its `home` position.

When you use a command like `transfer_with_liquid_class()` in a protocol, the robot tracks where the pipette's mount moves, how far the plunger moves, and how much liquid has been moved from each well.

Robot motor control commands won't track changes to liquids, labware, and instruments like a pipette or the Gripper. For example, if you use a motor control command to move a well plate to a new slot, a subsequent [`move_labware()`][opentrons.protocol_api.ProtocolContext.move_labware] command won't move the well plate from the correct location.

!!! warning
    As in the example above, be sure to home (or return to their previous position) any pipettes, the gantry, and other instruments that you’ve moved with a motor control command. Use caution to avoid collisions, especially when moving mounts with a pipette or Flex Gripper lowered towards the deck.

## Gripper commands

The [`open_gripper_jaw()`][opentrons.protocol_api.RobotContext.open_gripper_jaw] and [`close_gripper_jaw()`][opentrons.protocol_api.RobotContext.close_gripper_jaw] methods let you control the Flex Gripper jaws to handle custom labware or hardware on the deck.

You can also control the Gripper while other commands run. For example, use a mixture of move and gripper commands to pick up labware while pipetting liquids.

## Axis and plunger coordinates

To move a robot axis, you'll need to provide a position in the form of an axis coordinate map. Helper commands return axis or plunger coordinates you can use in a movement command.

Start by providing a method like [`axis_coordinates_for()`][opentrons.protocol_api.RobotContext.axis_coordinates_for] a deck location to return a coordinate map for any mount and deck position. Then, pass the axis map to a [`move_axes_to()`][opentrons.protocol_api.RobotContext.move_axes_to] command.

Use the [`plunger_coordinates_for_volume()`][opentrons.protocol_api.RobotContext.plunger_coordinates_for_volume] method to change the position of a pipette plunger to aspirate, dispense, or blowout. To move the plunger to a known position like the bottom of a well or blowout location, use [`plunger_coordinates_for_named_position()`][opentrons.protocol_api.RobotContext.plunger_coordinates_for_named_position].

```python
from opentrons.protocol_api import ASPIRATE_ACTION

volume_position = protocol.robot.plunger_coordinates_for_volume(
    mount="left",
    volume=30,
    action=ASPIRATE_ACTION
)

protocol.robot.move_axes_to(
    axis_map=volume_position
)
```

In this example, `plunger_coordinates_for_volume` calculates an axis map for aspirating 30 µL of liquid. Then, the `move_axes_to` method uses the axis map to move the `Q` axis of the 96-channel pipette loaded earlier in the protocol. 

!!! note
    You should always specify the `left` mount when moving the 96-channel pipette.

!!! warning
    Moving your pipette's plunger to an extreme position can damage the instrument. Avoid moves outside of known positions, like below the blowout location. For example, the [blowout location for the Flex 96-Channel 1000 µL](https://github.com/Opentrons/opentrons/blob/edge/shared-data/pipette/definitions/2/general/ninety_six_channel/p1000/3_6.json#L786) is 73.5 mm below its highest position.
