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


Automated vs Manual Moves
=========================

Opentrons Flex supports an additional ``use_gripper`` parameter of :py:meth:`~.ProtocolContext.move_labware` for moving labware with the gripper. Set its value to ``True`` to have the gripper pick up and move the labware without user intervention or pausing the protocol. The default value is ``False``, so if you don't specify a value, the protocol will pause for you to manually move the labware.

.. code-block:: python

    plate = protocol.load_labware('nest_96_wellplate_200ul_flat', 'D1')
    # have the gripper move the plate from D1 to D2
    protocol.move_labware(labware=plate, new_location='D2', use_gripper=True)
    # pause to move the plate manually from D2 to D3
    protocol.move_labware(labware=plate, new_location='D3', use_gripper=False)
    # pause to move the plate manually from D3 to C1
    protocol.move_labware(labware=plate, new_location='C1')

.. versionadded:: 2.15

All you have to do to specify that a protocol requires the gripper is to include a single ``move_labware()`` command with ``use_labware=True``. You don't have to load the gripper as an instrument, and there is no ``InstrumentContext`` for the gripper. 

.. note::

    Labware definitions don't explicitly declare compatibility or incompatibility with the gripper. The Python Protocol API won't raise a warning or error if you try to grip and move other types of labware.


Movement with Modules
=====================


The Off-Deck Location
=====================

