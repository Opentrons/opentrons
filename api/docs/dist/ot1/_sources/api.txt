.. _api:

API Reference
===============

.. module:: opentrons

If you are reading this, you are probably looking for an in-depth explanation of API classes and methods to fully master your protocol development skills. 

Robot
-----

All protocols are set up, simulated and executed using a Robot class.

.. autoclass:: Robot
   :members: connect, home, reset, commands, move_to, containers, actions, disconnect, head_speed, pause, resume, stop, diagnostics, get_warnings, add_instrument, get_mosfet, get_motor

Pipette
-----------------

.. module:: opentrons.instruments

.. autoclass:: Pipette
   :members: aspirate, dispense, mix, delay, drop_tip, blow_out, touch_tip, pick_up_tip, return_tip, calibrate, calibrate_position, move_to, home, set_speed
