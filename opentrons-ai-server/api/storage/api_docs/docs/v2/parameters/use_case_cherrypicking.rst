:og:description: How to use a CSV parameter to perform cherrypicking in an Opentrons Python protocol.

.. _use-case-cherrypicking:

**********************************
Parameter Use Case – Cherrypicking
**********************************

A common liquid handling task is `cherrypicking`: pipetting liquid from only certain wells on a source plate and placing them in order on a destination plate. This use case demonstrates how to use a CSV runtime parameter to automate this process and to customize it on every run — without having to modify the Python protocol itself.

In this simple example, the CSV will only control:

  - Source slot
  - Source well
  - Volume to transfer

The destination labware and well order will remain fixed, to focus on using these three pieces of data with the :py:meth:`.transfer` function. In actual use, you can further customize pipetting behavior by adding more runtime parameters or by adding columns to your CSV file.

Preparing the CSV
=================

To get started, let's set up the CSV parameter. The data format we expect for this protocol is simple enough to fully explain in the parameter's description.

.. code-block:: python

    def add_parameters(parameters):
    
        parameters.add_csv_file(
            variable_name="cherrypicking_wells",
            display_name="Cherrypicking wells",
            description=(
                "Table with three columns:"
                " source slot, source well,"
                " and volume to transfer in µL."
            )
        )

Here is an example of a CSV file that fits this format, specifying three wells across two plates:

.. code-block:: text

    source slot,source well,volume
    D1,A1,50
    D1,C4,30
    D2,H1,50

The protocol will rely on the data being structured exactly this way, with a header row and the three columns in this order. The technician would select this, or another file with the same structure, during run setup.

Our protocol will use the information contained in the selected CSV for loading labware in the protocol and performing the cherrypicking transfers.

Parsing the CSV
===============

We'll use the Python API's :py:meth:`.parse_as_csv` method to allow easy access to different portions of the CSV data at different points in the protocol::

    def run(protocol):

        well_data = protocol.params.cherrypicking_wells.parse_as_csv()

Now ``well_data`` is a list with four elements, one for each row in the file. We'll use the rows in a ``for`` loop later in the protocol, when it's time to transfer liquid.

Loading Source Labware
======================

We'll use the data from the ``source slot`` column as part of loading the source labware. Let's assume that we always use Opentrons Tough PCR plates for both source and destination plates. Then we need to determine the locations for loading source plates from the first column of the CSV. This will have three steps:

  - Using a list comprehension to get data from the ``source slot`` column.
  - Deduplicating the items in the column.
  - Looping over the unique items to load the plates.
  
First, we'll get all of the data from the first column of the CSV, using a list comprehension. Then we'll take a slice of the resulting list to remove the header::

    source_slots = [row[0] for row in well_data][1:]
    # ['D1', 'D1', 'D2']

Next, we'll get the unique items in the list by converting it to a :py:obj:`set` and back to a list::

    unique_source_slots = list(set(source_slots))
    # ['D1', 'D2']

Finally, we'll loop over those slot names to load labware::

    for slot in unique_source_slots::
        protocol.load_labware(
            load_name="opentrons_96_wellplate_200ul_pcr_full_skirt", 
            location=slot
        )

Note that loading labware in a loop like this doesn't assign each labware instance to a variable. That's fine, because we'll use :py:obj:`.ProtocolContext.deck` to refer to them by slot name later on.

The entire start of the ``run()`` function, including a pipette and fixed labware (i.e., labware not affected by the CSV runtime parameter) will look like this:

.. code-block:: python
    :substitutions:

    from opentrons import protocol_api
    
    requirements = {"robotType": "Flex", "apiLevel": "|apiLevel|"}
    
    def add_parameters(parameters):
    
        parameters.add_csv_file(
            variable_name="cherrypicking_wells",
            display_name="Cherrypicking wells",
            description=(
                "Table with three columns:"
                " source slot, source well,"
                " and volume to transfer in µL."
            )
        )
    
    def run(protocol: protocol_api.ProtocolContext):
        well_data = protocol.params.cherrypicking_wells.parse_as_csv()
        source_slots = [row[0] for row in well_data][1::]
        unique_source_slots = list(set(source_slots))
    
        # load tip rack in deck slot C1
        tiprack = protocol.load_labware(
            load_name="opentrons_flex_96_tiprack_1000ul", location="C1"
        )
        # attach pipette to left mount
        pipette = protocol.load_instrument(
            instrument_name="flex_1channel_1000",
            mount="left",
            tip_racks=[tiprack]
        )
        # load trash bin
        trash = protocol.load_trash_bin("A3")
        # load destination plate in deck slot C2
        dest_plate = protocol.load_labware(
            load_name="opentrons_96_wellplate_200ul_pcr_full_skirt",
            location="C2"
        )
        # load source plates based on CSV data
        for slot in unique_source_slots:
            protocol.load_labware(
                load_name="opentrons_96_wellplate_200ul_pcr_full_skirt", 
                location=slot
            )

Picking the Cherries
====================

Now it's time to transfer liquid based on the data in each row of the CSV. 

Once again we'll start by slicing off the header row of ``well_data``. Each remaining row has the source slot, source well, and volume data that we can directly pass to :py:meth:`.transfer`. 

We also need to specify the destination well. We want the destinations to proceed in order according to :py:meth:`.Labware.wells`. To track this all in a single loop, we'll wrap our CSV data in an :py:obj:`.enumerate` object to provide an index that increments each time through the loop. All together, the transfer loop looks like this::

    for index, row in enumerate(well_data[1::]):
        # get source location from CSV
        source_slot = row[0]
        source_well = row[1]
        source_location = protocol.deck[source_slot][source_well]
        
        # get volume as a number
        transfer_volume = float(row[2])
        
        # get destination location from loop index
        dest_location = dest_plate.wells()[index]
        
        # perform parameterized transfer
        pipette.transfer(
            volume=transfer_volume,
            source=source_location,
            dest=dest_location
        )

Let's unpack this. For each time through the loop, we build the source location from the first (``row[0]``) and second (``row[1]``) item in the row list. We then construct a complete location with respect to ``protocol.deck``.

Next, we get the volume for the transfer. All CSV data is treated as strings, so we have to cast it to a floating point number.

The last piece of information needed is the destination well. We take the index of the current iteration through the loop, and use that same index with respect to the ordered list of all wells on the destination plate.

With all the information gathered and stored in variables, all that's left is to pass that information as the arguments of ``transfer()``. With our example file, this will execute three transfers. By using a different CSV at run time, this code could complete up to 96 transfers (at which point it would run out of both tips and destination wells). 

For more complex transfer behavior — such as adjusting location within the well — you could extend the CSV format and the associated code to work with additional data. And check out the `verified cherrypicking protocol <https://library.opentrons.com/p/flex-custom-parameters-cherrypicking>`_ in the Opentrons Protocol Library for further automation based on CSV data, including loading different types of plates, automatically loading tip racks, and more.
