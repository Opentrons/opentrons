:og:description: How the Opentrons Python API moves liquids between wells when using complex commands.

.. _complex-source-dest:

************************
Sources and Destinations
************************

Complex commands require both ``source`` and ``dest`` (destination) arguments, in order to move liquid from one well or group of wells to another. This contrasts with the :ref:`v2-atomic-commands` :py:meth:`~.InstrumentContext.aspirate` and :py:meth:`~.InstrumentContext.dispense`, which only operate in a single location.

For example, a simple transfer between two wells on a plate could specify::

    pipette.transfer(
        volume=100,
        source=plate['A1'],
        dest=plate['A2'],
    )

.. versionadded:: 2.0

This page covers how :py:meth:`~.InstrumentContext.transfer` , :py:meth:`~.InstrumentContext.distribute`, and :py:meth:`~.InstrumentContext.consolidate` operate on source and destination wells. Each method has its own :ref:`restrictions on sources and destinations <source-dest-args>`. They also aspirate and dispense in different :ref:`patterns <complex-transfer-patterns>` that are optimized for their distinct use cases. Finally, you can control the amount of liquid transferred by specifying a :ref:`list of volumes <complex-list-volumes>` rather than a single value.


.. _source-dest-args:

``source`` and ``dest`` Arguments
=================================

:py:meth:`~.InstrumentContext.transfer` is the most versatile complex liquid handling function, having the fewest restrictions on what wells it can operate on. You will most likely want to use transfer commands in a majority of cases.

Certain liquid handling cases focus on moving liquid to or from a single well. :py:meth:`~.InstrumentContext.distribute` limits its source to a single well, while :py:meth:`~.InstrumentContext.consolidate` limits its destination to a single well. Distribute actions also make  changes to tip-handling behavior that improve equal distribution.

These restrictions and behaviors are summarized as follows:

+-------------------+----------------------------------------------------+---------------------+
| Method            | Valid sources                                      | Valid destinations  |
+===================+====================================================+=====================+
| ``transfer()``    | Any number of wells                                | Any number of wells |
+                   +----------------------------------------------------+---------------------+
|                   | The larger group of wells must be evenly divisible by the smaller group. |
+-------------------+----------------------------------------------------+---------------------+
| ``distribute()``  | Exactly one well                                   | Any number of wells |
+-------------------+----------------------------------------------------+---------------------+
| ``consolidate()`` | Any number of wells                                | Exactly one well    |
+-------------------+----------------------------------------------------+---------------------+

Singleton wells can be passed by themselves or as a list with one item: ``source=plate['A1']`` and ``source=[plate['A1']]`` are equivalent.
    
The section on :ref:`many-to-many transfers <many-to-many>` below covers how ``transfer()`` works when specifying sources and destinations of different sizes. However, if they don't meet the even divisibility requirement, the API will raise an error. You can work around such situations by making multiple calls to ``transfer()`` in sequence or by using a :ref:`complex-list-volumes` to skip certain wells.

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

.. figure:: ../../img/complex_commands/robot_consolidate.png
    :name: Transfer
    :scale: 35%
    :align: center
    
    This consolidate aspirates three times and dispenses one time.
    
.. note::
    By default all three commands begin by picking up a tip, and conclude by dropping a tip. In general, don't call :py:meth:`.pick_up_tip` just before a complex command, or the API will raise an error. You can override this behavior with :ref:`complex_params`, by setting ``new_tip="never"``.


.. _many-to-many:

Many-to-Many
------------

``transfer()`` lets you specify both ``source`` and ``dest`` arguments that contain multiple wells. This section covers how the method determines which wells to aspirate from and dispense to in these cases.

When the source and destination both contain the same number of wells, the mapping between wells is straightforward. You can imagine writing out the two lists one above each other, with each unique well in the source list paired to a unique well in the destination list. For example, here is the code for using one row as the source and another row as the destination, and the resulting correspondence between wells::

    pipette.transfer(
        volume=50,
        source=plate.rows()[0],
        dest=plate.rows()[1],
    )

.. list-table::
    :stub-columns: 1

    * - Source
      - A1
      - A2
      - A3
      - A4
      - A5
      - A6
      - A7
      - A8
      - A9
      - A10
      - A11
      - A12
    * - Destination
      - B1
      - B2
      - B3
      - B4
      - B5
      - B6
      - B7
      - B8
      - B9
      - B10
      - B11
      - B12

There's no requirement that the source and destination lists be mutually exclusive. In fact, this command adapted from the :ref:`tutorial` deliberately uses slices of the same list, with the effect that each aspiration happens in the same location as the previous dispense::

    row = plate.rows()[0]
    pipette.transfer(
        volume=100, 
        source=row[:11], 
        dest=row[1:],
    )

.. list-table::
    :stub-columns: 1

    * - Source
      - A1
      - A2
      - A3
      - A4
      - A5
      - A6
      - A7
      - A8
      - A9
      - A10
      - A11
    * - Destination
      - A2
      - A3
      - A4
      - A5
      - A6
      - A7
      - A8
      - A9
      - A10
      - A11
      - A12
      
When the source and destination lists contain different numbers of wells, ``transfer()`` will always aspirate and dispense as many times as there are wells in the *longer* list. The shorter list will be "stretched" to cover the length of the longer list. Here is an example of transferring from 3 wells to a full row of 12 rows:: 

    pipette.transfer(
        volume=50,
        source=[plate["A1"], plate["A2"], plate["A3"]],
        dest=plate.rows()[1],
    )

.. list-table::
    :stub-columns: 1

    * - Source
      - A1
      - A1
      - A1
      - A1
      - A2
      - A2
      - A2
      - A2
      - A3
      - A3
      - A3
      - A3
    * - Destination
      - B1
      - B2
      - B3
      - B4
      - B5
      - B6
      - B7
      - B8
      - B9
      - B10
      - B11
      - B12

This is why the longer list must be evenly divisible by the shorter list. If we changed the destination in this example to a column instead of a row, the API will raise an error, because 8 is not evenly divisible by 3::

    pipette.transfer(
        volume=50,
        source=[plate["A1"], plate["A2"], plate["A3"]],
        dest=plate.columns()[3],  # labware column 4
    )
    # error: source and destination lists must be divisible
    
The API raises this error rather than presuming which wells to aspirate from three times and which only two times. If you wanted to aspirate three times from A1, three times from A2, and three times from A3, use multiple ``transfer()`` commands in sequence::

    pipette.transfer(50, plate["A1"], plate.columns()[3][:3])
    pipette.transfer(50, plate["A2"], plate.columns()[3][3:6])
    pipette.transfer(50, plate["A3"], plate.columns()[3][6:])
    
Finally, be aware of the ordering of source and destination lists when constructing them with :ref:`well-accessor-methods`. For example, at first glance this code may appear to take liquid from each well in the first row of a plate and move it to all the wells in the same column::

    pipette.transfer(
        volume=20,
        source=plate.rows()[0],
        dest=plate.rows()[1:],
    )
    
However, because the well ordering of :py:meth:`Labware.rows` goes *across* wells instead of *down* wells, liquid from A1 will be dispensed in B1–B7, liquid from A2 will be dispensed in B8–C2, etc. The intended task is probably better accomplished by repeating transfers in a ``for`` loop::

    for i in range(12):        
        pipette.transfer(
            volume=20,
            source=plate.rows()[0][i],
            dest=plate.columns()[i][1:],
        )

Here the repeat index ``i`` picks out:

    - The individual well in the first row, for the source.
    - The corresponding column, which is sliced to form the destination.

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