:og:description: How to load and work with Opentrons-verified and custom labware in a Python protocol.

.. _new-labware:

#######
Labware
#######

Labware are the durable or consumable items that you work with, reuse, or discard while running a protocol on a Flex or OT-2. Items such as pipette tips, well plates, tubes, and reservoirs are all examples of labware. This section provides a brief overview of default labware, custom labware, and how to use basic labware API methods when creating a protocol for your robot.

*************
Labware Types
*************

Default Labware
===============
.. Description almost verbatim from Flex user manual.

Default labware is everything listed in the `Opentrons Labware Library <https://labware.opentrons.com/>`_. When used in a protocol, your Flex or OT-2 knows how to work with default labware. However, you must first inform the API about the labware you will place on the robot’s deck. Search the library when you’re looking for the API load names of the labware you want to use. You can copy the load names from the library and pass them to the ``load_labware`` method in your protocol.

Custom Labware
==============

Custom labware is labware that is not listed the Labware Library. If your protocol needs something that's not in the library, you can create it with the `Opentrons Labware Creator <https://labware.opentrons.com/create/>`_. However, before using the Labware Creator, you should take a moment to review the support article, `Creating Custom Labware Definitions <https://support.opentrons.com/s/article/Creating-Custom-Labware-Definitions>`_.

After you've created your labware, save it as a ``.json`` file and add it to the Opentrons App. See `Using Labware in Your Protocols <https://support.opentrons.com/s/article/Using-labware-in-your-protocols>`_ for instructions. 

If other people need to use your custom labware definition, they must also add it to their Opentrons App.

***************
Loading Labware
***************

Throughout this section, we'll use the labware listed in the following table.

.. list-table::
    :widths: 20 40 45
    :header-rows: 1

    * - Labware type
      - Labware name
      - API load name
    * - Well plate
      - `Corning 96 Well Plate 360 µL Flat <https://labware.opentrons.com/corning_96_wellplate_360ul_flat/>`_
      - ``corning_96_wellplate_360ul_flat``
    * - Flex tip rack
      - `Opentrons Flex 96 Tips 200 µL <https://shop.opentrons.com/opentrons-flex-tips-200-l/>`_
      - ``opentrons_flex_96_tiprack_200ul``
    * - OT-2 tip rack
      - `Opentrons 96 Tip Rack 300 µL <https://labware.opentrons.com/opentrons_96_tiprack_300ul>`_
      - ``opentrons_96_tiprack_300ul``

Following the example in the :ref:`overview-section-v2`, here is how to the :py:meth:`.ProtocolContext.load_labware` method to load labware on either Flex or OT-2. 

.. code-block:: python

    #Flex
    tiprack = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'D1')
    plate = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D2')

.. code-block:: python

    #OT-2
    tiprack = protocol.load_labware('opentrons_96_tiprack_300ul', '1')
    plate = protocol.load_labware('corning_96_wellplate_360ul_flat', '2')

After the ``load_labware`` method loads labware into your protocol, it returns a :py:class:`opentrons.protocol_api.labware.Labware` object.

.. Recommend a call-out instead of a section (H2, H3) for "label." It's more a "pro tip" nice-to-have rather than
.. an item that requires its own section.

Labeling Labware
================
    
The ``load_labware`` method also accepts an optional ``label`` argument. You can use it to help identify labware with a descriptive label. If used, the label value is displayed in the Opentrons App. For example::
        
    tiprack = protocol.load_labware('corning_96_wellplate_360ul_flat',
                                    location= '1',
                                    label= 'any-name-you-want')

Adapter Section
===============

TBD use examples from PR 13016 and RLAB-343. This is the ``adapter`` argument.


.. _new-well-access:

**************************
Accessing Wells in Labware
**************************

Well Ordering
=============

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

    # Flex
    def run(protocol):
        plate = protocol.load_labware('corning_24_wellplate_3.4ml_flat', location='D1')

.. code-block:: python

    # OT-2
    def run(protocol):
        plate = protocol.load_labware('corning_24_wellplate_3.4ml_flat', location='1')

.. versionadded:: 2.0

Accessor Methods
================

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
==========================

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

    You may find coordinate well names like ``"B3"`` easier to reason with, especially when working with irregular labware, e.g.
    ``opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical`` (see the `Opentrons 10 Tube Rack <https://labware.opentrons.com/opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical>`_ in the Labware Library). Whichever well access method you use, your protocol will be most maintainable if you use only one access method consistently.

.. versionadded:: 2.0

Accessing Groups of Wells
=========================

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
================

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
=============================

This example uses ``load_liquid`` to label the initial well location, contents, and volume (in µL) for the liquid objects created by ``define_liquid``. Notice how values of the ``liquid`` argument use the variable names ``greenWater`` and ``blueWater`` (defined above) to associate each well with a particular liquid: 

.. code-block:: python

        well_plate["A1"].load_liquid(liquid=greenWater, volume=50)
        well_plate["A2"].load_liquid(liquid=greenWater, volume=50)
        well_plate["B1"].load_liquid(liquid=blueWater, volume=50)
        well_plate["B2"].load_liquid(liquid=blueWater, volume=50)
        reservoir["A1"].load_liquid(liquid=greenWater, volume=200)
        reservoir["A2"].load_liquid(liquid=blueWater, volume=200)
        
.. versionadded:: 2.14

This information shows up in the Opentrons App (v6.3.0 or higher) after you import your protocol. A summary of liquids is available on the protocol detail page, and well-by-well detail is available in the Initial Liquid Setup section of the run setup page.

.. note::
    ``load_liquid`` does not validate volume for your labware nor does it prevent you from adding multiple liquids to each well. For example, you could label a 40 µL well plate with ``greenWater``, ``volume=50``, and then also add blue water to the well. The API won't stop you. It's your responsibility to ensure the labels you use accurately reflect the amounts and types of liquid you plan to place into wells and reservoirs.

Labeling vs Handling Liquids
============================

The ``load_liquid`` arguments include a volume amount (``volume=n`` in µL). This amount is just a label. It isn't a command or function that manipulates liquids. It only tells you how much liquid should be in a well at the start of the protocol. You need to use a method like :py:meth:`.transfer` to physically move liquids from a source to a destination.


.. _v2-location-within-wells:
.. _new-labware-well-properties:

***************
Well Dimensions
***************

The functions in the :ref:`new-well-access` section above return a single :py:class:`.Well` object or a larger object representing many wells. :py:class:`.Well` objects have attributes that provide information about their physical shape, such as the depth or diameter, as specified in their corresponding labware definition. These properties can be used for different applications, such as calculating the volume of a well or a :ref:`position-relative-labware`.

.. note::

    In the code samples below, the ``load_labware`` method shows a Flex deck slot location (``D1``). If you have an OT-2, replace ``D1`` with ``1``. Although our Python API knows how to translate Flex and OT-2 deck locations, it's a good practice to use the deck location coordinates that match your robot model. See :ref:`deck-slots` for more information.

Depth
=====

Use :py:attr:`.Well.depth` to get the distance in mm between the very top of the well and the very bottom. For example, a conical well's depth is measured from the top center to the bottom center of the well.

.. code-block:: python
    :substitutions:

    def run(protocol):
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D1')
        depth = plate['A1'].depth # 10.67

Diameter
========

Use :py:attr:`.Well.diameter` to get the diameter of a given well in mm. Since diameter is a circular measurement, this attribute is only present on labware with circular wells. If the well is not circular, the value will be ``None``. Use length and width (see below) for non-circular wells.

.. code-block:: python
    :substitutions:

    def run(protocol):
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat', 'D1')
        diameter = plate['A1'].diameter	# 6.86

Length
======

Use :py:attr:`.Well.length` to get the length of a given well in mm. Length is defined as the distance along the robot's x-axis (left to right). This attribute is only present on rectangular wells. If the well is not rectangular, the value will be ``None``. Use diameter (see above) for circular wells.

.. code-block:: python
    :substitutions:

    def run(protocol):
        plate = protocol.load_labware('nest_12_reservoir_15ml', 'D1')
        length = plate['A1'].length	# 8.2


Width
=====

Use :py:attr:`.Well.width` to get the width of a given well in mm. Width is defined as the distance along the y-axis (front to back). This attribute is only present on rectangular wells. If the well is not rectangular, the value will be ``None``. Use diameter (see above) for circular wells.


.. code-block:: python
    :substitutions:

    def run(protocol):
        plate = protocol.load_labware('nest_12_reservoir_15ml', 'D1')
        width = plate['A1'].width	# 71.2


.. versionadded:: 2.9

