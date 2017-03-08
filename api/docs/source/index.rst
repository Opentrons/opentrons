.. Opentrons API documentation master file, created by
   sphinx-quickstart on Thu Oct 27 12:10:26 2016.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

===============
Opentrons API
===============

The Opentrons API is a simple framework designed to make writing automated biology lab protocols easy.

We’ve designed it in a way we hope is accessible to anyone with basic computer and wetlab skills. As a bench scientist, you should be able to code your automated protocols in a way that reads like a lab notebook.

`View source code on GitHub`__

__ https://github.com/opentrons/opentrons-api

**********************

.. testsetup::  helloworld

    from opentrons import containers, instruments, robot

    robot.reset()

    tiprack = containers.load('tiprack-200ul', 'A1')
    plate = containers.load('96-flat', 'B1')

    pipette = instruments.Pipette(axis='b', max_volume=200)

How it Looks
---------------

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

How it's Organized
------------------

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

**********************

How to Use
-------------

Writing protocols in Python requires some up-front design before seeing your liquid handling automation in action. At a high-level, writing protocols with the Opentrons API looks like:

1) Write a Python protocol
2) Test your protocol for errors
3) Repeat steps 1 & 2
4) Load protocol into calibration UI
5) Calibrate containers and pipettes
6) Run your protocol

We at Opentrons are actively working towards our own protocol editor, but in the mean time we recommend writing your protocols in one of two ways:

Text Editor
^^^^^^^^^^^

Using a popular and free code editor, like `Sublime Text 3`__, is a common method for writing Python protocols. Download onto your computer, and you can now write and save Python scripts.

__ https://www.sublimetext.com/3

.. note::

    Make sure that when saving a protocol file, it ends with the ``.py`` file extension. This will ensure the App and other programs are able to properly read it.

    For example, ``my_protocol_file.py``

Jupyter Notebook
^^^^^^^^^^^^^^^^

For a more interactive environment to write and debug, we recommend using Jupyter Notebook. To begin using it, you will need to install `Anaconda`__, which comes with Jupyter Notebook.

Once installed, launch Jupyter Notebook, and install the Opentrons API by doing the following:

1) Create a new Python notebook
2) Run the command ``!pip install --upgrade opentrons`` in a cell
3) Restart your notebook's Kernel, and API will be installed

__ https://www.continuum.io/downloads

.. note::

    Be sure to download the **Python 3.6 version** if Anaconda, and Python 2.7 will not work with the Opentrons API.


Table of Contents
-----------------

.. toctree::
  :maxdepth: 2

  introduction
  labware_library
  tutorials
  calibration
  modules
  api
  firmware

.. |br| raw:: html

   <br />
