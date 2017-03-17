.. _setup:

==========
Setup
==========

There are a few things to consider when beginning a new Python protocol. In this section, we exlain the Opentrons API's ``containers``, ``instruments``, and ``robot`` modules, and how they are used to setup and control your Python protocol.

.. toctree::
    :maxdepth: 3

    setup

**********************

.. testsetup:: containers

    from opentrons import containers, robot
    robot.reset()

Containers
----------

The containers module allows you to load common labware into your protocol. `Go here`__ to see a visualization of all built-in containers.

__ https://andysigler.github.io/ot-api-containerviz/

.. testcode:: containers

    '''
    Examples in this section require the following
    '''
    from opentrons import containers

List
^^^^

Once the container module is loaded, you can see a list of all containers currently inside the API by calling ``containers.list()``

.. testcode:: containers

    containers.list()

Load
^^^^

Labware is loaded with two arguments: 1) the container type, and 2) the deck slot it will be placed in on the robot.

.. testcode:: containers

    p = containers.load('96-flat', 'B1')

A third optional argument can be used to give a container a unique name.

.. testcode:: containers

    p = containers.load('96-flat', 'B1', 'any-name-you-want')

Unique names are useful in a few scenarios. First, they allow the container to have independant calibration data from other containers in the same slot. In the example above, the container named 'any-name-you-want' will assume different calibration data from the unnamed plate, even though they are the same type and in the same slot.

.. note::

    Calibration data refers to the saved positions for each container on deck, and is a part of the `Opentrons App calibration procedure`__.

__ https://opentrons.com/getting-started/calibrate-deck

Names can also be used to place multiple containers in the same slot all at once. For example, the flasks below are all placed in slot D1. So in order for the Opentrons API to tell them apart, we have given them each a unique name.

.. testcode:: containers

    fa = containers.load('T25-flask', 'D1', 'flask_a')
    fb = containers.load('T25-flask', 'D1', 'flask_b')
    fc = containers.load('T25-flask', 'D1', 'flask_c')

Create
^^^^^^

In addition to the default containers that come with the Opentrons API, you can create your own custom containers.

Through the API's call containers.create(), you can create simple grid containers, which consist of circular wells arranged in columns and rows.

.. testcode:: containers

    containers.create(
        '3x6_plate',                    # name of you container
        grid=(3, 6),                    # specify amount of (columns, rows)
        spacing=(12, 12),               # distances (mm) between each (column, row)
        diameter=5,                     # diameter (mm) of each well on the plate
        depth=10)                       # depth (mm) of each well on the plate

When you create your custom container, then it will be saved for later use under the name you've given it. This means you can use containers.load() to use the custom container you've created in this and any future protocol.

.. testcode:: containers

    custom_plate = containers.load('3x6_plate', 'D1')

    for well in custom_plate.wells():
        print(well)

will print out...

.. testoutput:: containers
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well B1>
    <Well C1>
    <Well A2>
    <Well B2>
    <Well C2>
    <Well A3>
    <Well B3>
    <Well C3>
    <Well A4>
    <Well B4>
    <Well C4>
    <Well A5>
    <Well B5>
    <Well C5>
    <Well A6>
    <Well B6>
    <Well C6>

.. testsetup:: pipettes

    from opentrons import instruments, robot
    robot.reset()

**********************

Instruments
-----------

The ``instruments`` module gives your protocol access to the ``Pipette``, which is what you will be primarily using to create protocol commands.

.. testcode:: pipettes

    '''
    Examples in this section require the following
    '''
    from opentrons import instruments

Axis and Max Volume
^^^^^^^^^^^^^^^^^^^

To create a ``Pipette``, you must give it an axis and a max_volume. The axis can be either ``'a'`` or ``'b'``, and the volume is whatever your hand pipette is calibrated for. In this example, we are using a 200uL pipette.

.. testcode:: pipettes

    pipette = instruments.Pipette(
        axis='b',
        name='my-p200',
        max_volume=200)

Minimum Volume
^^^^^^^^^^^^^^

The minimum allowed volume can be set for each pipette. If your protocol attempts to aspirate or dispense a volume below this volume, the API will give you a warning.

.. testcode:: pipettes

    pipette = instruments.Pipette(
        axis='b',
        name='my-p200',
        max_volume=200,
        min_volume=20)

Channels
^^^^^^^^

Pipettes can also be assigned a number of channels, either ``channel=1`` or ``channel=8``. If you do not specify, it will default to ``channel=1`` channel.

.. testcode:: pipettes

    pipette = instruments.Pipette(
        axis='b',
        name='my-p200-multichannel',
        max_volume=200,
        min_volume=20,
        channels=8)

Plunger Speeds
^^^^^^^^^^^^^^

The speeds at which the pipette will aspirate and dispense can be set through ``aspirate_speed`` and ``dispense_speed``. The values are in millimeters/minute, and default to ``aspirate_speed=300`` and ``dispense_speed=500``.

.. testcode:: pipettes

    pipeipette = instruments.Pipette(
        axis='b',
        name='my-p200-multichannel',
        max_volume=200,
        min_volume=20,
        channels=8,
        aspirate_speed=200,
        dispense_speed=600)

.. testsetup:: robot

    from opentrons import robot, containers, instruments

    robot.reset()

    plate = containers.load('96-flat', 'B1', 'my-plate')
    tiprack = containers.load('tiprack-200ul', 'A1', 'my-rack')

    pipette = instruments.Pipette(axis='b', max_volume=200, name='my-pipette')

**********************

Robot
-----

The robot module can be thought of as the parent for all aspects of the Opentrons API. All containers, instruments, and protocol commands are added to and controlled by robot.

.. testcode:: robot

    '''
    Examples in this section require the following
    '''
    from opentrons import robot, containers, instruments

    plate = containers.load('96-flat', 'B1', 'my-plate')
    tiprack = containers.load('tiprack-200ul', 'A1', 'my-rack')

    pipette = instruments.Pipette(axis='b', max_volume=200, name='my-pipette')

Get Containers
^^^^^^^^^^^^^^

When containers are loaded, they are automatically added to the ``robot``. You can see all currently held containers by calling ``robot.get_containers()``, which returns a `Python list`__.

__ https://docs.python.org/3.5/tutorial/datastructures.html#more-on-lists

.. testcode:: robot
    
    for name, container in robot.get_containers():
        print(name, container.get_type())

will print out...

.. testoutput:: robot
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    my-plate 96-flat
    my-rack tiprack-200ul

Get Instruments
^^^^^^^^^^^^^^^

When instruments are created, they are automatically added to the ``robot``. You can see all currently held instruments by calling ``robot.get_instruments()``, which returns a `Python list`__.

__ https://docs.python.org/3.5/tutorial/datastructures.html#more-on-lists

.. testcode:: robot
    
    for axis, pipette in robot.get_instruments():
        print(pipette.name, axis)

will print out...

.. testoutput:: robot
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    my-pipette B

Commands
^^^^^^^^

When commands are called on a pipette, they are automatically enqueued to the ``robot`` in the order they are called. You can see all currently held commands by calling ``robot.commands()``, which returns a `Python list`__.

__ https://docs.python.org/3.5/tutorial/datastructures.html#more-on-lists

.. testcode:: robot
    
    pipette.pick_up_tip(tiprack.wells('A1'))
    pipette.drop_tip(tiprack.wells('A1'))

    for c in robot.commands():
        print(c)

will print out...

.. testoutput:: robot
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    Picking up tip from <Deck><Slot A1><Container my-rack><Well A1>
    Drop_tip at <Deck><Slot A1><Container my-rack><Well A1>

Clear Commands
^^^^^^^^^^^^^^

Once commands are enqueued to the ``robot``, we can erase those commands by calling ``robot.clear_commands()``. Any previously created instruments and containers will still be inside robot, but all commands are erased.

.. testcode:: robot
    
    robot.clear_commands()
    pipette.pick_up_tip(tiprack['A1'])
    print('There is', len(robot.commands()), 'command')

    robot.clear_commands()
    print('There are now', len(robot.commands()), 'commands')

will print out...

.. testoutput:: robot
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    There is 1 command
    There are now 0 commands

Comment
^^^^^^^

You can add a custom message to the list of command descriptions you see when running ``robot.commands()``. This command is ``robot.comment()``, and it allows you to print out any information you want at the point in your protocol

.. testcode:: robot
    
    robot.clear_commands()

    pipette.pick_up_tip(tiprack['A1'])
    robot.comment("Hello, just picked up tip A1")

    pipette.pick_up_tip(tiprack['A1'])
    robot.comment("Goodbye, just dropped tip A1")

    for c in robot.commands():
        print(c)

will print out...

.. testoutput:: robot
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    Picking up tip from <Deck><Slot A1><Container my-rack><Well A1>
    Hello, just picked up tip A1
    Picking up tip from <Deck><Slot A1><Container my-rack><Well A1>
    Goodbye, just dropped tip A1

Simulate
^^^^^^^^

Once commands have been enqueued to the ``robot``, we can simulate their execution by calling ``robot.simulate()``. This helps us debug our protocol, and to see if the robots gives us any warnings.

.. testcode:: robot
    
    pipette.pick_up_tip()

    for warning in robot.simulate():
        print(warning)

will print out...

.. testoutput:: robot
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    pick_up_tip called with no reference to a tip

Reset
^^^^^

Calling ``robot.reset()`` will remove everything from the robot. Any previously added containers, pipettes, or commands will be erased.

.. testcode:: robot
    
    robot.reset()
    print(robot.get_containers())
    print(robot.get_instruments())
    print(robot.commands())

will print out...

.. testoutput:: robot
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    []
    []
    []

