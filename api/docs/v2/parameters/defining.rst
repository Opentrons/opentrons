:og:description: Define and set possible values for parameters in Opentrons Python protocols.

.. _defining-rtp:

*******************
Defining Parameters
*******************

To use parameters, you need to define them in :ref:`a separate function <add-parameters>` within your protocol. Each parameter definition has two main purposes: to specify acceptable values, and to inform the protocol user what the parameter does.

Depending on the type of parameter, you'll need to specify some or all of the following.

.. list-table::
   :header-rows: 1

   * - Information
     - Purpose
   * - ``variable_name``
     - A unique name for :ref:`referencing the parameter value <using-rtp>` elsewhere in the protocol.
   * - ``display_name``
     - A label for the parameter shown in the Opentrons App or on the touchscreen.
   * - ``description``
     - An optional longer explanation of what the parameter does, or how its values will affect the execution of the protocol.
   * - ``default``
     - The value the parameter will have if the user makes no changes to it during run setup.
   * - ``minimum`` and ``maximum``
     - For numeric parameters only. Allows free entry of any value within the range (inclusive). Both values are required. Can't be used at the same time as ``choices``.
   * - ``choices``
     - For numeric or string parameters. Provides a fixed list of values to choose from. Each choice has its own display name and value. Can't be used at the same time as ``minimum`` and ``maximum``.


.. _add-parameters:

The ``add_parameters()`` Function
=================================

All parameter definitions are contained in a Python function, which must be named ``add_parameters`` and takes a single argument. You must define ``add_parameters`` before the ``run`` function that contains protocol commands.

The examples on this page assume the following definition, which uses the argument name ``parameters``. The type specification of the argument is optional.

.. code-block::

    def add_parameters(parameters: protocol_api.ProtocolContext.Parameters):
    
Within this function definition, call methods on ``parameters`` to define parameters. The next section demonstrates how each type of parameter has its own method.

Types of Parameters
===================

Boolean Parameters
------------------

Boolean parameters are ``True`` or ``False``. During setup, they appear as *On* or *Off*, respectively. 

An example boolean::

    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        default=False,
        description="Skip incubation delays and shorten mix steps."
    )

.. versionadded:: 2.18

Integer Parameters
------------------

Enter an integer within a range or choose from a list of options.

An example integer::

    parameters.add_int(
        variable_name="sample_count",
        display_name="Sample count",
        default=6,
        minimum=1,
        maximum=12,
        description="How many samples to process."
    )

.. versionadded:: 2.18

Float Parameters
----------------

Enter a floating point number within a range or choose from a list of options.

An example float with choices::

    parameters.add_float(
        variable_name="volume",
        display_name="Aspirate volume",
        default=20.0,
        choices=[
            {"display_name": "Low (10.0 µL)", "value": 10.0},
            {"display_name": "Medium (20.0 µL)", "value": 20.0},
            {"display_name": "High (50.0 µL)", "value": 50.0},
        ],
        description="How many microliters to aspirate from each sample.",
        unit="µL"
    )

.. versionadded:: 2.18

String Parameters
-----------------

Enumerated only. Choose from a list of predefined strings.

An example string enumeration::

    parameters.add_str(
        variable_name="pipette",
        display_name="Pipette Name",
        choices=[
            {"display_name": "1-Channel 50µL", "value": "flex_1channel_50"},
            {"display_name": "8-Channel 50µL", "value": "flex_8channel_50"},
        ],
        default="flex_1channel_50",
        description="What pipette to use during the protocol.",
    )

.. versionadded:: 2.18
