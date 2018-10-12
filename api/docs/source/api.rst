.. _api:


API Reference
===============

.. module:: opentrons

If you are reading this, you are probably looking for an in-depth explanation of API classes and methods to fully master your protocol development skills.

Robot
----------------

All protocols are set up, simulated and executed using a Robot class.

.. autoclass:: opentrons.legacy_api.robot.Robot
   :members: connect, home, reset, run, simulate, commands, move_to, disconnect, head_speed, pause, resume, stop, get_warnings, add_instrument, get_motor

Pipette
-----------------

.. module:: opentrons.legacy_api.instruments

.. autoclass:: opentrons.legacy_api.instruments.Pipette
   :members: aspirate, dispense, mix, delay, drop_tip, blow_out, touch_tip, pick_up_tip, return_tip, move_to, home, set_flow_rate
