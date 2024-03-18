:og:description: Define and set possible values for parameters in Opentrons Python protocols.

.. _defining-rtp:

*******************
Defining Parameters
*******************

.. dunno if this will be a named intro section or just some text at the top

Parameters all have:

- A ``variable_name`` for referencing in code.
- A ``display_name`` to label them in the Opentrons App or on the touchscreen.
- An optional ``description`` to provide more information about how the parameter will affect the execution of the protocol.
- A ``default`` value that the protocol will use if no changes are made during run setup.

Numeric and string parameters have additional attributes. See below.

The ``add_parameters()`` Function
=================================

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
