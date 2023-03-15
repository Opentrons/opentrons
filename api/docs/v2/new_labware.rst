.. _new-labware:

#######
Labware
#######


When writing a protocol, you must inform the Protocol API about the labware you will be placing on the OT-2's deck.

When you load labware, you specify the name of the labware (e.g. ``corning_96_wellplate_360ul_flat``), and the slot on the OT-2's deck in which it will be placed (e.g. ``2``). The first place to look for the names of labware should always be the `Opentrons Labware Library <https://labware.opentrons.com>`_, where Opentrons maintains a database of labware, their names in the API, what they look like, manufacturer part numbers, and more. In this example, we’ll use ``'corning_96_wellplate_360ul_flat'`` (`an ANSI standard 96-well plate <https://labware.opentrons.com/corning_96_wellplate_360ul_flat>`_) and ``'opentrons_96_tiprack_300ul'`` (`the Opentrons standard 300 µL tiprack <https://labware.opentrons.com/opentrons_96_tiprack_300ul>`_).

In the example given in the :ref:`overview-section-v2` section, we loaded labware like this:

.. code-block:: python

    plate = protocol.load_labware('corning_96_wellplate_360ul_flat', '2')
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', '1')


which informed the protocol context that the deck contains a 300 µL tiprack in slot 1 and a 96 well plate in slot 2.

A third optional argument can be used to give the labware a nickname to be displayed in the Opentrons App.

.. code-block:: python

    plate = protocol.load_labware('corning_96_wellplate_360ul_flat',
                                  location='2',
                                  label='any-name-you-want')

Labware is loaded into a protocol using :py:meth:`.ProtocolContext.load_labware`, which returns
:py:class:`opentrons.protocol_api.labware.Labware` object.

***************
Finding Labware
***************

Default Labware
^^^^^^^^^^^^^^^

The OT-2 has a set of labware well-supported by Opentrons defined internally. This set of labware is always available to protocols. This labware can be found on the `Opentrons Labware Library <https://labware.opentrons.com>`_. You can copy the load names that should be passed to ``protocol.load_labware`` statements to get the correct definitions.


.. _v2-custom-labware:

Custom Labware
^^^^^^^^^^^^^^

If you have a piece of labware that is not in the Labware Library, you can create your own definition using the `Opentrons Labware Creator <https://labware.opentrons.com/create/>`_. Before using the Labware Creator, you should read the introduction article `here <https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions>`__.

Once you have created your labware and saved it as a ``.json`` file, you can add it to the Opentrons App by clicking "More" and then "Labware". Once you have added your labware to the Opentrons App, it will be available to all Python Protocol API version 2 protocols uploaded to your robot through that Opentrons App. If other people will be using this custom labware definition, they must also add it to their Opentrons App. You can find a support article about this custom labware process `here <https://support.opentrons.com/en/articles/3136506-using-labware-in-your-protocols>`__.


.. _new-well-access:

**************************
Accessing Wells in Labware
**************************

Well Ordering
^^^^^^^^^^^^^

When writing a protocol, you will need to select which wells to
transfer liquids to and from.

Rows of wells (see image below) on a labware are typically labeled with capital letters starting with ``'A'``;
for instance, an 8x12 96 well plate will have rows ``'A'`` through ``'H'``.

Columns of wells (see image below) on a labware are typically labeled with numerical indices starting with ``'1'``;
for instance, an 8x12 96 well plate will have columns ``'1'`` through ``'12'``.

For all well accessing functions, the starting well will always be at the top left corner of the labware.
The ending well will be in the bottom right, see the diagram below for further explanation.

.. image:: ../img/well_iteration/Well_Iteration.png

.. code-block:: python
    :substitutions:

    '''
    Examples in this section expect the following
    '''
    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol):

        plate = protocol.load_labware('corning_24_wellplate_3.4ml_flat', location='1')


.. versionadded:: 2.0


Accessor Methods
^^^^^^^^^^^^^^^^

There are many different ways to access wells inside labware. Different methods are useful in different contexts. The table below lists out the methods available to access wells and their differences.

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

.. versionadded:: 2.0

List Access From ``wells``
--------------------------

Wells can be referenced by their name, as demonstrated above. However, they can also be referenced with zero-indexing, with the first well in a labware being at position 0.

.. code-block:: python

    plate.wells()[0]   # well A1
    plate.wells()[23]  # well D6

.. tip::

    You may find well names (e.g. ``"B3"``) to be easier to reason with,
    especially with irregular labware (e.g.
    ``opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical``
    (`Labware Library <https://labware.opentrons.com/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical>`_).
    Whichever well access method you use, your protocol will be most maintainable if you use only one access method consistently.

.. versionadded:: 2.0

Accessing Groups of Wells
^^^^^^^^^^^^^^^^^^^^^^^^^

When describing a liquid transfer, you can point to groups of wells for the
liquid's source and/or destination. Or, you can get a group of wells and loop
(or iterate) through them.

You can access a specific row or column of wells by using the
:py:meth:`.Labware.rows_by_name` and :py:meth:`.Labware.columns_by_name` methods
on a labware. These methods both return a dictionary with the row or column name as the keys:

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

Since these methods return either lists or dictionaries, you can iterate through them as you would regular Python data structures.

For example, to access the individual wells of row ``'A'`` in a well plate, you can do:

.. code-block:: python

    for well in plate.rows()[0]:
        print(well)

or,

.. code-block:: python

    for well_obj in plate.rows_by_name()['A'].values():
        print(well_obj)

and it will return the individual well objects in row A.

.. versionadded:: 2.0

*************************
Labeling Liquids in Wells
*************************

Optionally, you can specify the liquids that should be in various wells at the beginning of your protocol. Doing so helps you identify well contents by name and volume, and adds corresponding labels to a single well, or group of wells, in well plates and reservoirs. Viewing the initial liquid setup in a Python protocol is available in the Opentrons App v6.3.0 or higher.

To use these optional methods, first create a liquid object with :py:meth:`.ProtocolContext.define_liquid` and then label individual wells by calling :py:meth:`.Well.load_liquid`, both within the ``run()`` function of your Python protocol.

Let's examine how these two methods work. The following examples demonstrate how to define colored water samples for a well plate and reservoir.

Defining Liquids
^^^^^^^^^^^^^^^^

This example uses ``define_liquid`` to create two liquid objects and instantiates them with the variables ``greenWater`` and ``blueWater``, respectively. The arguments for ``define_liquid`` are all required, and let you name the liquid, describe it, and assign it a color:

.. code-block:: python

        greenWater = protocol.define_liquid(
            name="Green water",
            description="Green colored water for demo",
            display_color="#00FF00",
        )
        blueWater = protocol.define_liquid(
            name="Blue water",
            description="Blue colored water for demo",
            display_color="#0000FF",
        )

.. versionadded:: 2.14
        
The ``display_color`` parameter accepts a hex color code, which adds a color to that liquid's label when you import your protocol into the Opentrons App. The ``define_liquid`` method accepts standard 3-, 4-, 6-, and 8-character hex color codes.

Labeling Wells and Reservoirs
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

This example uses ``load_liquid`` to label the initial well location, contents, and volume (in µL) for the liquid objects created by ``define_liquid``. Notice how values of the ``liquid`` argument use the variable names ``greenWater`` and ``blueWater`` (defined above) to associate each well with a particular liquid: 

.. code-block:: python

        well_plate["A1"].load_liquid(liquid=greenWater, volume=50)
        well_plate["A2"].load_liquid(greenWater, volume=50)
        well_plate["B1"].load_liquid(blueWater, volume=50)
        well_plate["B2"].load_liquid(blueWater, volume=50)
        reservoir["A1"].load_liquid(greenWater, volume=200)
        reservoir["A2"].load_liquid(blueWater, volume=200)
        
.. versionadded:: 2.14

This information shows up in the Opentrons App (v6.3.0 or higher) after you import your protocol. A summary of liquids is available on the protocol detail page, and well-by-well detail is available in the Initial Liquid Setup section of the run setup page.

.. note::
    ``load_liquid`` does not validate volume for your labware nor does it prevent you from adding multiple liquids to each well. For example, you could label a 40 µL well plate with ``greenWater``, ``volume=50``, and then also add blue water to the well. The API won't stop you. It's your responsibility to ensure the labels you use accurately reflect the amounts and types of liquid you plan to place into wells and reservoirs.

Labeling vs Handling Liquids
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The ``load_liquid`` arguments include a volume amount (``volume=n`` in µL). This amount is just a label. It isn't a command or function that manipulates liquids. It only tells you how much liquid should be in a well at the start of the protocol. You need to use a method like :py:meth:`.transfer` to physically move liquids from a source to a destination.


.. _v2-location-within-wells:
.. _new-labware-well-properties:

***************
Well Dimensions
***************

The functions in the :ref:`new-well-access` section above return a single :py:class:`.Well` object or a larger object representing many wells. :py:class:`.Well` objects have methods that provide information about their physical shape, such as the depth or diameter, as specified in their corresponding labware definition. These properties can be used for different applications, such as calculating the volume of a well or a :ref:`position-relative-labware`.

Depth
^^^^^

Use :py:meth:`.Well.depth` to get the distance in mm between the very top of the well and the very bottom. For example, a conical well's depth is measured from the top center to the bottom center of the well.

.. code-block:: python
    :substitutions:

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol):
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat', '1')
        depth = plate['A1'].depth # 10.67

Diameter
^^^^^^^^
Use :py:meth:`.Well.diameter` to get the diameter of a given well in mm. Since diameter is a circular measurement, this method only works for labware with circular wells. If the well is not circular, the value returned will be ``None``. Use length and width (see below) for non-circular wells.

.. code-block:: python
    :substitutions:

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol):
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat', '1')
        diameter = plate['A1'].diameter	# 6.86


Length
^^^^^^
Use :py:meth:`.Well.length` to get the length of a given well in mm. Length is defined as the distance along the robot's x-axis (left to right). This method only works with rectangular wells. If the well is not rectangular, the value returned will be ``None``. Use diameter (see above) for circular wells.

.. code-block:: python
    :substitutions:

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol):
        plate = protocol.load_labware('nest_12_reservoir_15ml', '1')
        length = plate['A1'].length	# 8.2


Width
^^^^^
Use :py:meth:`.Well.width` to get the width of a given well in mm. Width is defined as the distance along the y-axis (front to back). This method only works with rectangular wells. If the well is not rectangular, the value returned will be ``None``. Use diameter (see above) for circular wells.


.. code-block:: python
    :substitutions:

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol):
        plate = protocol.load_labware('nest_12_reservoir_15ml', '1')
        width = plate['A1'].width	# 71.2




.. versionadded:: 2.9

