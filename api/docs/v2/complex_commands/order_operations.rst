:og:description: The order of basic commands that are part of a complex liquid handling commmand in the Python API.

.. _complex-command-order:

*******************
Order of Operations
*******************

Complex commands perform a series of :ref:`building block commands <v2-atomic-commands>` in order. In fact, the run preview for your protocol in the Opentrons App lists all of these commands as separate steps. This lets you examine what effect your complex commands will have before running them. 

This page describes what steps you should expect the robot to perform when using different complex commands with different required and :ref:`optional <complex_params>` parameters.

Step Sequence
=============

The order of steps is fixed within complex commands, but legacy and liquid class complex commands handle transfer steps and changes to actions differently.


In a ``transfer()``, aspiration and dispensing are the only required actions. You can enable or disable all of the other actions with :ref:`complex liquid handling parameters <complex_params>`. A ``transfer()`` command designed to perform every possible action will proceed in this order:

    1. Pick up tip
    2. Mix at source
    3. Aspirate from source
    4. Touch tip at source
    5. Air gap
    6. Dispense into destination
    7. Mix at destination
    8. Touch tip at destination
    9. Blow out
    10. Drop tip
    

In a ``transfer_with_liquid_class()``, your chosen liquid class definition specifies nearly all transfer behavior your Flex pipette will perform, like position information. For more information, see :ref:`liquid-class-definitions`. 

A liquid class definition with every action enabled would proceed in this order: 

To **aspirate:**
1. Pick up tip
2. Submerge into the source well to the aspirate position
3. Delay for an amount of time
4. Mix at the aspirate position
5. Pre-wet the attached tip at the aspirate position
6. Aspirate from the source well
7. Delay for an amount of time
8. Retract from the source well to the specified position
9. Touch tip at the source well
10. Add an air gap 

To **dispense:**
11. Move to and submerge into the destination well to the dispense position
12. Delay for an amount of time 
13. Dispense into the destination well
14. Push out into the destination well
15. Delay for an amount of time 
16. Mix at the dispense position
17. Retract from the destination well to the specified position
18. Delay for an amount of time
19. Blow out at the specified location
20. Touch tip at the blow out location
21. Drop tip

Each command may repeat some or all of these steps in order to move liquid as requested. :py:meth:`.transfer` repeats as many times as there are wells in the longer of its ``source`` or ``dest`` arguments. Both legacy and liquid class distribute and consolidate methods try to repeat as few times as possible. See :ref:`complex-tip-refilling` below for how they behave when they do need to repeat. 

Example Orders
==============

The smallest possible number of steps in a complex command like ``transfer()`` is just two: aspirating and dispensing. This is possible by omitting the tip pickup and drop steps::

    pipette.transfer(
        volume=100,
        source=plate["A1"],
        dest=plate["B1"],
        new_tip="never",
    )

You can also use ``new_tip="never"`` to reuse pipette tips and decrease the total number of steps in any liquid class complex command. 

Here's another example, a distribute command that adds touch tip steps (and does not turn off tip handling). The code for this command is::

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

If you use ``distribute_with_liquid_class()`` to perform the same transfer, the liquid class definition automatically determines transfer behaviors like touch tip and blow out. For more information on automatic changes to transfer steps, see the :ref:`liquid-class-definitions`. 

.. _complex-tip-refilling:

Tip Refilling
=============

One factor that affects the exact order of steps for a complex command is whether the amount of liquid being moved can fit in the tip at once. If it won't fit, you don't have to adjust your command. The API will handle it for you by including additional steps to refill the tip when needed.

For example, say you need to move 100 µL of liquid from one well to another, but you only have a 50 µL pipette attached to your robot. To accomplish this with building block commands, you'd need multiple aspirates and dispenses. ``aspirate(volume=100)`` would raise an error, since it exceeds the tip's volume. But you can accomplish this with a single command::

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

Remember that ``distribute()`` includes a disposal volume by default, and this can affect the number of times the pipette refills its tip. Say you want to ``distribute()`` 80 µL to each of the 12 wells in row A of a plate. That's 960 µL total — less than the capacity of the pipette — but the 100 µL disposal volume will cause the pipette to refill.

.. code-block:: text

    Picking up tip from A1 of tip rack on 3
    Aspirating 980.0 uL from A1 of well plate on 2 at 274.7 uL/sec
    Dispensing 80.0 uL into B1 of well plate on 2 at 274.7 uL/sec
    Dispensing 80.0 uL into B2 of well plate on 2 at 274.7 uL/sec
    ... 
    Dispensing 80.0 uL into B11 of well plate on 2 at 274.7 uL/sec
    Blowing out at A1 of Opentrons Fixed Trash on 12
    Aspirating 180.0 uL from A1 of well plate on 2 at 274.7 uL/sec
    Dispensing 80.0 uL into B12 of well plate on 2 at 274.7 uL/sec
    Blowing out at A1 of Opentrons Fixed Trash on 12
    Dropping tip into A1 of Opentrons Fixed Trash on 12
    
This command will blow out 200 total µL of liquid in the trash. If you need to conserve liquid, use :ref:`complex liquid handling parameters <complex_params>` to reduce or eliminate the :ref:`disposal volume <param-disposal-volume>`, or to :ref:`blow out <param-blow-out>` in a location other than the trash.

.. _distribute-consolidate-volume-list:
.. _complex-list-volumes:

List of Volumes
===============

Legacy complex commands like ``transfer()`` can aspirate or dispense different amounts for different wells, rather than the same amount across all wells. Liquid class complex commands, like ``transfer_with_liquid_class()`` only accept a single volume argument, and aspirate or dispense the same amount across wells. 

To do this in a ``transfer()``, set the ``volume`` parameter to a list of volumes instead of a single number. The list must be the same length as the number of ``source`` or ``dest`` (or the longer of the two for a ``transfer()``), or the API will raise an error. For example, this command transfers a different amount of liquid into each of wells B1, B2, and B3::

    pipette.transfer(
        volume=[20, 40, 60],
        source=plate["A1"],
        dest=[plate["B1"], plate["B2"], plate["B3"]],
    )

.. versionadded: 2.0

Setting any item in the list to ``0`` will skip aspirating and dispensing for the corresponding well. This example takes the command from above and skips B2::

    pipette.transfer(
        volume=[20, 0, 60],
        source=plate["A1"],
        dest=[plate["B1"], plate["B2"], plate["B3"]],
    )
    
The pipette dispenses in B1 and B3, and does not move to B2 at all.

.. code-block:: text

	Picking up tip from A1 of tip rack on 3
	Aspirating 20.0 uL from A1 of well plate on 2 at 274.7 uL/sec
	Dispensing 20.0 uL into B1 of well plate on 2 at 274.7 uL/sec
	Aspirating 60.0 uL from A1 of well plate on 2 at 274.7 uL/sec
	Dispensing 60.0 uL into B3 of well plate on 2 at 274.7 uL/sec
	Dropping tip into A1 of Opentrons Fixed Trash on 12

This is such a simple example that you might prefer to use two ``transfer()`` commands instead. Lists of volumes become more useful when they are longer than a couple elements. For example, you can specify ``volume`` as a list with 96 items and ``dest=plate.wells()`` to individually control amounts to dispense (and wells to skip) across an entire plate.
	
.. note::
    When the optional ``new_tip`` parameter is set to ``"always"``, the pipette will pick up and drop a tip even for skipped wells. If you don't want to waste tips, pre-process your list of sources or destinations and use the result as the argument of your complex command.

.. versionadded:: 2.0
    Skip wells for ``transfer()`` and ``distribute()``.
.. versionadded:: 2.8
    Skip wells for ``consolidate()``.
