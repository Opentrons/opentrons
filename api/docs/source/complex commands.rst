.. _complex commands:

#######################
Complex Liquid Handling
#######################

The examples below will use the following set-up:

.. code-block:: python

    from opentrons import robot, labware, instruments

    robot.clear_commands()

    plate = labware.load('96-flat', '1')

    tiprack = labware.load('tiprack-200ul', '2')

    pipette = instruments.P300_Single(
        mount='left',
        tip_racks=[tiprack])

**********************

Transfer
========

Most of time, a protocol is really just looping over some wells, aspirating, and then dispensing. Even though they are simple in nature, these loops take up a lot of space. The ``pipette.transfer()`` command takes care of those common loops. It will combine aspirates and dispenses automatically, making your protocol easier to read and edit.

Basic
-----

The example below will transfer 100 uL from well ``'A1'`` to well ``'B1'``, automatically picking up a new tip and then disposing it when finished.

.. code-block:: python

    pipette.transfer(100, plate.wells('A1'), plate.wells('B1'))

Transfer commands will automatically create entire series of ``aspirate()``, ``dispense()``, and other ``Pipette`` commands.


Large Volumes
-------------

Volumes larger than the pipette's ``max_volume`` will automatically divide into smaller transfers.

.. code-block:: python

    pipette.transfer(700, plate.wells('A2'), plate.wells('B2'))

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Transferring 700 from <Well A2> to <Well B2>
    Picking up tip <Well A1>
    Aspirating 200.0 uL from <Well A2> at 1 speed
    Dispensing 200.0 uL into <Well B2>
    Aspirating 200.0 uL from <Well A2> at 1 speed
    Dispensing 200.0 uL into <Well B2>
    Aspirating 150.0 uL from <Well A2> at 1 speed
    Dispensing 150.0 uL into <Well B2>
    Aspirating 150.0 uL from <Well A2> at 1 speed
    Dispensing 150.0 uL into <Well B2>
    Dropping tip <Well A1>

Multiple Wells
--------------

Transfer commands are most useful when moving liquid between multiple wells.

.. code-block:: python

    pipette.transfer(100, plate.cols('1'), plate.cols('2'))

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Transferring 100 from <WellSeries: <Well A1><Well A2><Well A3><Well A4><Well A5><Well A6><Well A7><Well A8><Well A9><Well A10><Well A11><Well A12>> to <WellSeries: <Well B1><Well B2><Well B3><Well B4><Well B5><Well B6><Well B7><Well B8><Well B9><Well B10><Well B11><Well B12>>
    Picking up tip <Well A1>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well B1>
    Aspirating 100.0 uL from <Well A2> at 1 speed
    Dispensing 100.0 uL into <Well B2>
    Aspirating 100.0 uL from <Well A3> at 1 speed
    Dispensing 100.0 uL into <Well B3>
    Aspirating 100.0 uL from <Well A4> at 1 speed
    Dispensing 100.0 uL into <Well B4>
    Aspirating 100.0 uL from <Well A5> at 1 speed
    Dispensing 100.0 uL into <Well B5>
    Aspirating 100.0 uL from <Well A6> at 1 speed
    Dispensing 100.0 uL into <Well B6>
    Aspirating 100.0 uL from <Well A7> at 1 speed
    Dispensing 100.0 uL into <Well B7>
    Aspirating 100.0 uL from <Well A8> at 1 speed
    Dispensing 100.0 uL into <Well B8>
    Aspirating 100.0 uL from <Well A9> at 1 speed
    Dispensing 100.0 uL into <Well B9>
    Aspirating 100.0 uL from <Well A10> at 1 speed
    Dispensing 100.0 uL into <Well B10>
    Aspirating 100.0 uL from <Well A11> at 1 speed
    Dispensing 100.0 uL into <Well B11>
    Aspirating 100.0 uL from <Well A12> at 1 speed
    Dispensing 100.0 uL into <Well B12>
    Dropping tip <Well A1>

One to Many
-------------

You can transfer from a single source to multiple destinations, and the other way around (many sources to one destination).

.. code-block:: python

    pipette.transfer(100, plate.wells('A1'), plate.rows('2'))

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Transferring 100 from <Well A1> to <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>
    Picking up tip <Well A1>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well A2>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well B2>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well C2>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well D2>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well E2>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well F2>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well G2>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well H2>
    Dropping tip <Well A1>

Few to Many
-------------

What happens if, for example, you tell your pipette to transfer from 4 source wells to 2 destination wells? The transfer command will attempt to divide the wells evenly, or raise an error if the number of wells aren't divisible.

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1', 'A2', 'A3', 'A4'),
        plate.wells('B1', 'B2'))

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Transferring 100 from <WellSeries: <Well A1><Well A2><Well A3><Well A4>> to <WellSeries: <Well B1><Well B2>>
    Picking up tip <Well A1>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well B1>
    Aspirating 100.0 uL from <Well A2> at 1 speed
    Dispensing 100.0 uL into <Well B1>
    Aspirating 100.0 uL from <Well A3> at 1 speed
    Dispensing 100.0 uL into <Well B2>
    Aspirating 100.0 uL from <Well A4> at 1 speed
    Dispensing 100.0 uL into <Well B2>
    Dropping tip <Well A1>

List of Volumes
---------------

Instead of applying a single volume amount to all source/destination wells, you can instead pass a list of volumes.

.. code-block:: python

    pipette.transfer(
        [20, 40, 60],
        plate.wells('A1'),
        plate.wells('B1', 'B2', 'B3'))

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Transferring [20, 40, 60] from <Well A1> to <WellSeries: <Well B1><Well B2><Well B3>>
    Picking up tip <Well A1>
    Aspirating 20.0 uL from <Well A1> at 1 speed
    Dispensing 20.0 uL into <Well B1>
    Aspirating 40.0 uL from <Well A1> at 1 speed
    Dispensing 40.0 uL into <Well B2>
    Aspirating 60.0 uL from <Well A1> at 1 speed
    Dispensing 60.0 uL into <Well B3>
    Dropping tip <Well A1>

Volume Gradient
---------------

Create a linear gradient between a start and ending volume (uL). The start and ending volumes must be the first and second elements of a tuple.

.. code-block:: python

    pipette.transfer(
        (100, 30),
        plate.wells('A1'),
        plate.rows('2'))

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Transferring (100, 30) from <Well A1> to <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>
    Picking up tip <Well A1>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well A2>
    Aspirating 90.0 uL from <Well A1> at 1 speed
    Dispensing 90.0 uL into <Well B2>
    Aspirating 80.0 uL from <Well A1> at 1 speed
    Dispensing 80.0 uL into <Well C2>
    Aspirating 70.0 uL from <Well A1> at 1 speed
    Dispensing 70.0 uL into <Well D2>
    Aspirating 60.0 uL from <Well A1> at 1 speed
    Dispensing 60.0 uL into <Well E2>
    Aspirating 50.0 uL from <Well A1> at 1 speed
    Dispensing 50.0 uL into <Well F2>
    Aspirating 40.0 uL from <Well A1> at 1 speed
    Dispensing 40.0 uL into <Well G2>
    Aspirating 30.0 uL from <Well A1> at 1 speed
    Dispensing 30.0 uL into <Well H2>
    Dropping tip <Well A1>

**********************

Distribute and Consolidate
==========================

Save time and tips with the ``distribute()`` and ``consolidate()`` commands. These are nearly identical to ``transfer()``, except that they will combine multiple transfer's into a single tip.

Consolidate
-----------

Volumes going to the same destination well are combined within the same tip, so that multiple aspirates can be combined to a single dispense.

.. code-block:: python

    pipette.consolidate(30, plate.rows('2'), plate.wells('A1'))

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Consolidating 30 from <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>> to <Well A1>
    Transferring 30 from <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>> to <Well A1>
    Picking up tip <Well A1>
    Aspirating 30.0 uL from <Well A2> at 1 speed
    Aspirating 30.0 uL from <Well B2> at 1 speed
    Aspirating 30.0 uL from <Well C2> at 1 speed
    Aspirating 30.0 uL from <Well D2> at 1 speed
    Aspirating 30.0 uL from <Well E2> at 1 speed
    Aspirating 30.0 uL from <Well F2> at 1 speed
    Dispensing 180.0 uL into <Well A1>
    Aspirating 30.0 uL from <Well G2> at 1 speed
    Aspirating 30.0 uL from <Well H2> at 1 speed
    Dispensing 60.0 uL into <Well A1>
    Dropping tip <Well A1>

If there are multiple destination wells, the pipette will never combine their volumes into the same tip.

.. code-block:: python

    pipette.consolidate(30, plate.rows('2'), plate.wells('A1', 'A2'))

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Consolidating 30 from <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>> to <WellSeries: <Well A1><Well A2>>
    Transferring 30 from <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>> to <WellSeries: <Well A1><Well A2>>
    Picking up tip <Well A1>
    Aspirating 30.0 uL from <Well A2> at 1 speed
    Aspirating 30.0 uL from <Well B2> at 1 speed
    Aspirating 30.0 uL from <Well C2> at 1 speed
    Aspirating 30.0 uL from <Well D2> at 1 speed
    Dispensing 120.0 uL into <Well A1>
    Aspirating 30.0 uL from <Well E2> at 1 speed
    Aspirating 30.0 uL from <Well F2> at 1 speed
    Aspirating 30.0 uL from <Well G2> at 1 speed
    Aspirating 30.0 uL from <Well H2> at 1 speed
    Dispensing 120.0 uL into <Well A2>
    Dropping tip <Well A1>

Distribute
-----------

Volumes from the same source well are combined within the same tip, so that one aspirate can provide for multiple dispenses.

.. code-block:: python

    pipette.distribute(55, plate.wells('A1'), plate.rows('2'))

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Distributing 55 from <Well A1> to <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>
    Transferring 55 from <Well A1> to <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>
    Picking up tip <Well A1>
    Aspirating 165.0 uL from <Well A1> at 1 speed
    Dispensing 55.0 uL into <Well A2>
    Dispensing 55.0 uL into <Well B2>
    Dispensing 55.0 uL into <Well C2>
    Aspirating 165.0 uL from <Well A1> at 1 speed
    Dispensing 55.0 uL into <Well D2>
    Dispensing 55.0 uL into <Well E2>
    Dispensing 55.0 uL into <Well F2>
    Aspirating 110.0 uL from <Well A1> at 1 speed
    Dispensing 55.0 uL into <Well G2>
    Dispensing 55.0 uL into <Well H2>
    Dropping tip <Well A1>


If there are multiple source wells, the pipette will never combine their volumes into the same tip.

.. code-block:: python

    pipette.distribute(30, plate.wells('A1', 'A2'), plate.rows('2'))

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Distributing 30 from <WellSeries: <Well A1><Well A2>> to <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>
    Transferring 30 from <WellSeries: <Well A1><Well A2>> to <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>
    Picking up tip <Well A1>
    Aspirating 120.0 uL from <Well A1> at 1 speed
    Dispensing 30.0 uL into <Well A2>
    Dispensing 30.0 uL into <Well B2>
    Dispensing 30.0 uL into <Well C2>
    Dispensing 30.0 uL into <Well D2>
    Aspirating 120.0 uL from <Well A2> at 1 speed
    Dispensing 30.0 uL into <Well E2>
    Dispensing 30.0 uL into <Well F2>
    Dispensing 30.0 uL into <Well G2>
    Dispensing 30.0 uL into <Well H2>
    Dropping tip <Well A1>

Disposal Volume
---------------

When dispensing multiple times from the same tip, it is recommended to aspirate an extra amount of liquid to be disposed of after distributing. This added ``disposal_vol`` can be set as an optional argument.

.. code-block:: python

    pipette.distribute(
        30,
        plate.wells('A1', 'A2'),
        plate.rows('2'),
        disposal_vol=10)   # include extra liquid to make dispenses more accurate

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Distributing 30 from <WellSeries: <Well A1><Well A2>> to <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>
    Transferring 30 from <WellSeries: <Well A1><Well A2>> to <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>
    Picking up tip <Well A1>
    Aspirating 130.0 uL from <Well A1> at 1 speed
    Dispensing 30.0 uL into <Well A2>
    Dispensing 30.0 uL into <Well B2>
    Dispensing 30.0 uL into <Well C2>
    Dispensing 30.0 uL into <Well D2>
    Blowing out at <Well A1>
    Aspirating 130.0 uL from <Well A2> at 1 speed
    Dispensing 30.0 uL into <Well E2>
    Dispensing 30.0 uL into <Well F2>
    Dispensing 30.0 uL into <Well G2>
    Dispensing 30.0 uL into <Well H2>
    Blowing out at <Well A1>
    Dropping tip <Well A1>

.. note::

    If you do not specify a ``disposal_vol``, the pipette will by default use a ``disposal_vol`` equal to it's ``min_volume``. This tutorial has not given the pipette any ``min_volume``, so below is an example of allowing the pipette's ``min_volume`` to be used as a default for ``disposal_vol``.

.. code-block:: python

    pipette.min_volume = 20  # `min_volume` is used as default to `disposal_vol`

    pipette.distribute(
        30,
        plate.wells('A1', 'A2'),
        plate.rows('2'))

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Distributing 30 from <WellSeries: <Well A1><Well A2>> to <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>
    Transferring 30 from <WellSeries: <Well A1><Well A2>> to <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>
    Picking up tip <Well A1>
    Aspirating 140.0 uL from <Well A1> at 1 speed
    Dispensing 30.0 uL into <Well A2>
    Dispensing 30.0 uL into <Well B2>
    Dispensing 30.0 uL into <Well C2>
    Dispensing 30.0 uL into <Well D2>
    Blowing out at <Well A1>
    Aspirating 140.0 uL from <Well A2> at 1 speed
    Dispensing 30.0 uL into <Well E2>
    Dispensing 30.0 uL into <Well F2>
    Dispensing 30.0 uL into <Well G2>
    Dispensing 30.0 uL into <Well H2>
    Blowing out at <Well A1>
    Dropping tip <Well A1>

**********************

Transfer Options
================

There are other options for customizing your transfer command:

Always Get a New Tip
------------------------

Transfer commands will by default use the same one tip for each well, then finally drop it in the trash once finished.

The pipette can optionally get a new tip at the beginning of each aspirate, to help avoid cross contamination.

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1', 'A2', 'A3'),
        plate.wells('B1', 'B2', 'B3'),
        new_tip='always')    # always pick up a new tip

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Transferring 100 from <WellSeries: <Well A1><Well A2><Well A3>> to <WellSeries: <Well B1><Well B2><Well B3>>
    Picking up tip <Well A1>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well B1>
    Dropping tip <Well A1>
    Picking up tip <Well B1>
    Aspirating 100.0 uL from <Well A2> at 1 speed
    Dispensing 100.0 uL into <Well B2>
    Dropping tip <Well A1>
    Picking up tip <Well C1>
    Aspirating 100.0 uL from <Well A3> at 1 speed
    Dispensing 100.0 uL into <Well B3>
    Dropping tip <Well A1>

Never Get a New Tip
------------------------

For scenarios where you instead are calling ``pick_up_tip()`` and ``drop_tip()`` elsewhere in your protocol, the transfer command can ignore picking up or dropping tips.

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1', 'A2', 'A3'),
        plate.wells('B1', 'B2', 'B3'),
        new_tip='never')    # never pick up or drop a tip

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Transferring 100 from <WellSeries: <Well A1><Well A2><Well A3>> to <WellSeries: <Well B1><Well B2><Well B3>>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well B1>
    Aspirating 100.0 uL from <Well A2> at 1 speed
    Dispensing 100.0 uL into <Well B2>
    Aspirating 100.0 uL from <Well A3> at 1 speed
    Dispensing 100.0 uL into <Well B3>

Trash or Return Tip
------------------------

By default, the transfer command will drop the pipette's tips in the trash container. However, if you wish to instead return the tip to it's tip rack, you can set ``trash=False``.

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1'),
        plate.wells('B1'),
        trash=False)       # do not trash tip

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Transferring 100 from <Well A1> to <Well B1>
    Picking up tip <Well A1>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well B1>
    Returning tip
    Dropping tip <Well A1>

Touch Tip
---------

A touch-tip can be performed after every aspirate and dispense by setting ``touch_tip=True``.

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1'),
        plate.wells('A2'),
        touch_tip=True)     # touch tip to each well's edge

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Transferring 100 from <Well A1> to <Well A2>
    Picking up tip <Well A1>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Touching tip
    Dispensing 100.0 uL into <Well A2>
    Touching tip
    Dropping tip <Well A1>

Blow Out
--------

A blow-out can be performed after every dispense that leaves the tip empty by setting ``blow_out=True``.

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1'),
        plate.wells('A2'),
        blow_out=True)      # blow out droplets when tip is empty

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Transferring 100 from <Well A1> to <Well A2>
    Picking up tip <Well A1>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well A2>
    Blowing out
    Dropping tip <Well A1>

Mix Before/After
----------------

A mix can be performed before every aspirate by setting ``mix_before=``. The value of ``mix_before=`` must be a tuple, the 1st value is the number of repetitions, the 2nd value is the amount of liquid to mix.

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1'),
        plate.wells('A2'),
        mix_before=(2, 50), # mix 2 times with 50uL before aspirating
        mix_after=(3, 75))  # mix 3 times with 75uL after dispensing

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Transferring 100 from <Well A1> to <Well A2>
    Picking up tip <Well A1>
    Mixing 2 times with a volume of 50ul
    Aspirating 50 uL from <Well A1> at 1.0 speed
    Dispensing 50 uL into None
    Aspirating 50 uL from None at 1.0 speed
    Dispensing 50 uL into None
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Dispensing 100.0 uL into <Well A2>
    Mixing 3 times with a volume of 75ul
    Aspirating 75 uL from <Well A2> at 1.0 speed
    Dispensing 75 uL into None
    Aspirating 75 uL from None at 1.0 speed
    Dispensing 75 uL into None
    Aspirating 75 uL from None at 1.0 speed
    Dispensing 75 uL into None
    Dropping tip <Well A1>

Air Gap
-------

An air gap can be performed after every aspirate by setting ``air_gap=int``, where the value is the volume of air in microliters to aspirate after aspirating the liquid.

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1'),
        plate.wells('A2'),
        air_gap=20)         # add 20uL of air after each aspirate

    for c in robot.commands():
        print(c)

will print out...

.. code-block:: python

    Transferring 100 from <Well A1> to <Well A2>
    Picking up tip <Well A1>
    Aspirating 100.0 uL from <Well A1> at 1 speed
    Air gap
    Aspirating 20 uL from None at 1.0 speed
    Dispensing 20 uL into <Well A2>
    Dispensing 100.0 uL into <Well A2>
    Dropping tip <Well A1>
