:og:description: How to load and work with Opentrons pipettes in a Python protocol.

.. _new-pipette:

########
Pipettes
########

When writing a protocol, you must inform the Protocol API about the pipettes you will be using on your robot. The :py:meth:`.ProtocolContext.load_instrument` function provides this information and returns an :py:class:`.InstrumentContext` object.

For information about liquid handling, see :ref:`v2-atomic-commands` and :ref:`v2-complex-commands`.

.. _new-create-pipette:

Loading Pipettes
================

Similar to working with labware and modules, you must inform the robot about the pipettes you want to use in your protocol. As noted above, the:py:meth:`~.ProtocolContext.load_instrument` method provides this capability. It also requires the :ref:`pipette's API load name <new-pipette-models>`, its left or right mount position, and (optionally) a list of associated tip racks. Even if you don't use the pipette anywhere else in your protocol, the Opentrons App and the robot won't let you start the protocol run until all pipettes loaded by ``load_instrument()`` are attached properly.

Loading Flex 1- and 8-Channel Pipettes
--------------------------------------

This code sample loads a Flex 1-Channel Pipette in the left mount and a Flex 8-Channel Pipette in the right mount. Both pipettes are 1000 µL. Each pipette uses its own 1000 µL tip rack.  

.. code-block:: Python
    :substitutions:

    from opentrons import protocol_api
    
    requirements = {'robotType': 'Flex', '|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        tiprack1 = protocol.load_labware(
            load_name='opentrons_flex_96_tiprack_1000ul', location='D1')
        tiprack2 = protocol.load_labware(
            load_name='opentrons_flex_96_tiprack_1000ul', location='C1')       
        left = protocol.load_instrument(
            instrument_name='flex_1channel_1000',
            mount='left',
            tip_racks=[tiprack1])                
        right = protocol.load_instrument(
            instrument_name='flex_8channel_1000',
            mount='right',
            tip_racks=[tiprack2]) 

Loading a Flex 96-Channel Pipette
---------------------------------

This code sample loads the Flex 96-Channel Pipette. Because of its size, the Flex 96-Channel Pipette requires the left *and* right pipette mounts. You cannot use this pipette with 1- or 8-Channel Pipette in the same protocol or when these instruments are attached to the robot. To load the 96-Channel Pipette, specify its position as ``mount='left'`` as shown here:

.. code-block:: python

    def run(protocol: protocol_api.ProtocolContext):
        left = protocol.load_instrument(
            instrument_name='flex_96channel_1000', mount='left')

.. versionadded:: 2.15

Loading OT-2 Pipettes
---------------------

This code sample loads a P1000 Single-Channel GEN2 pipette in the left mount and a P300 Single-Channel GEN2 pipette in the right mount. Each pipette uses its own 1000 µL tip rack. 

.. code-block:: python
    :substitutions:

    from opentrons import protocol_api

    metadata = {'apiLevel': |apiLevel|}

    def run(protocol: protocol_api.ProtocolContext):
        tiprack1 = protocol.load_labware(
            load_name='opentrons_96_tiprack_1000ul',
            location=1)
        tiprack2 = protocol.load_labware(
            load_name='opentrons_96_tiprack_1000ul',
            location=2)
        left = protocol.load_instrument(
            instrument_name='p1000_single_gen2',
            mount='left',
            tip_racks=[tiprack1])
        right = protocol.load_instrument(
            instrument_name='p300_multi_gen2',
            mount='right',
            tip_racks=[tiprack1])

.. versionadded:: 2.0

When you load a pipette in this way, you are declaring that you want the specified pipette to be attached to the robot. Even if you don't use the pipette anywhere else in your protocol, the Opentrons App or the touchscreen on Flex will not let your protocol proceed until all pipettes loaded with ``load_instrument`` are attached.

If you're writing a protocol that uses the Flex Gripper, you might think that this would be the place in your protocol to declare that. However, the gripper doesn't require ``load_instrument``! Whether your gripper requires a protocol is determined by the presence of :py:meth:`.ProtocolContext.move_labware` commands. See :ref:`moving-labware` for more details.

.. _new-multichannel-pipettes:

Multi-Channel Pipettes and Well Plates
======================================

All building block and advanced commands work with single- and multi-channel pipettes.

To keep the interface to the Opentrons API consistent between single- and multi-channel pipettes, commands treat the *backmost channel* (furthest from the door) of a multi-channel pipette as the location of the pipette. Location arguments to building block and advanced commands are specified for the backmost channel.

Also, this means that offset changes (such as :py:meth:`.Well.top` or :py:meth:`.Well.bottom`) can be applied to the single specified well, and each pipette channel will be at the same position relative to the well that it is over.

Finally, because there is only one motor in a multi-channel pipette, these pipettes always aspirate and dispense on all channels simultaneously.

8-Channel, 96-Well Plate Example
--------------------------------

To demonstrate these concepts, let's write a protocol that uses a Flex 8-Channel Pipette and a 96-well plate. We'll then aspirate and dispense a liquid to different locations on the same well plate. To start, let's load a pipette in the right mount and add our labware.

.. code-block:: python

    def run(protocol: protocol_api.ProtocolContext):
        # Load a tiprack for 1000uL tips
        tiprack1 = protocol.load_labware(
        load_name='opentrons_flex_96_tiprack_1000ul',
        location='D1')       
        # Load a 96-well plate
        plate = protocol.load_labware(
            load_name='corning_96_wellplate_360ul_flat',
            location='C1')       
        # Load an 8-channel pipette on the right mount
        right = protocol.load_instrument(
            instrument_name='flex_8channel_1000',
            mount='right',
            tip_racks=[tiprack1])

After loading our instruments and labware, let's tell the robot to pick up a pipette tip from location ``A1`` in ``tiprack1``::

    right.pick_up_tip(tiprack1['A1'])

With the backmost pipette channel above location A1 on the tip rack, all eight channels are above the eight tip rack wells in column 1.   

After picking up a tip, let's tell the robot to aspirate 300 ul from the well plate at location ``A2``::
        
    right.aspirate(volume=300, location=plate['A2'])

With the backmost pipette tip above location A2 on the well plate, all eight channels are above the eight wells in column 1.

Finally, let's tell the robot to dispense 300 ul into the well plate at location ``A3``::

    right.dispense(volume=300, location=plate['A3'].top())

With the backmost pipette tip above location A3, all 8 channels are above the eight wells in column 3. The pipette will dispense liquid into all the wells simultaneously.

8-Channel, 384-Well Plate Example
---------------------------------

In general, you should specify wells in the first row of a well plate when using multi-channel pipettes. An exception to this rule is when using 384-well plates. The greater well density means the nozzles of a multi-channel pipette can only accesses every other well in a column. Specifying well A1 accesses every other well starting with the first (rows A, C, E, G, I, K, M, and O). Similarly, specifying well B1 also accesses every other well, but starts with the second (rows B, D, F, H, J, L, N, and P).

To demonstrate these concepts, let's write a protocol that uses a Flex 8-Channel Pipette and a 384-well plate. We'll then aspirate and dispense a liquid to different locations on the same well plate. To start, let's load a pipette in the right mount and add our labware.

.. code-block:: python

    def run(protocol: protocol_api.ProtocolContext):
        # Load a tiprack for 200uL tips
        tiprack1 = protocol.load_labware(
            load_name='opentrons_flex_96_tiprack_200ul', location=1)
        # Load a well plate
        plate = protocol.load_labware(
            load_name='corning_384_wellplate_112ul_flat', location=4)
        # Load an 8-channel pipette on the right mount
        right = protocol.load_instrument(
            instrument_name='flex_8channel_1000',
            location='right',
            tip_racks=[tiprack1])


After loading our instruments and labware, let's tell the robot to pick up a pipette tip from location ``A1`` in ``tiprack1``::

    right.pick_up_tip(tiprack1['A1'])

With the backmost pipette channel above location A1 on the tip rack, all eight channels are above the eight tip rack wells in column 1.

After picking up a tip, let's tell the robot to aspirate 100 ul from the well plate at location ``A1``::

    right.aspirate(volume=100, location=plate['A1'])

Because of the limited clearance between wells, the eight pipette channels will only aspirate from every other well in the column (e.g. A1, C1, E1, G1, I1, K1, M1, O1).

Finally, let's tell the robot to dispense 100 ul into the well plate at location ``B1``::

    right.dispense(volume=100, location=plate['B1'])

Because of the limited clearance between wells, the eight pipette channels will only dispense into every other well in the column (e.g. B1, D1, F1, H1, J1, L1, N1, P1).

Adding Tip Racks
================

The ``load_instrument()`` method includes the optional argument ``tip_racks``. This parameter accepts a list of tip rack labware objects, which lets you to specify as many tip racks as you want. The advantage of using ``tip_racks`` is twofold. First, associating tip racks with your pipette allows for automatic tip tracking throughout your protocol. Second, it removes the need to specify tip locations in the :py:meth:`.InstrumentContext.pick_up_tip` method. For example, let's start by loading loading some labware and instruments like this::
        
    def run(protocol: protocol_api.ProtocolContext):
    tiprack_left = protocol.load_labware(
        load_name='opentrons_flex_96_tiprack_200ul', location='1')
    tiprack_right = protocol.load_labware(
        load_name='opentrons_flex_96_tiprack_200ul', location='2')
    left_pipette = protocol.load_instrument(
        instrument_name='flex_8channel_1000', mount='left')
    right_pipette = protocol.load_instrument(
            instrument_name='flex_8channel_1000',
            mount='right',
            tip_racks=[tiprack_right])

Next, let's specify the tip rack location for the left pipette, which was loaded without a ``tip_racks`` argument::
    
    left_pipette.pick_up_tip(tiprack_left['A1'])
    left_pipette.drop_tip()

But now you have to specify ``tiprack_left`` every time you call ``pick_up_tip``, which means you're doing all your own tip tracking::

    left_pipette.pick_up_tip(tiprack_left['A2'])
    left_pipette.drop_tip()
    left_pipette.pick_up_tip(tiprack_left['A3'])
    left_pipette.drop_tip()

However, because you specified a tip rack location for the right pipette, the robot will automatically pick up from location ``A1`` of its associated tiprack::
    
    right_pipette.pick_up_tip()
    right_pipette.drop_tip()

Additional calls to ``pick_up_tip`` will automatically progress through the tips in the right rack::

    right_pipette.pick_up_tip()
    right_pipette.drop_tip()
    right_pipette.pick_up_tip()
    right_pipette.drop_tip()
       
See also, :ref:`v2-atomic-commands` and :ref:`v2-complex-commands`.

.. versionadded:: 2.0

.. _new-pipette-models:

API Load Names
==============

The pipette's API load name (``instrument_name``) is the first parameter of the ``load_instrument()`` method. It tells your robot which attached pipette you're going to use in a protocol. The tables below list the API load names for the currently available Flex and OT-2 pipettes.

.. tabs::

    .. tab:: Flex Pipettes
        
        +-------------------------+-----------+-------------------------+
        | Pipette Name            | Capacity  | API Load Name           |
        +=========================+===========+=========================+
        | Flex 1-Channel Pipette  | 1–50 µL   | ``flex_1channel_50``    |
        +                         +-----------+-------------------------+
        |                         | 5–1000 µL | ``flex_1channel_1000``  |
        +-------------------------+-----------+-------------------------+
        | Flex 8-Channel Pipette  | 1–50 µL   + ``flex_8channel_50``    |
        +                         +-----------+-------------------------+
        |                         | 5–1000 µL | ``flex_8channel_1000``  |
        +-------------------------+-----------+-------------------------+
        | Flex 96-Channel Pipette | 5–1000 µL | ``flex_96channel_1000`` |
        +-------------------------+-----------+-------------------------+

    .. tab:: OT-2 Pipettes

        +-----------------------------+--------------------+-----------------------+
        | Pipette Name                | Capacity           | API Load Name         |
        +=============================+====================+=======================+
        | P20 Single-Channel GEN2     | 1-20 µL            | ``p20_single_gen2``   |
        +-----------------------------+                    +-----------------------+
        | P20 Multi-Channel GEN2      |                    | ``p20_multi_gen2``    |
        +-----------------------------+--------------------+-----------------------+
        | P300 Single-Channel GEN2    | 20-300 µL          | ``p300_single_gen2``  |
        +-----------------------------+                    +-----------------------+
        | P300 Multi-Channel GEN2     |                    | ``p300_multi_gen2``   |
        +-----------------------------+--------------------+-----------------------+
        | P1000 Single-Channel GEN2   | 100-1000 µL        | ``p1000_single_gen2`` |
        +-----------------------------+--------------------+-----------------------+

        See the OT-2 Pipette Generations section below if you're using GEN1 pipettes on an OT-2. The GEN1 family includes the P10, P50, and P300 single- and multi-channel pipettes, along with the P1000 single-chanel model.


OT-2 Pipette Generations
========================

The OT-2 works with the GEN1 and GEN2 pipette models. The newer GEN2 pipettes have different volume ranges than the older GEN1 pipettes. With some exceptions, the volume ranges for GEN2 pipettes overlap those used by the GEN1 models. If your protocol specifies a GEN1 pipette, but you have a GEN2 pipette with a compatible volume range, you can still run your protocol. The OT-2 will consider the GEN2 pipette to have the same minimum volume as the GEN1 pipette. The following table lists the volume compatibility between the GEN2 and GEN1 pipettes.

.. list-table::
    :header-rows: 1
    
    * - GEN2 Pipette
      - GEN1 Pipette
      - GEN1 Volume
    * - P20 Single-Channel GEN2
      - P10 Single-Channel GEN1
      - 1-10 µL
    * - P20 Multi-Channel GEN2
      - P10 Multi-Channel GEN1
      - 1-10 µL
    * - P300 Single-Channel GEN2
      - P300 Single-Channel GEN1
      - 30-300 µL
    * - P300 Multi-Channel GEN2
      - P300 Multi-Channel GEN1
      - 20-200 µL
    * - P1000 Single-Channel GEN2
      - P1000 Single-Channel GEN1
      - 100-1000 µL

The single- and multi-channel P50 GEN1 pipettes are the exceptions here. If your protocol uses a P50 GEN1 pipette, there is no backward compatibility with a related GEN2 pipette. To replace a P50 GEN1 with a corresponding GEN2 pipette, edit your protocol to load a P20 Single-Channel GEN2 (for volumes below 20 µL) or a P300 Single-Channel GEN2 (for volumes between 20 and 50 µL).

.. _new-plunger-flow-rates:

Pipette Flow Rates
==================

Pipettes aspirate or dispense at different rates measured in units of µL/s. You can change the flow rate on a loaded :py:class:`.InstrumentContext` by altering the :py:obj:`~.InstrumentContext.flow_rate` properties listed below:

* ``InstrumentContext.flow_rate.aspirate``
* ``InstrumentContext.flow_rate.dispense``
* ``InstrumentContext.flow_rate.blow_out``

You can change each attribute without affecting the others. For example, let's load a simple OT-2 protocol as shown below:

.. code-block:: python

    def run(protocol: protocol_api.ProtocolContext):
        tiprack = protocol.load_labware(
            load_name='opentrons_96_tiprack_300ul',
            location='1')
        pipette = protocol.load_instrument(
            instrument_name='p300_single',
            mount='right',
            tip_racks=[tiprack])
        plate = protocol.load_labware(
            load_name='corning_96_wellplate_360ul_flat',
            location='3')
        pipette.pick_up_tip()

Next, let's aspirate at the default flow rate of 150 µL/s and dispense at the default flow rate of 300 µL/s::

        pipette.aspirate(volume=150, plate['A1'])
        pipette.dispense(volume=300, plate['A1'])

Here we're changing default aspirate rate to 50 ul/s (1/3 of the default), but the dispense rate remains unchanged at 300 ul/s::

        pipette.flow_rate.aspirate = 50
        pipette.aspirate(volume=50, plate['A1'])
        pipette.dispense(volume=300, plate['A1'])

Here we're slowing down the dispense rate to match the aspirate rate.::
        
        pipette.flow_rate.dispense = 50
        pipette.aspirate(volume=50, plate['A1'])
        pipette.dispense(volume=50, plate['A1'])

Finally, let's slow down the blow out flow rate from its default::

        pipette.flow_rate.blow_out = 100
        pipette.aspirate(volume=50, plate['A1'])
        pipette.blow_out(volume=50)

.. note::
    In API version 2.13 and earlier, :py:obj:`.InstrumentContext.speed` offered similar functionality. It attempted to set the plunger speed in mm/s. Due to technical limitations, that speed could only be approximate. You must use ``.flow_rate`` in version 2.14 and later, and you should consider replacing older code that sets ``.speed``.

.. versionadded:: 2.0


.. _defaults:

Flex Pipette Flow Rates
-----------------------

The following table provides data on the default aspirate, dispense, and blow-out flow rates (in µL/s) for Flex pipettes.

*Flex Flow rate data coming soon.* 

OT-2 Pipette Flow Rates
-----------------------

The following table provides data on the default aspirate, dispense, and blow-out flow rates (in µL/s) for OT-2 GEN2 pipettes.

+-----------------------------------------+-----------------------------+
| Pipette Model                           | Flow Rates (µL/s)           |
+=========================================+=============================+ 
| P20 Single-Channel GEN2 (1-20 µL)       | * API v2.6 or higher: 7.56  |
|                                         | * API v2.5 or lower: 3.78   |
+-----------------------------------------+-----------------------------+
| P300 Single-Channel GEN2 (20-300 µL)    | * API v2.6 or higher: 92.86 |
|                                         | * API v2.5 or lower: 46.43  |
+-----------------------------------------+-----------------------------+
| P1000 Single-Channel GEN2 (100-1000 µL) | * API v2.6 or higher: 274.7 |
|                                         | * API v2.5 or lower: 137.35 |
+-----------------------------------------+-----------------------------+
| P20 Multi-Channel GEN2 (1-20 µL)        | 7.6                         |
+-----------------------------------------+-----------------------------+
| P300 Multi-Channel GEN2 (20-300 µL)     | 94                          |
+-----------------------------------------+-----------------------------+

Additionally, all OT-2 GEN2 pipettes have a default head speed of 400 mm/second and a well bottom clearance of 1mm for aspirate and dispense actions.
