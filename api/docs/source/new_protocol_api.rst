.. _protocol-api:

Opentrons API Version 2
================

For the OT 1 API, `please go to this link`__

__ https://docs.opentrons.com/ot1/

For Version 1 of the OT 2 API, `please go to this link`__

__ https://docs.opentrons.com

The Opentrons API is a simple framework designed to make writing automated biology lab protocols easy.

We’ve designed it in a way we hope is accessible to anyone with basic computer and wetlab skills. As a bench scientist, you should be able to code your automated protocols in a way that reads like a lab notebook.

`View source code on GitHub`__

__ https://github.com/Opentrons/opentrons

.. _protocol-api-robot:

**********************

How it Looks
---------------

The design goal of the Opentrons API is to make code readable and easy to understand. For example, below is a short set of instruction to transfer from well ``'A1'`` to well ``'B1'`` that even a computer could understand:

.. code-block:: none

    This protocol is by me; it’s called Opentrons Protocol Tutorial and is used for demonstrating the Opentrons API

    Begin the protocol

    Add a 96 well plate, and place it in slot '2' of the robot deck
    Add a 200uL tip rack, and place it in slot '1' of the robot deck

    Add a single-channel 300uL pipette to the left mount, and tell it to use that tip rack

    Transfer 100uL from the plate's 'A1' well to it's 'B2' well

If we were to rewrite this with the Opentrons API, it would look like the following:

.. code-block:: python

    # metadata
    metadata = {
        'protocolName': 'My Protocol',
        'author': 'Name <email@address.com>',
        'description': 'Simple protocol to get started using OT2',
        'source': 'Opentrons Protocol Tutorial'
    }

    # protocol run function
    def run(protocol_context):

        # labware
        plate = protocol_context.load_labware_by_name('generic_96_wellplate_380_ul', '2')
        tiprack = protocol_context.load_labware_by_name('opentrons_96_tiprack_300_ul', '1')

        # pipettes
        pipette = protocol_context.load_instrument('p300_single', 'left', tip_racks=[tiprack])

        # commands
        pipette.aspirate(100, plate.wells_by_index()['A1'])
        pipette.dispense(100, plate.wells_by_index()['B2'])


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

The fields above ("protocolName", "author", "description", and "source") are the recommended fields, but the metadata dictionary can contain fewer fields, or additional fields as desired (though non-standard fields may not be rendered by the client, depending on how it is designed).

Run Function
^^^^^^^^^^^^

Opentrons API version 2 protocols are structured around a function called ``run(ctx)``. This function must be named exactly ``run`` and must take exactly one mandatory argument (its name doesn’t matter). When the robot runs a protocol, it will call this function, and pass it an object that does two things:

1) Remember, track, and check the robot’s state
2) Expose the functions that make the robot act

This object is called the *protocol context*, and is always an instance of the :py:class:`.ProtocolContext` class. The protocol context plays the same role as the ``robot``, ``labware``, ``instruments``, and ``modules`` objects in past versions of the API, with one important difference: it is only one object; and because it is passed in to your protocol rather than imported, it is possible for the API to be much more rigorous about separating simulation from reality.

The key point is that there is no longer any need to ``import opentrons`` at the top of every protocol, since the *robot* now *runs the protocol*, rather than the *protocol running the robot*.


Labware
^^^^^^^

The labware section informs the protocol context what labware is present on the robot’s deck. In this section, you define the tip racks, well plates, troughs, tubes, or anything else you’ve put on the deck.

Each labware is given a name (ex: ``'generic_96_wellplate_380_ul'``), and the slot on the robot it will be placed (ex: ``'2'``). A list of valid labware can be found in :ref:`protocol-api-valid-labware`. In this example, we’ll use ``'generic_96_wellplate_380_ul'`` (an ANSI standard 96-well plate) and ``'opentrons_96_tiprack_300_ul'``, the Opentrons standard 300 uL tiprack.

From the example above, the "labware" section looked like:

.. code-block:: python

    plate = protocol_context.load_labware_by_name('generic_96_wellplate_380_ul', '2')
    tiprack = protocol_context.load_labware_by_name('opentrons_96_tiprack_300_ul', '1')


and informed the protocol context that the deck contains a 300 uL tiprack in slot 1 and a 96 well plate in slot 2.

More complete documentation on labware methods (such as the ``.wells()`` method) is available in :ref:`protocol-api-labware`.

.. _protocol-api-valid-labware:

This table lists the names of valid labwares that can be loaded with :py:meth:`.ProtocolContext.load_labware_by_name`, along with the name of the legacy labware definition each is equivalent to (if any).

+-------------------------------------------+----------------------------------------+
| API 2 Labware Name                        | API 1 Labware Name                     |
+===========================================+========================================+
| biorad_96_wellplate_pcr_200_ul            | 96-pcr-flat                            |
+-------------------------------------------+----------------------------------------+
| corning_12_wellplate_6.9_ml               | 12-well-plate                          |
+-------------------------------------------+----------------------------------------+
| corning_24_wellplate_3.4_ml               | 24-well-plate                          |
+-------------------------------------------+----------------------------------------+
| corning_384_wellplate_112_ul              | 384-plate                              |
+-------------------------------------------+----------------------------------------+
| corning_48_wellplate_1.6_ml               | 48-well-plate                          |
+-------------------------------------------+----------------------------------------+
| corning_6_wellplate_16.8_ml               | 6-well-plate                           |
+-------------------------------------------+----------------------------------------+
| eppendorf_96_tiprack_1000_ul              | --                                     |
+-------------------------------------------+----------------------------------------+
| eppendorf_96_tiprack_10_ul                | --                                     |
+-------------------------------------------+----------------------------------------+
| generic_96_wellplate_380_ul               | 96-flat                                |
+-------------------------------------------+----------------------------------------+
| opentrons_15_tuberack_15_ml_falcon        | opentrons-tuberack-15ml                |
+-------------------------------------------+----------------------------------------+
| opentrons_24_aluminum_tuberack_2_ml       | opentrons-aluminum-block-2ml-eppendorf |
+-------------------------------------------+----------------------------------------+
| opentrons_24_tuberack_1.5_ml_eppendorf    | opentrons-tuberack-1.5ml-eppendorf     |
+-------------------------------------------+----------------------------------------+
| opentrons_24_tuberack_2_ml_eppendorf      | opentrons-tuberack-2ml-eppendorf       |
+-------------------------------------------+----------------------------------------+
| opentrons_24_tuberack_2_ml_screwcap       | opentrons-tuberack-2ml-screwcap        |
+-------------------------------------------+----------------------------------------+
| opentrons_6_tuberack_falcon_50_ml         | opentrons-tuberack-50ml                |
+-------------------------------------------+----------------------------------------+
| opentrons_6x15_ml_4x50_ml_tuberack        | opentrons-tuberack-15_50ml             |
+-------------------------------------------+----------------------------------------+
| opentrons_96_aluminum_biorad_plate_200_ul | opentrons-aluminum-block-96-PCR-plate  |
+-------------------------------------------+----------------------------------------+
| opentrons_96_aluminum_tuberack_200_ul     | --                                     |
+-------------------------------------------+----------------------------------------+
| opentrons_96_tiprack_1000_ul              | tiprack-1000ul                         |
+-------------------------------------------+----------------------------------------+
| opentrons_96_tiprack_10_ul                | tiprack-10ul                           |
+-------------------------------------------+----------------------------------------+
| opentrons_96_tiprack_300_ul               | opentrons-tiprack-300ul                |
+-------------------------------------------+----------------------------------------+
| usa_scientific_12_trough_22_ml            | trough-12row                           |
+-------------------------------------------+----------------------------------------+


Pipettes
^^^^^^^^

Next, pipettes are created and attached to a specific mount on the OT-2 (``'left'`` or ``'right'``).

There are other parameters for pipettes, but the most important are the tip rack(s) it will use during the protocol.

From the example above, the "pipettes" section looked like:

.. code-block:: python

    pipette = protocol_context.load_instrument('p300_single', 'left', tip_racks=[tiprack])


And finally, the actual protocol commands! The most common commands are ``transfer()``, ``aspirate()``, ``dispense()``, ``pick_up_tip()``, ``drop_tip()``, and much more.

This section can tend to get long, relative to the complexity of your protocol. However, with a better understanding of Python you can learn to compress and simplify even the most complex-seeming protocols.

From the example above, the "commands" section looked like:

.. code-block:: python

    pipette.aspirate(100, plate.wells_by_index()['A1'])
    pipette.dispense(100, plate.wells_by_index()['B2'])

which does exactly what it says - aspirate 100 uL from A1 and dispense it all in B2.

Complete documentation of pipettes and pipette commands can be found in :ref:`protocol_api-protocols-and-instruments`.

Modules
^^^^^^^

Modules are peripherals that attach to the OT-2 to extend its capabilities. Modules currently supported are the Temperature Module and the Magnetic Module.  The Thermocycler is under development.

A Temperature Module, for example, can be loaded and used in a protocol like this:

.. code-block:: python

    def run(protocol_context):
        temp_mod = protocol_context.load_module('Temperature Module', '10')
        temp_plate = temp_mod.load_labware('biorad_96_wellplate_pcr_200_ul')

        master_mix = labware.load('opentrons_6_tuberack_falcon_50_ml')

        for target_well in temp_plate.wells():
            pipette.transfer(50, master_mix.wells_by_index()['A1'], target_well)

        target_temp = 80.0  # degrees Celcius
        temp_mod.set_temp(target_temp)
        temp_mod.wait_for_temp()

        # perform other operations

        temp_mod.deactivate()

Complete documentation on all module classes is available in :ref:`protocol-api-modules`.

.. _protocol_api-protocols-and-instruments:

Protocols and Instruments
-----------------
.. module:: opentrons.protocol_api.contexts

.. autoclass:: opentrons.protocol_api.contexts.ProtocolContext
   :members:

.. autoclass:: opentrons.protocol_api.contexts.InstrumentContext
   :members:

.. _protocol-api-labware:

Labware and Wells
-----------------
.. automodule:: opentrons.protocol_api.labware
   :members:

.. _protocol-api-modules:

Modules
-------
.. autoclass:: opentrons.protocol_api.contexts.TemperatureModuleContext
   :members:
   :inherited-members:

.. autoclass:: opentrons.protocol_api.contexts.MagneticModuleContext
   :members:
   :inherited-members:

.. autoclass:: opentrons.protocol_api.contexts.ThermocyclerContext
   :members:
   :inherited-members:


.. _protocol-api-types:

Useful Types and Definitions
----------------------------
.. automodule:: opentrons.types
   :members:


.. _protocol-api-deck-coords:

Deck Coordinates
----------------

The OT2’s base coordinate system is known as deck coordinates. This coordinate system is referenced frequently through the API. It is a right-handed coordinate system always specified in mm, with `(0, 0, 0)` at the front left of the robot. `+x` is to the right, `+y` is to the back, and `+z` is up.

Note that there are technically two `z` axes, one for each pipette mount. In these terms, `z` is the axis of the left pipette mount and `a` is the axis of the right pipette mount. These are obscured by the API’s habit of defining motion commands on a per-pipette basis; the pipettes internally select the correct `z` axis to move. This is also true of the pipette plunger axes, `b` (left) and `c` (right).

When locations are specified to functions like :py:meth:`opentrons.protocol_api.contexts.InstrumentContext.move_to`, in addition to being an instance of :py:class:`opentrons.protocol_api.labware.Well` they may define coordinates in this deck coordinate space. These coordinates can be specified either as a standard python :py:class:`tuple` of three floats, or as an instance of the :py:class:`collections.namedtuple` :py:class:`opentrons.types.Point`, which can be created in the same way.
