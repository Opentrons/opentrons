.. _introduction:

============
API Intro
============

.. testsetup::  helloworld

    from opentrons import containers, instruments, robot

    robot.reset()

    tiprack = containers.load('tiprack-200ul', 'A1')
    plate = containers.load('96-flat', 'B1')

    pipette = instruments.Pipette(axis='b', max_volume=200)

Hello Opentrons
---------------

The Opentrons API is a simple framework designed to make writing automated lab protocols easy.

Below is a short protocol that will pick up a tip and use it to move 100ul from well ``'A1'`` to well ``'B1'``:

.. testcode::  helloworld

    # imports
    from opentrons import containers, instruments

    # containers
    plate = containers.load('96-flat', 'B1')
    tiprack = containers.load('tiprack-200ul', 'A1')

    # pipettes
    pipette = instruments.Pipette(axis='b', max_volume=200, tip_racks=[tiprack])

    # commands
    pipette.transfer(100, plate.wells('A1'), plate.wells('B1'))


The design goal of the Opentrons API is to make code readable and easy to understand. If we were to read the above code example as if it were in plain English, it would look like the following:

.. code-block:: none

    Use the Opentrons API's containers and instruments

    Add a 96 well plate, and place it in slot 'B1'
    Add a 200uL tip rack, and place it in slot 'A1'

    Add a 200uL pipette to axis 'b', and tell it to use that tip rack

    Transfer 100uL from the plate's 'A1' well to it's 'A2' well

**********************

Protocol Sections
-----------------

When writing protocols using the Opentrons API, there are generally three sections:

Imports
^^^^^^^

When writing in Python, you must always include the Opentrons API within your file. We most commonly use the ``containers`` and ``instruments`` sections of the API, so 99% of the time we can just import those.

From the example above, the "imports" section looked like:

.. code-block::  python

    from opentrons import containers, instruments


Containers
^^^^^^^^^^

The first actualy code writing we do in our protocol files is creating containers. These usually include tip racks, well plates, troughs, tubes, etc.

When a container is created, it is told specifically what type of container it is, and secondly which slot on the OT-One it should be placed.

From the example above, the "containers" section looked like:

.. code-block::  python

    plate = containers.load('96-flat', 'B1')
    tiprack = containers.load('tiprack-200ul', 'A1')

Pipettes
^^^^^^^^

Next, pipettes are created and attached to a specific axis on the OT-One (``'a'`` or ``'b'``). There are many other options that can be given a pipette, most commonly we give pipettes a ``max_volume`` to set it's size, and we also "attach" a tip rack to it.

From the example above, the "pipettes" section looked like:

.. code-block::  python

    pipette = instruments.Pipette(axis='b', max_volume=200, tip_racks=[tiprack])

Commands
^^^^^^^^

And finally, the most fun section, the actual protocol commands. Here we are usually telling the pipette to move liquid from one place to another, and also picking up and dropping off tips.

This section can tend to get long, relative to the complexity of your protocol. However, with a better understanding of Python you can learn to compress and simplify even the most complex-seeming protocols.

From the example above, the "commands" section looked like:

.. code-block:: python

    pipette.transfer(100, plate.wells('A1'), plate.wells('B1'))

