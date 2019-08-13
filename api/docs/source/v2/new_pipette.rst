.. _new_pipette:

########################
Creating a Pipette
########################

Pipettes are created and attached to a specific mount on the OT-2 (``'left'`` or ``'right'``) on the OT-2 using the function ``load_instrument``
from the ``ProtocolContext`` class. This will return an ``InstrumentContext`` object. See :ref:`v2-atomic-commands` and :ref:`v2-complex-commands`
for liquid handling commands from the ``InstrumentContext`` class.

There are other parameters for pipettes, but the most important are the tip rack(s) it will use during the protocol.

Pipette Model(s)
===================
Currently in our API there are 7 pipette models to correspond with the offered pipette models on our website.

They are as follows:

+---------------------------------------+-----------------------------+
|          Pipette Type                 |     Model Name              |
+=======================================+=============================+
| ``P10 Single``   (1 - 10 ul)          | ``'p10_single'``            |
+---------------------------------------+-----------------------------+
| ``P10 Multi``    (1 - 10 ul)          | ``'p10_multi'``             |
+---------------------------------------+-----------------------------+
| ``P50 Single``   (5 - 50 ul)          | ``'p50_single'``            |
+---------------------------------------+-----------------------------+
| ``P50 Multi``    (5 - 50 ul)          | ``'p50_multi'``             |
+---------------------------------------+-----------------------------+
| ``P300 Single``  (30 - 300 ul)        | ``'p300_single'``           |
+---------------------------------------+-----------------------------+
| ``P300 Multi``   (30 - 300 ul)        | ``'p300_multi'``            |
+---------------------------------------+-----------------------------+
| ``P1000 Single`` (100 - 1000 ul)      | ``'p1000_single'``          |
+---------------------------------------+-----------------------------+


For every pipette type you are using in a protocol, you must use one of the
model names specified above. For example, if you want to control a ``P300 Single``,
the command might look something like:

.. code-block:: python

    pipette = protocol_context.load_instrument('p300_single', 'left')


Adding Tip Racks
================
As stated at the beginning of this section, the most important non-mandatory parameter to add on a pipette would be tipracks.
This parameter accepts a *list* of tiprack labware objects which allows 1-n amount of tipracks. Associating tipracks with your pipette
allows for automatic tip tracking throughout your protocol which is further discussed in :ref:`v2-atomic-commands` and :ref:`v2-complex-commands`.

.. code-block:: python
    tiprack = protocol_context.load_labware('opentrons_96_tiprack_300ul', '1')
    pipette = protocol_context.load_instrument('p300_single', 'left', tip_racks=[tiprack])

Plunger Flow Rates
==================

The speeds in units of microliters/second at which the pipette will aspirate and dispense can be controlled.

This may look something like

.. code-block:: python

    pipette = protocol_context.load_instrument('p300_single', 'left', tip_racks=[tiprack])
    pipette.flow_rate.aspirate = 50
    pipette.flow_rate.dispense = 50
    pipette.flow_rate.blow_out = 100

The above sets a ``P300 Single`` pipette's flow rates to 50 μl/s for aspirate and dispense, but 100 μl/s for blow out.


Minimum and Maximum Volume
==========================

The minimum and maximum volume of the pipette will be set according to the volume of the tip currently in use.

To find defaults for volume as well as liquid handling default speeds, see below.

.. _defaults:

Defaults
========

The given defaults for every pipette model is the following:

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
