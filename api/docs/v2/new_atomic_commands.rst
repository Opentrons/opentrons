:og:description: Building block commands are the smallest individual actions that Opentrons robots can perform.

.. _v2-atomic-commands:

***********************
Building Block Commands
***********************

Building block commands execute some of the most basic actions that your robot can complete. But basic doesn’t mean these commands lack capabilities. They perform important tasks in your protocols. They're also foundational to the :ref:`complex commands <v2-complex-commands>` that help you write and run longer, more intricate procedures. In this section, we'll look at building block commands that let you work with pipette tips, liquids, and robot utility features.

Manipulating Pipette Tips
=========================

Your robot needs to attach a disposable tip to the pipette before it can aspirate or dispense liquids. The API provides three basic functions that help the robot attach and manage pipette tips during a protocol run. These methods are :py:meth:`.InstrumentContext.pick_up_tip`, :py:meth:`.InstrumentContext.drop_tip`, and :py:meth:`.InstrumentContext.return_tip`. Respectively, these methods tell the robot to pick up a tip from a tip rack, drop a tip into the trash (or another location), and return a tip to its location in the tip rack.

The following sections demonstrate how to use each method and include sample code. The examples used here assume that you've loaded the pipettes and labware from the basic :ref:`protocol template <protocol-template>`.

Picking Up a Tip
----------------

To pick up a tip, call the :py:meth:`~.InstrumentContext.pick_up_tip` method without any arguments::
    
    pipette.pick_up_tip()

This simple statement works because the variable ``tiprack_1`` in the sample protocol includes the on-deck location of the tip rack (Flex ``location="D3"``, OT-2 ``location=3``) *and* the ``pipette`` variable includes the argument ``tip_racks=[tiprack_1]``. Given this information, the robot moves to the tip rack and picks up a tip from position A1 in the rack. On subsequent calls to ``pick_up_tip()``, the robot will use the next available tip. For example::

    pipette.pick_up_tip()  # picks up tip from rack location A1
    pipette.drop_tip()     # drops tip in trash bin
    pipette.pick_up_tip()  # picks up tip from rack location B1
    pipette.drop_tip()     # drops tip in trash bin 

If you omit the ``tip_rack`` argument from the ``pipette`` variable, the API will raise an error. You must pass in the tip rack's location to ``pick_up_tip`` like this::
    
    pipette.pick_up_tip(tiprack_1['A1'])
    pipette.drop_tip()
    pipette.pick_up_tip(tiprack_1['B1']) 

If coding the location of each tip seems inefficient or tedious, try using a ``for`` loop to automate a sequential tip pick up process. When using a loop, the API keeps track of tips and manages tip pickup for you. But ``pick_up_tip`` is still a powerful feature. It gives you direct control over tip use when that’s important in your protocol.

.. versionadded:: 2.0

Automating Tip Pick Up
----------------------

When used with Python's :py:class:`range` class, a ``for`` loop brings automation to the tip pickup and tracking process. It also eliminates the need to call ``pick_up_tip()`` multiple times. For example, this snippet tells the robot to sequentially use all the tips in a 96-tip rack::

    for i in range(96):
        pipette.pick_up_tip()
        # liquid handling commands
        pipette.drop_tip()

If your protocol requires a lot of tips, add a second tip rack to the protocol. Then, associate it with your pipette and increase the number of repetitions in the loop. The robot will work through both racks. 

First, add another tip rack to the sample protocol::

    tiprack_2 = protocol.load_labware(
        load_name="opentrons_flex_96_tiprack_1000ul",
        location="C3"
    )

Next, revise the pipette's ``load_instrument()`` method to include the new tip rack in the ``tip_rack`` argument::

    pipette = protocol.load_instrument(
        instrument_name="flex_1channel_1000",
        mount="left",
        tip_racks=[tiprack_1, tiprack_2],
    ) 

Finally, sum the tip count in the range::

    for i in range(192):
        pipette.pick_up_tip()
        pipette.drop_tip()

For a more advanced "real-world" example, review the :ref:`off-deck location protocol <off-deck-location>` on the :ref:`moving-labware` page. This example also uses a ``for`` loop to iterate through a tip rack, but it includes other commands that pause the protocol and let you replace an on-deck tip rack with another rack stored in an off-deck location.

Dropping a Tip
--------------

To drop a tip in the trash bin, call the :py:meth:`~.InstrumentContext.drop_tip` method with no arguments::
    
    pipette.pick_up_tip()

You can also specify where to drop the tip by passing in a location. For example, this code drops a tip in the trash bin and returns another tip to to a previously used well in a tip rack::

    pipette.pick_up_tip()            # picks up tip from rack location A1
    pipette.drop_tip()               # drops tip in trash bin 
    pipette.pick_up_tip()            # picks up tip from rack location B1
    pipette.drop_tip(tiprack['A1'])  # drops tip in rack location A1

.. versionadded:: 2.0

.. _pipette-return-tip:

Return Tip
===========

To return a tip to its original location, call the :py:meth:`~.InstrumentContext.return_tip` method with no arguments::

    pipette.return_tip()


----------------------

Currently, the API considers tips as "used" after being picked up. For example, if the robot picked up a tip from rack location A1 and then returned it to the same location, it will not attempt to pick up this tip again, unless explicitly specified. Instead, the robot will pick up a tip starting from rack location B1. For example::

    pipette.pick_up_tip()                # picks up tip from rack location A1
    pipette.return_tip()                 # drops tip in rack location A1
    pipette.pick_up_tip()                # picks up tip from rack location B1
    pipette.drop_tip()                   # drops tip in trash bin
    pipette.pick_up_tip(tiprack_1['A1']) # picks up tip from rack location A1

Early API versions treated returned tips as unused items. They could be picked up again without an explicit argument. For example:: 

    pipette.pick_up_tip()  # picks up tip from rack location A1
    pipette.return_tip()   # drops tip in rack location A1
    pipette.pick_up_tip()  # picks up tip from rack location A1

.. versionchanged: 2.2


Liquid Control
==============

After attaching a tip, your robot is ready to aspirate, dispense, and perform other liquid handling tasks. The API includes methods that help you perform these actions and the following sections show how to use them. The examples used here assume that you've loaded the pipettes and labware from the basic :ref:`protocol template <protocol-template>`. 

.. _new-aspirate:

Aspirate
--------

To draw liquid up into a pipette tip, call the :py:meth:`.InstrumentContext.aspirate` method. Using this method, you can specify the aspiration volume in µL, the well location, and pipette flow rate. Other parameters let you position the pipette within a well. For example, this snippet tells the robot to aspirate 200 µL from well location A1.

.. code-block:: python

    pipette.pick_up_tip()
    pipette.aspirate(200, plate['A1'])

If the pipette doesn't move, you can specify an additional aspiration action without including a location. To demonstrate, this code snippet pauses the protocol, automatically resumes it, and aspirates a second time from ``plate['A1']``).

.. code-block:: python

    pipette.pick_up_tip()
    pipette.aspirate(200, plate['A1'])
    protocol.delay(seconds=5) # pause for 5 seconds
    pipette.aspirate(100)     # aspirate 100 µL at current position

Now our pipette holds 300 µL.

Aspirate by Well or Location
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The :py:meth:`~.InstrumentContext.aspirate` method includes a ``location`` parameter that accepts either a ``Well`` or a ``Location``. 

If you specify a well, like ``plate['A1']``, the pipette will aspirate from a default position 1 mm above the bottom center of that well. To change the default clearance, first set the ``aspirate`` attribute of :py:obj:`.well_bottom_clearance`:: 

    pipette.pick_up_tip
    pipette.well_bottom_clearance.aspirate = 2 # tip is 2 mm above well bottom
    pipette.aspirate(200, plate['A1'])

You can also aspirate from a location along the center vertical axis within a well using the :py:meth:`.Well.top` and :py:meth:`.Well.bottom` methods. These methods move the pipette to a specified distance relative to the top or bottom center of a well::

    pipette.pick_up_tip()
    depth = plate['A1'].bottom(z=2) # tip is 2 mm above well bottom
    pipette.aspirate(200, depth)

See also:

- :ref:`new-default-op-positions` for information about controlling pipette height for a particular pipette.
- :ref:`position-relative-labware` for information about controlling pipette height from within a well.
- :ref:`move-to` for information about moving a pipette to any reachable deck location.

Aspiration Flow Rates
^^^^^^^^^^^^^^^^^^^^^

Flex and OT-2 pipettes aspirate at :ref:`default flow rates <new-plunger-flow-rates>` measured in µL/s. Specifying the ``rate`` parameter multiplies the flow rate by that value. As a best practice, don't set the flow rate higher than 3x the default. For example, this code causes the pipette to aspirate at twice its normal rate::

    pipette.aspirate(200, plate['A1'], rate=2.0)

.. Removed note related to API v1

.. Removed note because pipette clearance defaults and locations are now covered

.. versionadded:: 2.0

.. _new-dispense:

Dispense
--------

To dispense liquid from a pipette tip, call the :py:meth:`.InstrumentContext.dispense` method. Using this method, you can specify the dispense volume in µL, the well location, and pipette flow rate. Other parameters let you position the pipette within a well. For example, this snippet tells the robot to dispense 200 µL into well location B1.

.. code-block:: python

    pipette.dispense(200, plate['B1'])

If the pipette doesn’t move, you can specify an additional dispense action without including a location. To demonstrate, this code snippet pauses the protocol, automatically resumes it, and dispense a second time from location B1.

.. code-block:: python
    
    pipette.dispense(100, plate['B1'])
    protocol.delay(seconds=5) # pause for 5 seconds
    pipette.dispense(100)     # dispense 100 µL at current position
    
Dispense by Well or Location
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The :py:meth:`~.InstrumentContext.dispense` method includes a ``location`` parameter that accepts either a ``Well`` or a ``Location``.

If you specify a well, like ``plate['B1']``, the pipette will dispense from a default position 1 mm above the bottom center of that well. To change the default clearance, you would call :py:obj:`.well_bottom_clearance`::

    pipette.well_bottom_clearance.dispense=2 # tip is 2 mm above well bottom
    pipette.dispense(200, plate['B1'])

You can also dispense from a location along the center vertical axis within a well using the :py:meth:`.Well.top` and :py:meth:`.Well.bottom` methods. These methods move the pipette to a specified distance relative to the top or bottom center of a well::

    depth = plate['B1'].bottom(z=2) # tip is 2 mm above well bottom
    pipette.dispense(200, depth)

See also:

- :ref:`new-default-op-positions` for information about controlling pipette height for a particular pipette.
- :ref:`position-relative-labware` for formation about controlling pipette height from within a well.
- :ref:`move-to` for information about moving a pipette to any reachable deck location.

Dispense Flow Rates
^^^^^^^^^^^^^^^^^^^

Flex and OT-2 pipettes dispense at :ref:`default flow rates <new-plunger-flow-rates>` measured in µL/s. Adding a number to the ``rate`` parameter multiplies the flow rate by that value. As a best practice, don't set the flow rate higher than 3x the default. For example, this code causes the pipette to dispense at twice its normal rate::

    pipette.dispense(200, plate['B1'], rate=2.0)

.. Removing the 2 notes here from the original. Covered by new revisions.

.. versionadded:: 2.0

.. _new-blow-out:

.. _blow-out:

Blow Out
--------

To blow an extra amount of air through the pipette's tip, call the :py:meth:`.InstrumentContext.blow_out` method. You can use a specific well in a well plate or reservoir as the blowout location. If no location is specified, the pipette will blowout from its current well position::

    pipette.blow_out()

You can also specify a particular well as the blowout location::

    pipette.blow_out(plate['B1'])

Many protocols use trash bin for blowing out the pipette. You can specify the trash bin as the blowout location by using the :py:meth:`.ProtocolContext.fixed_trash` method::

    pipette.blow_out(protocol.fixed_trash['A1'])  

.. versionadded:: 2.0

.. _touch-tip:

Touch Tip
---------

The :py:meth:`.InstrumentContext.touch_tip` method moves the pipette so the tip touches each wall of a well. A touch tip procedure helps knock off any droplets that might cling to the pipette's tip. This method includes optional arguments that allow you to control where the tip will touch the inner walls of a well and the touch speed. Calling :py:meth:`~.InstrumentContext.touch_tip` without arguments causes the pipette to touch the well walls from its current location::

    pipette.touch_tip() 

Touch Location
^^^^^^^^^^^^^^

These optional location arguments give you control over where the tip will touch the side of a well.

This example demonstrates touching the tip in a specific well::

    pipette.touch_tip(plate['B1'])
    
This example uses an offset to set the touch tip location 2mm below the top of the current well::

    pipette.touch_tip(v_offset=-2) 

This example moves the pipette 75% of well's total radius and 2 mm below the top of well::

    pipette.touch_tip(plate['B1'], 
                      radius=0.75,
                      v_offset=-2)

The ``touch_tip`` feature allows the pipette to touch the edges of a well gently instead of crashing into them. It includes the ``radius`` argument. When ``radius=1`` the robot moves the centerline of the pipette’s plunger axis to the edge of a well. This means a pipette tip may sometimes touch the well wall too early, causing it to bend inwards. A smaller radius helps avoid premature wall collisions and a lower speed produces gentler motion. Different liquid droplets behave differently, so test out these parameters in a single well before performing a full protocol run.

.. warning::
    *Do not* set the ``radius`` value greater than ``1.0``. When ``radius`` is > ``1.0``, the robot will forcibly move the pipette tip across a well wall or edge. This type of aggressive movement can damage the pipette tip and the pipette.

Touch Speed
^^^^^^^^^^^

Touch speed controls how fast the pipette moves in mm/s during a touch tip step. The default movement speed is 60 mm/s, the minimum is 20 mm/s, and the maximum is 80 mm/s. Calling ``touch_tip`` without any arguments moves a tip at the default speed in the current well::

    pipette.touch_tip()

This example specifies a well location and sets the speed to 20 mm/s::

    pipette.touch_tip(plate['B1'], speed=20)

This example uses the current well and sets the speed to 80 mm/s::

    pipette.touch_tip(speed=80)

.. versionadded:: 2.0

.. versionchanged:: 2.4
    Lowered minimum speed to 1 mm/s.

.. _mix:

Mix
---

The :py:meth:`~.InstrumentContext.mix` method aspirates and dispenses repeatedly in a single location. It's designed to mix the contents of a well together using a single command rather than using multiple ``aspirate()`` and ``dispense()`` calls. This method includes arguments that let you specify the number of times to mix, the volume (in µL) of liquid, and the well that contains the liquid you want to mix.

This example draws 100 µL from the current well and mixes it three times::

    pipette.mix(repetitions=3, volume=100)

This example draws 100 µL from well B1 and mixes it three times:: 

    pipette.mix(3, 100, plate['B1'])

This example draws an amount equal to the pipette's maximum rated volume and mixes it three times::

    pipette.mix(repetitions=3)

.. note::

    In API versions 2.2 and earlier, during a mix, the pipette moves up and out of the target well. In API versions 2.3 and later, the pipette does not move while mixing. 

.. versionadded:: 2.0

.. _air-gap:

Air Gap
-------

The :py:meth:`.InstrumentContext.air_gap` method tells the pipette to draw in air before or after a liquid. Creating an air gap helps keep liquids from seeping out of a pipette after drawing it from a well. This method includes arguments that give you control over the amount of air to aspirate and the pipette's height (in mm) above the well. By default, the pipette moves 5 mm above a well before aspirating air. Calling :py:meth:`~.InstrumentContext.air_gap` with no arguments uses the entire remaining volume in the pipette.

This example aspirates 200 µL of air 5 mm above the current well::

    pipette.air_gap(volume=200)

This example aspirates 200 µL of air 20 mm above the the current well::

    pipette.air_gap(volume=200, height=20)

This example aspirates enough air to fill the remaining volume in a pipette::

    pipette.air_gap()

.. versionadded:: 2.0




.. _new-utility-commands:


Utility Commands
================

With utility commands, you can control various robot functions such as pausing or delaying a protocol, checking the robot's door, turning robot lights on/off, and more. The following sections show you how to these utility commands and include sample code. The examples used here assume that you’ve loaded the pipettes and labware from the basic :ref:`protocol template <protocol-template>`.

Delay and Resume
----------------

Call the :py:meth:`.ProtocolContext.delay` method to insert a timed delay into your protocol. This method accepts time increments in seconds, minutes, or combinations of both. Your protocol resumes automatically after the specified time expires.

This example delays a protocol for 10 seconds::

    protocol.delay(seconds=10)

This example delays a protocol for 5 minutes::

    protocol.delay(minutes=5)

This example delays a protocol for 5 minutes and 10 seconds::

    protocol.delay(minutes=5, seconds=10)

Pause Until Resumed
-------------------

Call the :py:meth:`.ProtocolContext.pause` method to stop a protocol at a specific step. Unlike a delay, :py:meth:`~.ProtocolContext.pause` does not restart your protocol automatically. To resume, you'll respond to a prompt on the touchscreen or in the Opentrons App. This method also lets you specify an optional message that provides on-screen or in-app instructions on how to proceed. This example inserts a pause and includes a brief message::

    protocol.pause('Remember to get more pipette tips')

.. versionadded:: 2.0

Homing
------

Homing commands the robot to move the gantry, a pipette, or a pipette plunger to a defined position. For example, homing the gantry moves it to the back right of the working area. With the available homing methods you can home the gantry, home the mounted pipette and plunger, and home the pipette plunger. These functions take no arguments.

To home the gantry, call :py:meth:`.ProtocolContext.home`::

    protocol.home()

To home a specific pipette's Z axis and plunger, call :py:meth:`.InstrumentContext.home`::

    pipette = protocol.load_instrument('flex_1channel_1000', 'right')
    pipette.home()

To home a specific pipette's plunger only, you can call :py:meth:`.InstrumentContext.home_plunger`::

    pipette = protocol.load_instrument('flex_1channel_1000', 'right')
    pipette.home_plunger()

.. versionadded:: 2.0

Comment
-------

Call the :py:meth:`.ProtocolContext.comment` method if you want to write and display a brief message in the Opentrons App during a protocol run::

    protocol.comment('Hello, world!')

.. versionadded:: 2.0

Control and Monitor Robot Rail Lights
-------------------------------------

Call the :py:meth:`.ProtocolContext.set_rail_lights` method to turn the robot's rail lights on or off during a protocol. This method accepts Boolean ``True`` (lights on) or ``False`` (lights off) arguments. Rail lights are off by default.

This example turns the rail lights on::

    protocol.set_rail_lights(True)

This example turns the rail lights off::

    protocol.set_rail_lights(False)

.. versionadded:: 2.5

You can also check whether the rail lights are on or off in the protocol by using :py:obj:`.ProtocolContext.rail_lights_on`. This method returns ``True`` when lights are on and ``False`` when the lights are off.

.. versionadded:: 2.5


OT-2 Door Safety Switch
-----------------------

Introduced with :ref:`robot software version <version-table>` 3.19, the safety switch feature prevents the OT-2, and your protocol, from running if the door is open. To operate properly, the front door and top window of your OT-2 must be closed. You can toggle the door safety switch on or off from **Robot Settings > Advanced > Usage Settings**.

To check if the robot's door is closed at a specific point during a protocol run, call :py:obj:`.ProtocolContext.door_closed`. It returns a Boolean ``True`` (door closed) or ``False`` (door open) response.

.. code-block:: python

    protocol.door_closed

.. warning::

    :py:obj:`~.ProtocolContext.door_closed` is a status check only. It does not control the robot's behavior. If you wish to implement a custom method to pause or resume a protocol using ``door_closed``, disable the door safety feature first (not recommended).

.. versionadded:: 2.5

