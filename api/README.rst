=============
Opentrons API
=============

.. image:: https://travis-ci.org/Opentrons/opentrons.svg?branch=edge
   :target: https://travis-ci.org/Opentrons/opentrons
   :alt: Build Status

.. image:: https://coveralls.io/repos/github/Opentrons/opentrons/badge.svg?branch=edge
   :target: https://coveralls.io/github/Opentrons/opentrons?branch=edge
   :alt: Coverage Status

.. _Full API Documentation: http://docs.opentrons.com

Introduction
------------

Please refer to `Full API Documentation`_ for detailed instructions.

The Opentrons API is a simple framework designed to make writing automated biology lab protocols easy. 

We've designed it in a way we hope is accessible to anyone with basic computer and wetlab skills. As a bench scientist, you should be able to code your automated protocols in a way that reads like a lab notebook. 

.. code-block:: python
   
   pipette.aspirate(tube_1).dispense(tube_2)

That is how you tell the Opentrons robot to aspirate its the maximum volume of the current pipette from one tube and dispense it into another one. 

You string these commands into full protocols that anyone with Opentrons can run. This one way to program the robot to use a p300 pipette to pick up 200ul and dispense 50ul into the first four wells in a 96 well plate called 'plate'.

.. code-block:: python
   
   p300.aspirate(trough[1])
   p300.dispense(50, plate[0])
   p300.dispense(50, plate[1])
   p300.dispense(50, plate[2])
   p300.dispense(50, plate[3])

If you wanted to do this 96 times, you could write it like this:

.. code-block:: python
   
  for i in range(96):
      if p300.current_volume < 50:
          p300.aspirate(trough[1])
      p300.dispense(50, plate[i])

Basic Principles
----------------

**Human Readable**: API strikes a balance between human and machine readability of the protocol. Protocol written with Opentrons API sound similar to what the protocol will look in real life. For example:

.. code-block:: python

  p300.aspirate(100, plate['A1']).dispense(plate['A2'])

Is exactly what you think it would do: 
  * Take p300 pipette
  * Aspirate 100 uL from well A1 on your plate
  * Dispense everything into well A2 on the same plate

**Permissive**: everyone's process is different and we are not trying to impose our way of thinking on you. Instead, our API allows for different ways of expressing your protocol and adding fine details as you need them. 
For example:

.. code-block:: python

  p300.aspirate(100, plate[0]).dispense(plate[1])

while using 0 or 1 instead of 'A1' and 'B1' will do just the same.

or

.. code-block:: python

  p300.aspirate(100, plate[0].bottom())

will aspirate 100, from the bottom of a well.

Hello World
-----------

Below is a short protocol that will pick up a tip and use it to move 100ul volume across all the wells on a plate:

.. code-block:: python

  from opentrons import labware, instruments

  tiprack = labware.load(
      'tiprack-200ul',  # container type
      '1'               # slot
  )

  plate = labware.load('96-flat', '2')
  
  p300 = instruments.P300_Single(mount='left')

  p300.pick_up_tip(tiprack[0])

  for i in range(95):
      p300.aspirate(100, plate[i])
      p300.dispense(plate[i + 1])

  p300.return_tip()

Using This Repo Outside Of A Robot
----------------------------------

The code in this subdirectory can be used outside of a robot to check protocols; however, because the code requires extra shared data files and dependencies, you cannot simply run a python interpreter - it must be installed.

There are two ways to install the Opentrons software. The first is to create a virtual environment unique to this particular checkout of the Opentrons software; this is useful to avoid affecting the rest of your system. The second way is to install the Opentrons software to your entire system, and is much easier to use with other Python packages like Jupyter.

Before either step is taken, please follow the instructions in the Environment and Repository section of CONTRIBUTING.md in the repository root, up to and including running ``make install``.


Virtual Environment Setup
~~~~~~~~~~~~~~~~~~~~~~~~~

Once ``make install`` has been run, the virtual environment is ready to use. For more information on virtual environments see the Python documentation at https://docs.python.org/3/library/venv.html . The API Makefile contains a useful command to ensure that the version of the API installed to the virtual environment is up to date and start the virtual environment: ``make local-shell``. After running ``make local-shell``, the terminal in which you ran it is now in the virtual environment, and other Python scripts or applications started from that terminal will be able to see the Opentrons software.

In addition to running scripts that ``import opentrons``, the local installation makes it easy to run an API server locally on your machine. This is only important if you want to interact with the system the same way the opentrons app does; if you only want to test protocols, you can simply run the protocol in the virtual environment. To run the server, do ``make dev``.

Systemwide Setup
~~~~~~~~~~~~~~~~

Sometimes it can be inconvenient to activate a virtual environment and run things from it every time you want to use the API to simulate a protocol. This workflow is easier in that case, and is best used when you do not intend to modify the API. In that case, in addition to running ``make install``, we recommend that you check out the latest release of the API rather than using the ``edge`` branch. Instead, go to the root of the repository on GitHub at https://github.com/Opentrons/opentrons , click the branch dropdown, click the tags tab, and find the numerically highest tag, then check that out locally.

Once the most recent tag is checked out, in this directory run ``make wheel``. This command builds the API into an installable Python object. Then, in this directory run ``pip install dist/opentrons-*.whl``. This command installs the API on your system. Finally, set the environment variable ``ENABLE_VIRTUAL_SMOOTHIE=true``. This prevents the API from accessing your computer as it would the robot. If you see errors about the directory ``data``, it means you have not set the environment variable.

Once the API is installed and the environment variable is set, you should be able to ``import opentrons`` from anywhere on your system, including from inside Jupyter.
