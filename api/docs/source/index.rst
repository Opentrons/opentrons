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

Work Flow
---------

Writing protocols in Python requires some up-front design before seeing your liquid handling automation in action. At a high-level, writing protocols with the Opentrons API looks like:

1) Write a Python protocol
2) Test your code for errors
3) Repeat 1 & 2 until ready to run
4) Load protocol into calibration UI
5) Save positions of everything on your robot
6) Run the protocol and monitor progress

**********************

.. testsetup::  helloworld

    from opentrons import containers, instruments, robot

    robot.reset()

    tiprack = containers.load('tiprack-200ul', 'A1')
    plate = containers.load('96-flat', 'B1')

    pipette = instruments.Pipette(axis='b', max_volume=200)


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
