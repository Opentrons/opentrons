:og:description: How to specify deck slots in the Python Protocol API.

.. _deck-slots:

**********
Deck Slots
**********

Deck slots are where you place hardware items on the deck surface of your Opentrons robot. In the API, you load the corresponding items into your protocol with methods like :py:obj:`.ProtocolContext.load_labware`, :py:obj:`.ProtocolContext.load_module`, or :py:obj:`.ProtocolContext.load_trash_bin`. When you call these methods, you need to specify which slot to load the item in. 

Physical Deck Labels
====================

Flex uses a coordinate labeling system for slots A1 (back left) through D4 (front right). Columns 1 through 3 are in the *working area* and are accessible by pipettes and the gripper. Column 4 is in the *staging area* and is only accessible by the gripper. For more information on staging area slots, see :ref:`deck-configuration` below.

OT-2 uses a numeric labeling system for slots 1 (front left) through 11 (back center). The back right slot is occupied by the fixed trash.

.. image:: ../img/Flex-and-OT-2-decks.svg
   :width: 100%


API Deck Labels
===============

The API accepts values that correspond to the physical deck slot labels on a Flex or OT-2 robot. Specify a slot in either format:

* A coordinate like ``"A1"``. This format must be a string.
* A number like ``"10"`` or ``10``. This format can be a string or an integer.

As of API version 2.15, the Flex and OT-2 formats are interchangeable. You can use either format, regardless of which robot your protocol is for. You could even mix and match formats within a protocol, although this is not recommended.

For example, these two ``load_labware()`` commands are equivalent:

.. code-block:: python

    protocol.load_labware("nest_96_wellplate_200ul_flat", "A1")
    
.. versionadded:: 2.15

.. code-block:: python

    protocol.load_labware("nest_96_wellplate_200ul_flat", 10)
    
.. versionadded:: 2.0

Both of these commands would require you to load the well plate in the back left slot of the robot.

The correspondence between deck labels is based on the relative locations of the slots. The full list of slot equivalencies is as follows:

.. list-table::
    :stub-columns: 1

    * - Flex
      - A1
      - A2
      - A3
      - B1
      - B2
      - B3
      - C1
      - C2
      - C3
      - D1
      - D2
      - D3
    * - OT-2
      - 10
      - 11
      - Trash
      - 7
      - 8
      - 9
      - 4
      - 5
      - 6
      - 1
      - 2
      - 3

.. TODO staging slots and error handling of A4–D4 in OT-2 protocols

Slots A4, B4, C4, and D4 on Flex have no equivalent on OT-2. 

.. _deck-configuration:

Deck Configuration
==================

Flex robots running robot system version 7.1.0 or higher let you specify their deck configuration on the touchscreen or in the Opentrons App. This tells the robot the positions of unpowered *deck fixtures*, like staging area slots, trash bins, and the waste chute. 

When the robot analyzes your Python protocol, it will check whether there are any conflicts with its current deck configuration. You can't start the protocol run until any conflicts are resolved. You can resolve them one of two ways:

    - Physically move hardware around the deck, and update the deck configuration.
    - Alter your protocol to work with the current deck configuration, and resend the protocol to your Flex.
    
The expected configuration is based on both explicit load commands and implicit effects of other commands in your protocol. [more TK]