.. _new-pipette:

########
Pipettes
########

Pipettes are created and attached to a specific mount on the OT-2 (``'left'`` or ``'right'``) on the OT-2 using the function :py:meth:`.ProtocolContext.load_instrument` .
from the ``ProtocolContext`` class. This will return an ``InstrumentContext`` object. See :ref:`v2-atomic-commands` and :ref:`v2-complex-commands`
for liquid handling commands from the ``InstrumentContext`` class.

This section discusses the details of creating a pipette, and the behaviors of the pipette you can alter.

.. _new-create-pipette:

Creating A Pipette
------------------

Pipettes are specified in a protocol using the method :py:meth:`.ProtocolContext.load_instrument`.
This method requires the model of the instrument to load, the mount to load it in, and (optionally)
a list of associated tipracks:

.. code-block:: python

    from opentrons import protocol_api

    def run(protocol: protocol_api.ProtocolContext):
        # Load a P50 multi on the left slot
        left = protocol.load_instrument('p50_multi', 'left')
        # Load a P1000 Single on the right slot, with two racks of tips
        tiprack1 = protocol.load_labware('opentrons_96_tiprack_1000ul', 1)
        tiprack2 = protocol.load_labware('opentrons_96_tiprack_1000ul', 2)
        right = protocol.load_instrument('p1000_single', 'right',
                                         tip_racks=[tiprack1, tiprack2])

.. _new-pipette-models:

Pipette Model(s)
===================
Currently in our API there are 7 pipette models to correspond with the offered pipette models on our website.

They are as follows:

+----------------------------------+--------------------+
|          Pipette Type            |     Model Name     |
+==================================+====================+
| ``P10 Single``   (1 - 10 ul)     | ``'p10_single'``   |
+----------------------------------+--------------------+
| ``P10 Multi``    (1 - 10 ul)     | ``'p10_multi'``    |
+----------------------------------+--------------------+
| ``P50 Single``   (5 - 50 ul)     | ``'p50_single'``   |
+----------------------------------+--------------------+
| ``P50 Multi``    (5 - 50 ul)     | ``'p50_multi'``    |
+----------------------------------+--------------------+
| ``P300 Single``  (30 - 300 ul)   | ``'p300_single'``  |
+----------------------------------+--------------------+
| ``P300 Multi``   (30 - 300 ul)   | ``'p300_multi'``   |
+----------------------------------+--------------------+
| ``P1000 Single`` (100 - 1000 ul) | ``'p1000_single'`` |
+----------------------------------+--------------------+


For every pipette type you are using in a protocol, you must use one of the
model names specified above.


Adding Tip Racks
================
:py:meth:`.ProtocolContext.load_instrument` has one important optional parameter: ``tipracks``.
This parameter accepts a *list* of tiprack labware objects, allowing you to specify as many
tipracks as you want. Associating tipracks with your pipette allows for automatic tip tracking
throughout your protocol, which removes the need for specifying tip locations in
:py:meth:`.InstrumentContext.pick_up_tip`.

For instance, in this protocol you can see the effects of specifying tipracks:

.. code-block:: python
   from opentrons import protocol_api
   def run(protocol: protocol_api.ProtocolContext):
       tiprack_left = protocol.load_labware('opentrons_96_tiprack_300ul', '1')
       tiprack_right = protocol.load_labware('opentrons_96_tiprack_300ul', '2')
       left_pipette = protocol.load_instrument('p300_single', 'left')
       right_pipette = protocol.load_instrument(
           'p300_multi', 'right', tip_racks=[tiprack_right])

       # You must specify the tip location for the left pipette, which was
       # created without specifying tip_racks
       left_pipette.pick_up_tip(tiprack['A1'])
       left_pipette.drop_tip()
       # And you have to do it every time you call pick_up_tip, doing all
       # your own tip tracking
       left_pipette.pick_up_tip(tiprack['A2'])
       left_pipette.drop_tip()
       left_pipette.pick_up_tip(tiprack['A3'])
       left_pipette.drop_tip()

       # Since you specified tip_racks when creating the right pipette, it will
       # automatically pick up from A1 of its associated tiprack
       right_pipette.pick_up_tip()
       right_pipette.drop_tip()
       # And further calls to pick_up_tip will automatically progress through
       # the tips in the rack
       right_pipette.pick_up_tip()
       right_pipette.drop_tip()
       right_pipette.pick_up_tip()
       right_pipette.drop_tip()
       

This is further discussed in :ref:`v2-atomic-commands`
and :ref:`v2-complex-commands`.

Modifying Pipette Behaviors
---------------------------

The OT-2 has many default behaviors that are occasionally appropriate to change for
a particular experiment or liquid. This section details those behaviors.

Plunger Flow Rates
==================

Opentrons pipettes have different rates of aspiration and dispense, depending on internal
mechanical details. In general, you should not increase aspiration and dispense flow rates
above their defaults; however, some experiments and protocols require slower rates of
aspiration and dispense. These flow rates can be changed on a created
:py:class:`.InstrumentContext` at any time, in units of microliters/sec by altering
:py:attr:`.InstrumentContext.flow_rate`. This has the following attributes:

* ``InstrumentContext.flow_rate.aspirate``: The aspirate flow rate, in ul/s
* ``InstrumentContext.flow_rate.dispense``: The dispense flow rate, in ul/s
* ``InstrumentContext.flow_rate.blow_out``: The blow out flow rate, in ul/s

Each of these attributes can be altered without affecting the others.

.. code-block:: python
    from opentrons import protocol_api

    def run(protocol: protocol_api.ProtocolContext):
        tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', '1')
        pipette = protocol.load_instrument(
            'p300_single', 'right', tip_racks=[tiprack])
        plate = protocol.load_labware('opentrons_96_tiprack_300ul', 3)
        pipette.pick_up_tip()
        # Aspirate at the default flowrate of 150 ul/s
        pipette.aspirate(50, plate['A1'])
        # Dispense at the default flowrate of 300 ul/s
        pipette.dispense(50, plate['A1'])
        # Change default aspirate speed to 50ul/s, 1/3 of the default
        pipette.flow_rate.aspirate = 50
        # this aspirate will be at 50ul/s
        pipette.aspirate(50, plate['A1'])
        # this dispense will be the default 300 ul/s
        pipette.dispense(50, plate['A1'])
        # Slow down dispense too
        pipette.flow_rate.dispense = 50
        # This is still at 50 ul/s
        pipette.aspirate(50, plate['A1'])
        # This is now at 50 ul/s as well
        pipette.dispense(50, plate['A1'])
        # Also slow down the blow out flowrate from its default
        pipette.flow_rate.blow_out = 100
        pipette.aspirate(50, plate['A1'])
        # This will be much slower
        pipette.blow_out()
        pipette.drop_tip()


:py:attr:`.InstrumentContext.speed` offers the same functionality, but controlled in
units of mm/s of plunger speed. This does not have a linear transfer to flow rate and
should only be used if you have a specific need.


.. _new-default-op-positions:

Default Positions Within Wells
==============================

By default, the OT-2 will aspirate and dispense 1mm above the bottom of a well. This
may not be suitable for some labware and well geometries, liquids, or experimental
protocols. While you can specify the exact location within a well in direct calls to
:py:meth:`.InstrumentContext.aspirate` and :py:meth:`.InstrumentContext.dispense`
(see the :ref:`v2-location-within-wells` section), you cannot use this method in
complex commands like :py:meth:`.InstrumentContext.transfer`, and it can be
cumbersome to specify the position every time.

Instead, you can use the attribute :py:attr:`.InstrumentContext.well_bottom_clearance`
to specify the height above the bottom of a well to either aspirate or dispense:

1) Editing ``pipette.well_bottom_clearance.aspirate`` changes the height of aspiration
2) Editing ``pipette.well_bottom_clearance.dispense`` changes the height of dispense

Changing these attributes will affect *all* aspirates and dispenses, even those
executed as part of a transfer.


.. code-block:: python

    from opentrons import protocol_api, types

    def run(protocol: protocol_api.ProtocolContext):
        tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', '1')
        pipette = protocol.load_instrument('p300_single', 'right')
        plate = protocol.load_labware('opentrons_96_tiprack_300ul', 3)
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


Head Speed
==========

The OT-2's gantry usually moves as fast as it can given its construction; this makes
protocol execution faster and saves time. However, some experiments or liquids may
value slower, gentler movements over protocol execution time. In this case, you
can alter the OT-2 gantry's speed when a specific pipette is moving by setting
:py:attr:`.InstrumentContext.default_speed`. This is a value in mm/s that controls
the overall speed of the gantry. Its default is 400 mm/s.

.. warning::

   The default of 400 mm/s was chosen because it is the maximum speed Opentrons knows
   will work with the gantry. Your specific robot may be able to move faster, but you
   shouldn't make this value higher than the default without extensive experimentation.


.. code-block:: python

    from opentrons import protocol_api, types

    def run(protocol: protocol_api.ProtocolContext):
        pipette = protocol.load_instrument('p300_single', 'right')
        # Move to 50mm above the front left of slot 5, very quickly
        pipette.move_to(protocol.deck.position_for('5').move(types.Point(z=50)))
        # Slow down the pipette
        pipette.default_speed = 100
        # Move to 50mm above the front left of slot 9, much more slowly
        pipette.move_to(protocol.deck.position_for('9').move(types.Point(z=50)))


.. _defaults:

Defaults
--------

**Head Speed**: 400 mm/s

**Well Bottom Clearances**

- Aspirate default: 1mm above the bottom
- Dispense default: 1mm above the bottom

**p10_single**

- Aspirate Default: 5 μl/s
- Dispense Default: 10 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 1 μl
- Maximum Volume: 10 μl

**p10_multi**

- Aspirate Default: 5 μl/s
- Dispense Default: 10 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 1 μl
- Maximum Volume: 10 μl

**p50_single**

- Aspirate Default: 25 μl/s
- Dispense Default: 50 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 5 μl
- Maximum Volume: 50 μl

**p50_multi**

- Aspirate Default: 25 μl/s
- Dispense Default: 50 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 5 μl
- Maximum Volume: 50 μl

**p300_single**

- Aspirate Default: 150 μl/s
- Dispense Default: 300 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 30 μl
- Maximum Volume: 300 μl

**p300_multi**

- Aspirate Default: 150 μl/s
- Dispense Default: 300 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 30 μl
- Maximum Volume: 300 μl

**p1000_single**

- Aspirate Default: 500 μl/s
- Dispense Default: 1000 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 100 μl
- Maximum Volume: 1000 μl
