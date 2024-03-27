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

We want to limit the number of samples to 8, 16, 24, or 32, so we'll use an integer parameter with choices.::

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


Loading Liquids
===============


Processing Samples
==================