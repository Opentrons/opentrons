.. _hc-api-reference:

Hardware Control Reference
==========================

.. _hc-api-init:

Top Level
---------

The definitions here can be reached by importing ``opentrons.hardware_control`` and nothing else.

.. module:: opentrons.hardware_control

.. _hc-api-api-class:

Main API Class
--------------

This is the main class used by the API.

.. module:: opentrons.hardware_control.api

.. autoclass:: opentrons.hardware_control.api.API
   :members:


.. _hc-api-thread-manager:

ThreadManager
-------------

The ThreadManager wraps the hardware controller and runs it in another thread, which lets some things
run in the background and allows you to run your own asyncio loop in the main thread without being blocked
by Smoothie communication.

.. module:: opentrons.hardware_control.thread_manager

.. autoclass:: opentrons.hardware_control.thread_manager.ThreadManager
   :members:

.. _hc-api-modules:

Modules
-------

The module classes obey a framework. There are individual controller classes for each kind of module.

Top Level
+++++++++

These things may be imported by importing ``opentrons.hardware_control.modules``.

.. module:: opentrons.hardware_control.modules

Abstract Base Class
+++++++++++++++++++

All module components have interfaces that match the abstract base class defined here.

.. module:: opentrons.hardware_control.modules.mod_abc

.. autoclass:: opentrons.hardware_control.modules.mod_abc.AbstractModule
    :members:

Temperature Module
++++++++++++++++++

.. module:: opentrons.hardware_control.modules.tempdeck


.. autoclass:: opentrons.hardware_control.modules.tempdeck.TempDeck
    :members:

Magnetic Module
+++++++++++++++

.. module:: opentrons.hardware_control.modules.magdeck

.. autoclass:: opentrons.hardware_control.modules.magdeck.MagDeck
    :members:

Thermocycler
++++++++++++

.. module:: opentrons.hardware_control.modules.thermocycler

.. autoclass:: opentrons.hardware_control.modules.thermocycler.Thermocycler
    :members:
