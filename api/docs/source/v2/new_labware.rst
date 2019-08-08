########
Labware
########


The labware section informs the protocol context what labware is present on the robot’s deck. In this section, you define the tip racks, well plates, troughs, tubes, or anything else you’ve put on the deck.

Each labware is given a name (ex: ``'corning_96_wellplate_360ul_flat'``), and the slot on the robot it will be placed (ex: ``'2'``). A list of valid labware can be found in :ref:`protocol-api-valid-labware`. In this example, we’ll use ``'corning_96_wellplate_360ul_flat'`` (an ANSI standard 96-well plate) and ``'opentrons_96_tiprack_300ul'``, the Opentrons standard 300 µL tiprack.

From the example given on the home page, the "labware" section looked like:

.. code-block:: python

    plate = protocol_context.load_labware('corning_96_wellplate_360ul_flat', '2')
    tiprack = protocol_context.load_labware('opentrons_96_tiprack_300ul', '1')


and informed the protocol context that the deck contains a 300 µL tiprack in slot 1 and a 96 well plate in slot 2.

More complete documentation on labware methods (such as the ``.wells()`` method) is available in :ref:`protocol-api-labware`.

.. _protocol-api-valid-labware:

To see the labware names that can be loaded with
:py:meth:`.ProtocolContext.load_labware`, please see the
`Opentrons Labware Library`__

__ https://labware.opentrons.com

**************************
Accessing Wells in Labware
**************************

Well Ordering
^^^^^^^^^^^^^^

When writing a protocol using the API, you will need to select which wells to
transfer liquids to and from.


- Lettered rows ``['A']-['END']``
- Numbered columns ``['1']-['END']``.

For all well accessing functions, the starting well will always be at the top left corner of the labware.
The ending well will be in the bottom right, see the diagram below for further explanation.

.. image:: ../img/well_iteration/Well_Iteration.png

.. code-block:: python

    '''
    Examples in this section expect the following
    '''
    def run(protocol_context):

        plate = protocol_context.load_labware('corning_24_wellplate_3.4ml_flat', slot='1')


Accessor Methods
^^^^^^^^^^^^^^^^
As part of API Version 2, we wanted to allow users to utilize python's data structures more easily and as intended.
That is why all of our labware accessor methods return either a dictionary, list or an individual Well object.

The table below lists out the different methods available to you and their differences.

+------------------------+---------------------------------------------------------------------------------------------------------------+
|   Method Name          |         Returns                                                                                               |
+========================+===============================================================================================================+
|   ``wells()``          | List of all wells, i.e. [labware:A1, labware:B1, labware:C1...]                                               |
+------------------------+---------------------------------------------------------------------------------------------------------------+
|   ``rows()``           | List of a list ordered by row, i.e [[labware:A1, labware:A2...], [labware:B1, labware:B2..]]                  |
+------------------------+---------------------------------------------------------------------------------------------------------------+
| ``columns()``          | List of a list ordered by column, i.e. [[labware:A1, labware:B1..], [labware:A2, labware:B2..]]               |
+------------------------+---------------------------------------------------------------------------------------------------------------+
| ``wells_by_name()``    | Dictionary with well names as keys, i.e. {'A1': labware:A1, 'B1': labware:B1}                                 |
+------------------------+---------------------------------------------------------------------------------------------------------------+
| ``rows_by_name()``     | Dictionary with row names as keys, i.e. {'A': [labware:A1, labware:A2..], 'B': [labware:B1, labware:B2]}      |
+------------------------+---------------------------------------------------------------------------------------------------------------+
| ``columns_by_name()``  | Dictionary with column names as keys, i.e. {'1': [labware:A1, labware:B1..], '2': [labware:A2, labware:B2..]} |
+------------------------+---------------------------------------------------------------------------------------------------------------+

Accessing Individual Wells
^^^^^^^^^^^^^^^^^^^^^^^^^^

Individual Well Dictionary access into a labware
------------------------------------------------
Once a labware is loaded into your protocol, you can easily access the many
wells within it by using dictionary indexing. If a well does not exist in this labware,
you will receive a `KeyError`.

.. code-block:: python

    a1 = plate['A1']
    d6 = plate.wells_by_name()['D6']

Individual Well List access into a labware
------------------------------------------
Wells can be referenced by their "string" name, as demonstrated above.
However, they can also be referenced with zero-indexing, with the first well in
a labware being at position 0.

.. code-block:: python

    plate.wells()[0]   # well A1
    plate.wells()[23]  # well D6

.. Tip::
    You may find well names (e.g. ``B3``) to be easier to reason with,
    especially with irregular labware (e.g.
    ``opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical``). Whichever well
    access method you use, your protocol will be most maintainable if you pick
    one method and don't use the other one.

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

You can access a specific row or column by using the ``rows_by_name()`` and
``columns_by_name()`` methods on a labware. These methods both return a dictionary
with the row or column name as the index

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

or..

.. code-block:: python

    for well_obj in plate.rows_by_name()['A'].values():
        print(well_obj)

and it will return the individual well objects in row A.


*****************************
Invalid Labware Load Names
*****************************

Once you make the switch to API Version 2, you will no longer be able to use definition names from the opentrons standard labware in API Version 1.

For your reference, a labware map was made and can be found at :ref:`deprecated_labware`.
