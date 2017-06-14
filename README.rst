=============
Opentrons API
=============

.. image:: https://travis-ci.org/OpenTrons/opentrons-api.svg?branch=master
   :target: https://travis-ci.org/OpenTrons/opentrons-api
   :alt: Build Status

.. image:: https://coveralls.io/repos/github/OpenTrons/opentrons-api/badge.svg?branch=master
   :target: https://coveralls.io/github/OpenTrons/opentrons-api?branch=master
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

You string these commands into full protocols that anyone with Opentrons can run. This one way to program the robot to use a p200 pipette to pick up 200ul (its full volume) and dispense 50ul into the first four wells in a 96 well plate called 'plate.'

.. code-block:: python
   
   p200.aspirate(trough[1])
   p200.dispense(50, plate[0])
   p200.dispense(50, plate[1])
   p200.dispense(50, plate[2])
   p200.dispense(50, plate[3])

If you wanted to do this 96 times, you could write it like this:

.. code-block:: python
   
  for i in range(96):
      if p200.current_volume < 50:
          p200.aspirate(trough[1])
      p200.dispense(50, plate[i])

Basic Principles
----------------

**Human Readable**: API strikes a balance between human and machine readability of the protocol. Protocol written with Opentrons API sound similar to what the protocol will look in real life. For example:

.. code-block:: python

  p200.aspirate(100, plate['A1']).dispense(plate['A2'])

Is exactly what you think it would do: 
  * Take p200 pipette
  * Aspirate 100 uL from well A1 on your plate
  * Dispense everything into well A2 on the same plate

**Permissive**: everyone's process is different and we are not trying to impose our way of thinking on you. Instead, our API allows for different ways of expressing your protocol and adding fine details as you need them. 
For example:

.. code-block:: python

  p200.aspirate(100, plate[0]).dispense(plate[1])

while using 0 or 1 instead of 'A1' and 'B1' will do just the same.

or

.. code-block:: python

  p200.aspirate(100, plate[0].bottom())

will aspirate 100, from the bottom of a well.

Hello World
-----------

Below is a short protocol that will pick up a tip and use it to move 100ul volume across all the wells on a plate:

.. code-block:: python

  from opentrons import robot
  from opentrons import containers, instruments

  tiprack = containers.load(
      'tiprack-200ul',  # container type
      'A1',             # slot
      'tiprack'         # user-defined name
  )

  plate = containers.load('96-flat', 'B1', 'plate')
  
  p200 = instruments.Pipette(
      axis="b",
      max_volume=200
  )

  p200.pick_up_tip(tiprack[0])

  for i in range(95):
      p200.aspirate(100, plate[i])
      p200.dispense(plate[i + 1])

  p200.return_tip()

  robot.simulate()

Installing Opentrons API
------------------------
If you are just starting with Python it is recommended to install Jupyter notebook to run Opentrons API. Please refer to `Full API Documentation`_ for detailed instructions.

If you are familiar with python and comfortable running ``pip``, you can install Opentrons API by running:

.. code-block:: bash

  pip install opentrons
