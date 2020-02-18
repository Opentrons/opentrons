.. _api:


API Reference
==============

.. module:: opentrons

If you are reading this, you are probably looking for an in-depth explanation of API classes and methods to fully master your protocol development skills.

Robot
-----

All protocols are set up, simulated and executed using a Robot class.

.. autoclass:: opentrons.legacy_api.robot.Robot
   :members: connect, home, reset, commands, move_to, disconnect, head_speed, pause, resume, stop, get_warnings, add_instrument

Pipette
-------

.. module:: opentrons.legacy_api.instruments

.. autoclass:: opentrons.legacy_api.instruments.Pipette
   :members: aspirate, dispense, mix, delay, drop_tip, blow_out, touch_tip, pick_up_tip, return_tip, transfer, distribute, consolidate, move_to, home, set_flow_rate

Placeable
---------

.. autoclass:: opentrons.legacy_api.containers.placeable.Placeable
   :members: from_center, top, bottom, center


.. _simulating-ref:

Simulation
----------

.. automodule:: opentrons.simulate
   :exclude-members: CommandScraper, AccumulatingHandler, get_protocol_api, bundle_from_sim, main
   :members:
