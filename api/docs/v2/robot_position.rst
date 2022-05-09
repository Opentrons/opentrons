.. _robot-position:

##############
Robot Position
##############

Most of the time when executing a protocol, the Python Protocol API's methods take care of determining where the robot needs to go to perform the commands you've given. But sometimes you need to modify how the robot moves in order to achieve the purposes of your protocol. This document will cover the two main ways to define positions — relative to labware, or relative to the entire deck — as well as how to alter the robot's speed or trajectory as it moves to those positions.


.. _position-relative-labware:

****************************
Position Relative to Labware
****************************

Every well on every piece of labware you load has three addressable positions — top, bottom, and center — that are determined by the labware definition. You can use these positions as-is or calculate other positions relative to them in a number of ways.

Top
===

The method :py:meth:`.Well.top` returns a position level with the top of the well, centered in both horizontal directions. 

.. code-block:: python

   plate['A1'].top()     # the top center of the well

This is a good position to use for :ref:`new-blow-out` or any other operation where you
don't want the tip to contact the liquid. In addition, you can adjust the height of this position with the optional argument ``z``, which is measured in mm. Positive ``z`` numbers move the position up, and negative ``z`` numbers move it down:

.. code-block:: python

   plate['A1'].top(z=1)  # 1 mm above the top center of the well
   plate['A1'].top(z=-1) # 1 mm below the top center of the well

.. versionadded:: 2.0

Bottom
======

The method :py:meth:`.Well.bottom` returns a position level with the bottom of the well, centered in both horizontal directions. 

.. code-block:: python

   plate['A1'].bottom()     # the bottom center of the well

This is a good position to start for aspiration or any other operation where you want the tip to contact the liquid. The same as with :py:meth:`.Well.top`, you can adjust the height of this position with the optional argument ``z``, which is measured in mm. Positive ``z`` numbers move the position up, and negative ``z``` numbers move it down:

.. code-block:: python

   plate['A1'].bottom()     # the bottom center of the well
   plate['A1'].bottom(z=1)  # 1 mm above the bottom center of the well
   plate['A1'].bottom(z=-1) # 1 mm below the bottom center of the well
                            # this may be dangerous!


.. warning::

    Negative ``z`` arguments to :py:meth:`.Well.bottom` may cause the tip to collide with the bottom of the well. The OT-2 has no sensors to detect this. A collision may bend the tip (affecting liquid handling) and the pipette may be higher on the z-axis than expected until it picks up another tip.

.. versionadded:: 2.0

Center
======

The method :py:meth:`.Well.center` returns a position centered in the well both
vertically and horizontally. This can be a good place to start for precise
control of positions within the well for unusual or custom labware.

.. code-block:: python

   plate['A1'].center() # the vertical and horizontal center of the well

.. versionadded:: 2.0


.. _new-default-op-positions:

Default Positions
=================

By default, the OT-2 will aspirate and dispense 1 mm above the bottom of wells, which may not be suitable for some labware geometries, liquids, or protocols. You can change this by using :py:meth:`.Well.bottom` with the ``z`` argument, although it can be cumbersome to do this repeatedly. If you need to change the aspiration or dispensing height for many operations, specify the distance from the well bottom with :py:obj:`.InstrumentContext.well_bottom_clearance`. This attribute has two sub-attributes: ``well_bottom_clearance.aspirate`` changes the height for aspiration, and ``well_bottom_clearance.dispense`` changes the height for dispensing.

Changing these attributes will affect all subsequent aspirate and dispense actions performed by that pipette, even those executed as part of a :py:meth:`.transfer`.


.. code-block:: python
    :substitutions:

    from opentrons import protocol_api, types

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', '1')
        pipette = protocol.load_instrument('p300_single', 'right', tip_racks = [tiprack])
        plate = protocol.load_labware('corning_384_wellplate_112ul_flat', 3)

        pipette.pick_up_tip()

        # aspirate 1 mm above the bottom of the well (default)
        pipette.aspirate(50, plate['A1'])
        # dispense 1 mm above the bottom of the well (default)
        pipette.dispense(50, plate['A1'])

        # change clearance for aspiration to 2 mm
        pipette.well_bottom_clearance.aspirate = 2
        # aspirate 2 mm above the bottom of the well
        pipette.aspirate(50, plate['A1'])
        # still dispensing 1 mm above the bottom
        pipette.dispense(50, plate['A1'])

        pipette.aspirate(50, plate['A1'])
        # change clearance for dispensing to 10 mm      
        pipette.well_bottom_clearance.dispense = 10
        # dispense high above the well
        pipette.dispense(50, plate['A1'])

.. versionadded:: 2.0


.. _protocol-api-deck-coords:

********************
Position on the Deck
********************


The OT-2’s base coordinate system is known as *deck coordinates*. Many API functions use this coordinate system, and you can also reference it directly. It is a right-handed coordinate system always specified in mm, with the origin ``(0, 0, 0)`` at the front left of the robot. The positive ``x`` direction is to the right, the positive ``y`` direction is to the back, and the positive ``z`` direction is up. 

You can identify a point in this coordinate system with a :py:class:`.types.Location` object, either as a standard Python :py:class:`tuple` of three floats, or as an instance of the :py:obj:`~collections.namedtuple` :py:class:`.types.Point`.

.. note::

    There are technically multiple vertical axes: ``z`` is the axis of the left pipette mount and ``a`` is the axis of the right pipette mount. There are also pipette plunger axes: ``b`` (left) and ``c`` (right). You usually don't have to refer to these axes directly, since most motion commands are issued to a particular pipette and the OT-2 automatically selects the correct axis to move. Similarly, :py:class:`.types.Location` only deals with ``x``, ``y``, and ``z`` values. 
    



*****************
Movement Behavior
*****************

Whenever the OT-2 moves to a particular position, it calculates where to move using its `pipette offset and tip length calibration <https://support.opentrons.com/s/article/Get-started-Calibrate-tip-length-and-pipette-offset>`_ data. For convenience, many methods have location arguments and incorporate movement automatically. This section will focus on moving the robot independent of other actions, as well as changing its manner of movement.


Points vs. Locations
====================

When instructing the OT-2 to move, it's important to consider the difference between the :py:class:`~opentrons.types.Point` and :py:class:`~opentrons.types.Location` types. Points are ordered tuples or named tuples: ``(10, 20, 30)``, ``(x=10, y=20, z=30)``, and ``(z=30, y=20, x=10)`` are all equivalent. Locations are a higher-order tuple that combines a point with a reference object: a well, a piece of labware, or ``None`` (the deck).

.. TODO document position_for and other methods in deck.py that return Locations

This distinction is important for the :py:meth:`.Location.move` method, which operates on a location, takes a point as an argument, and outputs an updated location. To use this method, include ``from opentrons import types`` at the start of your protocol. Because ``.move()`` is a method, it does not mutate the location it is called against. To perform an action at the updated location, use it as an argument of another method or save it to a variable:

.. code-block:: python
    :substitutions:

    from opentrons import types

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol):
        plate = protocol.load_labware('corning_24_wellplate_3.4ml_flat', location='1')
        tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', '2')
        pipette = protocol.load_instrument('p300_single', 'right', tip_racks = [tiprack])
        pipette.pick_up_tip()

        # get the location at the center of well A1
        center_location = plate['A1'].center()

        # get a location 1 mm right, 1 mm back, and 1 mm up from the center of well A1
        adjusted_location = center_location.move(types.Point(x=1, y=1, z=1))

        # aspirate 1 mm right, 1 mm back, and 1 mm up from the center of well A1
        pipette.aspirate(50, adjusted_location)
        # dispense at the same location
        pipette.dispense(50, center_location.move(types.Point(x=1, y=1, z=1)))


.. versionadded:: 2.0



Move To
=======

You can use :py:meth:`.InstrumentContext.move_to` to move a pipette to any reachable location on the deck. If the pipette has picked up a tip, it will move the end of the tip to that position; if it hasn't, it will move the pipette nozzle to that position.

The argument of ``move_to()`` must be a :py:class:`.Location`, either one automatically generated by methods like :py:meth:`.Well.top` and :py:meth:`.Well.bottom` or one you've created yourself — you can't move to a well directly. The additional ``z`` arguments of the ``.top()`` and ``.bottom()`` methods (see :ref:`position-relative-labware` above) are shorthand for adjusting the top and bottom locations with ``move()``:

.. code-block:: python

    pipette.move_to(plate['A1'])              # error; can't move to a well itself
    pipette.move_to(plate['A1'].bottom())     # move to the bottom of well A1
    pipette.move_to(plate['A1'].top())        # move to the top of well A1
    pipette.move_to(plate['A1'].bottom(z=2))  # move to 2 mm above the bottom of well A1
    pipette.move_to(plate['A1'].bottom().move(types.Point(z=2)))    # same as above
    pipette.move_to(plate['A1'].top(z=-2))    # move to 2 mm below the top of well A1

When using ``move_to()``, by default the pipette will move in an arc: first upwards, then laterally to a position above the target location, and finally downwards to the target location.
If you have a reason for doing so, you can force the pipette to move in a straight line to the target location:

.. code-block:: python

    pipette.move_to(plate['A1'].top(), force_direct=True)

.. warning::

    Moving without an arc runs the risk of the pipette colliding with objects on the deck. Be very careful when using this option, especially when moving longer distances.

Small, direct movements can be useful for working inside of a well, without having the tip exit and re-enter the well. Here is how to move the pipette to a well, make direct movements inside that well, and then move on to a different well:

.. code-block:: python

    pipette.move_to(plate['A1'].top())
    pipette.move_to(plate['A1'].bottom(1), force_direct=True)
    pipette.move_to(plate['A1'].top(-2), force_direct=True)
    pipette.move_to(plate['A2'].top())

.. versionadded:: 2.0

Gantry Speed
============

The OT-2's gantry usually moves as fast as it can given its construction: 400 mm/s. Moving at this speed
saves time when executing protocols. However, some experiments or liquids may
require slower movements. In this case, you
can reduce the gantry speed for a specific pipette by setting
:py:obj:`.InstrumentContext.default_speed`:

.. code-block:: python
    :substitutions:

    from opentrons import protocol_api, types

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        pipette = protocol.load_instrument('p300_single', 'right')
        # move to 50 mm above the front left of slot 5 at default speed
        pipette.move_to(protocol.deck.position_for('5').move(types.Point(z=50)))
        # slow down the pipette
        pipette.default_speed = 100
        # move to 50 mm above the front left of slot 9 much more slowly
        pipette.move_to(protocol.deck.position_for('9').move(types.Point(z=50)))
        
.. warning::

   The default of 400 mm/s was chosen because it is the maximum speed Opentrons knows
   will work with the gantry. Your specific robot may be able to move faster, but you
   shouldn't increase this value above 400 unless instructed by Opentrons Support.


.. versionadded:: 2.0

Axis Speed Limits
=================

In addition to controlling the overall gantry speed, you can set speed limits for each of the individual  axes: ``x`` (gantry left/right motion), ``y`` (gantry forward/back motion), ``z`` (left pipette up/down motion), and ``a`` (right pipette up/down motion). Unlike ``default_speed``, which is an instrument property, axis speed limits are stored in a protocol property :py:obj:`.ProtocolContext.max_speeds`; therefore the ``x`` and ``y`` values affect all movements by both pipettes. This property works like a dictionary, where the keys are axes, assigning a value to a key sets a max speed, and deleting a key or setting it to ``None`` resets that axis's limit to the default:

.. code-block:: python
    :substitutions:

	protocol.max_speeds['x'] = 50       # limit x-axis to 50 mm/s
	del protocol.max_speeds['x']        # reset x-axis limit
	protocol.max_speeds['a'] = 10       # limit a-axis to 10 mm/s
	protocol.max_speeds['a'] = None     # reset a-axis limit


Note that ``max_speeds`` can't set limits for the pipette plunger axes (``b`` and ``c``); instead, set the
flow rates or plunger speeds as described in :ref:`new-plunger-flow-rates`.

.. versionadded:: 2.0
