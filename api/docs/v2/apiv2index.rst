.. _apiv2index:

OT-2 Python API Version 2
=========================


.. toctree::
    :hidden:

    new_pipette
    new_labware
    new_modules
    new_atomic_commands
    new_complex_commands
    new_protocol_api
    new_examples
    new_advanced_running


.. _protocol-api-robot:

Overview
++++++++

How it Looks
------------

The design goal of the Opentrons API is to make code readable and easy to understand. For example, below is a short set of instructions to transfer from well ``'A1'`` to well ``'B1'`` that even a computer could understand:

.. code-block:: none

    This protocol is by me; it’s called Opentrons Protocol Tutorial and is used for demonstrating the Opentrons API

    Begin the protocol

    Add a 96 well plate, and place it in slot '2' of the robot deck
    Add a 300 µL tip rack, and place it in slot '1' of the robot deck

    Add a single-channel 300 µL pipette to the left mount, and tell it to use that tip rack

    Transfer 100 µL from the plate's 'A1' well to its 'B2' well

If we were to rewrite this with the Opentrons API, it would look like the following:

.. code-block:: python

    from opentrons import protocol_api

    # metadata
    metadata = {
        'protocolName': 'My Protocol',
        'author': 'Name <email@address.com>',
        'description': 'Simple protocol to get started using OT2'
    }

    # protocol run function. the part after the colon lets your editor know
    # where to look for autocomplete suggestions
    def run(protocol: protocol_api.ProtocolContext):

        # labware
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat', '2')
        tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', '1')

        # pipettes
        left_pipette = protocol.load_instrument(
             'p300_single', 'left', tip_racks=[tiprack])

        # commands
        left_pipette.pick_up_tip()
        left_pipette.aspirate(100, plate['A1'])
        left_pipette.dispense(100, plate['B2'])
        left_pipette.drop_tip()


**********************

How it's Organized
------------------

When writing protocols using the Opentrons API, there are generally five sections:

1) Metadata
2) Run function
3) Labware
4) Pipettes
5) Commands

Metadata
^^^^^^^^

Metadata is a dictionary of data that is read by the server and returned to client applications (such as the Opentrons Run App). It is not needed to run a protocol (and is entirely optional), but if present can help the client application display additional data about the protocol currently being executed.

The fields above (``"protocolName"``, ``"author"``, and ``"description"``) are the recommended fields, but the metadata dictionary can contain fewer fields, or additional fields as desired (though non-standard fields are not displayed by the Opentrons app).

The Run Function and the Protocol Context
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Opentrons API version 2 protocols are structured around a function called ``run(protocol)``, defined in code like this:

.. code-block:: python

   from opentrons import protocol_api

   def run(protocol: protocol_api.ProtocolContext):
       pass

This function must be named exactly ``run`` and must take exactly one mandatory argument (its name doesn’t matter, but we recommend ``protocol`` since this argument represents the protocol that the robot will execute).

The function ``run`` is the container for the code that defines your protocol.

The object ``protocol`` is the *protocol context*, which represents the robot and its capabilities. It is always an instance of the :py:class:`opentrons.protocol_api.contexts.ProtocolContext` class (though you'll never have to instantiate one yourself - it is always passed in to ``run()``), and it is tagged as such in the example protocol to allow most editors to give you autocomplete.

The protocol context has two responsibilities:

1) Remember, track, and check the robot’s state
2) Expose the functions that make the robot execute actions

The protocol context plays the same role as the ``robot``, ``labware``, ``instruments``, and ``modules`` objects in past versions of the API, with one important difference: it is only one object; and because it is passed in to your protocol rather than imported, it is possible for the API to be much more rigorous about separating simulation from reality.

The key point is that there is no longer any need to ``import opentrons`` at the top of every protocol, since the *robot* now *runs the protocol*, rather than the *protocol running the robot*. The example protocol imports the definition of the protocol context to provide editors with autocomplete sources.


Labware
^^^^^^^

The next step is defining the labware required for your protocol. You must tell the protocol context about what should be present on the deck, and where. You tell the protocol context about labware by calling the method ``protocol.load_labware(name, slot)`` and saving the result.

The name of a labware is a string that is different for each kind of labware. You can look up labware to add to your protocol on the Opentrons `Labware Library <https://labware.opentrons.com>`_.

The slot is the labelled location on the deck in which you've placed the labware. The available slots are numbered from 1-11.

Our example protocol above loads a `Corning 96 Well Plate <https://labware.opentrons.com/corning_96_wellplate_360ul_flat>`_ in slot 2 (``plate = protocol.load_labware('corning_96_wellplate_360ul_flat', 2)``) and an `Opentrons 300ul Tiprack <https://labware.opentrons.com/opentrons_96_tiprack_300ul>`_ in slot 1 (``tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', 1)``). These can be referenced later in the protocol as ``plate`` and ``tiprack`` respectively. Check out `the python docs <https://docs.python.org/3/index.html>`_ for further clarification on using variables effectively in your code.

You can find more information about handling labware in the :ref:`new-labware` section.


Pipettes
^^^^^^^^

After defining labware, you define the instruments required for your protocol. You tell the protocol context about which pipettes should be attached, and which slot they should be attached to, by calling the method ``protocol.load_instrument(model, mount, tip_racks)`` and saving the result.

The ``model`` of the pipette is the kind of pipette that should be attached; the ``mount`` is either ``"left"`` or ``"right"``; and ``tip_racks`` is a list of the objects representing tip racks that this instrument should use. Specifying ``tip_racks`` is optional, but if you don't then you'll have to manually specify where the instrument should pick up tips from every time you try and pick up a tip.

See :ref:`new-pipette` for more information on creating and working with pipettes.

Our example protocol above loads a P300 Single-channel pipette (``'p300_single'``) in the left mount (``'left'``), and uses the Opentrons 300ul tiprack we loaded previously as a source of tips (``tip_racks=[tiprack]``).


Commands
^^^^^^^^

Once the instruments and labware required for the protocol are defined, the next step is to define the commands that make up the protocol. The most common commands are ``aspirate()``, ``dispense()``, ``pick_up_tip()``, and ``drop_tip()``. These and many others are described in the :ref:`v2-atomic-commands` and :ref:`v2-complex-commands` sections, which go into more detail about the commands and how they work. These commands typically specify which wells of which labware to interact with, using the labware you defined earlier, and are methods of the instruments you created in the pipette section. For instance, in our example protocol, you use the pipette you defined to:

1) Pick up a tip (implicitly from the tiprack you specified in slot 1 and assigned to the pipette): ``pipette.pick_up_tip()``
2) Aspirate 100ul from well A1 of the 96 well plate you specified in slot 2: ``pipette.aspirate(100, plate['A1'])``
3) Dispense 100ul into well A2 of the 96 well plate you specified in slot 2: ``pipette.dispense(100, plate['A2'])``
4) Drop the tip (implicitly into the trash at the back right of the robot's deck): ``pipette.drop_tip()``
