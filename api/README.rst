=============
Opentrons API
=============

.. image:: https://badgen.net/travis/Opentrons/opentrons
   :target: https://travis-ci.org/Opentrons/opentrons
   :alt: Build Status

.. image:: https://badgen.net/codecov/c/github/Opentrons/opentrons
   :target: https://codecov.io/gh/Opentrons/opentrons
   :alt: Coverage Status

.. image:: https://badgen.net/pypi/v/opentrons
   :target: https://pypi.org/project/opentrons/
   :alt: Download From PyPI

.. _Full API Documentation: http://docs.opentrons.com

Note On Versions
----------------

This API is for locally simulating protocols for the OT 2 without connecting to a robot. It no longer controls an OT 1.

`Version 2.5.2 <https://pypi.org/project/opentrons/2.5.2/>`_ was the final release of this API for the OT 1. If you want to download this API to use the OT 1, you should download it with

.. code-block:: shell

   pip install opentrons==2.5.2

For APIs between 2.5.2 and 3.7.0, there is no PyPI package available. Those APIs should be installed by cloning this repo and following the instructions in `the Development Setup section of CONTRIBUTING.md <https://github.com/Opentrons/opentrons/blob/edge/CONTRIBUTING.md#development-setup>`_ and `the API CONTRIBUTING.rst <https://github.com/Opentrons/opentrons/blob/edge/api/CONTRIBUTING.rst>`_.


Introduction
------------

Please refer to our `Full API Documentation`_ for detailed instructions.

The Opentrons API is a simple framework designed to make writing automated biology lab protocols for the Opentrons OT2 easy.

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

Simulating Protocols
--------------------

To simulate a protocol using this package, you can use the console script ``opentrons_simulate``, which is installed when this package is installed from pip. For detailed information on how to run the script, run ``opentrons_simulate --help``. In general, however, simulating a protocol is as simple as running ``opentrons_simulate.exe C:\path\to\protocol`` on Windows or ``opentrons_simulate /path/to/protocol`` on OSX or Linux.

The simulation script can also be invoked through python with ``python -m opentrons.simulate /path/to/protocol``.

This also provides an entrypoint to use the Opentrons simulation package from other Python contexts such as an interactive prompt or Jupyter. To simulate a protocol in python, open a file containing a protocol and pass it to ``opentrons.simulate.simulate``:

.. code-block:: python

   import opentrons.simulate
   protocol_file = open(’/path/to/protocol.py’)
   opentrons.simulate.simulate(protocol_file)


The function will either run and return or raise an  exception if there is a problem with the protocol.

Configuration
-------------

The module has a lot of configuration, some of which is only relevant when running on an actual robot, but some of which could be useful during simulation. When the module is first imported, it will try and write configuration files in ``~/.opentrons/config.json`` (``C:\Users\%USERNAME%\.opentrons\config.json`` on Windows). This contains mostly paths to other configuration files and directories, most of which will be in that folder. The location can be changed by setting the environment variable ``OT_CONFIG_DIR`` to another path. Inividual settings in the config file can be overridden by setting environment variables named like ``OT_${UPPERCASED_VAR_NAME}`` (for instance, to override the ``serial_log_file`` config element you could set the environment variable ``OT_SERIAL_LOG_FILE`` to a different path).


