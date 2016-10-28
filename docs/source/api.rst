.. _api:

Developer Interface
===================

.. module:: opentrons

If you are reading this, you might be looking for detailed explanation of the API
which would allow you to build more sophisticated protocols and control the robot
with more precession.

Main Interface
--------------

All protocols are set up, simulated and executed using a Robot class.

.. autoclass:: Robot
   :inherited-members:

The actual protocol is written by issuing commands to instruments, such as ``Move To``,
``Pick Up Tip``, ``Aspirate`` or ``Dispense``.

.. module:: opentrons.instruments.pipette

.. autoclass:: Pipette
   :inherited-members:

