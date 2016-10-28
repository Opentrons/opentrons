.. Opentrons API documentation master file, created by
   sphinx-quickstart on Thu Oct 27 12:10:26 2016.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Opentrons API: the ultimate way to design and run protocols
===========================================================

Introduction
------------

The Opentrons API is a versatile framework that makes it incredibly easy to write protocols and command the robot. Using the API your protocols can be understood by our machines and read or modified by fellow non-programmer scientists. It's also an opportunity for you to learn a little bit of Python.

Hello World
-----------

.. doctest::

  from opentrons.robot import Robot
  from opentrons import containers, instruments

  robot = Rodbot()

  tiprack = containers.load(
      'tiprack-200ul',  # container type
      'A1',             # slot
      'tiprack'         # user-defined name
  )
  plate = containers.load('96-flat', 'B1', 'plate')
      
  p200 = instruments.Pipette(
      axis="b"
  )

  p200.set_max_volume(200)  # volume calibration, can be called whenever you want
  robot.clear()             # clear robot's state first

  p200.pick_up_tip(tiprack[0])  # pick up tip from position 0 in a tip rack

  # loop through 95 wells, transferring to the next
  for i in range(95):
      p200.aspirate(100, plate[i])
      p200.dispense(plate[i + 1]).blow_out().touch_tip()

  p200.drop_tip(tiprack[0])

Basic Principles
----------------

**Human Readable**: API strikes a balance between human and machine readability of the protocol. Protocol written with Opentrons API sound similar to what the protocol will look in real life. For example:

::

  p200.aspirate(100, plate['A1']).dispense(plate['A2'])

Is exactly what you think it would do: 
  * Take P200 pipette
  * Aspirate 100 uL of liquid from well A1 on your plate
  * Dispense everything into well A2 on the same plate

**Permissive**: everyone's process is different and we are not trying to impose our way of thinking on you. Instead, our API allows for different ways of expressing your protocol and adding fine details as you need them. 
For example:

::

  p200.aspirate(100, plate[0]).dispense(plate[1])

while using 0 or 1 instead of 'A1' and 'A2' will do just the same.

or

::

  p200.aspirate(100, plate[0].bottom())

will aspirate 100, from the bottom of a well.

API Reference
-------------

.. toctree::
   :maxdepth: 2

   api

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

