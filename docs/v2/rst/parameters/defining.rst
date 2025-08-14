:og:description: Define and set possible values for parameters in Opentrons Python protocols.

.. _defining-rtp:

*******************
Defining Parameters
*******************

To use parameters, you need to define them in :ref:`a separate function <add-parameters>` within your protocol. Each parameter definition has two main purposes: to specify acceptable values, and to inform the protocol user what the parameter does.

Depending on the :ref:`type of parameter <rtp-types>`, you'll need to specify some or all of the following.

.. list-table::
   :header-rows: 1

   * - Attribute
     - Details
   * - ``variable_name``
     -
        - A unique name for :ref:`referencing the parameter value <using-rtp>` elsewhere in the protocol.
        - Must meet the usual requirements for `naming objects in Python <https://docs.python.org/3/reference/lexical_analysis.html#identifiers>`__.
   * - ``display_name``
     -
        - A label for the parameter shown in the Opentrons App or on the touchscreen.
        - Maximum 30 characters.
   * - ``description``
     -
       - An optional longer explanation of what the parameter does, or how its values will affect the execution of the protocol.
       - Maximum 100 characters.
   * - ``default``
     -
       - The value the parameter will have if the technician makes no changes to it during run setup.
   * - ``minimum`` and ``maximum``
     -
       - For numeric parameters only.
       - Allows free entry of any value within the range (inclusive).
       - Both values are required.
       - Can't be used at the same time as ``choices``.
   * - ``choices``
     -
       - For numeric or string parameters.
       - Provides a fixed list of values to choose from.
       - Each choice has its own display name and value.
       - Can't be used at the same time as ``minimum`` and ``maximum``.
   * - ``units``
     -
       - Optional, for numeric parameters with ``minimum`` and ``maximum`` only.
       - Displays after the number during run setup.
       - Does not affect the parameter's value or protocol execution.
       - Maximum 10 characters.



.. _add-parameters:

The ``add_parameters()`` Function
=================================

All parameter definitions are contained in a Python function, which must be named ``add_parameters`` and takes a single argument. Define ``add_parameters()`` before the ``run()`` function that contains protocol commands.

The examples on this page assume the following definition, which uses the argument name ``parameters``. The type specification of the argument is optional.

.. code-block::

    def add_parameters(parameters: protocol_api.ParameterContext):

Within this function definition, call methods on ``parameters`` to define parameters. The next section demonstrates how each type of parameter has its own method.

.. _rtp-types:

Types of Parameters
===================

The API supports four types of parameters that correspond to Python built-in types: Boolean (:py:class:`bool`), integer (:py:class:`int`), floating point number (:py:class:`float`), and string (:py:class:`str`). It is not possible to mix types within a single parameter.

In addition, starting in version 2.20, the API supports CSV files as parameters. All data contained in CSV parameters, including numeric data, is initially interpreted as strings. See :ref:`rtp-csv-data` for more information.

Boolean Parameters
------------------

Boolean parameters are ``True`` or ``False`` only.

.. code-block::

    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        description="Skip incubation delays and shorten mix steps.",
        default=False
    )

During run setup, the technician can toggle between the two values. In the Opentrons App, Boolean parameters appear as a toggle switch. On the touchscreen, they appear as *On* or *Off*, for ``True`` and ``False`` respectively.

.. versionadded:: 2.18

Integer Parameters
------------------

Integer parameters either accept a range of numbers or a list of numbers. You must specify one or the other; you can't create an open-ended prompt that accepts any integer.

To specify a range, include ``minimum`` and ``maximum``.

.. code-block::

    parameters.add_int(
        variable_name="volume",
        display_name="Aspirate volume",
        description="How much to aspirate from each sample.",
        default=20,
        minimum=10,
        maximum=100,
        unit="µL"
    )

During run setup, the technician can enter any integer value from the minimum up to the maximum. Entering a value outside of the range will show an error. At that point, they can correct their custom value or restore the default value.

To specify a list of numbers, include ``choices``. Each choice is a dictionary with entries for display name and value. The display names let you briefly explain the effect each choice will have.

.. code-block::

    parameters.add_int(
        variable_name="volume",
        display_name="Aspirate volume",
        description="How much to aspirate from each sample.",
        default=20,
        choices=[
            {"display_name": "Low (10 µL)", "value": 10},
            {"display_name": "Medium (20 µL)", "value": 20},
            {"display_name": "High (50 µL)", "value": 50},
        ]
    )

During run setup, the technician can choose from a menu of the provided choices.

.. versionadded:: 2.18

Float Parameters
----------------

Float parameters either accept a range of numbers or a list of numbers. You must specify one or the other; you can't create an open-ended prompt that accepts any floating point number.

Specifying a range or list is done exactly the same as in the integer examples above. The only difference is that all values must be floating point numbers.

.. code-block::

    parameters.add_float(
        variable_name="volume",
        display_name="Aspirate volume",
        description="How much to aspirate from each sample.",
        default=5.0,
        choices=[
            {"display_name": "Low (2.5 µL)", "value": 2.5},
            {"display_name": "Medium (5 µL)", "value": 5.0},
            {"display_name": "High (10 µL)", "value": 10.0},
        ]
    )

.. versionadded:: 2.18

String Parameters
-----------------

String parameters only accept a list of values. You can't currently prompt for free text entry of a string value.

To specify a list of strings, include ``choices``. Each choice is a dictionary with entries for display name and value. Only the display name will appear during run setup.

A common use for string display names is to provide an easy-to-read version of an API load name. You can also use them to briefly explain the effect each choice will have.

.. code-block::

    parameters.add_str(
        variable_name="pipette",
        display_name="Pipette type",
        choices=[
            {"display_name": "1-Channel 50 µL", "value": "flex_1channel_50"},
            {"display_name": "8-Channel 50 µL", "value": "flex_8channel_50"},
        ],
        default="flex_1channel_50",
    )

During run setup, the technician can choose from a menu of the provided choices.

.. versionadded:: 2.18

CSV Parameters
--------------

CSV parameters accept any valid comma-separated file. You don't need to specify the format of the data. Due to this flexibility, CSV parameters do not have default values. Separately provide standard operating procedures or template files to the scientists and technicians who will create the tabular data your protocol relies on.

Briefly describe the purpose of your CSV parameter when defining it.

.. code-block::

    parameters.add_csv_file(
        variable_name="cherrypicking_wells",
        display_name="Cherrypicking wells",
        description="Table of labware, wells, and volumes to transfer."
    )

During run setup, the technician can use the Flex touchscreen to choose a CSV file. They can choose from files on an attached USB drive, or from files already associated with the protocol and stored on the robot. Or in the Opentrons App, they can choose any file on their computer.

.. note::
    The touchscreen and app currently limit you to selecting one CSV file per run. To match this limitation, the API will raise an error if you define more than one CSV parameter.

.. versionadded:: 2.20
