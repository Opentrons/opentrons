.. _api:

Developer Interface
===================

.. module:: opentrons

If you are reading this, you are probably looking for an in-depth explanation of API classes and methods to fully master your protocol development skills. 

Robot
-----

All protocols are set up, simulated and executed using a Robot class.

.. autoclass:: Robot
   :members: connect, home, reset, run, simulate, commands, move_to, containers, actions, disconnect, pause, resume, stop, diagnostics, get_warnings, add_instrument, get_mosfet, get_motor

Protocol Commands
-----------------

The actual protocol is written by issuing commands to instruments, such as ``Move To``,
``Pick Up Tip``, ``Aspirate`` or ``Dispense``.

.. module:: opentrons.instruments.pipette

.. autoclass:: Pipette
   :inherited-members:
