#######################
Pipette Characteristics
#######################

.. _new-multichannel-pipettes:

Multi-Channel Pipettes
======================

All building block and advanced commands work with single- and multi-channel pipettes.

To keep the interface to the Opentrons API consistent between single- and multi-channel pipettes, commands treat the *backmost channel* (furthest from the door) of a multi-channel pipette as the location of the pipette. Location arguments to building block and advanced commands are specified for the backmost channel.

Also, this means that offset changes (such as :py:meth:`.Well.top` or :py:meth:`.Well.bottom`) can be applied to the single specified well, and each pipette channel will be at the same position relative to the well that it is over.

Finally, because there is only one motor in a multi-channel pipette, these pipettes always aspirate and dispense on all channels simultaneously.

8-Channel, 96-Well Plate Example
--------------------------------

To demonstrate these concepts, let's write a protocol that uses a Flex 8-Channel Pipette and a 96-well plate. We'll then aspirate and dispense a liquid to different locations on the same well plate. To start, let's load a pipette in the right mount and add our labware.

.. code-block:: python
    :substitutions:

    from opentrons import protocol_api
    
    requirements = {'robotType': 'Flex', 'apiLevel':'|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        # Load a tiprack for 1000 µL tips
        tiprack1 = protocol.load_labware(
            load_name='opentrons_flex_96_tiprack_1000ul', location='D1')       
        # Load a 96-well plate
        plate = protocol.load_labware(
            load_name='corning_96_wellplate_360ul_flat', location='C1')       
        # Load an 8-channel pipette on the right mount
        right = protocol.load_instrument(
            instrument_name='flex_8channel_1000',
            mount='right',
            tip_racks=[tiprack1])

After loading our instruments and labware, let's tell the robot to pick up a pipette tip from location ``A1`` in ``tiprack1``::

    right.pick_up_tip()

With the backmost pipette channel above location A1 on the tip rack, all eight channels are above the eight tip rack wells in column 1.   

After picking up a tip, let's tell the robot to aspirate 300 µL from the well plate at location ``A2``::
        
    right.aspirate(volume=300, location=plate['A2'])

With the backmost pipette tip above location A2 on the well plate, all eight channels are above the eight wells in column 2.

Finally, let's tell the robot to dispense 300 µL into the well plate at location ``A3``::

    right.dispense(volume=300, location=plate['A3'].top())

With the backmost pipette tip above location A3, all eight channels are above the eight wells in column 3. The pipette will dispense liquid into all the wells simultaneously.

8-Channel, 384-Well Plate Example
---------------------------------

In general, you should specify wells in the first row of a well plate when using multi-channel pipettes. An exception to this rule is when using 384-well plates. The greater well density means the nozzles of a multi-channel pipette can only access every other well in a column. Specifying well A1 accesses every other well starting with the first (rows A, C, E, G, I, K, M, and O). Similarly, specifying well B1 also accesses every other well, but starts with the second (rows B, D, F, H, J, L, N, and P).

To demonstrate these concepts, let's write a protocol that uses a Flex 8-Channel Pipette and a 384-well plate. We'll then aspirate and dispense a liquid to different locations on the same well plate. To start, let's load a pipette in the right mount and add our labware.

.. code-block:: python

    def run(protocol: protocol_api.ProtocolContext):
        # Load a tiprack for 200 µL tips
        tiprack1 = protocol.load_labware(
            load_name='opentrons_flex_96_tiprack_200ul', location="D1")
        # Load a well plate
        plate = protocol.load_labware(
            load_name='corning_384_wellplate_112ul_flat', location="D2")
        # Load an 8-channel pipette on the right mount
        right = protocol.load_instrument(
            instrument_name='flex_8channel_1000',
            mount='right',
            tip_racks=[tiprack1])


After loading our instruments and labware, let's tell the robot to pick up a pipette tip from location ``A1`` in ``tiprack1``::

    right.pick_up_tip()

With the backmost pipette channel above location A1 on the tip rack, all eight channels are above the eight tip rack wells in column 1.

After picking up a tip, let's tell the robot to aspirate 100 µL from the well plate at location ``A1``::

    right.aspirate(volume=100, location=plate['A1'])

The eight pipette channels will only aspirate from every other well in the column: A1, C1, E1, G1, I1, K1, M1, and O1.

Finally, let's tell the robot to dispense 100 µL into the well plate at location ``B1``::

    right.dispense(volume=100, location=plate['B1'])

The eight pipette channels will only dispense into every other well in the column: B1, D1, F1, H1, J1, L1, N1, and P1.


.. _new-plunger-flow-rates:

Pipette Flow Rates
==================

Measured in µL/s, the flow rate determines how much liquid a pipette can aspirate, dispense, and blow out. Opentrons pipettes have their own default flow rates. The API lets you change the flow rate on a loaded :py:class:`.InstrumentContext` by altering the :py:obj:`.InstrumentContext.flow_rate` properties listed below. 

* Aspirate: ``InstrumentContext.flow_rate.aspirate``
* Dispense: ``InstrumentContext.flow_rate.dispense``
* Blow out: ``InstrumentContext.flow_rate.blow_out``

These flow rate properties operate independently. This means you can specify different flow rates for each property within the same protocol. For example, let's load a simple protocol and set different flow rates for the attached pipette.

.. code-block:: python

    def run(protocol: protocol_api.ProtocolContext):
        tiprack1 = protocol.load_labware(
            load_name='opentrons_flex_96_tiprack_1000ul', location='D1')       
        pipette = protocol.load_instrument(
            instrument_name='flex_1channel_1000',
            mount='left',
            tip_racks=[tiprack1])                
        plate = protocol.load_labware(
            load_name='corning_96_wellplate_360ul_flat', location='D3')
        pipette.pick_up_tip()

Let's tell the robot to aspirate, dispense, and blow out the liquid using default flow rates. Notice how you don't need to specify a ``flow_rate`` attribute to use the defaults::

        pipette.aspirate(200, plate['A1'])  # 160 µL/s
        pipette.dispense(200, plate['A2'])  # 160 µL/s
        pipette.blow_out()                  #  80 µL/s

Now let's change the flow rates for each action::

        pipette.flow_rate.aspirate = 50
        pipette.flow_rate.dispense = 100
        pipette.flow_rate.blow_out = 75
        pipette.aspirate(200, plate['A1'])  #  50 µL/s
        pipette.dispense(200, plate['A2'])  # 100 µL/s
        pipette.blow_out()                  #  75 µL/s
        
These flow rates will remain in effect until you change the ``flow_rate`` attribute again *or* call ``configure_for_volume()``. Calling ``configure_for_volume()`` always resets all pipette flow rates to the defaults for the mode that it sets.

.. TODO add mode ranges and flow defaults to sections below

.. note::
    In API version 2.13 and earlier, :py:obj:`.InstrumentContext.speed` offered similar functionality to ``.flow_rate``. It attempted to set the plunger speed in mm/s. Due to technical limitations, that speed could only be approximate. You must use ``.flow_rate`` in version 2.14 and later, and you should consider replacing older code that sets ``.speed``.

.. versionadded:: 2.0


Flex Pipette Flow Rates
-----------------------

The default flow rates for Flex pipettes depend on the maximum volume of the pipette and the capacity of the currently attached tip. For each pipette–tip configuration, the default flow rate is the same for aspirate, dispense, and blowout actions.

.. list-table::
    :header-rows: 1
    
    * - Pipette Model
      - Tip Capacity (µL)
      - Flow Rate (µL/s)
    * - 50 µL (1- and 8-channel)
      - All capacities
      - 57
    * - 1000 µL (1-, 8-, and 96-channel)
      - 50
      - 478
    * - 1000 µL (1-, 8-, and 96-channel)
      - 200
      - 716
    * - 1000 µL (1-, 8-, and 96-channel)
      - 1000
      - 716


Additionally, all Flex pipettes have a well bottom clearance of 1 mm for aspirate and dispense actions.

.. _ot2-flow-rates:

OT-2 Pipette Flow Rates
-----------------------

The following table provides data on the default aspirate, dispense, and blowout flow rates (in µL/s) for OT-2 GEN2 pipettes. Default flow rates are the same across all three actions.

.. list-table::
    :header-rows: 1

    * - Pipette Model
      - Volume (µL)
      - Flow Rates (µL/s)
    * - P20 Single-Channel GEN2
      - 1–20
      - 
          * API v2.6 or higher: 7.56
          * API v2.5 or lower: 3.78
    * - P300 Single-Channel GEN2
      - 20–300
      - 
          * API v2.6 or higher: 92.86
          * API v2.5 or lower: 46.43
    * - P1000 Single-Channel GEN2
      - 100–1000
      -
          * API v2.6 or higher: 274.7
          * API v2.5 or lower: 137.35
    * - P20 Multi-Channel GEN2
      - 1–20
      - 7.6
    * - P300 Multi-Channel GEN2
      - 20–300
      - 94
 
Additionally, all OT-2 GEN2 pipettes have a default head speed of 400 mm/s and a well bottom clearance of 1 mm for aspirate and dispense actions.

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

