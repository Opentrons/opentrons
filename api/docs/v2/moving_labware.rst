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



.. note::

    Labware definitions don't explicitly declare compatibility or incompatibility with the gripper. The Python Protocol API won't raise a warning or error if you try to grip and move other types of labware.


Movement with Modules
=====================


The Off-Deck Location
=====================