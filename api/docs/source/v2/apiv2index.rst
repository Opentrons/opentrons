.. _apiv2index:

Opentrons API Version 2
========================


.. toctree::
    :hidden:

    new_labware
    new_pipette
    new_atomic commands
    new_complex commands
    new_hardware_control
    new_protocol_api
    new_examples


.. _protocol-api-robot:
Overview
++++++++

How it Looks
---------------

The design goal of the Opentrons API is to make code readable and easy to understand. For example, below is a short set of instruction to transfer from well ``'A1'`` to well ``'B1'`` that even a computer could understand:

.. code-block:: none

    This protocol is by me; it’s called Opentrons Protocol Tutorial and is used for demonstrating the Opentrons API

    Begin the protocol

    Add a 96 well plate, and place it in slot '2' of the robot deck
    Add a 300 µL tip rack, and place it in slot '1' of the robot deck

    Add a single-channel 300 µL pipette to the left mount, and tell it to use that tip rack

    Transfer 100 µL from the plate's 'A1' well to its 'B2' well

If we were to rewrite this with the Opentrons API, it would look like the following:

.. code-block:: python

    # metadata
    metadata = {
        'protocolName': 'My Protocol',
        'author': 'Name <email@address.com>',
        'description': 'Simple protocol to get started using OT2'
    }

    # protocol run function
    def run(protocol_context):

        # labware
        plate = protocol_context.load_labware('corning_96_wellplate_360ul_flat', '2')
        tiprack = protocol_context.load_labware('opentrons_96_tiprack_300ul', '1')

        # pipettes
        pipette = protocol_context.load_instrument('p300_single', 'left', tip_racks=[tiprack])

        # commands
        pipette.aspirate(100, plate['A1'])
        pipette.dispense(100, plate['B2'])


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

The fields above ("protocolName", "author", and "description") are the recommended fields, but the metadata dictionary can contain fewer fields, or additional fields as desired (though non-standard fields may not be rendered by the client, depending on how it is designed).

Run Function
^^^^^^^^^^^^

Opentrons API version 2 protocols are structured around a function called ``run(ctx)``. This function must be named exactly ``run`` and must take exactly one mandatory argument (its name doesn’t matter). When the robot runs a protocol, it will call this function, and pass it an object that does two things:

1) Remember, track, and check the robot’s state
2) Expose the functions that make the robot act

This object is called the *protocol context*, and is always an instance of the :py:class:`.ProtocolContext` class. The protocol context plays the same role as the ``robot``, ``labware``, ``instruments``, and ``modules`` objects in past versions of the API, with one important difference: it is only one object; and because it is passed in to your protocol rather than imported, it is possible for the API to be much more rigorous about separating simulation from reality.

The key point is that there is no longer any need to ``import opentrons`` at the top of every protocol, since the *robot* now *runs the protocol*, rather than the *protocol running the robot*.
