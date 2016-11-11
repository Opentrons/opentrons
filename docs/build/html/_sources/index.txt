.. Opentrons API documentation master file, created by
   sphinx-quickstart on Thu Oct 27 12:10:26 2016.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

.. testsetup:: index_main

  from opentrons import Robot
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
      axis="b",
      max_volume = 1000
  )

  pipette = p200

.. testsetup:: index_long
  
  from opentrons import Robot
  Robot().reset()

Opentrons API: Simple Biology Lab Protocol Coding
===========================================================

Introduction
------------

The Opentrons API is a simple framework designed to make writing automated biology lab protocols easy. 

We've designed it in a way we hope is accessible to anyone with basic computer and wetlab skills. As a bench scientist, you should be able to code your automated protocols in a way that reads like a lab notebook. 

.. testcode:: index_main
   
   pipette.aspirate(tube_1).dispense(tube_2)

That is how you tell the Opentrons robot to aspirate its the maximum volume of the current pipette from one tube and dispense it into another one. 

You string these commands into full protocols that anyone with Opentrons can run. This one way to program the robot to use a p200 pipette to pick up 200ul (its full volume) and dispense 50ul into the first four wells in a 96 well plate called 'plate.'

.. testcode:: index_main
   
   p200.aspirate(trough[1])
   p200.dispense(50, plate[0])
   p200.dispense(50, plate[1])
   p200.dispense(50, plate[2])
   p200.dispense(50, plate[3])

If you wanted to do this 96 times, you could write it like this:

.. testcode:: index_main
   
  p200.aspirate(trough)
   
  for i in range(95):
      p200.dispense(plate[i + 1]).blow_out().touch_tip()

Table of Contents
-----------------

.. toctree::
   :maxdepth: 3

   setup
   getting_started
   running_a_protocol
   well_access
   tips_and_tricks
   module
   api

Basic Principles
----------------

**Human Readable**: API strikes a balance between human and machine readability of the protocol. Protocol written with Opentrons API sound similar to what the protocol will look in real life. For example:

.. testcode:: index_main

  p200.aspirate(100, plate['A1']).dispense(plate['A2'])

Is exactly what you think it would do: 
  * Take p200 pipette
  * Aspirate 100 uL from well A1 on your plate
  * Dispense everything into well A2 on the same plate

**Permissive**: everyone's process is different and we are not trying to impose our way of thinking on you. Instead, our API allows for different ways of expressing your protocol and adding fine details as you need them. 
For example:

.. testcode:: index_main

  p200.aspirate(100, plate[0]).dispense(plate[1])

while using 0 or 1 instead of 'A1' and 'B1' will do just the same.

or

.. testcode:: index_main

  p200.aspirate(100, plate[0].bottom())

will aspirate 100, from the bottom of a well.


Hello World
-----------

Below is a short protocol that will pick up a tip and use it to move 100ul volume across all the wells on a plate:

.. testcode:: index_long

  # First, import opentrons API modules
  from opentrons import Robot
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





Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`