:og:description: Basic commands for working with liquids.

.. _liquid-control:

**************
Liquid Control
**************

After attaching a tip, your robot is ready to aspirate, dispense, and perform other liquid handling tasks. The API includes methods that help you perform these actions and the following sections show how to use them. The examples used here assume that you've loaded the pipettes and labware from the basic :ref:`protocol template <protocol-template>`. 

.. _new-aspirate:

Aspirate
========

To draw liquid up into a pipette tip, call the :py:meth:`.InstrumentContext.aspirate` method. Using this method, you can specify the aspiration volume in µL, the well location, and pipette flow rate. Other parameters let you position the pipette within a well. For example, this snippet tells the robot to aspirate 200 µL from well location A1.

.. code-block:: python

    pipette.pick_up_tip()
    pipette.aspirate(200, plate["A1"])

If the pipette doesn't move, you can specify an additional aspiration action without including a location. To demonstrate, this code snippet pauses the protocol, automatically resumes it, and aspirates a second time from ``plate["A1"]``).

.. code-block:: python

    pipette.pick_up_tip()
    pipette.aspirate(200, plate["A1"])
    protocol.delay(seconds=5) # pause for 5 seconds
    pipette.aspirate(100)     # aspirate 100 µL at current position

Now our pipette holds 300 µL.

Aspirate by Well or Location
----------------------------

The :py:meth:`~.InstrumentContext.aspirate` method includes a ``location`` parameter that accepts either a :py:class:`.Well` or a :py:class:`~.types.Location`. 

If you specify a well, like ``plate["A1"]``, the pipette will aspirate from a default position 1 mm above the bottom center of that well. To change the default clearance, first set the ``aspirate`` attribute of :py:obj:`.well_bottom_clearance`:: 

    pipette.pick_up_tip
    pipette.well_bottom_clearance.aspirate = 2  # tip is 2 mm above well bottom
    pipette.aspirate(200, plate["A1"])

You can also aspirate from a location along the center vertical axis within a well using the :py:meth:`.Well.top` and :py:meth:`.Well.bottom` methods. These methods move the pipette to a specified distance relative to the top or bottom center of a well::

    pipette.pick_up_tip()
    depth = plate["A1"].bottom(z=2) # tip is 2 mm above well bottom
    pipette.aspirate(200, depth)

See also:

- :ref:`new-default-op-positions` for information about controlling pipette height for a particular pipette.
- :ref:`position-relative-labware` for information about controlling pipette height from within a well.
- :ref:`move-to` for information about moving a pipette to any reachable deck location.

Aspiration Flow Rates
---------------------

Flex and OT-2 pipettes aspirate at :ref:`default flow rates <new-plunger-flow-rates>` measured in µL/s. Specifying the ``rate`` parameter multiplies the flow rate by that value. As a best practice, don't set the flow rate higher than 3x the default. For example, this code causes the pipette to aspirate at twice its normal rate::


    pipette.aspirate(200, plate["A1"], rate=2.0)

.. versionadded:: 2.0

.. _new-dispense:

Dispense
========

To dispense liquid from a pipette tip, call the :py:meth:`.InstrumentContext.dispense` method. Using this method, you can specify the dispense volume in µL, the well location, and pipette flow rate. Other parameters let you position the pipette within a well. For example, this snippet tells the robot to dispense 200 µL into well location B1.

.. code-block:: python

    pipette.dispense(200, plate["B1"])

.. note::
    In API version 2.16 and earlier, you could pass a ``volume`` argument to ``dispense()`` greater than what was aspirated into the pipette. In this case, the API would ignore ``volume`` and dispense the pipette's :py:obj:`~.InstrumentContext.current_volume`. The robot *would not* move the plunger lower as a result.

    In version 2.17 and later, passing such values raises an error.

    To move the plunger a small extra amount, add a :ref:`push out <push-out-dispense>`. Or to move it a large amount, use :ref:`blow out <blow-out>`.

If the pipette doesn’t move, you can specify an additional dispense action without including a location. To demonstrate, this code snippet pauses the protocol, automatically resumes it, and dispense a second time from location B1.

.. code-block:: python
    
    pipette.dispense(100, plate["B1"])
    protocol.delay(seconds=5) # pause for 5 seconds
    pipette.dispense(100)     # dispense 100 µL at current position
    
Dispense by Well or Location
----------------------------

The :py:meth:`~.InstrumentContext.dispense` method includes a ``location`` parameter that accepts either a :py:class:`.Well` or a :py:class:`~.types.Location`.

If you specify a well, like ``plate["B1"]``, the pipette will dispense from a default position 1 mm above the bottom center of that well. To change the default clearance, you would call :py:obj:`.well_bottom_clearance`::

    pipette.well_bottom_clearance.dispense=2 # tip is 2 mm above well bottom
    pipette.dispense(200, plate["B1"])

You can also dispense from a location along the center vertical axis within a well using the :py:meth:`.Well.top` and :py:meth:`.Well.bottom` methods. These methods move the pipette to a specified distance relative to the top or bottom center of a well::

    depth = plate["B1"].bottom(z=2) # tip is 2 mm above well bottom
    pipette.dispense(200, depth)

See also:

- :ref:`new-default-op-positions` for information about controlling pipette height for a particular pipette.
- :ref:`position-relative-labware` for formation about controlling pipette height from within a well.
- :ref:`move-to` for information about moving a pipette to any reachable deck location.

Dispense Flow Rates
-------------------

Flex and OT-2 pipettes dispense at :ref:`default flow rates <new-plunger-flow-rates>` measured in µL/s. Adding a number to the ``rate`` parameter multiplies the flow rate by that value. As a best practice, don't set the flow rate higher than 3x the default. For example, this code causes the pipette to dispense at twice its normal rate::

    pipette.dispense(200, plate["B1"], rate=2.0)

.. versionadded:: 2.0

.. _push-out-dispense:

Push Out After Dispense
-----------------------

The optional ``push_out`` parameter of ``dispense()`` helps ensure all liquid leaves the tip. Use ``push_out`` for applications that require moving the pipette plunger lower than the default, without performing a full :ref:`blow out <blow-out>`.

For example, this dispense action moves the plunger the equivalent of an additional 5 µL beyond where it would stop if ``push_out`` was set to zero or omitted::

    pipette.pick_up_tip()
    pipette.aspirate(100, plate["A1"])
    pipette.dispense(100, plate["B1"], push_out=5)
    pipette.drop_tip()

.. versionadded:: 2.15

.. _new-blow-out:

.. _blow-out:

Blow Out
========

To blow an extra amount of air through the pipette's tip, call the :py:meth:`.InstrumentContext.blow_out` method. You can use a specific well in a well plate or reservoir as the blowout location. If no location is specified, the pipette will blowout from its current well position::

    pipette.blow_out()

You can also specify a particular well as the blowout location::

    pipette.blow_out(plate["B1"])

Many protocols use a trash container for blowing out the pipette. You can specify the pipette's current trash container as the blowout location by using the :py:obj:`.InstrumentContext.trash_container` property::

    pipette.blow_out(pipette.trash_container)

.. versionadded:: 2.0
.. versionchanged:: 2.16
    Added support for ``TrashBin`` and ``WasteChute`` locations.

.. _touch-tip:

Touch Tip
=========

The :py:meth:`.InstrumentContext.touch_tip` method moves the pipette so the tip touches each wall of a well. A touch tip procedure helps knock off any droplets that might cling to the pipette's tip. This method includes optional arguments that allow you to control where the tip will touch the inner walls of a well and the touch speed. Calling :py:meth:`~.InstrumentContext.touch_tip` without arguments causes the pipette to touch the well walls from its current location::

    pipette.touch_tip() 

Touch Location
--------------

These optional location arguments give you control over where the tip will touch the side of a well.

This example demonstrates touching the tip in a specific well::

    pipette.touch_tip(plate["B1"])
    
This example uses an offset to set the touch tip location 2mm below the top of the current well::

    pipette.touch_tip(v_offset=-2) 

This example moves the pipette 75% of well's total radius and 2 mm below the top of well::

    pipette.touch_tip(plate["B1"], 
                      radius=0.75,
                      v_offset=-2)

The ``touch_tip`` feature allows the pipette to touch the edges of a well gently instead of crashing into them. It includes the ``radius`` argument. When ``radius=1`` the robot moves the centerline of the pipette’s plunger axis to the edge of a well. This means a pipette tip may sometimes touch the well wall too early, causing it to bend inwards. A smaller radius helps avoid premature wall collisions and a lower speed produces gentler motion. Different liquid droplets behave differently, so test out these parameters in a single well before performing a full protocol run.

.. warning::
    *Do not* set the ``radius`` value greater than ``1.0``. When ``radius`` is > ``1.0``, the robot will forcibly move the pipette tip across a well wall or edge. This type of aggressive movement can damage the pipette tip and the pipette.

Touch Speed
-----------

Touch speed controls how fast the pipette moves in mm/s during a touch tip step. The default movement speed is 60 mm/s, the minimum is 1 mm/s, and the maximum is 80 mm/s. Calling ``touch_tip`` without any arguments moves a tip at the default speed in the current well::

    pipette.touch_tip()

This example specifies a well location and sets the speed to 20 mm/s::

    pipette.touch_tip(plate["B1"], speed=20)

This example uses the current well and sets the speed to 80 mm/s::

    pipette.touch_tip(speed=80)

.. versionadded:: 2.0

.. versionchanged:: 2.4
    Lowered minimum speed to 1 mm/s.

.. _mix:

Mix
====

The :py:meth:`~.InstrumentContext.mix` method aspirates and dispenses repeatedly in a single location. It's designed to mix the contents of a well together using a single command rather than using multiple ``aspirate()`` and ``dispense()`` calls. This method includes arguments that let you specify the number of times to mix, the volume (in µL) of liquid, and the well that contains the liquid you want to mix.

This example draws 100 µL from the current well and mixes it three times::

    pipette.mix(repetitions=3, volume=100)

This example draws 100 µL from well B1 and mixes it three times:: 

    pipette.mix(3, 100, plate["B1"])

This example draws an amount equal to the pipette's maximum rated volume and mixes it three times::

    pipette.mix(repetitions=3)

.. note::

    In API versions 2.2 and earlier, during a mix, the pipette moves up and out of the target well. In API versions 2.3 and later, the pipette does not move while mixing. 

.. versionadded:: 2.0

.. _air-gap:

Air Gap
=======

The :py:meth:`.InstrumentContext.air_gap` method tells the pipette to draw in air before or after a liquid. Creating an air gap helps keep liquids from seeping out of a pipette after drawing it from a well. This method includes arguments that give you control over the amount of air to aspirate and the pipette's height (in mm) above the well. By default, the pipette moves 5 mm above a well before aspirating air. Calling :py:meth:`~.InstrumentContext.air_gap` with no arguments uses the entire remaining volume in the pipette.

This example aspirates 200 µL of air 5 mm above the current well::

    pipette.air_gap(volume=200)

This example aspirates 200 µL of air 20 mm above the the current well::

    pipette.air_gap(volume=200, height=20)

This example aspirates enough air to fill the remaining volume in a pipette::

    pipette.air_gap()

.. versionadded:: 2.0

.. _detect-liquid-presence:

Detect Liquids
==============

The :py:meth:`.InstrumentContext.detect_liquid_presence` method tells a Flex pipette to check for the presence of a liquid in a wellplate or reservoir. This method returns ``True`` if the pressure sensors in a pipette detect a liquid and ``False`` if liquid if the sensors do not. Detection takes place during aspiration, but you don't need to call :py:meth:`~.InstrumentContext.aspirate` to use ``detect_liquid_presence``. It's a standalone method that can be called when you just want to detect liquids only. As the Flex pipette detects a liquid, it stops, raises itself above the liquid's surface, and then resumes aspiration. See also :ref:`lpd`.

.. code-block:: python

    pipette.detect_liquid_presence()

.. 
    Sample and text is longer than what we usually do. Trying it anyway. 
    Maybe do the labware and reservoir in text only and just show the for/while loop.

This method will not raise an error or stop your protocol if the Flex pipette does not detect a liquid. You can write your own code to respond to the output of this method. For example, let's create a protocol that includes a tiprack, a 12-well reservoir, a 96-well plate, a single-channel pipette, and the waste bin.

.. code-block:: python

    def run(protocol: protocol_api.ProtocolContext):
        tiprack = (protocol.load_labware(TIPRACK_NAME, 'D1')).wells()
        reservoir = (protocol.load_labware(RESERVOIR_NAME, 'C2')).wells_by_name()
        plate = (protocol.load_labware(PLATE_NAME, 'D2')).wells()
        trash_bin = protocol.load_trash_bin('B3')
        pipette = protocol.load_instrument(PIPETTE_SINGLE_CHANNEL_NAME, mount="left", liquid_presence_detection=False)

Next, we'll add water to the reservoir as our test liquid::

    water = protocol.define_liquid(name="water", description="Normal water", display_color="#42AB2D")
    reservoir["A1"].load_liquid(liquid=water, volume=1000)
    reservoir["A2"].load_liquid(liquid=water, volume=500)
    reservoir["A3"].load_liquid(liquid=water, volume=850)
    ...
    reservoir["A11"].load_liquid(liquid=water, volume=0)
    reservoir["A12"].load_liquid(liquid=water, volume=250)

Now include some indexing to keep track of how many tips were used and which well plates received liquid::

    tipIndex = 0 
    plateIndex = 0

And finish up with ``for`` and ``while`` loops to perform liquid handling::

    for name, well in reservoir.items():

        pipette.pick_up_tip(tiprack[tipIndex])
        hasLiquid = pipette.detect_liquid_presence(well)
        pipette.drop_tip(trash_bin)
        tipIndex+=1

        curIndex = 0
        while hasLiquid:
            pipette.pick_up_tip(tiprack[tipIndex])
            pipette.aspirate(250, well)
            pipette.dispense(250, plate[plateIndex])
            pipette.drop_tip(trash_bin)
            tipIndex+=1
            plateIndex+=1

            pipette.pick_up_tip(tiprack[tipIndex])
            hasLiquid = pipette.detect_liquid_presence(well)
            pipette.drop_tip(trash_bin)
            tipIndex+=1

            curIndex+=1
        protocol.comment(f"Found liquid and aspirated from well {name} {curIndex} times. It is now empty.")

    protocol.comment("Exhausted all wells in reservoir.") 

When the robot uses all the liquid in a well, or finds an empty well, it will write a message to the robot's run log that records the well's name (e.g. ``A1``, ``A2``, etc.) and how many times it aspirated from that well before it ran dry. Then, it checks the next well for liquid. If the robot doesn't find liquid in the next well, it keeps checking each well until it does find liquid and starts the aspiration/dispense cycle again. If the protocol uses all the liquid in its wells, the robot records that too.

.. versionadded:: 2.20

.. _require-liquid-presence:

Require Liquids
===============

The :py:meth:`.InstrumentContext.require_liquid_presence` method tells a Flex pipette to check for and require a liquid in a well or reservoir. This method returns ``True`` if the pressure sensors in a pipette detect a liquid and ``False`` if liquid if the sensors do not. Detection takes place during aspiration. As the Flex pipette detects a liquid, it stops, raises itself above the liquid's surface, and then resumes aspiration. If the Flex pipette does not detect liquid, the robot raises an error, stops the protocol to let you resolve the problem, and writes a warning to the run log. See also :ref:`lpd`.

.. code-block:: python

    pipette.require_liquid_presence()

.. versionadded:: 2.20
