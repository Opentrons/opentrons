.. _labware:


######################
Labware
######################

We spend a fair amount of time organizing and counting wells when writing
Python protocols. This section describes the different ways we can access
wells and groups of wells.

************************************

***************
Labware Library
***************

The Opentrons API comes with many common labware built in. These can be loaded
into your Python protocol by using the ``labware.load()`` method with the
specific load name of the labware you need.

Please see the `Opentrons Labware Library`__ for a list of currently supported
labware, along with visualizations, pictures, and load names.

__ https://labware.opentrons.com

.. Tip::

    Copy and paste load names directly from the Labware Library to ensure
    your ``load()`` statements get the correct definitions.

If you are interested in using your own labware that is not included in the
API, please take a look at how to create custom labware definitions using
``labware.create()``, or contact Opentrons Support.

Labware Versions
================

Some labware on the Opentrons Labware Library have multiple versions of their
definitions available. Opentrons publishes new versions of a labware definition
when we find an issue with a labware definition. In general, you should use the
newest version of a labware definition; however, the older definitions remain
available for use with previously-written protocols that may have been customized
to work with the older definition.

If you do not specify a version when loading labware, version 1 will be used by default.


**********************

*********************************
Placing labware on the robot deck
*********************************

The robot deck is made up of slots labeled 1, 2, 3, 4, and so on.

.. image:: ../img/DeckMapEmpty.png

To tell the robot what labware will be on the deck for your protocol, use
``labware.load`` after importing ``labware`` as follows:

.. code-block:: python

    from opentrons import labware

    # ...

    tiprack = labware.load('opentrons_96_tiprack_300ul', slot='1')


**********************

************************
Labware Import Reference
************************

.. code-block:: python

    '''
    Examples in this section require the following
    '''
    from opentrons import labware

Load
====

``labware.load`` tells the robot that your protocol will be using a given
labware in a certain slot.

.. code-block:: python

    my_labware = labware.load('usascientific_12_reservoir_22ml', slot='1')

A third optional argument can be used to give a labware a nickname for display
in the Opentrons App.

.. code-block:: python

    my_labware = labware.load('usascientific_12_reservoir_22ml',
                     slot='2',
                     label='any-name-you-want')


Sometimes, you may need to place a labware on top of something else on the
deck, like modules. For this, you should use the ``share`` parameter.

.. code-block:: python

    from opentrons import labware, modules

    td = modules.load('tempdeck', slot='1')
    plate = labware.load('opentrons_96_aluminumblock_biorad_wellplate_200ul',
                         slot='1',
                         share=True)

To specify the version of the labware definition to use, you can use the ``version``
parameter:

.. code-block:: python

   from opentrons import labware
   block1 = labware.load(
                'opentrons_96_aluminumblock_biorad_wellplate_200ul',
                slot='1',
                version=2)  # version 2 of the aluminum block definition
   block2 = labware.load(
                'opentrons_96_aluminumblock_biorad_wellplate_200ul',
                 slot='2',
                 version=1)  # version 1 of the aluminum block definition
   block3 = labware.load(
                'opentrons_96_aluminumblock_biorad_wellplate_200ul',
                slot='2')  # if you don't specify version, version 1 is used


Create
======

.. Note::
    The current custom labware creation mechanisms in the API are fairly
    limited. We're working on a much more robust system for custom labware
    definitions. If the current API isn't able to support your labware, please
    reach out to our support team.

Using ``labware.create``, you can create your own custom labware. The labware
created through this method must consist of circular wells arranged in
regularly-spaced columns and rows.

.. code-block:: python

    custom_plate_name = 'custom_18_wellplate_200ul'

    if plate_name not in labware.list():
        labware.create(
            custom_plate_name,  # name of you labware
            grid=(3, 6),        # number of (columns, rows)
            spacing=(12, 12),   # distances (mm) between each (column, row)
            diameter=5,         # diameter (mm) of each well
            depth=10,           # depth (mm) of each well
            volume=200)         # volume (µL) of each well

    custom_plate = labware.load(custom_plate_name, slot='3')

    for well in custom_plate.wells():
        print(well)

The above example will print out...

.. code-block:: python

    <Well A1>
    <Well B1>
    <Well C1>
    <Well A2>
    <Well B2>
    <Well C2>
    <Well A3>
    <Well B3>
    <Well C3>
    <Well A4>
    <Well B4>
    <Well C4>
    <Well A5>
    <Well B5>
    <Well C5>
    <Well A6>
    <Well B6>
    <Well C6>

You only need to call ``labware.create`` once. It will save the labware
definition on the robot so that your labware will be available to all your
subsequent protocol runs.

``labware.create`` **will throw an error if you try to call it more than once
with the same load name**. In the example above, the call to `labware.create`
is wrapped in an if-block so it does not try to add the definition twice, which
would cause an error.

If you would like to delete a labware you have already added to the database
(for example: to make changes to its definition), you can do the following:

.. code-block:: python

    from opentrons.data_storage import database

    database.delete_container('custom_18_wellplate_200ul')

.. Note::
    There is some specialty labware that will require you to specify the
    type within your labware name. If you are creating a custom tip rack, it
    must be ``tiprack-REST-OF-LABWARE-NAME`` in order for the software to act
    reliably.

List (deprecated)
=================

``labware.list`` returns an array of all labware load names in the old,
unsupported format.

.. code-block:: python

    labware.list()

.. Tip::
    For a list of all currently supported labware, please visit the Opentrons
    `Labware Library`__

__ https://labware.opentrons.com


******************
Accessing Wells
******************

Individual Wells
================

When writing a protocol using the API, you will need to select which wells to
transfer liquids to and from.

The OT-2 deck and labware are all set up with the same coordinate system

- Lettered rows ``['A']-['END']``
- Numbered columns ``['1']-['END']``.

.. image:: ../img/well_iteration/Well_Iteration.png

.. code-block:: python

    '''
    Examples in this section expect the following
    '''
    from opentrons import labware

    plate = labware.load('corning_24_wellplate_3.4ml_flat', slot='1')

Wells by Name
-------------

Once a labware is loaded into your protocol, you can easily access the many
wells within it using ``wells()`` method. ``wells()`` takes the name of the
well as an argument, and will return the well at that location.

.. code-block:: python

    a1 = plate.wells('A1')
    d6 = plate.wells('D6')

Wells by Index
--------------

Wells can be referenced by their "string" name, as demonstrated above.
However, they can also be referenced with zero-indexing, with the first well in
a labware being at position 0.

.. code-block:: python

    plate.wells(0)   # well A1
    plate.wells(23)  # well D6

.. Tip::
    You may find well names (e.g. ``B3``) to be easier to reason with,
    especially with irregular labware (e.g.
    ``opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical``). Whichever well
    access method you use, your protocol will be most maintainable if you pick
    one method and don't use the other one.

Columns and Rows
----------------

A labware's wells are organized within a series of columns and rows, which are
also labelled on standard labware. In the API, rows are given letter names
(``'A'`` through ``'D'`` for example) and go left to right, while columns are
given numbered names (``'1'`` through ``'6'`` for example) and go from front to
back.

You can access a specific row or column by using the ``rows()`` and
``columns()`` methods on a labware. These will return all wells within that row
or column.

.. code-block:: python

    row = plate.rows('A')
    column = plate.columns('1')

    print('Column "1" has', len(column), 'wells')
    print('Row "A" has', len(row), 'wells')

will print out...

.. code-block:: python

    Column "1" has 4 wells
    Row "A" has 6 wells

The ``rows()`` or ``cols()`` methods can be used in combination with the
``wells()`` method to access wells within that row or column. In the example
below, both lines refer to well ``'A1'``.

.. code-block:: python

    plate.cols('1').wells('A')
    plate.rows('A').wells('1')

.. Tip::
    The example above works but is a little convoluted. If you can, always get
    individual wells like A1 with ``wells('A1')`` or ``wells(0)``


Multiple Wells
==============

If we had to reference each well one at a time, our protocols could get very
long.

When describing a liquid transfer, we can point to groups of wells for the
liquid's source and/or destination. Or, we can get a group of wells and loop
(or iterate) through them.


.. code-block:: python

    '''
    Examples in this section expect the following
    '''
    from opentrons import labware

    plate = labware.load('corning_24_wellplate_3.4ml_flat', slot='1')

Wells
-----

The ``wells()`` method can return a single well, or it can return a list of
wells when multiple arguments are passed.

Here is an example or accessing a list of wells, each specified by name:

.. code-block:: python

    w = plate.wells('A1', 'B2', 'C3', 'D4')

    print(w)

will print out...

.. code-block:: python

    <WellSeries: <Well A1><Well B2><Well C3><Well D4>>

Multiple wells can be treated just like a normal Python list, and can be
iterated through:

.. code-block:: python

    for w in plate.wells('A1', 'B2', 'C3', 'D4'):
        print(w)

will print out...

.. code-block:: python

    <Well A1>
    <Well B2>
    <Well C3>
    <Well D3>

Wells To
--------

Instead of having to list the name of every well, we can also create a range of
wells with a start and end point. The first argument is the starting well, and
the ``to=`` argument is the last well.

.. code-block:: python

    for w in plate.wells('A1', to='D1'):
        print(w)

will print out...

.. code-block:: python

    <Well A1>
    <Well B1>
    <Well C1>
    <Well D1>

These lists of wells can also move in the reverse direction along your labware.
For example, setting the ``to=`` argument to a well that comes before the
starting position is allowed:

.. code-block:: python

    for w in plate.wells('D1', to='A1'):
        print(w)

will print out...

.. code-block:: python

    <Well D1>
    <Well C1>
    <Well B1>
    <Well A1>

Wells Length
------------

Another way you can create a list of wells is by specifying the length of the
well list you need, including the starting well. The example below will
return 4 wells, starting at well ``'A1'``:

.. code-block:: python

    for w in plate.wells('A1', length=4):
        print(w)

will print out...

.. code-block:: python

    <Well A1>
    <Well B1>
    <Well C1>
    <Well D1>

Columns and Rows
----------------

The same arguments described above can be used with ``rows()`` and ``cols()``
to create lists of rows or columns.

Here is an example of iterating through rows:

.. code-block:: python

    for r in plate.rows('A', length=3):
        print(r)

will print out...

.. code-block:: python

    <WellSeries: <Well A1><Well A2><Well A3><Well A4><Well A5><Well A6>>
    <WellSeries: <Well B1><Well B2><Well B3><Well B4><Well B5><Well B6>>
    <WellSeries: <Well C1><Well C2><Well C3><Well C4><Well C5><Well C6>>

And here is an example of iterating through columns:

.. code-block:: python

    for c in plate.cols('1', to='6'):
        print(c)

will print out...

.. code-block:: python

    <WellSeries: <Well A1><Well B1><Well C1><Well D1>>
    <WellSeries: <Well A2><Well B2><Well C2><Well D2>>
    <WellSeries: <Well A3><Well B3><Well C3><Well D3>>
    <WellSeries: <Well A4><Well B4><Well C4><Well D4>>
    <WellSeries: <Well A5><Well B5><Well C5><Well D5>>
    <WellSeries: <Well A6><Well B6><Well C6><Well D6>>


Slices
------

Labware can also be treating similarly to Python lists, and can therefore
handle slices.

.. code-block:: python

    # start at index 0
    # slice until index 8, without including it
    # increment by 2
    for w in plate[0:8:2]:
        print(w)

will print out...

.. code-block:: python

    <Well A1>
    <Well C1>
    <Well A2>
    <Well C2>

The API's labware are also prepared to take string values for the slice's
``start`` and ``stop`` positions.

.. code-block:: python

    for w in plate['A1':'A2':2]:
        print(w)

will print out...

.. code-block:: python

    <Well A1>
    <Well C1>

.. code-block:: python

    for w in plate.rows['B']['1'::2]:
        print(w)

will print out...

.. code-block:: python

    <Well B1>
    <Well B3>
    <Well B5>


.. _deprecated_labware:


*****************************
Deprecated Labware Load Names
*****************************

Prior to version ``3.10.0`` of the Opentrons API, we used a completely
different set of labware load names. They will continue to work until version
``4.0.0`` is released, but they should be considered deprecated.

We recommend you switch over to using the load names from the Labware Library
as soon as possible. The following mapping can be used as a guide:

+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
|                  Deprecated                   |                                         Recommended                                         |                                            Notes                                             |
+===============================================+=============================================================================================+==============================================================================================+
| ``6-well-plate``                              | ``corning_6_wellplate_16.8ml_flat``                                                         |                                                                                              |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``12-well-plate``                             | ``corning_12_wellplate_6.9ml_flat``                                                         |                                                                                              |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``24-well-plate``                             | ``corning_24_wellplate_3.4ml_flat``                                                         |                                                                                              |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``48-well-plate``                             | ``corning_48_wellplate_1.6ml_flat``                                                         |                                                                                              |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``384-plate``                                 | ``corning_384_wellplate_112ul_flat``                                                        |                                                                                              |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``96-deep-well``                              | ``usascientific_96_wellplate_2.4ml_deep``                                                   | This labware has square wells                                                                |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``96-flat``                                   | ``corning_96_wellplate_360ul_flat``                                                         |                                                                                              |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``96-PCR-flat``                               | ``biorad_96_wellplate_200ul_pcr``                                                           |                                                                                              |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``96-PCR-tall``                               | ``biorad_96_wellplate_200ul_pcr``                                                           |                                                                                              |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``alum-block-pcr-strips``                     | ``opentrons_40_aluminumblock_eppendorf_24x2ml_safelock_snapcap_generic_16x0.2ml_pcr_strip`` | This product has been discontinued                                                           |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``biorad-hardshell-96-PCR``                   | ``biorad_96_wellplate_200ul_pcr``                                                           |                                                                                              |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``opentrons-aluminum-block-2ml-eppendorf``    | ``opentrons_24_aluminumblock_generic_2ml_screwcap``                                         | Opentrons Aluminum Block Set                                                                 |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``opentrons-aluminum-block-2ml-screwcap``     | ``opentrons_24_aluminumblock_generic_2ml_screwcap``                                         | Opentrons Aluminum Block Set                                                                 |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``opentrons-aluminum-block-96-PCR-plate``     | ``opentrons_96_aluminumblock_biorad_wellplate_200ul``                                       | Opentrons Aluminum Block Set                                                                 |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``opentrons-aluminum-block-PCR-strips-200ul`` | ``opentrons_96_aluminumblock_generic_pcr_strip_200ul``                                      | Opentrons Aluminum Block Set                                                                 |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``opentrons-tiprack-300ul``                   | ``opentrons_96_tiprack_300ul``                                                              |                                                                                              |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``opentrons-tuberack-1.5ml-eppendorf``        | ``opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap``                                  | Opentrons 4-in-1 Tube Rack Set                                                               |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``opentrons-tuberack-15_50ml``                | ``opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical``                                      | Opentrons 4-in-1 Tube Rack Set                                                               |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``opentrons-tuberack-15ml``                   | ``opentrons_15_tuberack_falcon_15ml_conical``                                               | Opentrons 4-in-1 Tube Rack Set                                                               |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``opentrons-tuberack-2ml-eppendorf``          | ``opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap``                                    | Opentrons 4-in-1 Tube Rack Set                                                               |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``opentrons-tuberack-2ml-screwcap``           | ``opentrons_24_tuberack_generic_2ml_screwcap``                                              | Opentrons 4-in-1 Tube Rack Set                                                               |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``opentrons-tuberack-50ml``                   | ``opentrons_6_tuberack_falcon_50ml_conical``                                                | Opentrons 4-in-1 Tube Rack Set                                                               |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``PCR-strip-tall``                            | ``opentrons_96_aluminumblock_generic_pcr_strip_200ul``                                      |                                                                                              |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``tiprack-10ul``                              | ``opentrons_96_tiprack_10ul``                                                               | If possible, please use an Opentrons tip rack rather than a rack with a slot adapter         |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``tiprack-200ul``                             | ``tipone_96_tiprack_200ul``                                                                 | If possible, please use an Opentrons tip rack rather than a rack with a slot adapter         |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``tiprack-1000ul``                            | ``opentrons_96_tiprack_1000ul``                                                             | If possible, please use an Opentrons tip rack rather than a rack with a slot adapter         |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``trash-box``                                 | ``agilent_1_reservoir_290ml``                                                               | ``trash-box`` is no longer supported; we recommend using a 1-well reservoir for liquid trash |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``trough-12row``                              | ``usascientific_12_reservoir_22ml``                                                         |                                                                                              |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``tube-rack-.75ml``                           | ``opentrons_24_tuberack_generic_0.75ml_snapcap_acrylic``                                    | Discontinued; please upgrade to the Opentrons 4-in-1 Tube Rack Set                           |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``tube-rack-2ml``                             | ``opentrons_24_tuberack_eppendorf_2ml_safelock_snapcap_acrylic``                            | Discontinued; please upgrade to the Opentrons 4-in-1 Tube Rack Set                           |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+
| ``tube-rack-15_50ml``                         | ``opentrons_10_tuberack_falcon_4x50ml_6x15ml_conical_acrylic``                              | Discontinued; please upgrade to the Opentrons 4-in-1 Tube Rack Set                           |
+-----------------------------------------------+---------------------------------------------------------------------------------------------+----------------------------------------------------------------------------------------------+

.. Note::
    If your labware is missing from the list above, or you're unsure how to
    update your protocol's load names, please contact our support team

The following load names do not have a new definitions available, and could
eventually be removed. They will continue to function normally for now. If you
have any concerns about their deprecation and/or removal, please reach out!

- ``24-vial-rack``
- ``48-vial-plate``
- ``5ml-3x4``
- ``96-well-plate-20mm``
- ``MALDI-plate``
- ``T25-flask``
- ``T75-flask``
- ``e-gelgol``
- ``hampton-1ml-deep-block``
- ``point``
- ``rigaku-compact-crystallization-plate``
- ``small_vial_rack_16x45``
- ``temperature-plate``
- ``tiprack-10ul-H``
- ``trough-12row-short``
- ``trough-1row-25ml``
- ``trough-1row-test``
- ``tube-rack-2ml-9x9``
- ``tube-rack-5ml-96``
- ``tube-rack-80well``
- ``wheaton_vial_rack``
