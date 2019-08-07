.. _new_pipette:

########################
Creating a Pipette
########################

Pipettes are created and attached to a specific mount on the OT-2 (``'left'`` or ``'right'``).

There are other parameters for pipettes, but the most important are the tip rack(s) it will use during the protocol.

Pipette Model(s)
===================
Currently in our API there are 7 pipette models to correspond with the offered pipette models on our website.

.. note::

They are as follows:

+---------------------------------------+-----------------------------+
|          Pipette Type                 |         Nickname            |
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

model nick names specified above. For example, if you want to control a ``P300 Single``,

the command might look something like:

.. code-block:: python

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


Defaults
========

The given defaults for every pipette model is the following:

**P10_Single**

- Aspirate Default: 5 μl/s
- Dispense Default: 10 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 1 μl
- Maximum Volume: 10 μl

**P10_Multi**

- Aspirate Default: 5 μl/s
- Dispense Default: 10 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 1 μl
- Maximum Volume: 10 μl

**P50_Single**

- Aspirate Default: 25 μl/s
- Dispense Default: 50 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 5 μl
- Maximum Volume: 50 μl

**P50_Multi**

- Aspirate Default: 25 μl/s
- Dispense Default: 50 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 5 μl
- Maximum Volume: 50 μl

**P300_Single**

- Aspirate Default: 150 μl/s
- Dispense Default: 300 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 30 μl
- Maximum Volume: 300 μl

**P300_Multi**

- Aspirate Default: 150 μl/s
- Dispense Default: 300 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 30 μl
- Maximum Volume: 300 μl

**P1000_Single**

- Aspirate Default: 500 μl/s
- Dispense Default: 1000 μl/s
- Blow Out Default: 1000 μl/s
- Minimum Volume: 100 μl
- Maximum Volume: 1000 μl
