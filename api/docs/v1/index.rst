=========================
OT-2 Python API Version 1
=========================

The Opentrons API is a simple Python framework designed to make writing automated biology lab protocols easy.

We’ve designed it in a way we hope is accessible to anyone with basic Python and wetlab skills. As a bench scientist, you should be able to code your automated protocols in a way that reads like a lab notebook.

**********************

Getting Started
---------------

New to Python? Check out our :ref:`writing` page first before continuing. To get a sense of the typical structure of our scripts, take a look at our :ref:`examples` page.

Our API requires Python version 3.7.6 or later. Once this is set up on your computer, you can simply use `pip` to install the Opentrons package.

.. code-block:: python

    pip install opentrons

To simulate protocols on your laptop, check out :ref:`simulate-block`. When you're ready to run your script on a robot, download our latest `desktop app <https://www.opentrons.com/ot-app>`_


Troubleshooting
---------------

If you encounter problems using our products please take a look at our `support docs <https://support.opentrons.com/en/>`_ or contact our team via intercom on our website at `opentrons.com <https://opentrons.com>`_.


**********************

Overview
--------

How it Looks
++++++++++++

The design goal of the Opentrons API is to make code readable and easy to understand. For example, below is a short set of instruction to transfer from well ``'A1'`` to well ``'B1'`` that even a computer could understand:

.. code-block:: none

    Use the Opentrons API's labware and instruments

    This protocol is by me; it’s called Opentrons Protocol Tutorial and is used for demonstrating the Opentrons API

    Add a 96 well plate, and place it in slot '2' of the robot deck
    Add a 200uL tip rack, and place it in slot '1' of the robot deck

    Add a single-channel 300uL pipette to the left mount, and tell it to use that tip rack

    Transfer 100uL from the plate's 'A1' well to it's 'B2' well

If we were to rewrite this with the Opentrons API, it would look like the following:

.. code-block:: python

    # imports
    from opentrons import labware, instruments

    # metadata
    metadata = {
        'protocolName': 'My Protocol',
        'author': 'Name <email@address.com>',
        'description': 'Simple protocol to get started using OT2',
    }

    # labware
    plate = labware.load('96-flat', '2')
    tiprack = labware.load('opentrons_96_tiprack_300ul', '1')

    # pipettes
    pipette = instruments.P300_Single(mount='left', tip_racks=[tiprack])

    # commands
    pipette.transfer(100, plate.wells('A1'), plate.wells('B2'))


How it's Organized
++++++++++++++++++

When writing protocols using the Opentrons API, there are generally five sections:

1) :ref:`index-imports`
2) :ref:`index-metadata`
3) :ref:`index-labware`
4) :ref:`index-pipettes`
5) :ref:`index-commands`

.. _index-imports:

Imports
^^^^^^^

When writing in Python, you must always include the Opentrons API within your file. We most commonly use the ``labware`` and ``instruments`` sections of the API.

From the example above, the "imports" section looked like:

.. code-block:: python

    from opentrons import labware, instruments

.. _index-metadata:

Metadata
^^^^^^^^

Metadata is a dictionary of data that is read by the server and returned to client applications (such as the Opentrons App). It is not needed to run a protocol (and is entirely optional), but if present can help the client application display additional data about the protocol currently being executed.

The fields above ("protocolName", "author", and "description") are the recommended fields, but the metadata dictionary can contain fewer or additional fields as desired (though non-standard fields may not be rendered by the client, depending on how it is designed).

You may see a metadata field called "source" in protocols you download directly from Opentrons. The "source" field is used for anonymously tracking protocol usage if you opt-in to analytics in the Opentrons App. For example, protocols from the Opentrons Protocol Library may have "source" set to "Opentrons Protocol Library". You shouldn't define "source" in your own protocols.

.. _index-labware:

Labware
^^^^^^^

While the imports section is usually the same across protocols, the labware section is different depending on the tip racks, well plates, troughs, or tubes you're using on the robot.

Each labware is given a type (ex: ``'96-flat'``), and the slot on the robot it will be placed (ex: ``'2'``).

From the example above, the "labware" section looked like:

.. code-block:: python

    plate = labware.load('96-flat', '2')
    tiprack = labware.load('opentrons_96_tiprack_300ul', '1')

.. _index-pipettes:

Pipettes
^^^^^^^^

Next, pipettes are created and attached to a specific mount on the OT-2 (``'left'`` or ``'right'``).

There are other parameters for pipettes, but the most important are the tip rack(s) it will use during the protocol.

From the example above, the "pipettes" section looked like:

.. code-block:: python

    pipette = instruments.P300_Single(mount='left', tip_racks=[tiprack])

.. _index-commands:

Commands
^^^^^^^^

And finally, the most fun section, the actual protocol commands! The most common commands are ``transfer()``, ``aspirate()``, ``dispense()``, ``pick_up_tip()``, ``drop_tip()``, and much more.

This section can tend to get long, relative to the complexity of your protocol. However, with a better understanding of Python you can learn to compress and simplify even the most complex-seeming protocols.

From the example above, the "commands" section looked like:

.. code-block:: python

    pipette.transfer(100, plate.wells('A1'), plate.wells('B1'))


******************

Feature Requests
----------------

Have an interesting idea or improvement for our software? Create a ticket on github by following these `guidelines.`__

__ https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md#opening-issues

Developer's guide
-----------------

Do you want to contribute to our open-source API? You can find more information on how to be involved `here.`__

__ https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md

.. toctree::

    writing
    labware
    pipettes
    atomic_commands
    complex_commands
    hardware_control
    modules
    examples
    api
