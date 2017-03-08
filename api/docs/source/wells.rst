.. _wells:

========
Wells
========

We spend a fair amount of time organizing and counting wells when writing Python protocols. This section describes the different ways we can access wells and groups of wells.

.. toctree::
    :maxdepth: 3

    wells

.. testsetup:: individualwells

    from opentrons import containers, robot

    robot.reset()
    plate = containers.load('96-flat', 'A1')

**********************

Individual Wells
----------------

When writing a protocol using the API, you will be spending most of your time selecting which wells to transfer liquids to and from.

The OT-One deck and containers are all set up with the same coordinate system - numbered rows and lettered columns.

.. image:: img/well_iteration/Well_Iteration.png

.. testcode:: individualwells
    
    '''
    Examples in this section expect the following
    '''
    from opentrons import containers

    plate = containers.load('96-flat', 'A1')

Wells by Name
^^^^^^^^^^^^^

Once a container is loaded into your protocol, you can easily access the many wells within it using ``wells()`` method. ``wells()`` takes the name of the well as an argument, and will return the well at that location.

.. testcode:: individualwells

    plate.wells('A1')
    plate.wells('H12')

Wells by Index
^^^^^^^^^^^^^^

Wells can be referenced by their "string" name, as demonstrated above. However, they can also be referenced with zero-indexing, with the first well in a container being at position 0.

.. testcode:: individualwells

    plate.wells(0)   # well A1
    plate.wells(95)  # well H12
    plate.wells(-1)  # well H12 (Python let's you do this)

Columns and Rows
^^^^^^^^^^^^^^^^

A container's wells are organized within a series of columns and rows, which are also labelled on standard labware. In the API, columns are given letter names (``'A'`` through ``'H'`` for example) and go left to right, while rows are given numbered names (``'1'`` through ``'8'`` for example) and go from front to back.
You can access a specific row or column by using the ``rows()`` and ``cols()`` methods on a container. These will return all wells within that row or column.

.. testcode:: individualwells

    column = plate.cols('A')
    row = plate.rows('1')

    print('Column "A" has', len(column), 'wells')
    print('Row "1" has', len(row), 'wells')

will print out...

.. testoutput:: individualwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    Column "A" has 12 wells
    Row "1" has 8 wells

The ``rows()`` or ``cols()`` methods can be used in combination with the ``wells()`` method to access wells within that row or column. In the example below, both lines refer to well ``'A1'``.

.. testcode:: individualwells

    plate.cols('A').wells('1')
    plate.rows('1').wells('A')

**********************

.. testsetup:: multiwells

    from opentrons import containers, robot

    robot.reset()
    plate = containers.load('96-flat', 'A1')


Multiple Wells
--------------

If we had to reference each well one at a time, our protocols could get very very long.

When describing a liquid transfer, we can point to groups of wells for the liquid's source and/or destination. Or, we can get a group of wells that we want to loop through.

.. testcode:: multiwells
    
    '''
    Examples in this section expect the following
    '''
    from opentrons import containers

    plate = containers.load('96-flat', 'B1')

Wells
^^^^^

The ``wells()`` method can return a single well, or it can return a list of wells when multiple arguments are passed.

Here is an example or accessing a list of wells, each specified by name:

.. testcode:: multiwells

    w = plate.wells('A1', 'B2', 'C3', 'H12')

    print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <WellSeries: <Well A1><Well B2><Well C3><Well H12>>

Multiple wells can be treated just like a normal Python list, and can be iterated through:

.. testcode:: multiwells

    for w in plate.wells('A1', 'B2', 'C3', 'H12'):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well B2>
    <Well C3>
    <Well H12>

Wells To
^^^^^^^^

Instead of having to list the name of every well, we can also create a range of wells with a start and end point. The first argument is the starting well, and the ``to=`` argument is the last well.

.. testcode:: multiwells
    
    for w in plate.wells('A1', to='H1'):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well B1>
    <Well C1>
    <Well D1>
    <Well E1>
    <Well F1>
    <Well G1>
    <Well H1>

Not only can we get every well between the start and end positions, but we can also set the ``step=`` size. The example below will access every 2nd well between ``'A1'`` and ``'H'``:

.. testcode:: multiwells
    
    for w in plate.wells('A1', to='H1', step=2):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well C1>
    <Well E1>
    <Well G1>

These lists of wells can also move in the reverse direction along your container. For example, setting the ``to=`` argument to a well that comes before the starting position is allowed:

.. testcode:: multiwells
    
    for w in plate.wells('H1', to='A1', step=2):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well H1>
    <Well F1>
    <Well D1>
    <Well B1>

Wells Length
^^^^^^^^^^^^

Another way you can create a list of wells is by specifying the length= of the well list you need, in addition to the starting point. The example below will return eight wells, starting at well ``'A1'``:

.. testcode:: multiwells
    
    for w in plate.wells('A1', length=8):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well B1>
    <Well C1>
    <Well D1>
    <Well E1>
    <Well F1>
    <Well G1>
    <Well H1>

And just like before, we can also set the ``step=`` argument. Except this time the example will be accessing every 3rd well, until a total of eight wells have been found:

.. testcode:: multiwells
    
    for w in plate.wells('A1', length=8, step=3):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well D1>
    <Well G1>
    <Well B2>
    <Well E2>
    <Well H2>
    <Well C3>
    <Well F3>

You can set the step= value to a negative number to move in the reverse direction along the container:

.. testcode:: multiwells
    
    for w in plate.wells('H11', length=8, step=-1):
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well H11>
    <Well G11>
    <Well F11>
    <Well E11>
    <Well D11>
    <Well C11>
    <Well B11>
    <Well A11>

Columns and Rows
^^^^^^^^^^^^^^^^

Columns and Rows
The same arguments described above can be used with ``rows()`` and ``cols()`` to create lists of rows or columns.

Here is an example of iterating through rows:

.. testcode:: multiwells

    for r in plate.rows('2', length=3, step=-2):
        print(r)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <WellSeries: <Well A2><Well B2><Well C2><Well D2><Well E2><Well F2><Well G2><Well H2>>
    <WellSeries: <Well A12><Well B12><Well C12><Well D12><Well E12><Well F12><Well G12><Well H12>>
    <WellSeries: <Well A10><Well B10><Well C10><Well D10><Well E10><Well F10><Well G10><Well H10>>

And here is an example of iterating through columns:

.. testcode:: multiwells

    for c in plate.cols('B', to='F', step=2):
        print(c)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <WellSeries: <Well B1><Well B2><Well B3><Well B4><Well B5><Well B6><Well B7><Well B8><Well B9><Well B10><Well B11><Well B12>>
    <WellSeries: <Well D1><Well D2><Well D3><Well D4><Well D5><Well D6><Well D7><Well D8><Well D9><Well D10><Well D11><Well D12>>
    <WellSeries: <Well F1><Well F2><Well F3><Well F4><Well F5><Well F6><Well F7><Well F8><Well F9><Well F10><Well F11><Well F12>>


Slices
^^^^^^

Containers can also be treating similarly to Python lists, and can therefore handle slices.

.. testcode:: multiwells

    for w in plate[0:8:2]:
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well C1>
    <Well E1>
    <Well G1>

The API's containers are also prepared to take string values for the slice's ``start`` and ``stop`` positions.

.. testcode:: multiwells

    for w in plate['A1':'A2':2]:
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well A1>
    <Well C1>
    <Well E1>
    <Well G1>

.. testcode:: multiwells

    for w in plate.cols['B']['1'::2]:
        print(w)

will print out...

.. testoutput:: multiwells
    :options: -ELLIPSIS, +NORMALIZE_WHITESPACE

    <Well B1>
    <Well B3>
    <Well B5>
    <Well B7>
    <Well B9>
    <Well B11>
