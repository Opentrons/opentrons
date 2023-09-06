:og:description: The order of basic commands that are part of a complex liquid handling commmand in the Python API.

.. _complex-command-order:

*******************
Order of Operations
*******************

Complex commands perform a series of :ref:`v2-atomic-commands` in order. In fact, the run preview for your protocol in the Opentrons App lists all of these commands as separate steps. This lets you examine what effect your complex commands will have before running them. 

This page describes what steps you should expect the robot to perform when using different complex commands with different required and :ref:`optional <complex_params>` parameters.

Complete Order
==============

The order of steps is fixed within complex commands. Aspiration and dispensing are the only required actions. You can enable or disable all of the other actions with :ref:`complex_params`. A complex command designed to perform every possible action will proceed in this order:

    1. Pick up tip
    2. Mix at source
    3. Aspirate from source
    4. Touch tip at source
    5. Air gap
    6. Dispense into destination
    7. Mix at destination
    8. Touch tip at destination
    9. Empty disposal volume, if present in tip
    10. Blow out, if tip is empty
    11. Drop tip
    
The command may repeat some or all of these steps in order to move liquid as requested. :py:meth:`.transfer` repeats as many times as there are wells in the longer of its ``source`` or ``dest`` argument. :py:meth:`.distribute` and :py:meth:`.consolidate` try to repeat as few times as possible. See :ref:`complex-tip-refilling` below for how they behave when they do need to repeat.

Example Orders
==============

The smallest possible number of steps in a complex command is just two: aspirating and dispensing. This is possible by omitting the tip pickup and drop steps::

    pipette.transfer(
        volume=100,
        source=plate["A1"],
        dest=plate["B1"],
        new_tip="never",
    )

Let's look at another example, a distribute command that adds touch tip steps (and does not turn off tip handling). The code for this command is::

    pipette.distribute(
        volume=100,
        source=[plate["A1"]],
        dest=[plate["B1"], plate["B2"]],
        touch_tip=True,
    )
    
Compared to the list of all possible actions, this code will only perform the following:

    1. Pick up tip
    2. Aspirate from source
    3. Touch tip at source
    4. Dispense into destination
    5. Touch tip at destination
    6. Blow out
    7. Drop tip
    
Let's unpack this. Picking up and dropping tips is default behavior for ``distribute()``. Specifying ``touch_tip=True`` adds two steps, as it is performed at both the source and destination. And it's also default behavior for ``distribute()`` to aspirate a disposal volume, which is blown out before dropping the tip. The exact order of steps in the run preview should look similar to this:

.. code-block:: text

    Picking up tip from A1 of tip rack on 3
    Aspirating 220.0 uL from A1 of well plate on 2 at 92.86 uL/sec
    Touching tip
    Dispensing 100.0 uL into B1 of well plate on 2 at 92.86 uL/sec
    Touching tip
    Dispensing 100.0 uL into B2 of well plate on 2 at 92.86 uL/sec
    Touching tip
    Blowing out at A1 of Opentrons Fixed Trash on 12
    Dropping tip into A1 of Opentrons Fixed Trash on 12
    
Since dispensing and touching the tip are both associated with the destination wells, those steps are performed at each of the two destination wells.

.. _complex-tip-refilling:

Tip Refilling
=============

One factor that affects the exact order of steps for a complex command is whether the amount of liquid being moved can fit in the tip at once. If it won't fit, you don't have to adjust your command. The API will handle it for you by including additional steps to refill the tip when needed.

For example, say you need to move 100 µL of liquid from one well to another, but you only have a 50 µL pipette attached to your robot. To accomplish this with building block commands, you'd need multiple aspirates and dispenses. ``aspirate(volume=100)`` would raise an error, since it exceeds the tip's volume. But you can accomplish this with a single transfer command::

    pipette50.transfer(
        volume=100,
        source=plate["A1"],
        dest=plate["B1"],
    )

To effect the transfer, the API will aspirate and dispense the maximum volume of the pipette (50 µL) twice:

.. code-block:: text

	Picking up tip from A1 of tip rack on D3
	Aspirating 50.0 uL from A1 of well plate on D2 at 57 uL/sec
	Dispensing 50.0 uL into B1 of well plate on D2 at 57 uL/sec
	Aspirating 50.0 uL from A1 of well plate on D2 at 57 uL/sec
	Dispensing 50.0 uL into B1 of well plate on D2 at 57 uL/sec
	Dropping tip into A1 of Opentrons Fixed Trash on A3

You can change ``volume`` to any value (above the minimum volume of the pipette) and the API will automatically calculate how many times the pipette needs to aspirate and dispense. ``volume=50`` would require just one repetition. ``volume=75`` would require two, split into 50 µL and 25 µL. ``volume=1000`` would repeat 20 times — not very efficient, but perhaps more useful than having to swap to a different pipette!

.. _distribute-consolidate-volume-list:
.. _complex-variable-volumes:

Variable Volumes
================

