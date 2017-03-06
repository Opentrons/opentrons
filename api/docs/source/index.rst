.. Opentrons API documentation master file, created by
   sphinx-quickstart on Thu Oct 27 12:10:26 2016.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Opentrons API
=============



.. testsetup::  helloworld

    from opentrons import containers, instruments, robot

    robot.reset()

    tiprack = containers.load('tiprack-200ul', 'A1')
    plate = containers.load('96-flat', 'B1')

    pipette = instruments.Pipette(axis='b', max_volume=200)

Hello Opentrons
---------------

Below is a short protocol that will pick up a tip and use it to move 100ul from well ``'A1'`` to well ``'B1'``:

.. testcode::  helloworld

    from opentrons import containers, instruments, robot

    tiprack = containers.load('tiprack-200ul', 'A1')
    plate = containers.load('96-flat', 'B1')

    pipette = instruments.Pipette(axis='b', max_volume=200, tip_racks=[tiprack])

    pipette.transfer(100, plate.wells('A1'), plate.wells('A2'))


The Opentrons API is a simple framework designed to make writing automated lab protocols easy.

Human Readable
^^^^^^^^^^^^^^

The design goal of the Opentrons API is to make code readable and easy to understand. If we were to read the above code example as if it were in plain English, it would look like the following:

.. testcode::
    # Import the Opentrons API's containers and instruments

    # Load a 200uL tip rack and place it in slot 'A1'
    # Load in a 96 well plate and place it in slot 'B1'

    # Create a 200uL pipette, tell it to use the 200uL tip rack,
    # and attach that pipette to axis 'b' on the robot

    # Transfer 100uL from the plate's 'A1' well to it's 'A2' well


Table of Contents
-----------------

.. toctree::
  :maxdepth: 3

  setup
  wells
  tips
  pipettes
  running_app
  module
  api
  updating_firmware

.. |br| raw:: html

   <br />
