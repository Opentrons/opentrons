:og:description: How to move labware, with the Flex Gripper or manually, in a Python protocol.

.. _moving-labware:

**************
Moving Labware
**************

You can move an entire labware (and all of its contents) from one deck slot to another at any point during your protocol. On Flex, you can either use the gripper or move the labware manually. On OT-2, you can can only move labware manually (since it doesn't have a gripper instrument). Use the :py:meth:`move_labware` method to initiate a move, regardless of whether it uses the gripper or not.

Automated vs Manual Moves
=========================



.. note::

    Labware definitions don't explicitly declare compatibility or incompatibility with the gripper. The Python Protocol API won't raise a warning or error if you try to grip and move other types of labware.


Movement with Modules
=====================


The Off-Deck Location
=====================