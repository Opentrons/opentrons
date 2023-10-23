:og:description: How to adapt an OT-2 Python protocol to run on Opentrons Flex.

.. _adapting-ot2-protocols:

********************************
Adapting OT-2 Protocols for Flex
********************************

Python protocols designed to run on the OT-2 can't be directly run on Flex without some modifications. This page describes the minimal steps that you need to take to get OT-2 protocols analyzing and running on Flex.

Adapting a protocol for Flex lets you have parity across different Opentrons robots in your lab, or you can extend older protocols to take advantage of new features only available on Flex. Depending on your application, you may need to do additional verification of your adapted protocol.

Examples on this page are in tabs so you can quickly move back and forth to see the differences between OT-2 and Flex code.

Metadata and Requirements
=========================

Flex requires you to specify an ``apiLevel`` of 2.15 or higher. If your OT-2 protocol specified ``apiLevel`` in the ``metadata`` dictionary, it's best to move it to the ``requirements`` dictionary. You can't specify it in both places, or the API will raise an error.

.. note::
    Consult the :ref:`list of changes in API versions <version-notes>` to see what effect raising the ``apiLevel`` will have. If you increased it by multiple minor versions to get your protocol running on Flex, make sure that your protocol isn't using removed commands or commands whose behavior has changed in a way that may affect your scientific results.

You also need to specify ``'robotType': 'Flex'``. If you omit ``robotType`` in the ``requirements`` dictionary, the API will assume the protocol is designed for the OT-2.

.. tabs::
    
    .. tab:: Original OT-2 code
    
        .. code-block:: python
            :substitutions:
            
            from opentrons import protocol_api
            
            metadata = {
                "protocolName": "My Protocol",
                "description": "This protocol uses the OT-2",
                "apiLevel": "2.14" 
            }

    .. tab:: Updated Flex code
    
        .. code-block:: python
            :substitutions:
            
            from opentrons import protocol_api
            
            metadata = {
                "protocolName": "My Protocol",
                "description": "This protocol uses the Flex",
            }

            requirements = {"robotType": "Flex", "apiLevel": "|apiLevel|"}


Pipettes and Tip-rack Load Names
================================

Flex uses different types of pipettes and tip racks than OT-2, which have their own load names in the API. If possible, load Flex pipettes of the same capacity or larger than the OT-2 pipettes. See the :ref:`list of pipette API load names <new-pipette-models>` for the valid values of ``instrument_name`` in Flex protocols. And check `Labware Library <https://labware.opentrons.com>`_ or the Opentrons App for the load names of Flex tip racks.

.. note::
    If you use smaller capacity tips than in the OT-2 protocol, you may need to make further adjustments to avoid running out of tips. Also, the protocol may have more steps and take longer to execute.

This example converts OT-2 code that uses a P300 Single-Channel GEN2 pipette and 300 µL tips to Flex code that uses a Flex 1-Channel 1000 µL pipette and 1000 µL tips.

.. tabs::
    
    .. tab:: Original OT-2 code
    
        .. code-block:: python

            def run(protocol: protocol_api.ProtocolContext):
                tips = protocol.load_labware("opentrons_96_tiprack_300ul", 1)
                left_pipette = protocol.load_instrument(
                    "p300_single_gen2", "left", tip_racks=[tips]
                )
                
    .. tab:: Updated Flex code
    
        .. code-block:: python

            def run(protocol: protocol_api.ProtocolContext):
                tips = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")
                left_pipette = protocol.load_instrument(
                    "flex_1channel_1000", "left", tip_racks[tips]
                )

Deck Slot Labels
================

It's good practice to update numeric labels for :ref:`deck slots <deck-slots>` (which match the labels on an OT-2) to coordinate ones (which match the labels on Flex). This is an optional step, since the two formats are interchangeable.

For example, the code in the previous section changed the location of the tip rack from ``1`` to ``"D1"``.


Module Load Names
=================

If your OT-2 protocol uses older generations of the Temperature Module or Thermocycler Module, update the load names you pass to :py:meth:`.load_module` to ones compatible with Flex:

    * ``temperature module gen2``
    * ``thermocycler module gen2`` or ``thermocyclerModuleV2``
    
The Heater-Shaker Module only has one generation, ``heaterShakerModuleV1``, which is compatible with Flex and OT-2.

The Magnetic Module is not compatible with Flex. For protocols that load ``magnetic module``, ``magdeck``, or ``magnetic module gen2``, you will need to make further modifications to use the :ref:`Magnetic Block <magnetic-block>` and Flex Gripper instead. This will require reworking some of your protocol steps, and you should verify that your new protocol design achieves similar results.

This simplified example, taken from a DNA extraction protocol, shows how using the Flex Gripper and the Magnetic Block can save time. Instead of pipetting an entire plate's worth of liquid from the Heater-Shaker to the Magnetic Module and then engaging the module, the gripper moves the plate to the Magnetic Block in one step.

.. tabs::
    
    .. tab:: Original OT-2 code
    
        .. code-block:: python

            hs_mod.set_and_wait_for_shake_speed(2000)
            protocol.delay(minutes=5)
            hs_mod.deactivate_shaker()
        
            for i in sample_plate.wells():
                # mix, transfer, and blow-out all samples
                pipette.pick_up_tip()
                pipette.aspirate(100,hs_plate[i])
                pipette.dispense(100,hs_plate[i])
                pipette.aspirate(100,hs_plate[i])
                pipette.air_gap(10)
                pipette.dispense(pipette.current_volume,mag_plate[i])
                pipette.aspirate(50,hs_plate[i])
                pipette.air_gap(10)
                pipette.dispense(pipette.current_volume,mag_plate[i])
                pipette.blow_out(mag_plate[i].bottom(0.5))
                pipette.drop_tip()
        
            mag_mod.engage()
        
            # perform elution steps

    .. tab:: Updated Flex code
    
        .. code-block:: python

            hs_mod.set_and_wait_for_shake_speed(2000)
            protocol.delay(minutes=5)
            hs_mod.deactivate_shaker()
        
            # move entire plate
            # no pipetting from Heater-Shaker needed
            hs_mod.open_labware_latch()
            protocol.move_labware(sample_plate, mag_block, use_gripper=True)
        
            # perform elution steps
