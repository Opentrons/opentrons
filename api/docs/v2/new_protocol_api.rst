.. _protocol-api-reference:

API Version 2 Reference
=======================

.. _protocol_api-protocols-and-instruments:

Protocols and Instruments
-------------------------
.. module:: opentrons.protocol_api.contexts

.. autoclass:: opentrons.protocol_api.contexts.ProtocolContext
   :members:
   :exclude-members: location_cache, _hw_manager

.. autoclass:: opentrons.protocol_api.contexts.InstrumentContext
   :members:

.. _protocol-api-labware:

Labware and Wells
-----------------
.. automodule:: opentrons.protocol_api.labware
   :members:
   :exclude-members: _depth, _width, _length

.. _protocol-api-modules:

Modules
-------
.. autoclass:: opentrons.protocol_api.contexts.TemperatureModuleContext
   :members:
   :exclude-members: start_set_temperature
   :inherited-members:

.. autoclass:: opentrons.protocol_api.contexts.MagneticModuleContext
   :members:
   :inherited-members:

.. autoclass:: opentrons.protocol_api.contexts.ThermocyclerContext
   :members:
   :exclude-members: total_step_count, current_cycle_index, total_cycle_count, hold_time, ramp_rate, current_step_index, flag_unsafe_move
   :inherited-members:
   
.. autoclass:: opentrons.protocol_api.contexts.HeaterShakerContext
   :members:
   :inherited-members:


.. _protocol-api-types:

Useful Types and Definitions
----------------------------
.. automodule:: opentrons.types
   :members:


Executing and Simulating Protocols
----------------------------------

.. automodule:: opentrons.execute
   :members:

.. automodule:: opentrons.simulate
   :members:


