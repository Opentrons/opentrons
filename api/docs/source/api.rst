.. _api:

.. testcleanup:: *

  from opentrons import robot
  robot.reset()

API Reference
===============

.. module:: opentrons

Robot
-----

All protocols are set up, simulated and executed using a Robot class.

.. autoclass:: Robot
   :members: connect, home, reset, run, simulate, commands, move_to, containers, actions, disconnect, head_speed, pause, resume, stop, get_warnings, add_instrument, get_mosfet, get_motor

Pipette
-----------------

.. module:: opentrons.instruments

.. autoclass:: Pipette
   :members: aspirate, dispense, mix, delay, drop_tip, blow_out, touch_tip, pick_up_tip, return_tip, calibrate_position, move_to, home, set_speed
