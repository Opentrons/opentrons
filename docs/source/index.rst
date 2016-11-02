.. Opentrons API documentation master file, created by
   sphinx-quickstart on Thu Oct 27 12:10:26 2016.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

.. testsetup:: main

  from opentrons.robot import Robot
  from opentrons import containers, instruments

  robot = Robot()
  robot.reset()             # clear robot's state first

  tiprack = containers.load(
      'tiprack-200ul',  # container type
      'A1',             # slot
      'tiprack'         # user-defined name
  )
  plate = containers.load('96-flat', 'B1', 'plate')
  trough = containers.load('trough-12row', 'B2', 'trough')

  tube_1 = plate[0]
  tube_2 = plate[1]

  well_1 = plate[0]
  well_2 = plate[1]
  well_3 = plate[2]
  well_4 = plate[3]
      
  p200 = instruments.Pipette(
      axis="b"
  )

  p200.set_max_volume(200)  # volume calibration, can be called whenever you want
  pipette = p200

.. testsetup:: long
  
  from opentrons.robot import Robot
  Robot().reset()

Opentrons API: Simple Biology Lab Protocol Coding
===========================================================

Introduction
------------

The Opentrons API is a simple framework designed to make writing automated biology lab protocols easy. 

We've designed it in a way we hope is accessible to anyone with basic computer and wetlab skills. As a bench scientist, you can write your automated protocols in a similar way to how you'd already write them in your lab notebook. 

.. testcode:: main
   
   pipette.aspirate(tube_1).dispense(tube_2)

That is how you tell the Opentrons robot to aspirate its full volume from tube-1 and dispense it into tube-2. 

To create your own automated protocols, you just have to string together commands for the robot to do for you. This one way to program the robot to use a p200 pipette to pick up 200ul (its full volume) and dispense 50ul into four different wells.

.. testcode:: main
   
   p200.aspirate(trough)
   p200.dispense(50, well_1).dispense(50, well_2).dispense(50, well_3).dispense(50, well_4)

If you wanted to do this 96 times, you could write it like this:

.. testsetup:: main
   
  p200.aspirate(trough)
   
  for i in range(95):
      p200.aspirate(100, plate[i])
      p200.dispense(plate[i + 1]).blow_out().touch_tip()

Hello World
-----------

Below is a short protocol that will pick up a tip and use it to move 100ul volume across all the wells on a plate:

.. testcode:: long

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

.. testcode:: main

  p200.aspirate(100, plate['A1']).dispense(plate['A2'])

Is exactly what you think it would do: 
  * Take P200 pipette
  * Aspirate 100 uL of liquid from well A1 on your plate
  * Dispense everything into well A2 on the same plate

**Permissive**: everyone's process is different and we are not trying to impose our way of thinking on you. Instead, our API allows for different ways of expressing your protocol and adding fine details as you need them. 
For example:

.. testcode:: main

  p200.aspirate(100, plate[0]).dispense(plate[1])

while using 0 or 1 instead of 'A1' and 'A2' will do just the same.

or

.. testcode:: main

  p200.aspirate(100, plate[0].bottom())

will aspirate 100, from the bottom of a well.

Installing Opentrons API
------------------------
If you are just starting with Python it is recommended to install Jupyter notebook to run Opentrons API. Please refer to :ref:`setup` for detailed instructions.

If you are familiar with python and comfortable running ``pip``, you can install Opentrons API by running:

.. code-block:: bash

  pip install opentrons

Further Reading
---------------

.. toctree::
   :maxdepth: 2

   api
   tips_and_tricks
   setup

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

