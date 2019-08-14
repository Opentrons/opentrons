.. _new-labware:

########
Labware
########


The labware section informs the protocol context what labware is present on the robot’s deck. In this section, you define the tip racks, well plates, troughs, tubes, or anything else you’ve put on the deck.

Each labware is given a name (e.g. ``'corning_96_wellplate_360ul_flat'``), and the slot on the robot it will be placed (e.g. ``'2'``). The first place to look for the names of labware should always be the `Opentrons Labware Library <https://labware.opentrons.com>`_, where Opentrons maintains a database of labwares, their load names, what they look like, manufacturer part numbers, and more. In this example, we’ll use ``'corning_96_wellplate_360ul_flat'`` (`an ANSI standard 96-well plate <https://labware.opentrons.com/corning_96_wellplate_360ul_flat>`_) and ``'opentrons_96_tiprack_300ul'`` (`the Opentrons standard 300 µL tiprack <https://labware.opentrons.com/opentrons_96_tiprack_300ul>`_).

From the example given on the home page, the "labware" section looked like:

.. code-block:: python

    plate = protocol.load_labware('corning_96_wellplate_360ul_flat', '2')
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', '1')


and informed the protocol context that the deck contains a 300 µL tiprack in slot 1 and a 96 well plate in slot 2.

Labware is loaded into a protocol using :py:meth:`.ProtocolContext.load_labware`, which returns a
:py:class:`opentrons.protocol_api.labware.Labware` object. You'll never create one of these objects
directly, only store them in variables from the return value of :py:meth:`.ProtocolContext.load_labware`.

.. _new-well-access:

**************************
Accessing Wells in Labware
**************************

Well Ordering
^^^^^^^^^^^^^

When writing a protocol using the API, you will need to select which wells to
transfer liquids to and from.

Rows of wells (see image below) on a labware are typically labeled with capital letters starting with ``'A'``;
for instance, an 8x12 96 well plate will have rows ``'A'`` through ``'H'``.

Columns of wells (see image below) on a labware are typically labeled with numerical indices starting with ``'1'``;
for instance, an 8x12 96 well plate will have columns ``'1'`` through ``'12'``.

For all well accessing functions, the starting well will always be at the top left corner of the labware.
The ending well will be in the bottom right, see the diagram below for further explanation.

.. image:: ../img/well_iteration/Well_Iteration.png

.. code-block:: python

    '''
    Examples in this section expect the following
    '''
    def run(protocol):

        plate = protocol.load_labware('corning_24_wellplate_3.4ml_flat', slot='1')


Accessor Methods
^^^^^^^^^^^^^^^^
As part of API Version 2, we wanted to allow users to utilize python's data structures more easily and as intended.
That is why all of our labware accessor methods return either a dictionary, list or an individual Well object.

The table below lists out the different methods available to you and their differences.

+-------------------------------------+-------------------------------------------------------------------------------------------------------------------+
|   Method Name                       |         Returns                                                                                                   |
+=====================================+===================================================================================================================+
| :py:meth:`.Labware.wells`           | List of all wells, i.e. ``[labware:A1, labware:B1, labware:C1...]``                                               |
+-------------------------------------+-------------------------------------------------------------------------------------------------------------------+
| :py:meth:`.Labware.rows`            | List of a list ordered by row, i.e ``[[labware:A1, labware:A2...], [labware:B1, labware:B2..]]``                  |
+-------------------------------------+-------------------------------------------------------------------------------------------------------------------+
| :py:meth:`.Labware.columns`         | List of a list ordered by column, i.e. ``[[labware:A1, labware:B1..], [labware:A2, labware:B2..]]``               |
+-------------------------------------+-------------------------------------------------------------------------------------------------------------------+
| :py:meth:`.Labware.wells_by_name`   | Dictionary with well names as keys, i.e. ``{'A1': labware:A1, 'B1': labware:B1}``                                 |
+-------------------------------------+-------------------------------------------------------------------------------------------------------------------+
| :py:meth:`.Labware.rows_by_name`    | Dictionary with row names as keys, i.e. ``{'A': [labware:A1, labware:A2..], 'B': [labware:B1, labware:B2]}``      |
+-------------------------------------+-------------------------------------------------------------------------------------------------------------------+
| :py:meth:`.Labware.columns_by_name` | Dictionary with column names as keys, i.e. ``{'1': [labware:A1, labware:B1..], '2': [labware:A2, labware:B2..]}`` |
+-------------------------------------+-------------------------------------------------------------------------------------------------------------------+

Accessing Individual Wells
^^^^^^^^^^^^^^^^^^^^^^^^^^

Dictionary Access
-----------------
Once a labware is loaded into your protocol, you can easily access the many
wells within it by using dictionary indexing. If a well does not exist in this labware,
you will receive a ``KeyError``. This is equivalent to using the return value of
:py:meth:`.Labware.wells_by_name`:

.. code-block:: python

    a1 = plate['A1']
    d6 = plate.wells_by_name()['D6']

List Access From ``wells``
--------------------------
Wells can be referenced by their "string" name, as demonstrated above.
However, they can also be referenced with zero-indexing, with the first well in
a labware being at position 0.

.. code-block:: python

    plate.wells()[0]   # well A1
    plate.wells()[23]  # well D6

.. tip::

    You may find well names (e.g. ``B3``) to be easier to reason with,
    especially with irregular labware (e.g.
    ``opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical``
    (`Labware Library <https://labware.opentrons.com/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical>`_).
    Whichever well access method you use, your protocol will be most maintainable
    if you pick one method and don't use the other one.

Accessing Groups of Wells
^^^^^^^^^^^^^^^^^^^^^^^^^
If we had to reference each well one at a time, our protocols could get very
long.

When describing a liquid transfer, we can point to groups of wells for the
liquid's source and/or destination. Or, we can get a group of wells and loop
(or iterate) through them.

A labware's wells are organized within a series of columns and rows, which are
also labelled on standard labware. In the API, rows are given letter names
(``'A'`` through ``'D'`` for example) and go left to right, while columns are
given numbered names (``'1'`` through ``'6'`` for example) and go from front to
back.

You can access a specific row or column by using the
:py:meth:`.Labware.rows_by_name` and :py:meth:`.Labware.columns_by_name` methods
on a labware. These methods both return a dictionary with the row or column name
as the index:

.. code-block:: python

    row_dict = plate.rows_by_name()['A']
    row_list = plate.rows()[0] # equivalent to the line above
    column_dict = plate.columns_by_name()['1']
    column_list = plate.columns()[0] # equivalent to the line above

    print('Column "1" has', len(column_dict), 'wells')
    print('Row "A" has', len(row_dict), 'wells')

will print out...

.. code-block:: python

    Column "1" has 4 wells
    Row "A" has 6 wells

So, since our methods return either lists or dictionaries, you can iterate through
them as you would regular python data structures.

For example, if I wanted to access the individual wells of row 'A' in my well plate, I could simply do:

.. code-block:: python

    for well in plate.rows()[0]:
        print(well)

or,

.. code-block:: python

    for well_obj in plate.rows_by_name()['A'].values():
        print(well_obj)

and it will return the individual well objects in row A.


.. _v2-location-within-wells:

********************************
Specifying Position Within Wells
********************************

The functions listed above (in the :ref:`new-well-access` section) return objects
(or lists, lists of lists, dictionaries, or dictionaries of lists of objects)
representing wells. These are :py:class:`opentrons.protocol_api.labware.Well`
objects. Similar to the :py:class:`.Labware` objects, you'll never create one of
these directly - only handle them as the return values of various methods.
:py:class:`.Well` objects have some useful methods on them, however, which allow
you to more closely specify the location to which the robot should move *inside*
a given well.

Each of these methods returns an object called a :py:class:`opentrons.types.Location`,
which encapsulates a position in deck coordinates (see :ref:`protocol-api-deck-coords`)
and a well with which it is associated. This lets you do further manipulations on the
positions returned by these methods. All :py:class:`.InstrumentContext` methods that
involve positions accept these :py:class:`.Location` objects.


Position Modifiers
^^^^^^^^^^^^^^^^^^

Top
---

The method :py:meth:`.Well.top` returns a position at the top center of the well. This
is a good position to use for :ref:`new-blow-out` or any other operation where you
don't want to be contacting the liquid. In addition, :py:meth:`.Well.top` takes an
optional argument ``z``, which is a distance in mm to move relative to the top
vertically (positive numbers move up, and negative numbers move down):

.. code-block:: python

   plate['A1'].top()     # This is the top center of the well
   plate['A1'].top(z=1)  # This is 1mm above the top center of the well
   plate['A1'].top(z=-1) # This is 1mm below the top center of the well

Bottom
------

The method :py:meth:`.Well.bottom` returns a position at the bottom center of the
well. This could be a good position to start at when considering where to aspirate,
or any other operation where you want to be contacting the liquid. In addition,
:py:meth:`.Well.bottom` takes an optional argument ``z``, which is a distance in mm
to move relative to the bottom vertically (positive numbers move up, and negative
numbers move down):

.. code-block:: python

   plate['A1'].bottom()     # This is the bottom center of the well
   plate['A1'].bottom(z=1)  # This is 1mm above the bottom center of the well
   plate['A1'].bottom(z=-1) # This is 1mm below the bottom center of the well.
                            # this may be dangerous!


.. warning::

    Negative ``z`` arguments to :py:meth:`.Well.bottom` may cause the tip to
    collide with the bottom of the well. The OT-2 has no sensors to detect this,
    and if it happens, the robot will be too high in z for the rest of the
    protocol.


.. note::

   If you are using this to change the position at which the robot does
   :ref:`new-aspirate` or :ref:`new-dispense` throughout the protocol, consider
   setting the default aspirate or dispense offset with
   :py:attr:`.InstrumentContext.well_bottom_clearance`
   (see :ref:`new-default-op-positions`).

Center
------

The method :py:meth:`.Well.center` returns a position centered in the well both
vertically and horizontally. This can be a good place to start for precise
control of positions within the well for unusual or custom labware.

.. code-block:: python

   plate['A1'].center() # This is the vertical and horizontal center of the well

Manipulating Positions
^^^^^^^^^^^^^^^^^^^^^^

The objects returned by the position modifier functions are all instances of
:py:class:`opentrons.types.Location`, which are
`named tuples <https://docs.python.org/3/library/collections.html#collections.namedtuple>`_
representing the combination of a point in space (another named tuple) and
a reference to the associated :py:class:`.Well` (or :py:class:`.Labware`, or
slot name, depending on context).

To further change positions, you can use :py:meth:`.Location.move`, which
lets you move the Location. This function takes a single argument, ``point``,
which should be a :py:class:`opentrons.types.Point`. This is a named tuple
with elements ``x``, ``y``, and ``z``, representing a 3 dimensional point.

To move a location, you create a :py:class:`.types.Point` representing a
3d offset and give it to :py:meth:`.Location.move`:

.. code-block:: python

   from opentrons import types

   def run(protocol):
        plate = protocol.load_labware(
           'corning_24_wellplate_3.4ml_flat', slot='1')
        plate['A1'].center().move(
           types.Point(x=1, y=1, z=1)) # 1mm up, to the right, and towards the
                                       # back of the robot

`
