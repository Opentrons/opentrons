.. Opentrons API documentation master file, created by
   sphinx-quickstart on Thu Oct 27 12:10:26 2016.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

===============
Opentrons API
===============

For the OT 1 API, `please go to this link`__

__ https://docs.opentrons.com/ot1/

The Opentrons API is a simple framework designed to make writing automated biology lab protocols easy.

We’ve designed it in a way we hope is accessible to anyone with basic computer and wetlab skills. As a bench scientist, you should be able to code your automated protocols in a way that reads like a lab notebook.

`View source code on GitHub`__

__ https://github.com/Opentrons/opentrons

**********************

How it Looks
---------------

The design goal of the Opentrons API is to make code readable and easy to understand. For example, below is a short set of instruction to transfer from well ``'A1'`` to well ``'B1'`` that even a computer could understand:

.. code-block:: none

    Use the Opentrons API's labware and instruments

    Add a 96 well plate, and place it in slot '2' of the robot deck
    Add a 200uL tip rack, and place it in slot '1' of the robot deck

    Add a single-channel 300uL pipette to the left mount, and tell it to use that tip rack

    Transfer 100uL from the plate's 'A1' well to it's 'B2' well

If we were to rewrite this with the Opentrons API, it would look like the following:

.. code-block:: python

    # imports
    from opentrons import labware, instruments

    # labware
    plate = labware.load('96-flat', '2')
    tiprack = labware.load('tiprack-200ul', '1')

    # pipettes
    pipette = instruments.P300_Single(mount='left', tip_racks=[tiprack])

    # commands
    pipette.transfer(100, plate.wells('A1'), plate.wells('B2'))

**********************

How it's Organized
------------------

When writing protocols using the Opentrons API, there are generally three sections:

1) Imports
2) Labware
3) Pipettes
4) Commands

Imports
^^^^^^^

When writing in Python, you must always include the Opentrons API within your file. We most commonly use the ``labware`` and ``instruments`` sections of the API.

From the example above, the "imports" section looked like:

.. code-block:: python

    from opentrons import labware, instruments


Labware
^^^^^^^

While the imports section is usually the same across protocols, the labware section is different depending on the tip racks, well plates, troughs, or tubes you're using on the robot.

Each labware is given a type (ex: ``'96-flat'``), and the slot on the robot it will be placed (ex: ``'2'``).

From the example above, the "labware" section looked like:

.. code-block:: python

    plate = labware.load('96-flat', '2')
    tiprack = labware.load('tiprack-200ul', '1')

Pipettes
^^^^^^^^

Next, pipettes are created and attached to a specific mount on the OT-2 (``'left'`` or ``'right'``).

There are other parameters for pipettes, but the most important are the tip rack(s) it will use during the protocol.

From the example above, the "pipettes" section looked like:

.. code-block:: python

    pipette = instruments.P300_Single(mount='left', tip_racks=[tiprack])

Commands
^^^^^^^^

And finally, the most fun section, the actual protocol commands! The most common commands are ``transfer()``, ``aspirate()``, ``dispense()``, ``pick_up_tip()``, ``drop_tip()``, and much more.

This section can tend to get long, relative to the complexity of your protocol. However, with a better understanding of Python you can learn to compress and simplify even the most complex-seeming protocols.

From the example above, the "commands" section looked like:

.. code-block:: python

    pipette.transfer(100, plate.wells('A1'), plate.wells('B1'))


Table of Contents
-----------------

.. toctree::
  :maxdepth: 3

  writing
  labware
  pipettes
  atomic commands
  complex commands
  robot
  modules
  examples
  api

.. |br| raw:: html

   <br />
