:og:description: How to control individual robot componenets in a protocol using robot motor commands. 

.. _motor-control: 

Robot Motor Control
====================

In a typical protocol, you use commands like ``transfer_with_liquid_class()`` or ``move_labware()`` to interact with and move hardware attached to the robot, like pipettes or the Flex Gripper. Robot motor control is an advanced feature that allows you to control individual robot components, like the gantry arm, pipette plunger, and gripper jaws. We'll take a look at robot motor commands in three categories: 

- **Movement commands** :py:meth:`~.RobotContext.move_to`, :py:meth:`~.RobotContext.move_axes_to`, and :py:meth:`~.RobotContext.move_axes_relative`
- **Gripper commands** :py:meth:`~.RobotContext.open_gripper_jaw` and :py:meth:`~.RobotContext.close_gripper_jaw`
- **Helper commands** :py:meth:`~.RobotContext.axis_coordinates_for`, :py:meth:`~.RobotContext.plunger_coordinates_for_volume`, and :py:meth:`~.RobotContext.plunger_coordinates_for_named_position`

Movement Commands
-----------------

Use movement commands to move individual robot components. For example, use the ``move_to()`` method to change the position of the extension mount, where the Flex Gripper attaches. 

The other movement commands move the *axis*... 



