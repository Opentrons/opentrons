.. _v2-atomic-commands:

########################
Atomic Liquid Handling
########################

Atomic liquid handling refers to the smallest individual action that can be completed on a robot.
For example, a liquid transfer at its core, found in :ref:`v2-complex-commands`, can be separated into a series of ``pick_up_tip()``, ``aspirate()``, ``dispense()``, ``drop_tip()`` etc.

For the purposes of this section we can assume that we already have the following:

.. code-block:: python

    def run(protocol_context):
        tiprack = protocol_context.load_labware('corning_96_wellplate_360ul_flat', 2)
        plate = protocol_context.load_labware('opentrons_96_tiprack_300ul', 3)
        pipette = protocol_context.load_instrument('p300_single', mount='left')

**************
Tip Handling
**************

When we handle liquids with a pipette, we are constantly exchanging old, used tips for new ones to prevent cross-contamination between our wells. To help with this constant need, we describe in this section a few methods for getting new tips, and removing tips from a pipette.

Pick Up Tip
===========

Before any liquid handling can be done, your pipette must have a tip on it. The command ``pick_up_tip()`` will move the pipette over to the specified tip, the press down into it to create a vacuum seal. The below example picks up the tip at location ``'A1'``.

.. code-block:: python

    pipette.pick_up_tip(tiprack['A1'])

If you have associated a tiprack with your pipette such as in the :ref:`new_pipette` section or :ref:`protocol_api-protocols-and-instruments`, then you can simply call

.. code-block:: python

    pipette.pick_up_tip()

Drop Tip
===========

Once finished with a tip, the pipette will autonomously remove the tip when we call ``drop_tip()``. We can specify where to drop the tip by passing in a location. The below example drops the tip back at its originating location on the tip rack.
If no location is specified, it will go to the fixed trash location on the deck.
.. code-block:: python

    pipette.drop_tip(tiprack['A1'])

Instead of returning a tip to the tip rack, we can also drop it in an alternative trash container besides the fixed trash on the deck.

.. code-block:: python

    trash = protocol_context.load_labware('trash-box', 4)
    pipette.pick_up_tip()
    pipette.drop_tip(trash)

Return Tip
===========

When we need to return the tip to its originating location on the tip rack, we can simply call ``return_tip()``. The example below will automatically return the tip to ``'A3'`` on the tip rack.

.. code-block:: python

    pipette.pick_up_tip(tiprack['A3'])
    pipette.return_tip()


**********************

For the purposes of this section we can assume that we already have the following:

.. code-block:: python

    def run(protocol_context):
        tiprack = protocol_context.load_labware('corning_96_wellplate_360ul_flat', 2)
        plate = protocol_context.load_labware('opentrons_96_tiprack_300ul', 3)
        pipette = protocol_context.load_instrument('p300_single', mount='left', tip_racks=[tiprack])

Iterating Through Tips
----------------------

Now that we have two tip racks attached to the pipette, we can automatically step through each tip whenever we call ``pick_up_tip()``. We then have the option to either ``return_tip()`` to the tip rack, or we can ``drop_tip()`` to remove the tip in the attached trash container.

.. code-block:: python

    pipette.pick_up_tip()  # picks up tip_rack_1:A1
    pipette.return_tip()
    pipette.pick_up_tip()  # picks up tip_rack_1:A2
    pipette.drop_tip()     # automatically drops in trash

    # use loop to pick up tips tip_rack_1:A3 through tip_rack_2:H12
    tips_left = 94 + 96 # add up the number of tips leftover in both tipracks
    for _ in range(tips_left):
        pipette.pick_up_tip()
        pipette.return_tip()

If we try to ``pick_up_tip()`` again when all the tips have been used, the Opentrons API will show you an error.

.. note::

    If you run the cell above, and then uncomment and run the cell below, you will get an error because the pipette is out of tips.

.. code-block:: python

    # this will raise an exception if run after the previous code block
    # pipette.pick_up_tip()

****************
Liquid Control
****************

This is the fun section, where we get to move things around and pipette! This section describes the ``InstrumentContext`` object's many liquid-handling commands, as well as how to move the ``robot``.
Please note that the default now for pipette aspirate and dispense location is a 1mm offset from the **bottom** of the well now.

**********************

.. code-block:: python

    def run(protocol_context):
        tiprack = protocol_context.load_labware('corning_96_wellplate_360ul_flat', 2)
        plate = protocol_context.load_labware('opentrons_96_tiprack_300ul', 3)
        pipette = protocol_context.load_instrument('p300_single', mount='left', tip_racks=[tiprack])
        pipette.pick_up_tip()

Aspirate
========

To aspirate is to pull liquid up into the pipette's tip. When calling aspirate on a pipette, we can specify how many micoliters, and at which location, to draw liquid from:

.. code-block:: python

    pipette.aspirate(50, plate['A1'])  # aspirate 50uL from plate:A1

Now our pipette's tip is holding 50uL.

We can also simply specify how many microliters to aspirate, and not mention a location. The pipette in this circumstance will aspirate from it's current location (which we previously set as ``plate['A1'])``.

.. code-block:: python

    pipette.aspirate(50)                     # aspirate 50uL from current position

Now our pipette's tip is holding 100uL.

We can also specify only the location to aspirate from. If we do not tell the pipette how many microliters to aspirate, it will by default fill up the remaining volume in its tip. In this example, since we already have 100uL in the tip, the pipette will aspirate another 200uL

.. code-block:: python

    pipette.aspirate(plate['A2'])      # aspirate until pipette fills from plate:A2


Dispense
========

To dispense is to push out liquid from the pipette's tip. Its usage in the Opentrons API is nearly identical to ``aspirate()``, in that you can specify microliters and location, only microliters, or only a location:

.. code-block:: python

    pipette.dispense(50, plate['B1']) # dispense 50uL to plate:B1
    pipette.dispense(50)              # dispense 50uL to current position
    pipette.dispense(plate['B2'])     # dispense until pipette empties to plate:B2

That final dispense without specifying a microliter amount will dispense all remaining liquids in the tip to ``plate['B2']``, and now our pipette is empty.

.. _blow-out:

Blow Out
========

To blow out is to push an extra amount of air through the pipette's tip, so as to make sure that any remaining droplets are expelled.

When calling ``blow_out()`` on a pipette, we have the option to specify a location to blow out the remaining liquid. If no location is specified, the pipette will blow out from its current position.

.. code-block:: python

    pipette.blow_out()            # blow out in current location
    pipette.blow_out(plate['B3']) # blow out in current plate:B3

.. _touch-tip:

Touch Tip
=========

To touch tip is to move the pipette's currently attached tip to four opposite edges of a well, for the purpose of knocking off any droplets that might be hanging from the tip.

When calling ``touch_tip()`` on a pipette, we have the option to specify a location where the tip will touch the inner walls.

Touch tip can take up to 4 arguments: ``touch_tip(location, radius, v_offset, speed)``.

.. code-block:: python

    pipette.touch_tip()            # touch tip within current location
    pipette.touch_tip(v_offset=-2) # touch tip 2mm below the top of the current location
    pipette.touch_tip(plate['B1']) # touch tip within plate:B1
    pipette.touch_tip(plate['B1'], # touch tip in plate:B1, at 75% of total radius and -2mm from top of well
                      radius=0.75,
                      v_offset=-2)

.. _mix:

Mix
===

Mixing is simply performing a series of ``aspirate()`` and ``dispense()`` commands in a row on a single location. However, instead of having to write those commands out every time, the Opentrons API allows you to simply say ``mix()``.

The mix command takes three arguments: ``mix(repetitions, volume, location)``

.. code-block:: python

    pipette.mix(4, 100, plate.['A2'])   # mix 4 times, 100uL, in plate:A2
    pipette.mix(3, 50)                  # mix 3 times, 50uL, in current location
    pipette.mix(2)                      # mix 2 times, pipette's max volume, in current location

.. _air-gap:

Air Gap
=======

Some liquids need an extra amount of air in the pipette's tip to prevent it from sliding out. A call to ``air_gap()`` with a microliter amount will aspirate that much air into the tip.

.. code-block:: python

    pipette.aspirate(100, plate['B4'])
    pipette.air_gap(20)
    pipette.drop_tip()

******
Moving
******

Move To
=======

Pipettes are able to ``move_to()`` any location on the deck.

For example, we can move to the first tip in our tip rack:

.. code-block:: python

    pipette.move_to(tiprack['A1'])

You can also specify at what height you would like the robot to move to inside of a location using ``top()`` and ``bottom()`` methods on that location.

.. code-block:: python

    pipette.move_to(plate['A1'].bottom())  # move to the bottom of well A1
    pipette.move_to(plate['A1'].top())     # move to the top of well A1
    pipette.move_to(plate['A1'].bottom(2)) # move to 2mm above the bottom of well A1
    pipette.move_to(plate['A1'].top(-2))   # move to 2mm below the top of well A1

The above commands will cause the robot's head to first move upwards, then over to above the target location, then finally downwards until the target location is reached.
If instead you would like the robot to move in a straight line to the target location, you can set the movement strategy to ``'direct'``.

.. code-block:: python

    pipette.move_to(plate['A1'], force_direct=True)

.. warning::

    Moving without an arc will run the risk of colliding with things on your deck. Be very careful when using this option.

Usually the above option is useful when moving inside of a well. Take a look at the below sequence of movements, which first move the head to a well, and use 'direct' movements inside that well, then finally move on to a different well.

.. code-block:: python

    pipette.move_to(plate['A1'])
    pipette.move_to(plate['A1'].bottom(1), force_direct=True)
    pipette.move_to(plate['A1'].top(-2), force_direct=True)
    pipette.move_to(plate['A2'])

Delay
=====

Pause your protocol for any given number of minutes or seconds. The value passed into ``delay()`` is the number of minutes or seconds the robot will wait until moving on to the next commands.

.. code-block:: python

    protocol_context.delay(seconds=2)             # pause for 2 seconds
    protocol_context.delay(minutes=5)             # pause for 5 minutes
    protocol_context.delay(minutes=5, seconds=2)  # pause for 5 minutes and 2 seconds
