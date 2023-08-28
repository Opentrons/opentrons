:og:description: How the Opentrons Python API moves liquids between wells when using complex commands.

.. _complex-source-dest:

************************
Sources and Destinations
************************

Complex commands require both ``source`` and ``dest`` (destination) arguments, in order to move liquid from one well or group of wells to another. This contrasts with the :ref:`v2-atomic-commands` :py:meth:`aspirate` and :py:meth:`dispense`, which only operate in a single location. 

This page covers how :py:meth:`~.InstrumentContext.transfer` , :py:meth:`~.InstrumentContext.distribute`, and :py:meth:`~.InstrumentContext.consolidate` operate on source and destination wells. Each method has its own restrictions on sources and destinations, covered in :ref:`source-dest-args` below. They may also aspirate and dispense in different patterns even when given the same source and destination arguments. Finally, you can affect how much liquid gets transferred by specifying a list of volumes rather than a single value.


.. _source-dest-args:

``source`` and ``dest`` Arguments
=================================


.. _complex-transfer-patterns:

Transfer Patterns
=================


.. _complex-list-volumes:

List of Volumes
===============