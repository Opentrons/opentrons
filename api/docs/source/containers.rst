.. _containers:

===============
Containers
===============

The containers module allows you to load common labware into your protocol. `Go here`__ to see a visualization of all built-in containers.

__ https://andysigler.github.io/ot-api-containerviz/

.. testsetup:: *

    from opentrons import containers

.. testcode::

    '''
    Examples on this page expect the following
    '''
    from opentrons import containers

List
-----------

Once the container module is loaded, you can see a list of all containers currently inside the API by calling ``containers.list()``

.. testcode::

    containers.list()

Load
-----------

Labware is loaded with two arguments: 1) the container type, and 2) the deck slot it will be placed in on the robot.

.. testcode::

    p = containers.load('96-flat', 'B1')

A third optional argument can be used to give a container a unique name.

.. testcode::

    p = containers.load('96-flat', 'B1', 'any-name-you-want')

Unique names are useful in a few scenarios. First, they allow the container to have independant calibration data from other containers in the same slot. In the example above, the container named 'any-name-you-want' will assume different calibration data from the unnamed plate, even though they are the same type and in the same slot.

.. note::

    Calibration data refers to the saved positions for each container on deck, and is a part of the `Opentrons App calibration procedure`__.

__ https://opentrons.com/getting-started/calibrate-deck

Names can also be used to place multiple containers in the same slot all at once. For example, the flasks below are all placed in slot D1. So in order for the Opentrons API to tell them apart, we have given them each a unique name.

.. testcode::

    fa = containers.load('T25-flask', 'D1', 'flask_a')
    fb = containers.load('T25-flask', 'D1', 'flask_b')
    fc = containers.load('T25-flask', 'D1', 'flask_c')

Create
-----------

In addition to the default containers that come with the Opentrons API, you can create your own custom containers.

Through the API's call containers.create(), you can create simple grid containers, which consist of circular wells arranged in columns and rows.

.. testcode::

    containers.create(
        '3x6_plate',                    # name of you container
        grid=(3, 6),                    # specify amount of (columns, rows)
        spacing=(12, 12),               # distances (mm) between each (column, row)
        diameter=5,                     # diameter (mm) of each well on the plate
        depth=10)                       # depth (mm) of each well on the plate

When you create your custom container, then it will be saved for later use under the name you've given it. This means you can use containers.load() to use the custom container you've created in this and any future protocol.

.. testcode::

    custom_plate = containers.load('3x6_plate', 'D1')

    for well in custom_plate.wells():
        print(well)

.. testoutput::

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
