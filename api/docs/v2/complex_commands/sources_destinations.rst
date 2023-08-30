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

Each complex command uses a different pattern of aspiration and dispensing. In addition, when you provide multiple wells as both the source and destination for ``transfer()``, it maps the source list onto the destination list in a certain way. This section covers both of these patterns.

Aspirating and Dispensing
-------------------------

``transfer()`` always alternates between aspirating and dispensing, regardless of how many wells are in the source and destination. Its default behavior is:

    1. Pick up a tip.
    2. Aspirate from the first source well.
    3. Dispense in the first destination well.
    4. Repeat the pattern of aspirating and dispensing, as needed.
    5. Drop the tip in the trash.
    
.. figure:: ../../img/complex_commands/transfer.png
    :name: Transfer
    :scale: 35%
    :align: center
    
    This transfer aspirates six times and dispenses six times.
    
``distribute()`` always fills the tip with as few aspirations as possible, and then dispenses to the destination wells in order. Its default behavior is:

    1. Pick up a tip.
    2. Aspirate enough to fill the destination wells, or as much will fit in the tip, whichever is smaller. This aspirate includes a disposal volume.
    3. Dispense in the first destination well.
    4. Continue to dispense in destination wells.
    5. Drop the tip in the trash.
    
.. figure:: ../../img/complex_commands/robot_distribute.png
    :name: Transfer
    :scale: 35%
    :align: center
    
    This distribute aspirates one time and dispenses three times.
    
``consolidate()`` aspirates multiple times in a row, and then dispenses as few times as possible in the destination well. Its default behavior is:

    1. Pick up a tip.
    2. Aspirate from the first source well.
    3. Continue aspirating from source wells.
    4. Dispense in the destination well.
    5. Drop the tip in the trash.    

.. figure:: ../../img/complex_commands/robote_consolidate.png
    :name: Transfer
    :scale: 35%
    :align: center
    
    This transfer aspirates three times and dispenses one time.
    
.. note::
    By default all three commands begin by picking up a tip, and conclude by dropping a tip. In general, don't call :py:meth:`.pick_up_tip` just before a complex command, or the API will raise an error. You can override this behavior with :ref:`complex_params`, by setting ``new_tip="never"``.

Many-to-Many
------------


.. _complex-tip-refilling:

Tip Refilling
-------------


Optimizing Patterns
-------------------

Choosing the right complex command optimizes gantry movement and ultimately can save time in your protocol. For example, say you want to take liquid from a reservoir and put 50 µL in each well of the first row of a plate. You could use ``transfer()``, like this::

    pipette.transfer(
        volume=50,
        source=reservoir["A1"],
        destination=plate.rows()[0],
    )
    
This will produce 12 aspirate steps and 12 dispense steps. The steps alternate, with the pipette moving back and forth between the reservoir and plate each time. Using ``distribute()`` with the same arguments is more optimal in this scenario::

    pipette.distribute(
        volume=50,
        source=reservoir["A1"],
        destination=plate.rows()[0],
    )
    
This will produce *just 1* aspirate step and 12 dispense steps (when using a 1000 µL pipette). The pipette will aspirate enough liquid to fill all the wells, plus a disposal volume. Then it will move to A1 of the plate, dispense, move the short distance to A2, dispense, and so on. This greatly reduces gantry movement and the time to perform this action. And even if you're using a smaller pipette, ``distribute()`` will fill the pipette, dispense as many times as possible, and only then return to the reservoir to refill.
 

.. _complex-list-volumes:

List of Volumes
===============