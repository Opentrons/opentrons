:og:description: Building block commands are the smallest individual actions that Opentrons robots can perform.

.. _v2-atomic-commands:

***********************
Building Block Commands
***********************

Building block commands execute some of the most basic actions that your robot can complete. But basic doesn’t mean these commands lack capabilities. They perform important tasks in your protocols. They're also foundational to the :ref:`complex commands <v2-complex-commands>` that help you write and run longer, more intricate procedures. In this section, we'll look at building block commands that let you work with pipette tips, liquids, and robot utility features.

************
Tip Handling
************

By default, the robot constantly exchanges old, used tips for new ones to prevent cross-contamination between wells. Tip handling uses the functions :py:meth:`.InstrumentContext.pick_up_tip`, :py:meth:`.InstrumentContext.drop_tip`, and :py:meth:`.InstrumentContext.return_tip`.

Pick Up Tip
===========

Before any liquid handling can be done, your pipette must have a tip on it. The command :py:meth:`.InstrumentContext.pick_up_tip` will move the pipette over to the specified tip, then press down into it to create a vacuum seal. The below example picks up the tip at location ``'A1'`` of the tiprack previously loaded in slot 3.

.. code-block:: python

   pipette.pick_up_tip(tiprack['A1'])

If you have associated a tiprack with your pipette such as in the :ref:`new-pipette` or :ref:`protocol_api-protocols-and-instruments` sections, then you can simply call

.. code-block:: python

    pipette.pick_up_tip()

This will use the next available tip from the list of tipracks passed in to the ``tip_racks`` argument of :py:meth:`.ProtocolContext.load_instrument`.

.. versionadded:: 2.0

Drop Tip
========

Once finished with a tip, the pipette will remove the tip when we call :py:meth:`.InstrumentContext.drop_tip`. You can specify where to drop the tip by passing in a location. The below example drops the tip back at its original location on the tip rack.
If no location is specified, the OT-2 will drop the tip in the fixed trash in slot 12 of the deck.

.. code-block:: python

    pipette.pick_up_tip()
    pipette.drop_tip(tiprack['A1'])  # drop back in A1 of the tiprack
    pipette.pick_up_tip()
    pipette.drop_tip()  # drop in the fixed trash on the deck


.. versionadded:: 2.0

.. _pipette-return-tip:

Return Tip
===========

To return the tip to the original location, you can call :py:meth:`.InstrumentContext.return_tip`. The example below will automatically return the tip to ``'A3'`` on the tip rack.

.. code-block:: python

    pipette.pick_up_tip(tiprack['A3'])
    pipette.return_tip()

.. note:

    In API Version 2.0 and 2.1, the returned tips are added back into the tip-tracker and thus treated as `unused`. If you make a subsequent call to `pick_up_tip` then the software will treat returned tips as valid locations.
    In API Version 2.2, returned tips are no longer added back into the tip tracker. This means that returned tips are no longer valid locations and the pipette will not attempt to pick up tips from these locations.
    Also in API Version 2.2, the return tip height was corrected to utilize values determined by hardware testing. This is more in-line with return tip behavior from Python Protocol API Version 1.

In API version 2.2 or above:

.. code-block:: python

    tip_rack = protocol.load_labware(
            'opentrons_96_tiprack_300ul', 1)
    pipette = protocol.load_instrument(
        'p300_single_gen2', mount='left', tip_racks=[tip_rack])

    pipette.pick_up_tip() # picks up tip_rack:A1
    pipette.return_tip()
    pipette.pick_up_tip() # picks up tip_rack:B1

In API version 2.0 and 2.1:

.. code-block:: python

    tip_rack = protocol.load_labware(
            'opentrons_96_tiprack_300ul', 1)
    pipette = protocol.load_instrument(
        'p300_single_gen2', mount='left', tip_racks=[tip_rack])

    pipette.pick_up_tip() # picks up tip_rack:A1
    pipette.return_tip()
    pipette.pick_up_tip() # picks up tip_rack:A1

Iterating Through Tips
----------------------

For this section, instead of using the protocol defined above, consider this setup:

.. code-block:: python
    :substitutions:

    from opentrons import protocol_api

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        plate = protocol.load_labware(
            'corning_96_wellplate_360ul_flat', 2)
        tip_rack_1 = protocol.load_labware(
            'opentrons_96_tiprack_300ul', 3)
        tip_rack_2 = protocol.load_labware(
            'opentrons_96_tiprack_300ul', 4)
        pipette = protocol.load_instrument(
            'p300_single_gen2', mount='left', tip_racks=[tip_rack_1, tip_rack_2])

This loads a `Corning 96 Well Plate <https://labware.opentrons.com/corning_96_wellplate_360ul_flat>`_ in slot 2 and two `Opentrons 300ul Tiprack <https://labware.opentrons.com/opentrons_96_tiprack_300ul>`_ in slots 3 and 4 respectively, and uses a P300 Single GEN2 pipette.

When a list of tip racks is associated with a pipette in its ``tip_racks`` argument, the pipette will automatically pick up the next unused tip in the list whenever you call :py:meth:`.InstrumentContext.pick_up_tip`. The pipette will first use all tips in the first tiprack, then move on to the second, and so on:

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

If you try to :py:meth:`.InstrumentContext.pick_up_tip()` again when all the tips have been used, the Protocol API will show you an error:

.. code-block:: python

    # this will raise an exception if run after the previous code block
    pipette.pick_up_tip()

To change the location of the first tip used by the pipette, you can use :py:obj:`.InstrumentContext.starting_tip`:

.. code-block:: python

    pipette.starting_tip = tip_rack_1.well('C3')
    pipette.pick_up_tip()  # pick up C3 from "tip_rack_1"
    pipette.return_tip()

To reset the tip tracking, you can call :py:meth:`.InstrumentContext.reset_tipracks`:

.. code-block:: python

    # Use up all tips
    for _ in range(96+96):
         pipette.pick_up_tip()
         pipette.return_tip()

    # Reset the tip tracker
    pipette.reset_tipracks()

    # Picks up a tip from well A1 of the first tip rack
    pipette.pick_up_tip()


.. versionadded:: 2.0

To check whether you should pick up a tip or not, you can utilize :py:meth:`.InstrumentContext.has_tip`:

.. code-block:: python

    for block in range(3):
        if block == 0 and not pipette.has_tip:
            pipette.pick_up_tip()
        else:
            m300.mix(mix_repetitions, 250, d)
            m300.blow_out(s.bottom(10))
            m300.return_tip()

.. versionadded:: 2.7

**********************

****************
Liquid Control
****************

This section describes the :py:class:`.InstrumentContext` 's liquid-handling commands.

The examples in this section should be inserted in the following:

.. code-block:: python
    :substitutions:

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol):
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat', 2)
        tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 3)
        pipette = protocol.load_instrument('p300_single_gen2', mount='left', tip_racks=[tiprack])
        pipette.pick_up_tip()
        # example code goes here


This loads a `Corning 96 Well Plate <https://labware.opentrons.com/corning_96_wellplate_360ul_flat>`_ in slot 2 and a `Opentrons 300ul Tiprack <https://labware.opentrons.com/opentrons_96_tiprack_300ul>`_ in slot 3, and uses a P300 Single GEN2 pipette.


.. _new-aspirate:

Aspirate
========

To aspirate is to pull liquid up into the pipette's tip. When calling :py:meth:`.InstrumentContext.aspirate` on a pipette, you can specify the volume to aspirate in µL, where to aspirate from, and how fast to aspirate liquid.

.. code-block:: python

    pipette.aspirate(50, plate['A1'], rate=2.0)  # aspirate 50uL from plate:A1

Now the pipette's tip is holding 50 µL.

The ``location`` parameter is either a well (like ``plate['A1']``) or a position within a well, like the return value of ``plate['A1'].bottom``.

The ``rate`` parameter is a multiplication factor of the pipette's default aspiration flow rate. The default aspiration flow rate for all pipettes is in the :ref:`defaults` section.

You can also simply specify the volume to aspirate, and not mention a location. The pipette will aspirate from its current location (which we previously set as ``plate['A1'])``.

.. code-block:: python

    pipette.aspirate(50)                     # aspirate 50uL from current position

Now our pipette's tip is holding 100 µL.

.. note::

    In version 1 of this API, ``aspirate`` (and ``dispense``) would inspect the types of the ``volume`` and ``location`` arguments and do the right thing if you specified only a location or specified location and volume out of order. In this and future versions of the Python Protocol API, this is no longer true. Like any other Python function, if you are specifying arguments by position without using their names, you must always specify them in order.

.. note::

    By default, the pipette will move to 1 mm above the bottom of the target well before aspirating.
    You can change this by using a well position function like :py:meth:`.Well.bottom` (see
    :ref:`v2-location-within-wells`) every time you call ``aspirate``, or - if you want to change
    the default throughout your protocol - you can change the default offset with
    :py:obj:`.InstrumentContext.well_bottom_clearance` (see :ref:`new-default-op-positions`).

.. versionadded:: 2.0

.. _new-dispense:

Dispense
========

To dispense is to push out liquid from the pipette's tip. The usage of :py:meth:`.InstrumentContext.dispense` in the Protocol API is similar to :py:meth:`.InstrumentContext.aspirate`, in that you can specify volume in µL and location, or only volume.

.. code-block:: python

    pipette.dispense(50, plate['B1'], rate=2.0) # dispense 50uL to plate:B1 at twice the normal rate
    pipette.dispense(50)              # dispense 50uL to current position at the normal rate


The ``location`` parameter is either a well (like ``plate['A1']``) or a position within a well, like the return value of ``plate['A1'].bottom``.

The ``rate`` parameter is a multiplication factor of the pipette's default dispense flow rate. The default dispense flow rate for all pipettes is in the :ref:`defaults` section.

.. note::

    By default, the pipette will move to 1 mm above the bottom of the target well before dispensing.
    You can change this by using a well position function like :py:meth:`.Well.bottom` (see
    :ref:`v2-location-within-wells`) every time you call ``dispense``, or - if you want to change
    the default throughout your protocol - you can change the default offset with
    :py:obj:`.InstrumentContext.well_bottom_clearance` (see :ref:`new-default-op-positions`).

.. note::

    In version 1 of this API, ``dispense`` (and ``aspirate``) would inspect the types of the ``volume`` and ``location`` arguments and do the right thing if you specified only a location or specified location and volume out of order. In this and future versions of the Python Protocol API, this is no longer true. Like any other Python function, if you are specifying arguments by position without using their names, you must always specify them in order.

.. versionadded:: 2.0

.. _new-blow-out:

.. _blow-out:

Blow Out
========

To blow out is to push an extra amount of air through the pipette's tip, to make sure that any remaining droplets are expelled.

When calling :py:meth:`.InstrumentContext.blow_out`, you can specify a location to blow out the remaining liquid. If no location is specified, the pipette will blow out from its current position.

.. code-block:: python

    pipette.blow_out()            # blow out in current location
    pipette.blow_out(plate['B3']) # blow out in current plate:B3


.. versionadded:: 2.0

.. _touch-tip:

Touch Tip
=========

To touch tip is to move the pipette's currently attached tip to four opposite edges of a well, to knock off any droplets that might be hanging from the tip.

When calling :py:meth:`.InstrumentContext.touch_tip` on a pipette, you have the option to specify a location where the tip will touch the inner walls.

:py:meth:`.InstrumentContext.touch_tip` can take up to 4 arguments: ``touch_tip(location, radius, v_offset, speed)``.

.. code-block:: python

    pipette.touch_tip()            # touch tip within current location
    pipette.touch_tip(v_offset=-2) # touch tip 2mm below the top of the current location
    pipette.touch_tip(plate['B1']) # touch tip within plate:B1
    pipette.touch_tip(plate['B1'], speed=100) # touch tip within plate:B1 at 100 mm/s
    pipette.touch_tip(plate['B1'], # touch tip in plate:B1, at 75% of total radius and -2mm from top of well
                      radius=0.75,
                      v_offset=-2)


.. versionadded:: 2.0

.. note:

    It is recommended that you change your API version to 2.4 to take advantage of new
    features added into `touch_tip` such as:
        - A lower minimum speed (1 mm/s)
        - Better handling around near by geometry considerations
        - Removed certain extraneous behaviors such as a diagonal move from X -> Y and
        moving directly to the height offset specified.

.. _mix:

Mix
===

To mix is to perform a series of ``aspirate`` and ``dispense`` commands in a row on a single location. Instead of having to write those commands out every time, you can call :py:meth:`.InstrumentContext.mix`.

The ``mix`` command takes up to three arguments: ``mix(repetitions, volume, location)``:

.. code-block:: python

    # mix 4 times, 100uL, in plate:A2
    pipette.mix(4, 100, plate['A2'])
    # mix 3 times, 50uL, in current location
    pipette.mix(3, 50)
    # mix 2 times, pipette's max volume, in current location
    pipette.mix(2)

.. note::

    In API Versions 2.2 and earlier, mixes consist of aspirates and then immediate dispenses. In between these actions, the pipette moves up and out of the target well. In API Version 2.3 and later, the pipette will not move between actions. 

.. versionadded:: 2.0

.. _air-gap:

Air Gap
=======

When dealing with certain liquids, you may need to aspirate air after aspirating the liquid to prevent it from sliding out of the pipette's tip. A call to :py:meth:`.InstrumentContext.air_gap` with a volume in µL will aspirate that much air into the tip. ``air_gap`` takes up to two arguments: ``air_gap(volume, height)``:

.. code-block:: python

    pipette.aspirate(100, plate['B4'])
    pipette.air_gap(20)
    pipette.drop_tip()

.. versionadded:: 2.0

**********************



.. _new-utility-commands:


Utility Commands
================

With utility commands, you can control various robot functions such as pausing a protocol, checking the robot's door, turning robot lights on/off, and more. The following sections show you how to these utility commands and include sample code. The examples used here assume that you’ve loaded the pipettes and labware from the basic :ref:`protocol template <protocol-template>`.

Delay and Resume
----------------

Call the :py:meth:`.ProtocolContext.delay` method to insert a timed delay (e.g. for an incubation period) into your protocol. This method accepts time increments in seconds, minutes, or combinations of both. Your protocol resumes automatically after the pause expires.

This example delays a protocol for 10 seconds::

    protocol.delay(seconds=10)

This example delays a protocol for 5 minutes::

    protocol.delay(minutes=5)

This example delays a protocol for 5 minutes and 10 seconds::

    protocol.delay(minutes=5, seconds=10)

Pause Until Resumed
-------------------

Call the :py:meth:`.ProtocolContext.pause` method to stop a protocol at a specific step. Unlike a delay, :py:meth:`~.ProtocolContext.pause` does not restart your protocol automatically. To resume, you'll respond to a prompt on the touchscreen or in the App. This method lets you specify an optional message that provides on-screen or in-app instructions on how to proceed. This example inserts a pause and includes a brief message::

    protocol.pause('Remember to get more pipette tips')

.. versionadded:: 2.0

Homing
------

Homing commands the robot to move the gantry, a pipette, or a pipette plunger to a defined position. For example, homing the gantry moves it to the back right of the working area. Homing methods include :py:meth:`.ProtocolContext.home`, :py:meth:`.InstrumentContext.home` and :py:meth:`.InstrumentContext.home_plunger`. These methods home the gantry, home the mounted pipette and plunger, and home the pipette plunger, respectively. These functions take no arguments.

This example homes the gantry::

    pipette = protocol.load_instrument('flex_1channel_1000', 'right')
    protocol.home()

To home a specific pipette's Z axis and plunger, you can call :py:meth:`~.InstrumentContext.home`::

    pipette = protocol.load_instrument('flex_1channel_1000', 'right')
    pipette.home()

To home a specific pipette's plunger only, you can call :py:meth:`~.InstrumentContext.home_plunger`::

    pipette = protocol.load_instrument('flex_1channel_1000', 'right')
    pipette.home_plunger()

.. versionadded:: 2.0

Comment
-------

Call the :py:meth:`.ProtocolContext.comment` method to create and display messages in the Opentrons App during protocol execution::

    protocol.comment('Hello, world!')

.. versionadded:: 2.0

Control and Monitor Robot Rail Lights
-------------------------------------

Call the :py:meth:`.ProtocolContext.set_rail_lights` method to turn the robot's rail lights on or off during a protocol. This method accepts boolean true (lights on) or false (lights off) arguments. Rail lights are off by default.

This example turns the rail lights on::

    protocol.set_rail_lights(True)

This example turns the rail lights off::

    protocol.set_rail_lights(False)

.. versionadded:: 2.5

You can also check whether the rail lights are on or off in the protocol by using :py:obj:`.ProtocolContext.rail_lights_on`. For example, this method returns ``True`` when lights are on and ``False`` when the lights are off.

.. versionadded:: 2.5

.. TODO clarify that this is specific to OT-2 (Flex always pauses when door open) or remove this section if OT-2 will also always pause in the future

OT-2 Door Safety Switch
-----------------------

Introduced with :ref:`robot software version <version-table>` 3.19, the safety switch feature prevents the OT-2, and your protocol, from running if the door is open. To operate properly, the front door and top window of your OT-2 must be closed.

.. image:: ../img/feature_flags/door_safety_switch.png

To check if the robot's door is closed at a specific point during a protocol run, call :py:obj:`.ProtocolContext.door_closed`. It returns a boolean true (door closed) or false (door open) response.

.. code-block:: python

    protocol.door_closed

.. warning::

    :py:obj:`~.ProtocolContext.door_closed` is a status check only. It does not control the robot's behavior. If you wish to implement a custom method to pause or resume a protocol using ``door_closed``, disable the door safety feature first (not recommended).

.. versionadded:: 2.5

