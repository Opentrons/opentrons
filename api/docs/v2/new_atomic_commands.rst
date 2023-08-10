:og:description: Building block commands are the smallest individual actions that Opentrons robots can perform.

.. _v2-atomic-commands:

#######################
Building Block Commands
#######################

Building block commands execute some of the most basic actions that your robot can complete. But basic doesn’t mean these commands lack capabilities. They perform important tasks in your protocols. They’re also foundational to the :ref:`complex commands <v2-complex-commands>` that help you write and run longer, more intricate procedures. In this section, we’ll look at building block commands that help you work with pipette tips, liquids, and robot utility features.

.. _atomic-instruments-labware:

Instruments and Labware
=======================

The examples in this section will work with Flex or an OT-2. If you want to follow along and test this code, make sure you have the right instruments and labware ready for your robot. If you're looking for specific information, skip this setup section and jump straight to the topic you're interested in. All of the examples here use the equipment listed in the table below.

.. list-table::
    :header-rows: 1

    * - Labware
      - Name
      - API load name
    * - Well plate
      - Corning 96 Well Plate 360 µL Flat
      - ``corning_96_wellplate_360ul_flat``
    * - Flex tip rack
      - Opentrons Flex 96 Tip Rack 1000 µL
      - ``opentrons_flex_96_tiprack_1000ul``
    * - OT-2 tip rack
      - Opentrons 96 Tip Rack 300 µL
      - ``opentrons_96_tiprack_300ul``
    * - Flex pipette
      - Flex 1-Channel Pipette
      - ``flex_1channel_1000``
    * - OT-2 pipette
      - P300 Single-Channel GEN2
      - ``p300_single_gen2``

.. _atomic-file:

Creating a Protocol File 
========================

Depending on your robot model and/or API version, the beginning of your basic protocol file should look similar to the following examples. For information about variations in the code before the ``run()`` function, see the :ref:`Metadata <tutorial-metadata>` and :ref:`Requirements <tutorial-requirements>` sections of the :ref:`tutorial`.

Samples are formatted to fit the available space and avoid horizontal scrolling.

.. tabs::

    .. tab:: Flex 

        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api

            # robotType could also be 'OT-2' with API v2.15 or higher
            requirements = {'robotType': 'Flex', 'apiLevel': '|apiLevel|'}

            def run(protocol: protocol_api.ProtocolContext):
                # load well plate in deck slot D2
                plate = protocol.load_labware(
                    load_name='corning_96_wellplate_360ul_flat',
                    location='D2')
                # load tip rack in deck slot D3
                rack = protocol.load_labware(
                    load_name='opentrons_flex_96_tiprack_1000ul',
                    location='D3')
                # attach pipette to left mount
                pipette = protocol.load_instrument(
                    instrument_name='flex_1channel_1000',
                    mount='left',
                    tip_racks=[rack])
                # Put building block commands here
    
    .. tab:: OT-2

        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api

            metadata = {'apiLevel': '|apiLevel|'}

            def run(protocol: protocol_api.ProtocolContext):
                # load well plate in deck slot 2
                plate = protocol.load_labware(
                    load_name='corning_96_wellplate_360ul_flat',
                    location=2)    
                # load tip rack in deck slot 3
                rack = protocol.load_labware(
                    load_name='opentrons_96_tiprack_300ul',
                    location=3)    
                # attach pipette to left mount
                pipette = protocol.load_instrument(
                    instrument_name='p300_single_gen2',
                    mount='left',
                    tip_racks=[rack])  
                # Put building block commands here

.. _atomic-tip-manipulation:

Manipulating Pipette Tips
=========================

The API provides three basic functions that help the robot manipulate pipette tips during a protocol run. These are :py:meth:`.InstrumentContext.pick_up_tip`, :py:meth:`.InstrumentContext.drop_tip`, and :py:meth:`.InstrumentContext.return_tip`. 
Respectively, they tell the robot to pick up a tip from a tip rack, drop a tip into the trash (or another location), and return a tip to its location in the tip rack. Let's look at examples for each of these functions.

.. _atomic-tip-pickup:

Picking Up a Tip
----------------

Your robot needs to attach a disposable tip to the pipette before it can work with the liquids in a protocol. To attach a tip, call the :py:meth:`~.InstrumentContext.pick_up_tip` function like this::

   pipette.pick_up_tip()

And because we already loaded a tip rack via the ``rack`` variable, the robot automatically knows where to go and what to do:

* **Flex**: Moves the pipette to deck slot D3 and picks up a tip from rack position A1.
* **OT-2**: Moves the pipette to deck slot 3 and picks up a tip from rack position A1.

.. Note::

    You can manually associate a tip rack and tip location with a pipette by excluding the ``tip_racks`` argument from the :py:meth:`~.ProtocolContext.load_instrument` method. For example, you'd tell the robot to get a tip like this::

         pipette.pick_up_tip(rack['A2'])
    
    There may be some use cases for this manual method, but it makes extra work for you by eliminating automatic tip tracking.

.. versionadded:: 2.0

.. _atomic-drop-tip:

Dropping a Tip
--------------

You tell the robot to discard a used tip by calling the :py:meth:`.InstrumentContext.drop_tip` method. This method automatically drops a tip in the on-deck trash bin. It also lets you set a specific drop location. This code builds on the pick up command by including ``drop_tip()``.

.. code-block:: python

    pipette.pick_up_tip()         # assume rack location A1
    pipette.drop_tip()            # drop tip in trash bin         
    pipette.pick_up_tip()         # pick up from rack location B1
    pipette.drop_tip(rack['B1'])  # drop tip in rack location B1
    

.. versionadded:: 2.0

.. _pipette-return-tip:

Returning a Tip
---------------

You tell the robot to return a tip to its original location in a tip rack by calling the :py:meth:`.InstrumentContext.return_tip` method. You cannot manually set a specific return location with this method. This code builds on the pick up command by including ``return_tip()``. 

.. code-block:: python

    pipette.pick_up_tip() # pick up tip at location A1
    pipette.return_tip()  # return tip to location A1
    pipette.pick_up_tip() # pick up tip at location B1
    pipette.return_tip()  # return tip to location B1

Your robot considers returned tips to be "used" items. Tip tracking skips returned/used tips and picks up the next unused tip in the rack.

.. versionchanged: 2.2
    Treats returned tips as used.

.. skip iterating now, go to other sections, come back to this

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

Handling liquids
================

The API provides multiple methods that let the robot perform its core function — handling liquids in scientific procedures. In this section, we'll look at functions that control how the robot:

* Aspirates and dispenses liquids using the :py:meth:`.InstrumentContext.aspirate` and :py:meth:`.InstrumentContext.dispense` methods.
* Clears the pipette tip using the :py:meth:`.InstrumentContext.blow_out` and :py:meth:`.InstrumentContext.touch_tip` methods.
* Mixes and separates liquids using the :py:meth:`.InstrumentContext.mix` and :py:meth:`.InstrumentContext.air_gap` methods.  

The examples here use the same :ref:`instruments and labware <atomic-instruments-labware>` and :ref:`basic protocol file <atomic-file>` from the introduction above. You may want to take a moment to review that information before going any further. As always, feel free to skip the labware and protocol file information and jump straight to the topic you're interested in.

.. start here

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
--------

To aspirate is to pull liquid up into the pipette's tip. When calling :py:meth:`.InstrumentContext.aspirate` on a pipette, you can specify the volume to aspirate in  µL, where to aspirate from, and how fast to aspirate liquid.

.. code-block:: python

    pipette.aspirate(50, plate['A1'], rate=2.0)  # aspirate 50 µL from plate:A1

Now the pipette's tip is holding 50 µL.

The ``location`` parameter is either a well (like ``plate['A1']``) or a position within a well, like the return value of ``plate['A1'].bottom``.

The ``rate`` parameter is a multiplication factor of the pipette's default aspiration flow rate. The default aspiration flow rate for all pipettes is in the :ref:`defaults` section.

You can also simply specify the volume to aspirate, and not mention a location. The pipette will aspirate from its current location (which we previously set as ``plate['A1'])``.

.. code-block:: python

    pipette.aspirate(50)                     # aspirate 50 µL from current position

Now our pipette's tip is holding 100 µL.

.. note::

    In version 1 of this API, ``aspirate`` (and ``dispense``) would inspect the types of the ``volume`` and ``location`` arguments and do the right thing if you specified only a location or specified location and volume out of order. In this and future versions of the Python Protocol API, this is no longer true. Like any other Python function, if you are specifying arguments by position without using their names, you must always specify them in order.

.. note::

    By default, the OT-2 will move to 1mm above the bottom of the target well before aspirating.
    You can change this by using a well position function like :py:meth:`.Well.bottom` (see
    :ref:`v2-location-within-wells`) every time you call ``aspirate``, or - if you want to change
    the default throughout your protocol - you can change the default offset with
    :py:obj:`.InstrumentContext.well_bottom_clearance` (see :ref:`new-default-op-positions`).

.. versionadded:: 2.0

.. _new-dispense:

Dispense
--------

To dispense is to push out liquid from the pipette's tip. The usage of :py:meth:`.InstrumentContext.dispense` in the Protocol API is similar to :py:meth:`.InstrumentContext.aspirate`, in that you can specify volume in µL and location, or only volume.

.. code-block:: python

    pipette.dispense(50, plate['B1'], rate=2.0) # dispense 50 µL to plate:B1 at twice the normal rate
    pipette.dispense(50)              # dispense 50 µL to current position at the normal rate


The ``location`` parameter is either a well (like ``plate['A1']``) or a position within a well, like the return value of ``plate['A1'].bottom``.

The ``rate`` parameter is a multiplication factor of the pipette's default dispense flow rate. The default dispense flow rate for all pipettes is in the :ref:`defaults` section.

.. note::

    By default, the OT-2 will move to 1mm above the bottom of the target well before dispensing.
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
--------

To blow out is to push an extra amount of air through the pipette's tip, to make sure that any remaining droplets are expelled.

When calling :py:meth:`.InstrumentContext.blow_out`, you can specify a location to blow out the remaining liquid. If no location is specified, the pipette will blow out from its current position.

.. code-block:: python

    pipette.blow_out()            # blow out in current location
    pipette.blow_out(plate['B3']) # blow out in current plate:B3


.. versionadded:: 2.0

.. _touch-tip:

Touch Tip
---------

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
---

To mix is to perform a series of ``aspirate`` and ``dispense`` commands in a row on a single location. Instead of having to write those commands out every time, you can call :py:meth:`.InstrumentContext.mix`.

The ``mix`` command takes up to three arguments: ``mix(repetitions, volume, location)``:

.. code-block:: python

    # mix 4 times, 100 µL, in plate:A2
    pipette.mix(4, 100, plate['A2'])
    # mix 3 times, 50 µL, in current location
    pipette.mix(3, 50)
    # mix 2 times, pipette's max volume, in current location
    pipette.mix(2)

.. note::

    In API Versions 2.2 and earlier, mixes consist of aspirates and then immediate dispenses. In between these actions, the pipette moves up and out of the target well. In API Version 2.3 and later, the pipette will not move between actions. 

.. versionadded:: 2.0

.. _air-gap:

Air Gap
-------

When dealing with certain liquids, you may need to aspirate air after aspirating the liquid to prevent it from sliding out of the pipette's tip. A call to :py:meth:`.InstrumentContext.air_gap` with a volume in µL will aspirate that much air into the tip. ``air_gap`` takes up to two arguments: ``air_gap(volume, height)``:

.. code-block:: python

    pipette.aspirate(100, plate['B4'])
    pipette.air_gap(20)
    pipette.drop_tip()

.. versionadded:: 2.0

.. _new-utility-commands:


Utility Commands
================

Delay for an Amount of Time
---------------------------

Sometimes you need to wait as a step in your protocol, for instance to wait for something to incubate. You can use :py:meth:`.ProtocolContext.delay` to wait your protocol for a specific amount of time. ``delay`` is a method of :py:class:`.ProtocolContext` since it concerns the protocol and the OT-2 as a whole.

The values passed into ``delay()`` specify the number of minutes and seconds that the OT-2 will wait until moving on to the next command.

.. code-block:: python

    protocol.delay(seconds=2)             # delay for 2 seconds
    protocol.delay(minutes=5)             # delay for 5 minutes
    protocol.delay(minutes=5, seconds=2)  # delay for 5 minutes and 2 seconds


Pause Until Resumed
-------------------

The method :py:meth:`.ProtocolContext.pause` will pause protocol execution at a specific step.
You can resume by pressing 'resume' in your Opentrons App. You can optionally specify a message that
will be displayed in the Opentrons App when protocol execution pauses.

.. code-block:: python
    :substitutions:

    from opentrons import protocol_api

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        # The start of your protocol goes here...

        # The OT-2 stops here until you press resume. It will display the message in
        # the Opentrons App. You do not need to specify a message, but it makes things
        # more clear.
        protocol.pause('Time to take a break')

.. versionadded:: 2.0

Homing
------

You can manually request that the OT-2 home during protocol execution. This is typically
not necessary; however, if at any point you will disengage motors or move
the gantry with your hand, you may want to command a home afterwards.

To home the entire OT-2, you can call :py:meth:`.ProtocolContext.home`.

To home a specific pipette's Z axis and plunger, you can call :py:meth:`.InstrumentContext.home`.

To home a specific pipette's plunger only, you can call :py:meth:`.InstrumentContext.home_plunger`.

None of these functions take any arguments:

.. code-block:: python
    :substitutions:

    from opentrons import protocol_api, types

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        pipette = protocol.load_instrument('p300_single', 'right')
        protocol.home() # Homes the gantry, z axes, and plungers
        pipette.home()  # Homes the right z axis and plunger
        pipette.home_plunger() # Homes the right plunger

.. versionadded:: 2.0


Comment
-------

The method :py:meth:`.ProtocolContext.comment` lets you display messages in the Opentrons App during protocol execution:


.. code-block:: python
    :substitutions:

    from opentrons import protocol_api, types

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        protocol.comment('Hello, world!')

.. versionadded:: 2.0


Control and Monitor Robot Rail Lights
-------------------------------------

You can turn the robot rail lights on or off in the protocol using :py:meth:`.ProtocolContext.set_rail_lights`:


.. code-block:: python
    :substitutions:

    from opentrons import protocol_api

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        # turn on robot rail lights
        protocol.set_rail_lights(True)

        # turn off robot rail lights
        protocol.set_rail_lights(False)

.. versionadded:: 2.5


You can also check whether the rail lights are on or off in the protocol using :py:obj:`.ProtocolContext.rail_lights_on`:


.. code-block:: python

    protocol.rail_lights_on  # returns True when the lights are on,
                             # False when the lights are off

.. versionadded:: 2.5


Monitor Robot Door
------------------

The door safety switch feature flag has been added to the OT-2 software since the 3.19.0 release. Enabling the feature flag allows your robot to pause a running protocol and prohibit the protocol from running when the robot door is open.

.. image:: ../img/feature_flags/door_safety_switch.png

You can also check whether or not the robot door is closed at a specific point in time in the protocol using :py:obj:`.ProtocolContext.door_closed`:


.. code-block:: python

    protocol.door_closed  # return True when the door is closed,
                          # False when the door is open


.. note::

    Both the top window and the front door must be closed in order for the robot to report the door is closed.


.. warning::

    If you chose to enable the door safety switch feature flag, you should only use :py:obj:`.ProtocolContext.door_closed` as a form of status check, and should not use it to control robot behavior. If you wish to implement custom method to pause or resume protocol using :py:obj:`.ProtocolContext.door_closed`, make sure you have first disabled the feature flag.

.. versionadded:: 2.5

