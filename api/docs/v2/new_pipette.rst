:og:description: How to load and work with Opentrons pipettes in a Python protocol.

.. _new-pipette:

********
Pipettes
********

.. toctree::
    pipettes/loading
    pipettes/characteristics
    pipettes/configuring
    pipettes/volume_modes
    
Opentrons pipettes are configurable devices used to move liquids throughout the working area during the execution of protocols. Flex and OT-2 each have their own pipettes, which are available for use in the Python API.

Pages in this section of the documentation cover:

    - :ref:`Loading pipettes <loading-pipettes>` into your protocol.
    - :ref:`Pipette characteristics <pipette-characteristics>`, such as how fast they can move liquid and how they move around the deck.
    - The :ref:`partial tip pickup <partial-tip-pickup>` configuration for the Flex 96-Channel Pipette, which uses only 8 channels for pipetting. Full and partial tip pickup can be combined in a single protocol.
    - The :ref:`volume modes <pipette-volume-modes>` of Flex 50 µL pipettes, which must operate in low-volume mode to accurately dispense very small volumes of liquid. 

For information about liquid handling, see :ref:`v2-atomic-commands` and :ref:`v2-complex-commands`.




