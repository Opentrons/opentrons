:og:description: How to move labware, with the Flex Gripper or manually, in a Python protocol.

.. _moving-labware:

**************
Moving Labware
**************

You can move an entire labware (and all of its contents) from one deck slot to another at any point during your protocol. On Flex, you can either use the gripper or move the labware manually. On OT-2, you can can only move labware manually (since it doesn't have a gripper instrument). 

Basic Movement
==============

Use the :py:meth:`.ProtocolContext.move_labware` method to initiate a move, regardless of whether it uses the gripper.

.. code-block:: python
    :substitutions:
        
    def run(protocol: protocol_api.ProtocolContext):
        plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'D1')
        protocol.move_labware(labware=plate, new_location='D2')
        
.. versionadded:: 2.15

The required arguments of ``move_labware()`` are the ``labware`` you want to move and its ``new_location``. You don't need to specify where the move begins, since that information is already stored in the :py:class:`Labware` object with the name ``plate``. That information gets updated when the move step is complete, so you can move a plate multiple times::

    protocol.move_labware(labware=plate, new_location='D2')
    protocol.move_labware(labware=plate, new_location='D3')
    
For the first move, the API knows to find the plate in its initial load location, slot D1. For the second move, the API knows to find the plate in D2.

Moving the following types of labware is fully supported by Opentrons:

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

Automatic vs Manual Moves
=========================

There are two ways to move labware:

- Automatically, with the Opentrons Flex Gripper.
- Manually, by pausing the protocol until a user confirms that they've moved the labware.

The ``use_gripper`` parameter of :py:meth:`~.ProtocolContext.move_labware` determines which way a particular movement should happen. Set its value to ``True`` for an automatic move. The default value is ``False``, so if you don't specify a value, the protocol will pause for a manual move.

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

The above example is a complete and valid ``run()`` function. You don't have to load the gripper as an instrument, and there is no ``InstrumentContext`` for the gripper. All you have to do to specify that a protocol requires the gripper is to include at least one ``move_labware()`` command with ``use_labware=True``.





Movement with Modules
=====================


The Off-Deck Location
=====================

