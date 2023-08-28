:og:description: How the Opentrons Python API moves liquids between wells when using complex commands.

.. _complex-source-dest:

************************
Sources and Destinations
************************

Complex commands require both ``source`` and ``dest`` (destination) arguments, in order to move liquid from one well or group of wells to another. This contrasts with the :ref:`v2-atomic-commands` :py:meth:`~.InstrumentContext.aspirate` and :py:meth:`~.InstrumentContext.dispense`, which only operate in a single location. 

This page covers how :py:meth:`~.InstrumentContext.transfer` , :py:meth:`~.InstrumentContext.distribute`, and :py:meth:`~.InstrumentContext.consolidate` operate on source and destination wells. Each method has its own :ref:`restrictions on sources and destinations <source-dest-args>`. They also aspirate and dispense in different :ref:`patterns <complex-transfer-patterns>` that are optimized for their distinct use cases. Finally, you can control the amount of liquid transferred by specifying a :ref:`list of volumes <complex-list-volumes>` rather than a single value.


.. _source-dest-args:

``source`` and ``dest`` Arguments
=================================

:py:meth:`~.InstrumentContext.transfer` is the most versatile complex liquid handling function, having the fewest restrictions on what wells it can operate on. You will most likely want to use transfer commands in a majority of cases.

Certain liquid handling cases focus on moving liquid to or from a single well. :py:meth:`~.InstrumentContext.distribute` limits its source to a single well, while :py:meth:`~.InstrumentContext.consolidate` limits its destination to a single well. Distribute actions also make  changes to tip-handling behavior that improve equal distribution.

These restrictions and behaviors are summarized as follows:

.. list-table::
   :header-rows: 1

   * - Method
     - Accepted wells
   * - ``transfer()``
     - 
       - **Source:** any number of wells
       - **Destination:** any number of wells
       - The larger group of wells must be evenly divisible by the smaller group.
   * - ``distribute()``
     - 
       - **Source:** exactly one well
       - **Destination:** any number of wells
   * - ``consolidate()``
     - 
       - **Source:** any number of wells
       - **Destination:** exactly one well

Singleton wells can be passed by themselves or as a list with one item: ``source=plate['A1']`` and ``source=[plate['A1']]`` are equivalent.
    
The next section covers transfer behavior when specifying sources and destinations of different sizes. However, if they don't meet the even divisibility requirement, the API will raise an error. You can work around such situations by making multiple calls to ``transfer()`` in sequence or by using a :ref:`complex-list-volumes` to skip certain wells.

For distributing and consolidating, the API will not raise an error if you use a list of wells as the argument that is limited to exactly one well. Instead, the API will ignore everything except the first well in the list. For example, the following command will only aspirate from well A1::

    pipette.distribute(
        volume=100,
        source=[plate["A1"], plate["A2"]],  # A2 ignored
        dest=plate.columns()[1],
    )

On the other hand, a transfer command with the same arguments would aspirate from both A1 and A2. The next section examines the exact order of aspiration and dispensing for all three methods.

.. _complex-transfer-patterns:

Transfer Patterns
=================


.. _complex-list-volumes:

List of Volumes
===============