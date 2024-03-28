:og:description: How to set up and use a sample count parameter in an Opentrons Python protocol.

.. _use-case-sample-count:

*********************************
Parameter Use Case – Sample Count
*********************************

Choosing how many samples to process is important for efficient automation. This use case explores how a single parameter for sample count can have pervasive effects throughout a protocol. The examples are adapted from an actual parameterized protocol for DNA prep. The sample code will use 8-channel pipettes to process 8, 16, 24, or 32 samples.

At first glance, it might seem like sample count would primarily affect liquid transfers to and from sample wells. But when using the Python API's full range of capabilities, it affects:

- How many tip racks to load.
- Whether tip racks need to be replaced from the staging area or off-deck.
- The initial volume and placement of reagents.
- Actual liquid handling!

To keep things as simple as possible, this use case only focuses on setting up and using the value of a single sample count parameter, which is just one of several parameters present in the full protocol.

From Samples to Columns
=======================

First of all, we need to set up the sample count parameter so it's both easy for technicians to understand during protocol setup and easy for us to use in the protocol's ``run`` function.

We want to limit the number of samples to 8, 16, 24, or 32, so we'll use an integer parameter with choices::

    def add_parameters(parameters):

        parameters.add_int(
            variable_name="sample_count",
            display_name="Sample count",
            description="Number of input DNA samples"
            default=24,
            choices=[
                {"display_name": "8", "value": 8},
                {"display_name": "16", "value": 16},
                {"display_name": "24", "value": 24},
                {"display_name": "32", "value": 32},
            ],
            unit="samples"
        )

All of the possible values are multiples of 8, because the protocol will use an 8-channel pipette to process an entire column of samples at once. Considering how 8-channel pipettes access wells, it may be more useful to operate with a *column count* in code. We can set a ``column_count`` very early in the ``run`` function by accessing the value of ``params.sample_count`` and dividing it by 8::

    def run(protocol):

        column_count = protocol.params.sample_count / 8

Most examples below will use ``column_count``, rather than redoing (and retyping!) this calculation multiple times.

Loading Tip Racks
=================

Tip racks come first in most protocols. To ensure that a protocol runs to completion, you need to load enough tip racks to avoid running out of tips.

We could load as many tip racks are needed for our maximum number of samples, but that would be suboptimal. Run setup is faster when the technician doesn't have to load extra items onto the deck. So it's best to examine the protocol's steps and determine how many racks are needed for each value of ``sample_count``.

In the case of this DNA prep protocol, we can create formulas for the number of 200 µL and 50 µL tip racks needed. The following factors go into these computations:

- 50 µL tips
    - 1 fixed action that picks up once per protocol.
    - 7 variable actions that pick up once per sample column.
- 200 µL tips
    - 2 fixed actions that pick up once per protocol.
    - 11 variable actions that pick up once per sample column.

Since each tip rack has 12 columns, divide the number of pickup actions by 12 to get the number of racks needed. And since you can't load a partial rack, you always need to round up — performing 13 pickups requires 2 racks. The :py:func:`math.ceil` method rounds up to the nearest integer. Add ``from math import ceil`` at the top of your protocol. Then calculate the number of tip racks as follows::

    tip_rack_50_count = ceil((1 + 7 * column_count) / 12)
    tip_rack_200_count = ceil((2 + 13 * column_count) / 12)

Running the numbers shows that the maximum combined number of tip racks is 7. Now we have to decide where to load up to 7 racks, working around the modules and other labware on the deck. Assuming we're running this protocol on a Flex with staging area slots, they'll all fit! (If you don't have staging area slots, you can load labware off-deck instead.) We'll reserve these slots for the different size racks::

    tip_rack_50_slots = ["B3", "C3", "B4"]
    tip_rack_200_slots = ["A2", "B2", "A3", "A4"]

Finally, we can combine this information to call :py:meth:`~.ProtocolContext.load_labware`. Depending on the number of racks needed, we'll slice that number of elements from the slot lists and use a `list comprehension <https://docs.python.org/2/tutorial/datastructures.html#list-comprehensions>`__ to gather up the loaded tip racks. For the 50 µL tips, this would look like::

    tip_racks_50 = [
        protocol.load_labware(
            load_name="opentrons_flex_96_tiprack_50ul",
            location=slot
        )
        for slot in tip_rack_50_slots[:tip_rack_50_count]
    ]

Then we can associate those lists of tip racks directly with each pipette as we load them. All together, the start of our ``run`` function looks like this::

    # calculate column count from sample count
    column_count = protocol.params.sample_count / 8

    # calculate number of required tip racks
    tip_rack_50_count = ceil((1 + 7 * column_count) / 12)
    tip_rack_200_count = ceil((2 + 13 * column_count) / 12)

    # assign tip rack locations (maximal case)
    tip_rack_50_slots = ["B3", "C3", "B4"]
    tip_rack_200_slots = ["A2", "B2", "A3", "A4"]

    # create lists of loaded tip racks
    # limit to number of needed racks for each type
    tip_racks_50 = [
        protocol.load_labware(
            load_name="opentrons_flex_96_tiprack_50ul",
            location=slot
        )
        for slot in tip_rack_50_slots[:tip_rack_50_count]
    ]
    tip_racks_200 = [
        protocol.load_labware(
            load_name="opentrons_flex_96_tiprack_200ul",
            location=slot
        )
        for slot in tip_rack_200_slots[:tip_rack_200_count]
    ]

    pipette_50 = protocol.load_instrument(
        instrument_name="flex_8channel_50",
        mount="right",
        tip_racks=tip_racks_50
    )
    pipette_1000 = protocol.load_instrument(
        instrument_name="flex_1channel_1000",
        mount="left",
        tip_racks=tip_racks_200
    )

This code will load as few as 3 tip racks and as many as 7, and associate them with the correct pipettes — all based on a single choice from a dropdown menu at run setup.

Loading Liquids
===============


Processing Samples
==================