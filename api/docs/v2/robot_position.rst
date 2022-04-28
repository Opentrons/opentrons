.. _robot-position:

################################
Controlling the Robot's Position
################################

TK intro about controlling position

****************************
Position Relative to Labware
****************************

TK section intro

Default Positions Within Wells
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

By default, the OT-2 will aspirate and dispense 1mm above the bottom of a well. This
may not be suitable for some labware geometries, liquids, or experimental
protocols. While you can specify the exact location within a well in direct calls to
:py:meth:`.InstrumentContext.aspirate` and :py:meth:`.InstrumentContext.dispense`
(see the :ref:`v2-location-within-wells` section), you cannot use this method in
complex commands like :py:meth:`.InstrumentContext.transfer`, and it can be
cumbersome to specify the position every time.

Instead, you can use the attribute :py:obj:`.InstrumentContext.well_bottom_clearance`
to specify the height above the bottom of a well to either aspirate or dispense:

1) Editing ``pipette.well_bottom_clearance.aspirate`` changes the height of aspiration
2) Editing ``pipette.well_bottom_clearance.dispense`` changes the height of dispense

Changing these attributes will affect *all* aspirates and dispenses, even those
executed as part of a transfer.


.. code-block:: python
    :substitutions:

    from opentrons import protocol_api, types

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', '1')
        pipette = protocol.load_instrument('p300_single', 'right', tip_racks = [tiprack])
        plate = protocol.load_labware('corning_384_wellplate_112ul_flat', 3)
        pipette.pick_up_tip()

        # Aspirate 1mm above the bottom of the well
        pipette.aspirate(50, plate['A1'])
        # Dispense 1mm above the bottom of the well
        pipette.dispense(50, plate['A1'])

        # Aspirate 2mm above the bottom of the well
        pipette.well_bottom_clearance.aspirate = 2
        pipette.aspirate(50, plate['A1'])
        # Still dispensing 1mm above the bottom
        pipette.dispense(50, plate['A1'])
        pipette.aspirate(50, plate['A1'])

        # Dispense high above the well
        pipette.well_bottom_clearance.dispense = 10
        pipette.dispense(50, plate['A1'])

.. versionadded:: 2.0

Position Modifiers
^^^^^^^^^^^^^^^^^^

Top
---

The method :py:meth:`.Well.top` returns a position at the top center of the well. This
is a good position to use for :ref:`new-blow-out` or any other operation where you
don't want to be contacting the liquid. In addition, :py:meth:`.Well.top` takes an
optional argument ``z``, which is a distance in mm to move relative to the top
vertically (positive numbers move up, and negative numbers move down):

.. code-block:: python

   plate['A1'].top()     # This is the top center of the well
   plate['A1'].top(z=1)  # This is 1mm above the top center of the well
   plate['A1'].top(z=-1) # This is 1mm below the top center of the well

.. versionadded:: 2.0

Bottom
------

The method :py:meth:`.Well.bottom` returns a position at the bottom center of the
well. This is a good position to start when considering where to aspirate,
or any other operation where you want to be contacting the liquid. In addition,
:py:meth:`.Well.bottom` takes an optional argument ``z``, which is a distance in mm
to move relative to the bottom vertically (positive numbers move up, and negative
numbers move down):

.. code-block:: python

   plate['A1'].bottom()     # This is the bottom center of the well
   plate['A1'].bottom(z=1)  # This is 1mm above the bottom center of the well
   plate['A1'].bottom(z=-1) # This is 1mm below the bottom center of the well.
                            # this may be dangerous!


.. warning::

    Negative ``z`` arguments to :py:meth:`.Well.bottom` may cause the tip to
    collide with the bottom of the well. The OT-2 has no sensors to detect this,
    and if it happens, the pipette that collided will be too high in z until the next time it picks up a tip.


.. note::

   If you are using this to change the position at which the robot does
   :ref:`new-aspirate` or :ref:`new-dispense` throughout the protocol, consider
   setting the default aspirate or dispense offset with
   :py:obj:`.InstrumentContext.well_bottom_clearance`
   (see :ref:`new-default-op-positions`).

.. versionadded:: 2.0

Center
------

The method :py:meth:`.Well.center` returns a position centered in the well both
vertically and horizontally. This can be a good place to start for precise
control of positions within the well for unusual or custom labware.

.. code-block:: python

   plate['A1'].center() # This is the vertical and horizontal center of the well

.. versionadded:: 2.0


Manipulating Positions
^^^^^^^^^^^^^^^^^^^^^^

The objects returned by the position modifier functions are all instances of
:py:class:`opentrons.types.Location`, which are
`named tuples <https://docs.python.org/3/library/collections.html#collections.namedtuple>`_
representing the combination of a point in space (another named tuple) and
a reference to the associated :py:class:`.Well` (or :py:class:`.Labware`, or
slot name, depending on context).

To adjust the position within a well, you can use :py:meth:`.Location.move`.
Pass it a :py:class:`opentrons.types.Point` representing a 3-dimensional offset.
It will return a new location, representing the original location with that offset applied.

For example:

.. code-block:: python
    :substitutions:

    from opentrons import types

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol):
        plate = protocol.load_labware(
        'corning_24_wellplate_3.4ml_flat', location='1')

        # Get the center of well A1.
        center_location = plate['A1'].center()

        # Get a location 1 mm right, 1 mm back, and 1 mm up from the center of well A1.
        adjusted_location = center_location.move(types.Point(x=1, y=1, z=1))

        # Move to 1 mm right, 1 mm back, and 1 mm up from the center of well A1.
        pipette.move_to(adjusted_location)

.. versionadded:: 2.0


*****************
Absolute Position
*****************

TK section intro

Move To
=======

You can use :py:meth:`.InstrumentContext.move_to` to move a pipette to any location on the deck.

For example, you can move to the first tip in your tip rack:

.. code-block:: python

    pipette.move_to(tiprack['A1'].top())


Unlike commands that require labware, like :ref:`new-aspirate` or :ref:`new-dispense`, :py:meth:`.InstrumentContext.move_to` deals with :py:class:`.types.Location` instances, which combine positions in :ref:`protocol-api-deck-coords` and associated :py:class:`.Labware` instances. You don't have to create them yourself; this is what is returned from methods such as :py:meth:`.Well.top` and :py:meth:`.Well.bottom`. It does mean, however, that you can't move to a well directly; you must use :py:meth:`.Well.top` or build a :py:class:`.types.Location` yourself.

You can also specify at what height you would like the robot to move to inside of a location using :py:meth:`.Well.top` and :py:meth:`.Well.bottom` methods on that location (more on these methods and others like them in the :ref:`v2-location-within-wells` section):

.. code-block:: python

    pipette.move_to(plate['A1'].bottom())  # move to the bottom of well A1
    pipette.move_to(plate['A1'].top())     # move to the top of well A1
    pipette.move_to(plate['A1'].bottom(2)) # move to 2mm above the bottom of well A1
    pipette.move_to(plate['A1'].top(-2))   # move to 2mm below the top of well A1

The above commands will cause the robot's head to first move upwards, then over to above the target location, then finally downwards until the target location is reached.
If instead you would like the robot to move in a straight line to the target location, you can set the movement strategy to ``'direct'``.

.. code-block:: python

    pipette.move_to(plate['A1'].top(), force_direct=True)

.. warning::

    Moving without an arc will run the risk of colliding with things on your deck. Be very careful when using this option.

Usually the above option is useful when moving inside of a well. Take a look at the below sequence of movements, which first move the head to a well, and use 'direct' movements inside that well, then finally move on to a different well.

.. code-block:: python

    pipette.move_to(plate['A1'].top())
    pipette.move_to(plate['A1'].bottom(1), force_direct=True)
    pipette.move_to(plate['A1'].top(-2), force_direct=True)
    pipette.move_to(plate['A2'].top())

.. versionadded:: 2.0

Gantry Speed
============

The OT-2's gantry usually moves as fast as it can given its construction; this makes
protocol execution faster and saves time. However, some experiments or liquids may
require slower, gentler movements over protocol execution time. In this case, you
can alter the OT-2 gantry's speed when a specific pipette is moving by setting
:py:obj:`.InstrumentContext.default_speed`. This is a value in mm/s that controls
the overall speed of the gantry. Its default is 400 mm/s.

.. warning::

   The default of 400 mm/s was chosen because it is the maximum speed Opentrons knows
   will work with the gantry. Your specific robot may be able to move faster, but you
   shouldn't make this value higher than the default without extensive experimentation.


.. code-block:: python
    :substitutions:

    from opentrons import protocol_api, types

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        pipette = protocol.load_instrument('p300_single', 'right')
        # Move to 50mm above the front left of slot 5, very quickly
        pipette.move_to(protocol.deck.position_for('5').move(types.Point(z=50)))
        # Slow down the pipette
        pipette.default_speed = 100
        # Move to 50mm above the front left of slot 9, much more slowly
        pipette.move_to(protocol.deck.position_for('9').move(types.Point(z=50)))

.. versionadded:: 2.0

Per-Axis Speed Limits
=====================

In addition to controlling the overall speed of motions, you can set per-axis speed limits
for the OT-2's axes. Unlike the overall speed, which is controlled per-instrument, axis
speed limits take effect for both pipettes and all motions. These can be set for the
``X`` (left-and-right gantry motion), ``Y`` (forward-and-back gantry motion), ``Z``
(left pipette up-and-down motion), and ``A`` (right pipette up-and-down motion) using
:py:obj:`.ProtocolContext.max_speeds`. This works like a dictionary, where the keys are
axes, assigning to a key sets a max speed, and deleting a key or setting it to ``None``
resets that axis's limit to the default:

.. code-block:: python
    :substitutions:

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol):
        protocol.max_speeds['X'] = 50  # limit x axis to 50 mm/s
        del protocol.max_speeds['X']  # reset x axis limit
        protocol.max_speeds['A'] = 10  # limit a axis to 10 mm/s
        protocol.max_speeds['A'] = None  # reset a axis limit


You cannot set limits for the pipette plunger axes with this mechanism; instead, set the
flow rates or plunger speeds as described in :ref:`new-plunger-flow-rates`.

.. versionadded:: 2.0
