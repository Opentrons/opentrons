:og:description: How to specify deck slots in the Python Protocol API.

..
    Allow concise cross-referencing to ProtocolContext.load_labware() et. al., without barfing out the whole import path.
.. py:currentmodule:: opentrons.protocol_api


.. _deck-slots:

**********
Deck Slots
**********

When you load an item onto the robot's deck, like with :py:obj:`ProtocolContext.load_labware()` or :py:obj:`ProtocolContext.load_module()`, you need to specify which slot to put it in. The API accepts values that correspond to the physical deck slot labels on an OT-2 or Flex robot.

Physical Deck Labels
====================

The Opentrons Flex uses a coordinate labeling system for slots A1 (back left) through D3 (front right).

The Opentrons OT-2 uses a numeric labeling system for slots 1 (front left) through 11 (back center). The back right slot is occupied by the fixed trash.

.. image:: ../img/Flex-and-OT-2-decks.svg
   :width: 100%


API Deck Labels
===============

Specify a slot in one of two formats:

* A coordinate like ``"A1"``. This matches how the deck is physically labeled on an Opentrons Flex.
* A number like ``"10"`` or ``10``. This matches how the deck is physically labeled on an Opentrons OT-2.



The Flex and OT-2 formats are interchangeable. You can use either format, regardless of which robot your protocol is for.

For example, these are equivalent:

.. code-block:: python

    protocol.load_labware("my_labware", "A1")

.. code-block:: python

    protocol.load_labware("my_labware", 10)
