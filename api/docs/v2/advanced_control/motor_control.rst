:og:description: How to control individual robot components in a protocol using robot motor commands. 

.. _motor-control: 

Robot Motor Control
====================

In a typical protocol, you use commands like ``transfer_with_liquid_class()`` or ``move_labware()`` to interact with and move hardware attached to the robot, like pipettes or the Flex Gripper. Robot motor control is an advanced feature that allows you to control individual robot components, like the gantry, pipette plunger, and gripper jaws. We'll take a look at robot motor commands in three categories: movement, gripper, and helper commands. 

Movement Commands
-----------------

Movement commands allow you to move individual robot motors to specific deck positions:

- :py:meth:`~.RobotContext.move_to`
- :py:meth:`~.RobotContext.move_axes_to`
- :py:meth:`~.RobotContext.move_axes_relative`
  
Use the :py:meth:`~.RobotContext.move_to` method to change the position of the gantry or instrument mounts for pipettes or the Flex Gripper. 

The other two movement commands change the position of the robot's axes:

- ``Axis.X`` and ``Axis.Y``: X and Y axis of the gantry 
- ``Axis.Z_L`` and ``Axis.Z_R``: Z axis of the left or right instrument mount
- ``Axis.Z_G`` and ``Axis.G``: Z axis and jaw motor of the Flex Gripper
- ``Axis.P_L`` and ``Axis.P_R``: pipette plunger axes in the left or right instrument mount 
- ``Axis_Q``: Flex 96-channel pipette tip pickup motor 

The :py:meth:`~.RobotContext.move_axes_to` and :py:meth:`~.RobotContext.move_axes_relative` methods move any axis to an absolute or relative position on the deck, respectively. 

This example moves ``Axis.Q`` to drop tips attached to a Flex 96-channel pipette.

.. code-block:: python
    :substitutions:

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

.. versionadded:: 2.25

Here, the 96-channel pipette moves to a specific position above the tip rack, including a ``z`` height. Then, the tip pickup motor moves -30 mm relative to its current position to drop attached tips. Before and after these movements, the instrument mount the pipette is attached to returns to it's ``home`` position. 

When you use a command like ``transfer_with_liquid_class()`` in a protocol, the robot tracks where the pipette's mount moves, how far the plunger moves, and how much liquid has been moved from each well. 

Robot motor control commands won't track changes to liquids, labware, and  instruments like a pipette or the Gripper. For example, if you use a motor control command to move a well plate to a new slot, a subsequent :py:meth:`~.ProtocolContext.move_labware` command won't move the well plate from the correct location. 

.. warning:: 

    As in the example above, be sure to home (or return to their previous position) any pipettes, the gantry, and other instruments that you've moved with a motor control command. Use caution to avoid collisions, especially when moving mounts with a pipette or Flex Gripper lowered towards the deck. 

Gripper Commands
-----------------

The :py:meth:`~.RobotContext.open_gripper_jaw` and :py:meth:`~.RobotContext.close_gripper_jaw` methods let you control the Flex Gripper jaws to handle custom labware or hardware on the deck. 

You can also control the Gripper while other commands run. For example, use a mixture of move and gripper commands to pick up labware while pipetting liquids. 

Axis and Plunger Coordinates 
-----------------------------
To move a robot axis, you'll need to provide a position in the form of an axis coordinate map. Helper commands return axis or plunger coordinates you can use in a movement command. 

For example, you can use :py:meth:`~.RobotContext.axis_coordinates_for` to return a coordinate map for any mount and deck position. Then, pass the axis map to a ``move_axes_to()`` command. 

Use the :py:meth:`~.RobotContext.plunger_coordinates_for_volume` to change the position of a pipette plunger to aspirate or dispense. To move the plunger to a known position like the bottom of a well or blowout location, use  :py:meth:`~.RobotContext.plunger_coordinates_for_named_position`.

.. warning:: 

    Moving your pipette's plunger to an extreme position can damage the instrument. Avoid moves outside of known positions, like below the blowout location. For example, the `blowout location for the Flex 96-Channel 1000 µL <https://github.com/Opentrons/opentrons/blob/edge/shared-data/pipette/definitions/2/general/ninety_six_channel/p1000/3_6.json#L786>`_ is 73.5 mm below its highest position.