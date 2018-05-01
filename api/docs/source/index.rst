.. Opentrons API documentation master file, created by
   sphinx-quickstart on Thu Oct 27 12:10:26 2016.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

.. testsetup:: *

  from opentrons import robot, labware, instruments
  robot.reset()

.. testcleanup:: *

  from opentrons import robot, labware, instruments
  robot.reset()

===============
Opentrons API
===============

The Opentrons API is a simple framework designed to make writing automated biology lab protocols easy.

We’ve designed it in a way we hope is accessible to anyone with basic computer and wetlab skills. As a bench scientist, you should be able to code your automated protocols in a way that reads like a lab notebook.

`View source code on GitHub`__

__ https://github.com/opentrons/opentrons/tree/edge/api

**********************

How it Looks
---------------

The design goal of the Opentrons API is to make code readable and easy to understand. For example, below is a short set of instruction to transfer from well ``'A1'`` to well ``'B1'`` that even a computer could understand:

.. code-block:: none

    Use the Opentrons API's labware and instruments

    Add a 96 well plate, and place it in slot '4' of the robot deck
    Add a 300uL tip rack, and place it in slot '1' of the robot deck

    Add a 300uL pipette to the 'right' mount (when facing the robot), and tell it to use that tip rack

    Transfer 100uL from the plate's 'A1' well to it's 'B2' well

If we were to rewrite this with the Opentrons API, it would look like the following:

.. testcode:: helloworld

    # imports
    from opentrons import labware, instruments

    # labware
    plate = labware.load('96-flat', '4')
    tiprack = labware.load('GEB-tiprack-300ul', '1')

    # pipettes
    pipette = instruments.P300_Single(mount='right', tip_racks=[tiprack])

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

.. testcode:: imports

    from opentrons import labware, instruments


Labware
^^^^^^^

While the imports section is usually the same across protocols, the labware section is different depending on the tip racks, well plates, troughs, or tubes you're using on the robot. [Note for OT-One users: "labware" was previously referred to as "containers". This term was ambiguous for developers, and so we now recommend using "labware", but "containers" is still supported in order to minimize the required changes to OT-One protocol files.]

Each labware is given a type (ex: ``'96-flat'``), and the slot on the robot it will be placed (ex: ``'4'``).

From the example above, the "labware" section looked like:

.. testcode:: imports

    plate = labware.load('96-flat', '4')
    tiprack = labware.load('tiprack-200ul', '1')

Pipettes
^^^^^^^^

Next, pipettes are created and attached to a specific mount on the OT2 (``'left'`` or ``'right'``). The mounts are designated "left" and "right" from the perspective of a user standing in front of the door of the robot, facing the robot.

There are other parameters for pipettes, but the most important is the list of tip racks it will use during the protocol. There is a general ``Pipette`` constructor that can be used by advanced developers, but the models currently under active development and testing are the ``P300_Single``, ``P300_Multi``, ``P10_Single``, and ``P10_Multi``.

From the example above, the "pipettes" section looked like:

.. testcode:: imports

    pipette = instruments.P300_Single(tip_racks=[tiprack])

Commands
^^^^^^^^

And finally, the most fun section, the actual protocol commands! The most common commands are ``transfer()``, ``aspirate()``, ``dispense()``, ``pick_up_tip()``, ``drop_tip()``, and much more.

This section can tend to get long, relative to the complexity of your protocol. However, with a better understanding of Python you can learn to compress and simplify even the most complex-seeming protocols.

From the example above, the "commands" section looked like:

.. testcode:: imports

    pipette.transfer(100, plate.wells('A1'), plate.wells('B1'))


Table of Contents
-----------------

.. toctree::
  :maxdepth: 3

  writing
  labware
  pipettes
  transfer
  robot
  modules
  examples
  api
  calibration
  firmware

.. |br| raw:: html

   <br />
