.. _protocol-api:

New Protocol API
================


.. _protocol-api-backcompat:

Backwards Compatibility
-----------------------

.. automodule:: opentrons.protocol_api.back_compat

.. autoclass:: opentrons.protocol_api.back_compat.BCRobot
   :members:

.. autoclass:: opentrons.protocol_api.back_compat.BCInstruments
   :members:

.. autoclass:: opentrons.protocol_api.back_compat.BCLabware
   :members:

.. autoclass:: opentrons.protocol_api.back_compat.BCModules
   :members:


.. _protocol-api-robot:

Robot and Pipette
-----------------
.. module:: opentrons.protocol_api.contexts

.. autoclass:: opentrons.protocol_api.contexts.ProtocolContext
   :members:

.. autoclass:: opentrons.protocol_api.contexts.InstrumentContext
   :members:


.. _protocol-api-labware:

Labware and Wells
-----------------
.. automodule:: opentrons.protocol_api.labware
   :members:


.. _protocol-api-types:

Useful Types and Definitions
----------------------------
.. automodule:: opentrons.types
   :members:


.. _protocol-api-deck-coords:

Deck Coordinates
----------------

The OT2’s base coordinate system is known as deck coordinates. This coordinate system is referenced frequently through the API. It is a right-handed coordinate system always specified in mm, with `(0, 0, 0)` at the front left of the robot. `+x` is to the right, `+y` is to the back, and `+z` is up.

Note that there are technically two `z` axes, one for each pipette mount. In these terms, `z` is the axis of the left pipette mount and `a` is the axis of the right pipette mount. These are obscured by the API’s habit of defining motion commands on a per-pipette basis; the pipettes internally select the correct `z` axis to move. This is also true of the pipette plunger axes, `b` (left) and `c` (right).

When locations are specified to functions like :py:meth:`opentrons.protocol_api.contexts.InstrumentContext.move_to`, in addition to being an instance of :py:class:`opentrons.protocol_api.labware.Well` they may define coordinates in this deck coordinate space. These coordinates can be specified either as a standard python :py:class:`tuple` of three floats, or as an instance of the :py:class:`collections.namedtuple` :py:class:`opentrons.types.Point`, which can be created in the same way.
