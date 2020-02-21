.. _hardware-control:

.. code-block:: python

    from opentrons import robot
    robot.reset()

###################
Advanced Control
###################

.. note::

    The below features are designed for advanced users who wish to use the Opentrons API in their own Python environment (ie Jupyter). This page is not relevant for users only using the Opentrons App, because the features described below will not be accessible.

The robot module can be thought of as the parent for all aspects of the Opentrons API. All containers, instruments, and protocol commands are added to and controlled by robot.

.. code-block:: python

    '''
    Examples in this section require the following
    '''
    from opentrons import robot, labware, instruments

    plate = labware.load('96-flat', 'B1', 'my-plate')
    tiprack = labware.load('opentrons_96_tiprack_300ul', 'A1', 'my-rack')

    pipette = instruments.P300_Single(mount='left', tip_racks=[tiprack])


User-Specified Pause
==========

This will pause your protocol at a specific step. You can resume by pressing 'resume' in your OT App.

.. code-block:: python

    robot.pause()

Head Speed
==========

The speed of the robot's motors can be set using ``robot.head_speed()``. The units are all millimeters-per-second (mm/sec). The ``x``, ``y``, ``z``, ``a``, ``b``, ``c`` parameters set the maximum speed of the corresponding axis on Smoothie.

'x': lateral motion, 'y': front to back motion, 'z': vertical motion of the left mount, 'a': vertical motion of the right mount, 'b': plunger motor for the left pipette, 'c': plunger motor for the right pipette.

The ``combined_speed`` parameter sets the speed across all axes to either the specified value or the axis max, whichever is lower. Defaults are specified by ``DEFAULT_MAX_SPEEDS`` in `robot_configs.py`__.

__ https://github.com/Opentrons/opentrons/blob/edge/api/src/opentrons/config/robot_configs.py

.. code-block:: python

    max_speed_per_axis = {
        'x': 600, 'y': 400, 'z': 125, 'a': 125, 'b': 50, 'c': 50}
    robot.head_speed(
        combined_speed=max(max_speed_per_axis.values()),
        **max_speed_per_axis)


Homing
======

You can `home` the robot by calling ``home()``. You can also specify axes. The robot will home immdediately when this call is made.

.. code-block:: python

    robot.home()           # home the robot on all axis
    robot.home('z')        # home the Z axis only

Commands
========

When commands are called on a pipette, they are recorded on the ``robot`` in the order they are called. You can see all past executed commands by calling ``robot.commands()``, which returns a `Python list`__.

__ https://docs.python.org/3.5/tutorial/datastructures.html#more-on-lists

.. code-block:: python

    pipette.pick_up_tip(tiprack.wells('A1'))
    pipette.drop_tip(tiprack.wells('A1'))

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Picking up tip <Well A1>
    Dropping tip <Well A1>

Clear Commands
==============

We can erase the robot command history by calling ``robot.clear_commands()``. Any previously created instruments and containers will still be inside robot, but the commands history is erased.

.. code-block:: python

    robot.clear_commands()
    pipette.pick_up_tip(tiprack['A1'])
    print('There is', len(robot.commands()), 'command')

    robot.clear_commands()
    print('There are now', len(robot.commands()), 'commands')

will print out...

.. code-block:: python

    There is 1 command
    There are now 0 commands

Comment
=======

You can add a custom message to the list of command descriptions you see when running ``robot.commands()``. This command is ``robot.comment()``, and it allows you to print out any information you want at the point in your protocol

.. code-block:: python

    robot.clear_commands()

    pipette.pick_up_tip(tiprack['A1'])
    robot.comment("Hello, just picked up tip A1")

    pipette.pick_up_tip(tiprack['A1'])
    robot.comment("Goodbye, just dropped tip A1")

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Picking up tip <Well A1>
    Hello, just picked up tip A1
    Picking up tip <Well A1>
    Goodbye, just dropped tip A1

Get Containers
==============

When containers are loaded, they are automatically added to the ``robot``. You can see all currently held containers by calling ``robot.get_containers()``, which returns a `Python list`__.

__ https://docs.python.org/3.5/tutorial/datastructures.html#more-on-lists

.. code-block:: python

    for container in robot.get_containers():
        print(container.get_name(), container.get_type())

will print out...

.. code-block:: python

    my-rack opentrons_96_tiprack_300ul
    my-plate 96-flat


Reset
=====

Calling ``robot.reset()`` will remove everything from the robot. Any previously added containers, pipettes, or commands will be erased.

.. code-block:: python

    robot.reset()
    print(robot.get_containers())
    print(robot.commands())

will print out...

.. code-block:: python

    []
    []
    []
