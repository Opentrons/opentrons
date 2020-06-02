.. _complex commands:

#######################
Complex Liquid Handling
#######################



The examples below will use the following set-up:

.. code-block:: python

    from opentrons import robot, labware, instruments

    plate = labware.load('96-flat', '1')

    tiprack = labware.load('opentrons_96_tiprack_300ul', '2')

    pipette = instruments.P300_Single(
        mount='left',
        tip_racks=[tiprack])

You could simulate the protocol using our protocol simulator, which can be installed by following the instructions `here. <https://github.com/Opentrons/opentrons/tree/edge/api#simulating-protocols>`_

**********************

Transfer
========

Most of time, a protocol is really just looping over some wells, aspirating, and then dispensing. Even though they are simple in nature, these loops take up a lot of space. The ``pipette.transfer()`` command takes care of those common loops. It will combine aspirates and dispenses automatically, making your protocol easier to read and edit.
For transferring with a multi-channel, please refer to the :ref:`multi-channel-lh` section.

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

will have the steps...

.. code-block:: python

    Transferring 700 from well A2 in "1" to well B2 in "1"
    Picking up tip well A1 in "2"
    Aspirating 300.0 uL from well A2 in "1" at 1 speed
    Dispensing 300.0 uL into well B2 in "1"
    Aspirating 200.0 uL from well A2 in "1" at 1 speed
    Dispensing 200.0 uL into well B2 in "1"
    Aspirating 200.0 uL from well A2 in "1" at 1 speed
    Dispensing 200.0 uL into well B2 in "1"
    Dropping tip well A1 in "12"

Multiple Wells
--------------

Transfer commands are most useful when moving liquid between multiple wells.

.. code-block:: python

    pipette.transfer(100, plate.cols('1'), plate.cols('2'))

will have the steps...

.. code-block:: python

    Transferring 100 from wells A1...H1 in "1" to wells A2...H2 in "1"
    Picking up tip well A1 in "2"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well A2 in "1"
    Aspirating 100.0 uL from well B1 in "1" at 1 speed
    Dispensing 100.0 uL into well B2 in "1"
    Aspirating 100.0 uL from well C1 in "1" at 1 speed
    Dispensing 100.0 uL into well C2 in "1"
    Aspirating 100.0 uL from well D1 in "1" at 1 speed
    Dispensing 100.0 uL into well D2 in "1"
    Aspirating 100.0 uL from well E1 in "1" at 1 speed
    Dispensing 100.0 uL into well E2 in "1"
    Aspirating 100.0 uL from well F1 in "1" at 1 speed
    Dispensing 100.0 uL into well F2 in "1"
    Aspirating 100.0 uL from well G1 in "1" at 1 speed
    Dispensing 100.0 uL into well G2 in "1"
    Aspirating 100.0 uL from well H1 in "1" at 1 speed
    Dispensing 100.0 uL into well H2 in "1"
    Dropping tip well A1 in "12"

One to Many
-------------

You can transfer from a single source to multiple destinations, and the other way around (many sources to one destination).

.. code-block:: python

    pipette.transfer(100, plate.wells('A1'), plate.cols('2'))


will have the steps...

.. code-block:: python

    Transferring 100 from well A1 in "1" to wells A2...H2 in "1"
    Picking up tip well A1 in "2"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well A2 in "1"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well B2 in "1"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well C2 in "1"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well D2 in "1"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well E2 in "1"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well F2 in "1"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well G2 in "1"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well H2 in "1"
    Dropping tip well A1 in "12"

Few to Many
-------------

What happens if, for example, you tell your pipette to transfer from 2 source wells to 4 destination wells? The transfer command will attempt to divide the wells evenly, or raise an error if the number of wells aren't divisible.

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1', 'A2'),
        plate.wells('B1', 'B2', 'B3', 'B4'))

will have the steps...

.. code-block:: python

    Transferring 100 from wells A1...A2 in "1" to wells B1...B4 in "1"
    Picking up tip well A1 in "2"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well B1 in "1"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well B2 in "1"
    Aspirating 100.0 uL from well A2 in "1" at 1 speed
    Dispensing 100.0 uL into well B3 in "1"
    Aspirating 100.0 uL from well A2 in "1" at 1 speed
    Dispensing 100.0 uL into well B4 in "1"
    Dropping tip well A1 in "12"

List of Volumes
---------------

Instead of applying a single volume amount to all source/destination wells, you can instead pass a list of volumes.

.. code-block:: python

    pipette.transfer(
        [20, 40, 60],
        plate.wells('A1'),
        plate.wells('B1', 'B2', 'B3'))


will have the steps...

.. code-block:: python

    Transferring [20, 40, 60] from well A1 in "1" to wells B1...B3 in "1"
    Picking up tip well A1 in "2"
    Aspirating 20.0 uL from well A1 in "1" at 1 speed
    Dispensing 20.0 uL into well B1 in "1"
    Aspirating 40.0 uL from well A1 in "1" at 1 speed
    Dispensing 40.0 uL into well B2 in "1"
    Aspirating 60.0 uL from well A1 in "1" at 1 speed
    Dispensing 60.0 uL into well B3 in "1"
    Dropping tip well A1 in "12"

Volume Gradient
---------------

Create a linear gradient between a start and ending volume (uL). The start and ending volumes must be the first and second elements of a tuple.

.. code-block:: python

    pipette.transfer(
        (100, 30),
        plate.wells('A1'),
        plate.cols('2'))


will have the steps...

.. code-block:: python

    Transferring (100, 30) from well A1 in "1" to wells A2...H2 in "1"
    Picking up tip well A1 in "2"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well A2 in "1"
    Aspirating 90.0 uL from well A1 in "1" at 1 speed
    Dispensing 90.0 uL into well B2 in "1"
    Aspirating 80.0 uL from well A1 in "1" at 1 speed
    Dispensing 80.0 uL into well C2 in "1"
    Aspirating 70.0 uL from well A1 in "1" at 1 speed
    Dispensing 70.0 uL into well D2 in "1"
    Aspirating 60.0 uL from well A1 in "1" at 1 speed
    Dispensing 60.0 uL into well E2 in "1"
    Aspirating 50.0 uL from well A1 in "1" at 1 speed
    Dispensing 50.0 uL into well F2 in "1"
    Aspirating 40.0 uL from well A1 in "1" at 1 speed
    Dispensing 40.0 uL into well G2 in "1"
    Aspirating 30.0 uL from well A1 in "1" at 1 speed
    Dispensing 30.0 uL into well H2 in "1"
    Dropping tip well A1 in "12"

**********************

Distribute and Consolidate
==========================

Save time and tips with the ``distribute()`` and ``consolidate()`` commands. These are nearly identical to ``transfer()``, except that they will combine multiple transfer's into a single tip.

Consolidate
-----------

Volumes going to the same destination well are combined within the same tip, so that multiple aspirates can be combined to a single dispense.

.. code-block:: python

    pipette.consolidate(30, plate.cols('2'), plate.wells('A1'))

will have the steps...

.. code-block:: python

    Consolidating 30 from wells A2...H2 in "1" to well A1 in "1"
    Transferring 30 from wells A2...H2 in "1" to well A1 in "1"
    Picking up tip well A1 in "2"
    Aspirating 30.0 uL from well A2 in "1" at 1 speed
    Aspirating 30.0 uL from well B2 in "1" at 1 speed
    Aspirating 30.0 uL from well C2 in "1" at 1 speed
    Aspirating 30.0 uL from well D2 in "1" at 1 speed
    Aspirating 30.0 uL from well E2 in "1" at 1 speed
    Aspirating 30.0 uL from well F2 in "1" at 1 speed
    Aspirating 30.0 uL from well G2 in "1" at 1 speed
    Aspirating 30.0 uL from well H2 in "1" at 1 speed
    Dispensing 240.0 uL into well A1 in "1"
    Dropping tip well A1 in "12"

If there are multiple destination wells, the pipette will never combine their volumes into the same tip.

.. code-block:: python

    pipette.consolidate(30, plate.cols('1'), plate.wells('A1', 'A2'))


will have the steps...

.. code-block:: python

    Consolidating 30 from wells A1...H1 in "1" to wells A1...A2 in "1"
    Transferring 30 from wells A1...H1 in "1" to wells A1...A2 in "1"
    Picking up tip well A1 in "2"
    Aspirating 30.0 uL from well A1 in "1" at 1 speed
    Aspirating 30.0 uL from well B1 in "1" at 1 speed
    Aspirating 30.0 uL from well C1 in "1" at 1 speed
    Aspirating 30.0 uL from well D1 in "1" at 1 speed
    Dispensing 120.0 uL into well A1 in "1"
    Aspirating 30.0 uL from well E1 in "1" at 1 speed
    Aspirating 30.0 uL from well F1 in "1" at 1 speed
    Aspirating 30.0 uL from well G1 in "1" at 1 speed
    Aspirating 30.0 uL from well H1 in "1" at 1 speed
    Dispensing 120.0 uL into well A2 in "1"
    Dropping tip well A1 in "12"

Distribute
-----------

Volumes from the same source well are combined within the same tip, so that one aspirate can provide for multiple dispenses.

.. code-block:: python

    pipette.distribute(55, plate.wells('A1'), plate.rows('A'))


will have the steps...

.. code-block:: python

    Distributing 55 from well A1 in "1" to wells A1...A12 in "1"
    Transferring 55 from well A1 in "1" to wells A1...A12 in "1"
    Picking up tip well A1 in "2"
    Aspirating 250.0 uL from well A1 in "1" at 1 speed
    Dispensing 55.0 uL into well A1 in "1"
    Dispensing 55.0 uL into well A2 in "1"
    Dispensing 55.0 uL into well A3 in "1"
    Dispensing 55.0 uL into well A4 in "1"
    Blowing out at well A1 in "12"
    Aspirating 250.0 uL from well A1 in "1" at 1 speed
    Dispensing 55.0 uL into well A5 in "1"
    Dispensing 55.0 uL into well A6 in "1"
    Dispensing 55.0 uL into well A7 in "1"
    Dispensing 55.0 uL into well A8 in "1"
    Blowing out at well A1 in "12"
    Aspirating 250.0 uL from well A1 in "1" at 1 speed
    Dispensing 55.0 uL into well A9 in "1"
    Dispensing 55.0 uL into well A10 in "1"
    Dispensing 55.0 uL into well A11 in "1"
    Dispensing 55.0 uL into well A12 in "1"
    Blowing out at well A1 in "12"
    Dropping tip well A1 in "12"


If there are multiple source wells, the pipette will never combine their volumes into the same tip.

.. code-block:: python

    pipette.distribute(30, plate.wells('A1', 'A2'), plate.rows('A'))

will have the steps...

.. code-block:: python

    Distributing 30 from wells A1...A2 in "1" to wells A1...A12 in "1"
    Transferring 30 from wells A1...A2 in "1" to wells A1...A12 in "1"
    Picking up tip well A1 in "2"
    Aspirating 210.0 uL from well A1 in "1" at 1 speed
    Dispensing 30.0 uL into well A1 in "1"
    Dispensing 30.0 uL into well A2 in "1"
    Dispensing 30.0 uL into well A3 in "1"
    Dispensing 30.0 uL into well A4 in "1"
    Dispensing 30.0 uL into well A5 in "1"
    Dispensing 30.0 uL into well A6 in "1"
    Blowing out at well A1 in "12"
    Aspirating 210.0 uL from well A2 in "1" at 1 speed
    Dispensing 30.0 uL into well A7 in "1"
    Dispensing 30.0 uL into well A8 in "1"
    Dispensing 30.0 uL into well A9 in "1"
    Dispensing 30.0 uL into well A10 in "1"
    Dispensing 30.0 uL into well A11 in "1"
    Dispensing 30.0 uL into well A12 in "1"
    Blowing out at well A1 in "12"
    Dropping tip well A1 in "12"

Disposal Volume
---------------

When dispensing multiple times from the same tip, it is recommended to aspirate an extra amount of liquid to be disposed of after distributing. This added ``disposal_vol`` can be set as an optional argument. There is a default disposal volume (equal to the pipette's minimum volume), which will be blown out at the trash after the dispenses.

.. code-block:: python

    pipette.distribute(
        30,
        plate.wells('A1', 'A2'),
        plate.cols('2'),
        disposal_vol=10)   # include extra liquid to make dispenses more accurate


will have the steps...

.. code-block:: python

    Distributing 30 from wells A1...A2 in "1" to wells A2...H2 in "1"
    Transferring 30 from wells A1...A2 in "1" to wells A2...H2 in "1"
    Picking up tip well A1 in "2"
    Aspirating 130.0 uL from well A1 in "1" at 1 speed
    Dispensing 30.0 uL into well A2 in "1"
    Dispensing 30.0 uL into well B2 in "1"
    Dispensing 30.0 uL into well C2 in "1"
    Dispensing 30.0 uL into well D2 in "1"
    Blowing out at well A1 in "12"
    Aspirating 130.0 uL from well A2 in "1" at 1 speed
    Dispensing 30.0 uL into well E2 in "1"
    Dispensing 30.0 uL into well F2 in "1"
    Dispensing 30.0 uL into well G2 in "1"
    Dispensing 30.0 uL into well H2 in "1"
    Blowing out at well A1 in "12"
    Dropping tip well A1 in "12"

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


will have the steps...

.. code-block:: python

    Transferring 100 from wells A1...A3 in "1" to wells B1...B3 in "1"
    Picking up tip well A1 in "2"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well B1 in "1"
    Dropping tip well A1 in "12"
    Picking up tip well B1 in "2"
    Aspirating 100.0 uL from well A2 in "1" at 1 speed
    Dispensing 100.0 uL into well B2 in "1"
    Dropping tip well A1 in "12"
    Picking up tip well C1 in "2"
    Aspirating 100.0 uL from well A3 in "1" at 1 speed
    Dispensing 100.0 uL into well B3 in "1"
    Dropping tip well A1 in "12"

Never Get a New Tip
------------------------

For scenarios where you instead are calling ``pick_up_tip()`` and ``drop_tip()`` elsewhere in your protocol, the transfer command can ignore picking up or dropping tips.

.. code-block:: python

    pipette.pick_up_tip()
    ...
    pipette.transfer(
        100,
        plate.wells('A1', 'A2', 'A3'),
        plate.wells('B1', 'B2', 'B3'),
        new_tip='never')    # never pick up or drop a tip
    ...
    pipette.drop_tip()


will have the steps...

.. code-block:: python

    Picking up tip well A1 in "2"
    ...
    Transferring 100 from wells A1...A3 in "1" to wells B1...B3 in "1"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well B1 in "1"
    Aspirating 100.0 uL from well A2 in "1" at 1 speed
    Dispensing 100.0 uL into well B2 in "1"
    Aspirating 100.0 uL from well A3 in "1" at 1 speed
    Dispensing 100.0 uL into well B3 in "1"
    ...
    Dropping tip well A1 in "12"


Use One Tip
------------------------

The default behavior of complex commands is to use one tip:

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1', 'A2', 'A3'),
        plate.wells('B1', 'B2', 'B3'),
        new_tip='once')    # use one tip (default behavior)

will have the steps...

.. code-block:: python

    Transferring 100 from wells A1...A3 in "1" to wells B1...B3 in "1"
    Picking up tip well A1 in "2"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well B1 in "1"
    Aspirating 100.0 uL from well A2 in "1" at 1 speed
    Dispensing 100.0 uL into well B2 in "1"
    Aspirating 100.0 uL from well A3 in "1" at 1 speed
    Dispensing 100.0 uL into well B3 in "1"
    Dropping tip well A1 in "12"

Trash or Return Tip
------------------------

By default, the transfer command will drop the pipette's tips in the trash container. However, if you wish to instead return the tip to it's tip rack, you can set ``trash=False``.

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1'),
        plate.wells('B1'),
        trash=False)       # do not trash tip


will have the steps...

.. code-block:: python

    Transferring 100 from well A1 in "1" to well B1 in "1"
    Picking up tip well A1 in "2"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well B1 in "1"
    Returning tip
    Dropping tip well A1 in "2"

Touch Tip
---------

A touch-tip can be performed after every aspirate and dispense by setting ``touch_tip=True``.

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1'),
        plate.wells('A2'),
        touch_tip=True)     # touch tip to each well's edge


will have the steps...

.. code-block:: python

    Transferring 100 from well A1 in "1" to well A2 in "1"
    Picking up tip well A1 in "2"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Touching tip
    Dispensing 100.0 uL into well A2 in "1"
    Touching tip
    Dropping tip well A1 in "12"

Blow Out
--------

A blow-out can be performed after every dispense that leaves the tip empty by setting ``blow_out=True``.

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1'),
        plate.wells('A2'),
        blow_out=True)      # blow out droplets when tip is empty


will have the steps...

.. code-block:: python

    Transferring 100 from well A1 in "1" to well A2 in "1"
    Picking up tip well A1 in "2"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well A2 in "1"
    Blowing out
    Dropping tip well A1 in "12"

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


will have the steps...

.. code-block:: python

    Transferring 100 from well A1 in "1" to well A2 in "1"
    Picking up tip well A1 in "2"
    Mixing 2 times with a volume of 50ul
    Aspirating 50 uL from well A1 in "1" at 1.0 speed
    Dispensing 50 uL into well A1 in "1"
    Aspirating 50 uL from well A1 in "1" at 1.0 speed
    Dispensing 50 uL into well A1 in "1"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Dispensing 100.0 uL into well A2 in "1"
    Mixing 3 times with a volume of 75ul
    Aspirating 75 uL from well A2 in "1" at 1.0 speed
    Dispensing 75.0 uL into well A2 in "1"
    Aspirating 75 uL from well A2 in "1" at 1.0 speed
    Dispensing 75.0 uL into well A2 in "1"
    Aspirating 75 uL from well A2 in "1" at 1.0 speed
    Dispensing 75.0 uL into well A2 in "1"
    Dropping tip well A1 in "12"

Air Gap
-------

An air gap can be performed after every aspirate by setting ``air_gap=int``, where the value is the volume of air in microliters to aspirate after aspirating the liquid.

.. code-block:: python

    pipette.transfer(
        100,
        plate.wells('A1'),
        plate.wells('A2'),
        air_gap=20)         # add 20uL of air after each aspirate


will have the steps...

.. code-block:: python

    Transferring 100 from well A1 in "1" to well A2 in "1"
    Picking up tip well A1 in "2"
    Aspirating 100.0 uL from well A1 in "1" at 1 speed
    Air gap
    Aspirating 20 uL from well A1 in "1" at 1.0 speed
    Dispensing 20 uL into well A2 in "1"
    Dispensing 100.0 uL into well A2 in "1"
    Dropping tip well A1 in "12"


.. _multi-channel-lh:

Multi-Channel Pipettes and Complex Liquid Handling
==================================================

When the robot is determining positioning for a multi-channel pipette, it uses
the back-nozzle (`A1` channel) to move to the plate. While considering which
wells you should input into your complex function, always keep in mind that
you should determine the multi-channel position via the back-nozzle position.

We will be using the code-block below to perform our examples.

.. code-block:: python

    from opentrons import robot, labware, instruments

    plate_96 = labware.load('96-flat', '1')
    plate_384 = labware.load('384-plate', '3')
    trough = labware.load('trough-12row', '4')

    tiprack = labware.load('opentrons_96_tiprack_300ul', '2')

    multi_pipette = instruments.P300_Multi(
        mount='left',
        tip_racks=[tiprack])

Transfer in a 96 Well Plate
---------------------------

If you want to move across a 96 well plate using a multi-channel you can do the
following:

.. code-block:: python

    multi_pipette.transfer(50, plate_96.columns('1'), plate_96.columns('2', to='12'))

will have the steps

.. code-block:: python

        Transferring 50 from well A1 in "3" to wells A2...H12 in "3"
        Picking up tip wells A1...H1 in "4"
        Aspirating 50.0 uL from wells A1...H1 in "3" at 1 speed
        Dispensing 50.0 uL into wells A2...H2 in "3"
        Aspirating 50.0 uL from wells A1...H1 in "3" at 1 speed
        Dispensing 50.0 uL into wells A3...H3 in "3"
        Aspirating 50.0 uL from wells A1...H1 in "3" at 1 speed
        Dispensing 50.0 uL into wells A4...H4 in "3"
        Aspirating 50.0 uL from wells A1...H1 in "3" at 1 speed
        Dispensing 50.0 uL into wells A5...H5 in "3"
        Aspirating 50.0 uL from wells A1...H1 in "3" at 1 speed
        Dispensing 50.0 uL into wells A6...H6 in "3"
        Aspirating 50.0 uL from wells A1...H1 in "3" at 1 speed
        Dispensing 50.0 uL into wells A7...H7 in "3"
        Aspirating 50.0 uL from wells A1...H1 in "3" at 1 speed
        Dispensing 50.0 uL into wells A8...H8 in "3"
        Aspirating 50.0 uL from wells A1...H1 in "3" at 1 speed
        Dispensing 50.0 uL into wells A9...H9 in "3"
        Aspirating 50.0 uL from wells A1...H1 in "3" at 1 speed
        Dispensing 50.0 uL into wells A10...H10 in "3"
        Aspirating 50.0 uL from wells A1...H1 in "3" at 1 speed
        Dispensing 50.0 uL into wells A11...H11 in "3"
        Aspirating 50.0 uL from wells A1...H1 in "3" at 1 speed
        Dispensing 50.0 uL into wells A12...H12 in "3"
        Dropping tip well A1 in "12"

or

.. code-block:: python

    multi_pipette.transfer(50, plate_96.wells('A1'), plate_96.columns('2', to='12'))

will have the steps

.. code-block:: python

    Transferring 50 from well A1 in "3" to wells A2...H12 in "3"
    Picking up tip wells A1...H1 in "4"
    Aspirating 50.0 uL from well A1 in "3" at 1 speed
    Dispensing 50.0 uL into wells A2...H2 in "3"
    Aspirating 50.0 uL from well A1 in "3" at 1 speed
    Dispensing 50.0 uL into wells A3...H3 in "3"
    Aspirating 50.0 uL from well A1 in "3" at 1 speed
    Dispensing 50.0 uL into wells A4...H4 in "3"
    Aspirating 50.0 uL from well A1 in "3" at 1 speed
    Dispensing 50.0 uL into wells A5...H5 in "3"
    Aspirating 50.0 uL from well A1 in "3" at 1 speed
    Dispensing 50.0 uL into wells A6...H6 in "3"
    Aspirating 50.0 uL from well A1 in "3" at 1 speed
    Dispensing 50.0 uL into wells A7...H7 in "3"
    Aspirating 50.0 uL from well A1 in "3" at 1 speed
    Dispensing 50.0 uL into wells A8...H8 in "3"
    Aspirating 50.0 uL from well A1 in "3" at 1 speed
    Dispensing 50.0 uL into wells A9...H9 in "3"
    Aspirating 50.0 uL from well A1 in "3" at 1 speed
    Dispensing 50.0 uL into wells A10...H10 in "3"
    Aspirating 50.0 uL from well A1 in "3" at 1 speed
    Dispensing 50.0 uL into wells A11...H11 in "3"
    Aspirating 50.0 uL from well A1 in "3" at 1 speed
    Dispensing 50.0 uL into wells A12...H12 in "3"
    Dropping tip well A1 in "12"

.. note::

    The following scenarios may _not_ work as you expect them to.

    .. code-block:: python

        multi_pipette.transfer(50, plate_96.wells('A1'), plate_96.wells())

    The multi-channel would visit **every** well in the plate and dispense liquid
    outside of the plate boundaries so be careful!

    .. code-block:: python

        multi_pipette.transfer(50, plate_96.wells('A1'), plate_96.rows('A'))

    In this scenario, the multi-channel would only visit the first column of the plate.


Transfer in a 384 Well Plate
----------------------------

In a 384 Well plate, there are 2 sets of 'columns' that the multi-channel can
dispense into ['A1', 'C1'...'A2', 'C2'...] and ['B1', 'D1'...'B2', 'D2'].

If you want to transfer to a 384 well plate in order, you can do:

.. code-block:: python

    alternating_wells = []
    for row in plate_384.rows():
        alternating_wells.append(row.wells('A'))
        alternating_wells.append(row.wells('B'))
    multi_pipette.transfer(50, trough.wells('A1'), alternating_wells)


or you can choose to dispense by row first, moving first through row A
and then through row B of the 384 well plate.

.. code-block:: python

    list_of_wells = [for well in plate_384.rows('A')] + [for well in plate_384.rows('B')]
    multi_pipette.transfer(50, trough.wells('A1'), list_of_wells)
