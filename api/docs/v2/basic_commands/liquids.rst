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


Use the :py:meth:`.Well.meniscus` method to aspirate relative to the meniscus of liquid in a well with a Flex pipette. First, you'll need to determine the amount of liquid in your well one of two ways: 

- Specify your starting liquid volume with :py:meth:`~.Labware.load_liquid`.
- Measure the height of the liquid with :py:meth:`~.InstrumentContext.measure_liquid_height`. 

This example measures the liquid height in well A2 of a plate and then immediately aspirates below the meniscus:: 

    pipette.pick_up_tip()
    pipette.measure_liquid_height(plate["A2"])
    pipette.aspirate(
        volume=200, 
        location=plate["A2"].meniscus(z=-1, target="end")
        ) 
    # aspirates at 1 mm below the liquid meniscus

The liquid meniscus changes when you aspirate liquid from a well. Set ``target="end"`` to ensure the pipette stays submerged while aspirating. For more information, see :ref:`well-meniscus`.

``measure_liquid_height()`` works best with a new pipette tip each time. To save time and tips throughout your protocol, use ``Labware.load_liquid`` instead to specify starting liquid volumes.

.. versionadded:: 2.23

See also:

- :ref:`new-default-op-positions` for information about controlling pipette height for a particular pipette.
- :ref:`position-relative-labware` for information about controlling pipette height from within a well.
- :ref:`move-to` for information about moving a pipette to any reachable deck location.

Aspiration Flow Rates
---------------------

Flex and OT-2 pipettes aspirate at :ref:`default flow rates <new-plunger-flow-rates>` measured in µL/s. Specifying the ``rate`` parameter multiplies the flow rate by that value. As a best practice, don't set the flow rate higher than 3x the default. For example, this code causes the pipette to aspirate at twice its normal rate::


    pipette.aspirate(200, plate["A1"], rate=2.0)

.. versionadded:: 2.0


You can also specify an absolute ``flow_rate`` to set the flow rate in µL/second::

    pipette.aspirate(200, plate["A1"], flow_rate=50)

.. versionchanged:: 2.24
    Add the aspirate ``flow_rate`` parameter. 

The ``rate`` and ``flow_rate`` parameters are mutually exclusive. If you specify both in the same command, the API will raise an error. 


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


Use the :py:meth:`.Well.meniscus` method to dispense at the meniscus of liquid in your well with a Flex pipette. First, you'll need to determine the amount of liquid in your well one of two ways: 

- Specify your starting liquid volume with :py:meth:`~.Labware.load_liquid`.
- Measure the height of liquid with :py:meth:`~.InstrumentContext.measure_liquid_height`.

This example measures the liquid height in well B1 of a plate and then immediately dispenses below the meniscus:: 

    pipette.measure_liquid_height(plate["B1"])
    pipette.dispense(
        volume=200, 
        location=plate["B1"].meniscus(z=-1, target="start")
        ) 
    # dispenses at 1 mm below the liquid meniscus

The liquid meniscus changes when you dispense liquid into a well. Set ``target="start"`` to ensure the pipette begins the dispense at the liquid meniscus. For more information, see :ref:`well-meniscus`.

``measure_liquid_height()`` works best with a new pipette tip each time. To save time and tips throughout your protocol, use ``Labware.load_liquid`` instead to specify starting liquid volumes.

.. versionadded:: 2.23

See also:

- :ref:`new-default-op-positions` for information about controlling pipette height for a particular pipette.
- :ref:`position-relative-labware` for formation about controlling pipette height from within a well.
- :ref:`move-to` for information about moving a pipette to any reachable deck location.

Dispense Flow Rates
-------------------

Flex and OT-2 pipettes dispense at :ref:`default flow rates <new-plunger-flow-rates>` measured in µL/s. Adding a number to the ``rate`` parameter multiplies the flow rate by that value. As a best practice, don't set the flow rate higher than 3x the default. For example, this code causes the pipette to dispense at twice its normal rate::

    pipette.dispense(200, plate["B1"], rate=2.0)

.. versionadded:: 2.0

You can also specify an absolute ``flow_rate`` to set the flow rate in µL/second::

    pipette.dispense(200, plate["B1"], flow_rate=50)

.. versionchanged:: 2.24
    Add the dispense ``flow_rate`` parameter. 

The ``rate`` and ``flow_rate`` parameters are mutually exclusive. If you specify both in the same command, the API will raise an error.  




.. _push-out-dispense:

Push Out After Dispense
-----------------------

Dispensing all liquid from the tip usually requires an additional volume of air to ensure no droplets remain. In a push out after dispense, the pipette dispenses all liquid by returning the plunger to its aspirate start position. Then, without stopping, the plunger moves further down to dispense the additional push out volume. 

Use the optional ``push_out`` parameter of ``dispense()`` for applications that require moving the pipette plunger lower than the default, without performing a full :ref:`blow out <blow-out>`.

Flex pipettes include a push out of air by default for any dispense that completely empties the attached pipette tip. Both default and maximum push out volumes depend on your Flex pipette and tip combination. 

+----------------------------------+-----------+---------------------------+----------------------------+
|              Pipette             |  Tip      |         Default           |          Maximum           |
|                                  |           |         push out          |          push out          |
+==================================+===========+===========================+============================+ 
| 50 µL (1- and 8-channel)         | 50 µL     | - Regular: 2 µL           | - Regular: 3.9 µL          | 
|                                  |           | - Low-volume mode: 7 µL   | - Low-volume mode: 11.7 µL | 
+----------------------------------+-----------+---------------------------+---------+------------------+ 
| 1000 µL (1-, 8-, and 96-channel) | 50 µL     |          7 µL             |         79.5 µL            | 
|                                  +-----------+---------------------------+----------------------------+
|                                  | 200 µL    |          5 µL             |         79.5 µL            | 
|                                  +-----------+---------------------------+----------------------------+
|                                  | 1000 µL   |          20 µL            |         79.5 µL            |
+----------------------------------+-----------+---------------------------+----------------------------+

OT-2 pipettes do not include a push out by default. 

You can change the push out volume for any :py:meth:`~.InstrumentContext.dispense` command. For this example dispense of all 100 µL of liquid in a 200 µL tip, the Flex 1-Channel 1000 µL pipette plunger will move the equivalent of 7 µL (an additional 2 µL more than the default) beyond the aspirate start position to push out any remaining liquid in the tip. 

.. code-block:: python
    
    pipette.pick_up_tip()
    pipette.aspirate(100, plate["A1"])
    pipette.dispense(100, plate["B1"], push_out=7)
    pipette.drop_tip()

Set ``push_out`` to override the default if you observe problems with dispensing. If liquid remains inside the tip after dispensing, set ``push_out`` higher. If no liquid remains, but contact dispenses create too many bubbles, set ``push_out`` lower. 

To disable ``push_out`` during any dispense action, set ``push_out=0``. You can use this to avoid multiple ``push_out`` actions during a mix step. 

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

.. versionadded:: 2.0
    
This example uses an offset to set the touch tip location 2mm below the top of the current well::

    pipette.touch_tip(v_offset=-2) 

This example moves the pipette 75% of well's total radius and 2 mm below the top of well::

    pipette.touch_tip(plate["B1"], radius=0.75, v_offset=-2)

And this example uses ``mm_from edge`` to set the touch tip location 0 mm, or the edge of the current well::

    pipette.touch_tip(plate["B1"], mm_from_edge=0)

.. versionchanged:: 2.24
    Add the ``mm_from_edge`` parameter.

The ``touch_tip`` feature allows the pipette to touch the edges of a well gently instead of crashing into them. It includes the ``radius`` and ``mm_from_edge`` arguments. When ``radius=1`` or ``mm_from_edge=0``,the robot moves the centerline of the pipette’s plunger axis to the edge of a well. This means a pipette tip may sometimes touch the well wall too early, causing it to bend inwards. A smaller radius or larger ``mm_from_edge``, like 1 mm, help avoid premature wall collisions and a lower speed produces gentler motion. Different liquid droplets behave differently, so test out these parameters in a single well before performing a full protocol run.

The ``radius`` and ``mm_from_edge`` arguments are mutually exclusive. If you specify both in the same command, the API will raise an error. 

.. warning::
    *Do not* set the ``radius`` value greater than ``1.0`` or a negative ``mm_from_edge`` value. When ``radius`` is > ``1.0`` or ``mm_from_edge`` is < ``0.0``, the robot will forcibly move the pipette tip across a well wall or edge. This type of aggressive movement can damage the pipette tip and the pipette.

Touch Speed
-----------

Touch speed controls how fast the pipette moves in mm/s during a touch tip step. The default movement speed is 60 mm/s, the minimum is 1 mm/s, and the maximum is 80 mm/s. Calling ``touch_tip`` without any arguments moves a tip at the default speed in the current well::

    pipette.touch_tip()

This example specifies a well location and sets the speed to 20 mm/s::

    pipette.touch_tip(plate["B1"], speed=20)

This example uses the current well and sets the speed to 80 mm/s::

    pipette.touch_tip(speed=80)

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

Like an ``aspirate()`` or ``dispense()``, you can use optional arguments to specify the flow rate, a delay, or a push out after an aspirate or dispense in the mix. 

This example draws 100 µL from the current well and mixes it three times, aspirating at 50 µL/sec and with a 5 second delay after each aspirate::

    pipette.mix(
        repetitions=3,
        volume=100,
        aspirate_flow_rate=50,
        aspirate_delay=5
    )

And this example adds a push out of 10 µL after the final dispense in the mix::

    pipette.mix(repetitions=3, volume=100, final_push_out=10)

.. note::

    In API versions 2.2 and earlier, during a mix, the pipette moves up and out of the target well. In API versions 2.3 and later, the pipette does not move while mixing. 

.. versionadded:: 2.0
.. versionchanged:: 2.24
    Adds the ``aspirate_flow_rate``, ``dispense_flow_rate``, ``aspirate_delay``, ``dispense_delay``, and ``final_push_out`` parameters. 

.. _air-gap:

Air Gap
=======

The :py:meth:`.InstrumentContext.air_gap` method tells the pipette to draw in air before or after a liquid. Creating an air gap helps keep liquids from seeping out of a pipette after drawing it from a well. This method includes arguments that give you control over the amount of air to aspirate and the position at the target well to add the air gap. By default, the pipette moves 5 mm above the center of a well before aspirating air. Calling :py:meth:`~.InstrumentContext.air_gap` with no arguments uses the entire remaining volume in the pipette.

This example aspirates 200 µL of air 5 mm above the current well::

    pipette.air_gap(volume=200)

This example aspirates 200 µL of air 20 mm above the the current well::

    pipette.air_gap(volume=200, height=20)

This example aspirates enough air to fill the remaining volume in a pipette::

    pipette.air_gap()

Instead of moving to a distance above the target well, this example uses the ``in_place`` parameter to immediately add add an air gap after an aspirate or dispense. Here, the pipette aspirates 200 µL of air while still inside the target well:: 

    pipette.air_gap(volume=200, in_place=True)

Just like in an ``aspirate()`` or ``dispense()``, you can use the ``rate`` and ``flow_rate`` parameters to change the flow rate. 

This example uses the ``rate`` parameter to aspirate 200 µL of air at twice the default flow rate:: 

    pipette.air_gap(volume=200, rate=2.0)

This example uses the ``flow_rate`` parameter to aspirate 200 µL of air at 50 µL/sec::

    pipette.air_gap(volume=200, flow_rate=50)

The ``rate`` and ``flow_rate`` parameters are mutually exclusive. If you choose to change the ``flow_rate``, specifying a ``rate`` will raise an error. 

.. versionadded:: 2.0
.. versionchanged:: 2.24
    Add the ``in_place`` and ``flow_rate`` parameters. 

.. _detect-liquid-presence:

Detect Liquids
==============

The :py:meth:`.InstrumentContext.detect_liquid_presence` method tells a Flex pipette to check for liquid in a well. It returns ``True`` if the pressure sensors in the pipette detect a liquid and ``False`` if the sensors do not. When ``detect_liquid_presence()`` finds an empty well it won't raise an error or stop your protocol. 

``detect_liquid_presence()`` is a standalone method to record the presence or absence of a liquid. You don't have to aspirate after detecting liquid presence. However, you should always pick up a tip immediately prior to checking for liquid, and either aspirate or drop the tip immediately after. This ensures that the pipette uses a clean, dry tip to check for liquid, and prevents cross-contamination.

A potential use of liquid detection is to try aspirating from another well if the first well is found to contain no liquid.

.. code-block:: python
    
    pipette.pick_up_tip()
    if pipette.detect_liquid_presence(reservoir["A1"]):
        pipette.aspirate(100, reservoir["A1"])
    else:
        pipette.aspirate(100, reservoir["A2"])

.. versionadded:: 2.20

.. _require-liquid-presence:

Require Liquids
===============

The :py:meth:`.InstrumentContext.require_liquid_presence` method tells a Flex pipette to check for `and require` liquid in a well. When ``require_liquid_presence()`` finds an empty well, it raises an error and pauses the protocol to let you resolve the problem.

``require_liquid_presence()`` is a standalone method to react to a missing liquid or empty well. You don't have to aspirate after requiring liquid presence. However, you should always pick up a tip immediately prior to checking for liquid, and either aspirate or drop the tip immediately after. This ensures that the pipette uses a clean, dry tip to check for liquid, and prevents cross-contamination.

.. code-block:: python

    pipette.pick_up_tip()
    pipette.require_liquid_presence(reservoir["A1"])
    pipette.aspirate(100, reservoir["A1"])  # only occurs if liquid found

You can also require liquid presence for all aspirations performed with a given pipette. See :ref:`lpd`.

.. versionadded:: 2.20

.. _measure-liquids:

Measure Liquids
===============

The :py:meth:`~.InstrumentContext.measure_liquid_height` method tells a Flex pipette to measure the height of liquid relative to the bottom of a well. When ``measure_liquid_height()`` finds an empty well, it raises and error and pauses the protocol to let you resolve the problem. 

``measure_liquid_height()`` is a standalone method that records the height of liquid in a well during a protocol. You can use the liquid height to aspirate or dispense from, or move to, the liquid meniscus, either immediately after or later in your protocol.

.. code-block:: python

    pipette.pick_up_tip()
    pipette.measure_liquid_height(plate["A1"])
    pipette.aspirate(
        volume=200, location=plate["A1"].meniscus(z=-1, target="end")
    )  # aspirates from 1 mm below the liquid meniscus

You don't have to aspirate after measuring liquid height, but you should always pick up a tip immediately prior to measuring the liquid height, and either aspirate or drop the tip immediately after. This ensures that the pipette uses a clean, dry tip to check for liquid, and prevents cross-contamination. 