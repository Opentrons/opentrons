.. _new-pipette:

########
Pipettes
########

When writing a protocol, you must inform the Protocol API about the pipettes you will be using on your OT-2. The Protocol API then creates software objects called :py:class:`.InstrumentContext`, that represent the attached pipettes.

Pipettes are loaded into a specific mount (``'left'`` or ``'right'``) on the OT-2 using the function :py:meth:`.ProtocolContext.load_instrument` from the :py:class:`.ProtocolContext` class. This will return an :py:class:`.InstrumentContext` object. See :ref:`v2-atomic-commands` and :ref:`v2-complex-commands`
for liquid handling commands from the :py:class:`.InstrumentContext` class.

.. _new-create-pipette:

Loading A Pipette
------------------

Pipettes are specified in a protocol using the method :py:meth:`.ProtocolContext.load_instrument`. This method requires the model of the instrument to load, the mount to load it in, and (optionally) a list of associated tipracks:

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.2'}

    def run(protocol: protocol_api.ProtocolContext):
        # Load a P50 multi on the left slot
        left = protocol.load_instrument('p50_multi', 'left')
        # Load a P1000 Single on the right slot, with two racks of tips
        tiprack1 = protocol.load_labware('opentrons_96_tiprack_1000ul', 1)
        tiprack2 = protocol.load_labware('opentrons_96_tiprack_1000ul', 2)
        right = protocol.load_instrument('p1000_single', 'right',
                                         tip_racks=[tiprack1, tiprack2])

.. versionadded:: 2.0

.. note::

    When you load a pipette in a protocol, you inform the OT-2 that you want the specified pipette to be present. Even if you do not use the pipette anywhere else in your protocol, the Opentrons App and the OT-2 will not let your protocol proceed until all pipettes loaded with ``load_instrument`` are attached to the OT-2.

.. _new-multichannel-pipettes:
Multi-Channel Pipettes
======================

All building block and advanced commands work with both single-channel (like
``'p20_single_gen2'``) and multi-channel (like ``'p20_multi_gen2'``) pipettes.
To keep the interface to the Opentrons API consistent between single and
multi-channel pipettes, commands treat the *backmost channel* (furthest from the
door) of a
multi-channel pipette as the location of the pipette. Location arguments to
building block and advanced commands are specified for the backmost channel.
This also means that offset changes (such as :py:meth:`.Well.top` or
:py:meth:`.Well.bottom`) can be applied to the single specified well, and each
channels of the pipette will be at the same position relative to the well
that it is over.

For instance, to aspirate from the first column of a 96-well plate you would write:

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.5'}

    def run(protocol: protocol_api.ProtocolContext):
        # Load a tiprack for 300uL tips
        tiprack1 = protocol.load_labware('opentrons_96_tiprack_300ul', 1)
        # Load a wellplate
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat')

        # Load a P300 Multi GEN2 on the right mount
        right = protocol.load_instrument(
            'p300_multi_gen2', 'right', tip_rack=tiprack1)

        # Specify well A1 for pick_up_tip. The backmost channel of the
        # pipette moves to A1, which means the rest of the wells are above the
        # rest of the wells in column 1.
        right.pick_up_tip(tiprack1['A1'])

        # Similarly, specifying well A2 for aspirate means the pipette will
        # position its backmost channel over well A2, and the rest of the
        # pipette channels are over the rest of the wells of column 1
        right.aspirate(300, plate['A2'])

        # Dispense into column 3 of the plate with all 8 channels of the
        # pipette at the top of their respective wells
        right.dispense(300, plate['A3'].top())

In general, you should specify wells in the first row of a labware when you are
using multi-channel pipettes. One common exception to this rule is when using
384-well plates. The spacing between the wells in a 384-well plate and the space
between the nozzles of a multi-channel pipette means that a multi-channel
pipette accesses every other well in a column. Specifying well A1 acesses every
other well starting with the first (rows A, C, E, G, I, K, M, and O); specifying well
B1 similarly accesses every other well, but starting with the second (rows B, D,
F, H, J, L, N, and P).

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.5'}

    def run(protocol: protocol_api.ProtocolContext):
        # Load a tiprack for 300uL tips
        tiprack1 = protocol.load_labware('opentrons_96_tiprack_300ul', 1)
        # Load a wellplate
        plate = protocol.load_labware('corning_384_wellplate_112ul_flat')

        # Load a P300 Multi GEN2 on the right mount
        right = protocol.load_instrument(
            'p300_multi_gen2', 'right', tip_rack=tiprack1)

        # pick up a tip in preparation for aspiration
        right.pick_up_tip()

        # Aspirate from wells A1, C1, E1, G1, I1, K1, M1, and O1
        right.aspirate(300, plate['A1'])
        # Dispense in wells B1, D1, F1, H1, J1, L1, N1, and P1
        right.dispense(300, plate['B1'])


This pattern of access applies to both building block commands and advanced
commands.

.. _new-pipette-models:

Pipette Models
==============

This table lists the model names, which are passed to :py:meth:`.ProtocolContext.load_instrument`, for each model of pipette sold by Opentrons.


+---------------------------------------+-------------------------+
|          Pipette Type                 |     Model Name          |
+=======================================+=========================+
| ``P20 Single GEN2`` (1 - 20 µL)       | ``'p20_single_gen2'``   |
+---------------------------------------+-------------------------+
| ``P300 Single GEN2`` (20 - 300 µL)    | ``'p300_single_gen2'``  |
+---------------------------------------+-------------------------+
| ``P1000 Single GEN2`` (100 - 1000 µL) | ``'p1000_single_gen2'`` |
+---------------------------------------+-------------------------+
| ``P300 Multi GEN2`` (20-300 µL)       | ``'p300_multi_gen2'``   |
+---------------------------------------+-------------------------+
| ``P20 Multi GEN2`` (1-20 µL)          | ``'p20_multi_gen2'``    |
+---------------------------------------+-------------------------+
| ``P10 Single``   (1 - 10 µL)          | ``'p10_single'``        |
+---------------------------------------+-------------------------+
| ``P10 Multi``    (1 - 10 µL)          | ``'p10_multi'``         |
+---------------------------------------+-------------------------+
| ``P50 Single``   (5 - 50 µL)          | ``'p50_single'``        |
+---------------------------------------+-------------------------+
| ``P50 Multi``    (5 - 50 µL)          | ``'p50_multi'``         |
+---------------------------------------+-------------------------+
| ``P300 Single``  (30 - 300 µL)        | ``'p300_single'``       |
+---------------------------------------+-------------------------+
| ``P300 Multi``   (30 - 300 µL)        | ``'p300_multi'``        |
+---------------------------------------+-------------------------+
| ``P1000 Single`` (100 - 1000 µL)      | ``'p1000_single'``      |
+---------------------------------------+-------------------------+


GEN2 Pipette Backward Compatibility
===================================

GEN2 pipettes have different volume ranges than GEN1 pipettes. However, each GEN2 pipette covers one or two GEN1 pipette volume ranges. For instance, with  a range of 1 - 20 µL, the P20 Single GEN2 covers the P10 Single GEN1 (1 - 10 µL). If your protocol specifies a GEN1 pipette but you have a GEN2 pipette attached to your OT-2  with a compatible volume range, you can still run your protocol. The OT-2 will consider the GEN2 pipette to have the same minimum volume as the GEN1 pipette, so any advanced commands have the same behavior as before.

Specifically, the P20 GEN2s (single and multi) cover the entire P10 GEN1 range; the P300 Single GEN2 covers the entire P300 Single GEN1 range; and the P1000 Single GEN2 covers the entire P1000 Single GEN1 range.

If you have a P50 Single specified in your protocol, there is no automatic backward compatibility.
If you want to use a GEN2 Pipette, you must change your protocol to load either a P300 Single GEN2
(if you are using volumes between 20 and 50 µL) or a P20 Single GEN2 (if you are using volumes
below 20 µL).

If your protocol specifies a pipette and you attach a compatible
pipette, the protocol will run, and the pipette will act the same as the pipette
specified in your protocol - altering parameters like its minimum volume if
necessary.

For instance, if your protocol specifies a P300
Multi, and you connect a P300 Multi GEN2, the pipette will act like a P300
Multi - it will set its minimum volume to 30 µL.


Adding Tip Racks
================

When you load a pipette, you can optionally specify a list of tip racks you will use to supply the pipette. This is done with the optional parameter ``tip_racks`` to :py:meth:`.ProtocolContext.load_instrument`.
This parameter accepts a *list* of tiprack labware objects, allowing you to specify as many
tipracks as you want. Associating tipracks with your pipette allows for automatic tip tracking
throughout your protocol. This removes the need to specify tip locations in
:py:meth:`.InstrumentContext.pick_up_tip`.

For instance, in this protocol you can see the effects of specifying tipracks:

.. code-block:: python

   from opentrons import protocol_api

   metadata = {'apiLevel': '2.2'}

   def run(protocol: protocol_api.ProtocolContext):
       tiprack_left = protocol.load_labware('opentrons_96_tiprack_300ul', '1')
       tiprack_right = protocol.load_labware('opentrons_96_tiprack_300ul', '2')
       left_pipette = protocol.load_instrument('p300_single', 'left')
       right_pipette = protocol.load_instrument(
           'p300_multi', 'right', tip_racks=[tiprack_right])

       # You must specify the tip location for the left pipette, which was
       # loaded without specifying tip_racks
       left_pipette.pick_up_tip(tiprack['A1'])
       left_pipette.drop_tip()

       # And you have to do it every time you call pick_up_tip, doing all
       # your own tip tracking
       left_pipette.pick_up_tip(tiprack['A2'])
       left_pipette.drop_tip()
       left_pipette.pick_up_tip(tiprack['A3'])
       left_pipette.drop_tip()

       # Since you specified tip_racks when loading the right pipette, it will
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

.. versionadded:: 2.0

Modifying Pipette Behaviors
---------------------------

The OT-2 has many default behaviors that are occasionally appropriate to change for
a particular experiment. This section details those behaviors.

.. _new-plunger-flow-rates:

Plunger Flow Rates
==================

Opentrons pipettes aspirate or dispense at different rates. These flow rates can be changed on a loaded
:py:class:`.InstrumentContext` at any time, in units of µL/sec by altering
:py:obj:`.InstrumentContext.flow_rate`. This has the following attributes:

* ``InstrumentContext.flow_rate.aspirate``: The aspirate flow rate, in µL/s
* ``InstrumentContext.flow_rate.dispense``: The dispense flow rate, in µL/s
* ``InstrumentContext.flow_rate.blow_out``: The blow out flow rate, in µL/s

Each of these attributes can be altered without affecting the others.

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.2'}

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


:py:obj:`.InstrumentContext.speed` offers the same functionality, but controlled in
units of mm/s of plunger speed. This does not have a linear transfer to flow rate and
should only be used if you have a specific need.

.. versionadded:: 2.0

.. _new-default-op-positions:

Default Positions Within Wells
==============================

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

    from opentrons import protocol_api, types

    metadata = {'apiLevel': '2.2'}

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

    from opentrons import protocol_api, types

    metadata = {'apiLevel': '2.2'}

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

    metadata = {'apiLevel': '2.2'}

    def run(protocol):
        protocol.max_speeds['X'] = 50  # limit x axis to 50 mm/s
        del protocol.max_speeds['X']  # reset x axis limit
        protocol.max_speeds['A'] = 10  # limit a axis to 10 mm/s
        protocol.max_speeds['A'] = None  # reset a axis limit


You cannot set limits for the pipette plunger axes with this mechanism; instead, set the
flow rates or plunger speeds as described in :ref:`new-plunger-flow-rates`.

.. versionadded:: 2.0

.. _defaults:

Defaults
--------

**Head Speed**: 400 mm/s

**Well Bottom Clearances**

- Aspirate default: 1mm above the bottom
- Dispense default: 1mm above the bottom

**p20_single_gen2**

- Aspirate Default: 3.78 µL/s
- Dispense Default: 3.78 µL/s
- Blow Out Default: 3.78 µL/s
- Minimum Volume: 1 µL
- Maximum Volume: 20 µL

**p300_single_gen2**

- Aspirate Default: 46.43 µL/s
- Dispense Default: 46.43 µL/s
- Blow Out Default: 46.43 µL/s
- Minimum Volume: 20 µL
- Maximum Volume: 300 µL

**p1000_single_gen2**

- Aspirate Default: 137.35 µL/s
- Dispense Default: 137.35 µL/s
- Blow Out Default: 137.35 µL/s
- Minimum Volume: 100 µL
- Maximum Volume: 1000 µL

**p20_multi_gen2**

- Aspirate Default: 7.6 µL/s
- Dispense Default: 7.6 µL/s
- Blow Out Default: 7.6 µL/s
- Minimum Volume: 1 µL
- Maximum Volume: 20 µL

**p300_multi_gen2**

- Aspirate Default: 94 µL/s
- Dispense Default: 94 µL/s
- Blow Out Default: 94 µL/s
- Minimum Volume: 20 µL
- Maximum Volume: 300 µL

**p10_single**

- Aspirate Default: 5 µL/s
- Dispense Default: 10 µL/s
- Blow Out Default: 1000 µL/s
- Minimum Volume: 1 µL
- Maximum Volume: 10 µL

**p10_multi**

- Aspirate Default: 5 µL/s
- Dispense Default: 10 µL/s
- Blow Out Default: 1000 µL/s
- Minimum Volume: 1 µL
- Maximum Volume: 10 µL

**p50_single**

- Aspirate Default: 25 µL/s
- Dispense Default: 50 µL/s
- Blow Out Default: 1000 µL/s
- Minimum Volume: 5 µL
- Maximum Volume: 50 µL

**p50_multi**

- Aspirate Default: 25 µL/s
- Dispense Default: 50 µL/s
- Blow Out Default: 1000 µL/s
- Minimum Volume: 5 µL
- Maximum Volume: 50 µL

**p300_single**

- Aspirate Default: 150 µL/s
- Dispense Default: 300 µL/s
- Blow Out Default: 1000 µL/s
- Minimum Volume: 30 µL
- Maximum Volume: 300 µL

**p300_multi**

- Aspirate Default: 150 µL/s
- Dispense Default: 300 µL/s
- Blow Out Default: 1000 µL/s
- Minimum Volume: 30 µL
- Maximum Volume: 300 µL

**p1000_single**

- Aspirate Default: 500 µL/s
- Dispense Default: 1000 µL/s
- Blow Out Default: 1000 µL/s
- Minimum Volume: 100 µL
- Maximum Volume: 1000 µL
