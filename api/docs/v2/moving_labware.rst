:og:description: How to move labware, with the Flex Gripper or manually, in a Python protocol.

.. _moving-labware:

**************
Moving Labware
**************

You can move an entire labware (and all of its contents) from one deck slot to another at any point during your protocol. On Flex, you can either use the gripper or move the labware manually. On OT-2, you can can only move labware manually, since it doesn't have a gripper instrument. 

Basic Movement
==============

Use the :py:meth:`.ProtocolContext.move_labware` method to initiate a move, regardless of whether it uses the gripper.

.. code-block:: python
    :substitutions:
        
    def run(protocol: protocol_api.ProtocolContext):
        plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'D1')
        protocol.move_labware(labware=plate, new_location='D2')
        
.. versionadded:: 2.15

The required arguments of ``move_labware()`` are the ``labware`` you want to move and its ``new_location``. You don't need to specify where the move begins, since that information is already stored in the :py:class:`~opentrons.protocol_api.labware.Labware` object — ``plate`` in this example. The destination of the move can be any empty deck slot, or a module that's ready to have labware added to it (see :ref:`movement-modules` below). Movement to an occupied location, including the labware's current location, will raise an error.

When the move step is complete, the API updates the labware's location, so you can move the plate multiple times::

    protocol.move_labware(labware=plate, new_location='D2')
    protocol.move_labware(labware=plate, new_location='D3')
    
For the first move, the API knows to find the plate in its initial load location, slot D1. For the second move, the API knows to find the plate in D2.


Automatic vs Manual Moves
=========================

There are two ways to move labware:

- Automatically, with the Opentrons Flex Gripper.
- Manually, by pausing the protocol until a user confirms that they've moved the labware.

The ``use_gripper`` parameter of :py:meth:`~.ProtocolContext.move_labware` determines whether a movement is automatic or manual. Set its value to ``True`` for an automatic move. The default value is ``False``, so if you don't specify a value, the protocol will pause for a manual move.

.. code-block:: python

    def run(protocol: protocol_api.ProtocolContext):
        plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'D1')
        
        # have the gripper move the plate from D1 to D2
        protocol.move_labware(labware=plate, new_location='D2', use_gripper=True)
        
        # pause to move the plate manually from D2 to D3
        protocol.move_labware(labware=plate, new_location='D3', use_gripper=False)
        
        # pause to move the plate manually from D3 to C1
        protocol.move_labware(labware=plate, new_location='C1')

.. versionadded:: 2.15

.. note::
    Don't add a ``pause()`` command before ``move_labware()``. When ``use_gripper`` is unset or ``False``, the protocol pauses when it reaches the movement step. The Opentrons App or the touchscreen on Flex shows an animation of the labware movement that you need to perform manually. The protocol only resumes when you press **Confirm and resume**.

The above example is a complete and valid ``run()`` function. You don't have to load the gripper as an instrument, and there is no ``InstrumentContext`` for the gripper. All you have to do to specify that a protocol requires the gripper is to include at least one ``move_labware()`` command with ``use_labware=True``.

If you attempt to use the gripper to move labware in an OT-2 protocol, the API will raise an error.


Supported Labware
=================

You can manually move any standard or custom labware. Using the gripper to move the following types of labware is fully supported by Opentrons:

.. list-table::
    :header-rows: 1

    * - Labware Type
      - API Load Name
    * - NEST 96 Deep Well Plate 2mL
      - ``nest_96_wellplate_2ml_deep``
    * - Armadillo 96 well plate 200 µL Full Skirt
      - ``armadillo_96_wellplate_200ul_pcr_full_skirt``
    * - NEST 96 Well Plate 200 µL Flat
      - ``nest_96_wellplate_200ul_flat``
    * - All Opentrons Flex 96 Tip Racks 
      - 
          * ``opentrons_flex_96_tiprack_50ul``
          * ``opentrons_flex_96_tiprack_200ul``
          * ``opentrons_flex_96_tiprack_1000ul``
          * ``opentrons_flex_96_filtertiprack_50ul``
          * ``opentrons_flex_96_filtertiprack_200ul``
          * ``opentrons_flex_96_filtertiprack_1000ul``
    
The gripper may work with other ANSI/SLAS standard labware, but this is not recommended.

.. note::

    Labware definitions don't explicitly declare compatibility or incompatibility with the gripper. The Python Protocol API won't raise a warning or error if you try to grip and move other types of labware.


.. _movement-modules: 

Movement with Modules
=====================

Moving labware on and off of modules lets you precisely control when the labware is in contact with the hot, cold, or magnetic surfaces of the modules — all within a single protocol.

When moving labware anywhere that isn't an empty deck slot, consider what physical object the labware will rest on following the move. That object should be the value of ``new_location``, and you need to make sure it's already loaded before the move. For example, if you want to move a 96-well flat plate onto a Heater-Shaker module, you actually want to have it rest on top of the Heater-Shaker's 96 Flat Bottom Adapter. Pass the adapter, not the module or the slot, as the value of ``new_location``::

    def run(protocol: protocol_api.ProtocolContext):
        plate = protocol.load_labware("nest_96_wellplate_200ul_flat", "D1")
        hs_mod = protocol.load_module("heaterShakerModuleV1", "C1")
        hs_adapter = hs_mod.load_adapter("opentrons_96_flat_bottom_adapter")
        hs_mod.open_labware_latch()
        protocol.move_labware(
            labware=plate, new_location=hs_adapter, use_gripper=True
        )

.. versionadded:: 2.15

If you try to move the plate to slot C1 or the Heater-Shaker module, the API will raise an error, because C1 is occupied by the Heater-Shaker, and the Heater-Shaker is occupied by the adapter. Only the adapter, as the topmost item in that stack, is unoccupied.

Also note the ``hs_mod.open_labware_latch()`` command in the above example. To move labware onto or off of a module, you have to make sure that it's physically accessible:

    - For the Heater-Shaker, use :py:meth:`~.HeaterShakerContext.open_labware_latch`.
    - For the Thermocycler, use :py:meth:`~.ThermocyclerContext.open_lid`.
    
If the labware is inaccessible, the API will raise an error. 

.. _off-deck-location:

The Off-Deck Location
=====================

In addition to moving labware around the deck, :py:meth:`~.ProtocolContext.move_labware` can also prompt you to move labware off of or onto the deck. 

Remove labware from the deck to perform tasks like retrieving samples or discarding a spent tip rack. The destination location for such moves is the special constant :py:obj:`~opentrons.protocol_api.OFF_DECK`::

    protocol.move_labware(labware=plate, new_location=protocol_api.OFF_DECK)
    
.. versionadded:: 2.15

Moving labware off-deck always requires user intervention, because the gripper can't reach outside of the robot. Omit the ``use_gripper`` parameter or explicitly set it to ``False``. If you try to move labware off-deck with ``use_gripper=True``, the API will raise an error.

You can also load labware off-deck, in preparation for a ``move_labware()`` command that brings it `onto` the deck. For example, you could assign two tip racks to a pipette — one on-deck, and one off-deck — and then swap out the first rack for the second one::

    from opentrons import protocol_api

    metadata = {"apiLevel": "2.15", "protocolName": "Tip rack replacement"}
    requirements = {"robotType": "OT-2"}


    def run(protocol: protocol_api.ProtocolContext):
        tips1 = protocol.load_labware("opentrons_96_tiprack_1000ul", 1)
        # load another tip rack but don't put it in a slot yet
        tips2 = protocol.load_labware(
            "opentrons_96_tiprack_1000ul", protocol_api.OFF_DECK
        )
        pipette = protocol.load_instrument(
            "p1000_single_gen2", "left", tip_racks=[tips1, tips2]
        )
        # use all the on-deck tips
        for i in range(96):
            pipette.pick_up_tip()
            pipette.drop_tip()
        # pause to move the spent tip rack off-deck
        protocol.move_labware(labware=tips1, new_location=protocol_api.OFF_DECK)
        # pause to move the fresh tip rack on-deck
        protocol.move_labware(labware=tips2, new_location=1)
        pipette.pick_up_tip()

Using the off-deck location to remove or replace labware lets you continue your workflow in a single protocol, rather than needing to end a protocol, reset the deck, and start a new protocol run.
