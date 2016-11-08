=============
Opentrons API
=============

.. image:: https://travis-ci.org/OpenTrons/opentrons-api.svg?branch=master
   :target: https://travis-ci.org/OpenTrons/opentrons-api
   :alt: Build Status

.. image:: https://coveralls.io/repos/github/OpenTrons/opentrons-api/badge.svg?branch=master
   :target: https://coveralls.io/github/OpenTrons/opentrons-api?branch=master
   :alt: Coverage Status

.. _Setting up Opentrons API: http://opentrons.github.io/opentrons-api/index.html#installing-opentrons-api
.. _Hello World API Protocol: http://opentrons.github.io/opentrons-api/index.html#hello-world 
.. _Tips and Tricks for API Liquid Handling: http://opentrons.github.io/opentrons-api/tips_and_tricks.html
.. _Full API Documentation: http://opentrons.github.io/opentrons-api/api.html

Quick Links
-----------

* `Setting up Opentrons API`_
* `Hello World API Protocol`_
* `Tips and Tricks for API Liquid Handling`_
* `Full API Documentation`_

Introduction
------------

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

If you wanted to do enough times to fill a 96 well plate, you could write it like this:

.. code-block:: python
   
   #define how much volume to dispense in each well
   dispense_vol = 50
   
   for i in range(96):
      if p200.current_volume < dispense_vol:
         p200.aspirate(trough[1])
      p200.dispense(dispense_vol, plate[i])

Hello World
-----------

Below is a short protocol that will pick up a tip and use it to move 100ul volume across all the wells on a plate:

.. code-block:: python

  # First, import opentrons API modules
  from opentrons.robot import Robot
  from opentrons import containers, instruments

  # Initialized Robot variable
  robot = Robot()

  # Load a tip rack and assign it to a variable
  tiprack = containers.load(
      'tiprack-200ul',  # container type
      'A1',             # slot
      'tiprack'         # user-defined name
  )
  # Load a plate
  plate = containers.load('96-flat', 'B1', 'plate')
  
  # Initialize a pipette    
  p200 = instruments.Pipette(
      axis="b"
  )

  p200.set_max_volume(200)  # volume calibration, can be called whenever you want
  p200.pick_up_tip(tiprack[0])  # pick up tip from position 0 in a tip rack

  # loop through 95 wells, transferring to the next
  for i in range(95):
      p200.aspirate(100, plate[i])
      p200.dispense(plate[i + 1]).blow_out().touch_tip()

  # return tip to back to position 0 in a tip rack
  p200.return_tip()
  # simulate a protocol run on a virtual robot
  robot.simulate()
  # robot.connect('/dev/tty.usbserialNNNN')  # connect to the robot
  # robot.run()                              # to run on a physical robot

Basic Principles
----------------

**Human Readable**: API strikes a balance between human and machine readability of the protocol. Protocol written with Opentrons API sound similar to what the protocol will look in real life. For example:

.. code-block:: python

  p200.aspirate(100, plate['A1']).dispense(plate['A2'])

Is exactly what you think it would do: 
  * Take P200 pipette
  * Aspirate 100 uL of liquid from well A1 on your plate
  * Dispense everything into well A2 on the same plate

**Permissive**: everyone's process is different and we are not trying to impose our way of thinking on you. Instead, our API allows for different ways of expressing your protocol and adding fine details as you need them. 
For example:

.. code-block:: python

  p200.aspirate(100, plate[0]).dispense(plate[1])

while using 0 or 1 instead of 'A1' and 'A2' will do just the same.

or

.. code-block:: python

  p200.aspirate(100, plate[0].bottom())

will aspirate 100, from the bottom of a well.

Installing Opentrons API
------------------------
If you are just starting with Python it is recommended to install Jupyter notebook to run Opentrons API. Please refer to `Setting up Opentrons API`_ for detailed instructions.

If you are familiar with python and comfortable running ``pip``, you can install Opentrons API by running:

.. code-block:: bash

  pip install opentrons

What's next?
---------------
* Start with `Setting up Opentrons API`_ in `Jupyter <http://jupyter.org/>`_.
* Write your first `Hello World API Protocol`_.
* Learn some common `Tips and Tricks for API Liquid Handling`_.
* Discover `Full API Documentation`_ for advanced API protocol writing.