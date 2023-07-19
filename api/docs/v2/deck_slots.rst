:og:description: How to specify deck slots in the Python Protocol API.

..
    Allow concise cross-referencing to ProtocolContext.load_labware() et. al., without barfing out the whole import path.
.. py:currentmodule:: opentrons.protocol_api


.. _deck-slots:

##########
Deck Slots
##########

When you load an item onto the robot's deck, like with :py:obj:`ProtocolContext.load_labware()` or :py:obj:`ProtocolContext.load_module()`, you need to specify which slot to put it in.

Specify a slot in one of two formats:

* A coordinate like ``"A1"``. This matches how the deck is physically labeled on an Opentrons Flex.
* A number like ``"10"`` or ``10``. This matches how the deck is physically labeled on an Opentrons OT-2.


Opentrons Flex Deck Layout
==========================

..
    TODO(mm, 2023-06-05): Embed a nice SVG instead of having these tables.

.. table::
    :widths: 1 1 1

    +----+----+----+
    | A1 | A2 | A3 |
    +----+----+----+
    | B1 | B2 | B3 |
    +----+----+----+
    | C1 | C2 | C3 |
    +----+----+----+
    | D1 | D2 | D3 |
    +----+----+----+


Opentrons OT-2 Deck Layout
==========================

.. table::
    :widths: 1 1 1

    +----+----+-----------+
    | 10 | 11 | 12 [#ft]_ |
    +----+----+-----------+
    | 7  | 8  | 9         |
    +----+----+-----------+
    | 4  | 5  | 6         |
    +----+----+-----------+
    | 1  | 2  | 3         |
    +----+----+-----------+

.. [#ft] Slot 12 has the fixed trash.


Equivalent Slots
================

The Flex and OT-2 formats are interchangeable. You can use either format, regardless of which robot your protocol is for.

For example, these are equivalent:

.. code-block:: python

    protocol.load_labware("my_labware", "A1")

.. code-block:: python

    protocol.load_labware("my_labware", 10)
