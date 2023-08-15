:og:description: Useful code snippets for working with Opentrons robots.

.. _new-examples:

*****************
Protocol Examples
*****************

This page provides simple, ready-made protocols for Flex and OT-2. Feel free to copy and modify these examples to create unique protocols that help automate your laboratory workflows. Also, experimenting with these protocols is another way to build upon the skills you've learned from working through the :ref:`tutorial`. Try adding different hardware, labware, and commands to a sample protocol and test its validity in the Opentrons app. 

Instruments and Labware
=======================

Before getting started, you'll want to have the right instruments and labware ready for your robot. 

Code samples use the following pipettes:

* Flex 1-Channel Pipette (5-1000 µL). The API load name for this pipette is ``flex_1channel_1000``. 
* P300 Single-Channel GEN2 pipette (20-300 µL) for the OT-2. The API load name for this pipette is ``p300_single_gen2``. 

Code samples also use the labware listed below: 

.. list-table::
    :header-rows: 1

    * - Labware type
      - Labware name
      - API load name
    * - Reservoir
      - USA Scientific 12-Well Reservoir 22 mL
      - ``usascientific_12_reservoir_22ml``
    * - Well plate
      - Corning 96-Well Plate 360 µL Flat
      - ``corning_96_wellplate_360ul_flat``
    * - Flex tip rack
      - Opentrons Flex 96 Tip Rack 200 µL
      - ``opentrons_flex_96_tiprack_200ul``
    * - OT-2 tip rack
      - Opentrons 96 Tip Rack 300 µL
      - ``opentrons_96_tiprack_300ul``

Basic Transfer
==============

This example uses the :py:meth:`.InstrumentContext.transfer` method to move 100 µL of liquid from one well to another.

.. tabs::

    .. tab:: Flex

        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api

            requirements = {"robotType": "Flex", "apiLevel": "|apiLevel|"}

            def run(protocol: protocol_api.ProtocolContext):
                plate = protocol.load_labware(
                    load_name='corning_96_wellplate_360ul_flat',
                    location="D1")
                tiprack_1 = protocol.load_labware(
                    load_name='opentrons_flex_96_tiprack_200ul',
                    location="D2")
                pipette_1 = protocol.load_instrument(
                    instrument_name='flex_1channel_1000',
                    mount='left',
                    tip_racks=[tiprack_1])
                # transfer 100 µL from well A1 to well B1
                pipette_1.transfer(100, plate['A1'], plate['B1'])
                pipette_1.drop_tip()

        The code above accomplishes the same thing as the sample below but perhaps a little more efficiently. It doesn't require the :ref:`basic commands <v2-atomic-commands>` such as :py:meth:`~.InstrumentContext.pick_up_tip`, :py:meth:`~.InstrumentContext.aspirate`, or :py:meth:`~.InstrumentContext.dispense` to move liquid between well plates. However, the following protocol can be useful because the methods is uses gives you exceptionally precise control over your robot.

        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api

            requirements = {'robotType': 'Flex', 'apiLevel':'|apiLevel|'}

            def run(protocol: protocol_api.ProtocolContext):
                plate = protocol.load_labware(
                    load_name='corning_96_wellplate_360ul_flat',
                    location="D1")
                tiprack_1 = protocol.load_labware(
                    load_name='opentrons_flex_96_tiprack_200ul',
                    location="D2")
                pipette_1 = protocol.load_instrument(
                    instrument_name='flex_1channel_1000',
                    mount='left',
                tip_racks=[tiprack_1])

                pipette_1.pick_up_tip()
                pipette_1.aspirate(100, plate['A1'])
                pipette_1.dispense(100, plate['B1'])
                pipette_1.drop_tip()
    
    .. tab:: OT-2

        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api

            metadata = {'apiLevel': '|apiLevel|'}

            def run(protocol: protocol_api.ProtocolContext):
                plate = protocol.load_labware(
                    load_name='corning_96_wellplate_360ul_flat',
                    location=1)
                tiprack_1 = protocol.load_labware(
                    load_name='opentrons_96_tiprack_300ul',
                    location=2)
                p300 = protocol.load_instrument(
                    instrument_name='p300_single',
                    mount='left',
                    tip_racks=[tiprack_1])
                # transfer 100 µL from well A1 to well B1
                p300.transfer(volume=100, plate['A1'], plate['B1'])
                p300.drop_tip()
    
        The code above accomplishes the same thing as the sample below but perhaps a little more efficiently. It doesn't require the :ref:`basic commands <v2-atomic-commands>` such as :py:meth:`~.InstrumentContext.pick_up_tip`, :py:meth:`~.InstrumentContext.aspirate`, or :py:meth:`~.InstrumentContext.dispense` to move liquid between well plates. However, the following protocol can be useful because the methods is uses gives you exceptionally precise control over your robot.
        
        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api

            metadata = {'apiLevel': '|apiLevel|'}

            def run(protocol: protocol_api.ProtocolContext):
                plate = protocol.load_labware(
                    load_name='corning_96_wellplate_360ul_flat',
                    location=1)
                tiprack_1 = protocol.load_labware(
                    load_name='opentrons_96_tiprack_300ul',
                    location=2)
                p300 = protocol.load_instrument(
                    instrument_name='p300_single',
                    mount='left',
                    tip_racks=[tiprack_1])

                p300.pick_up_tip()
                p300.aspirate(100, plate['A1'])
                p300.dispense(100, plate['B1'])
                p300.drop_tip()

Loops
=====

In Python, a loop is an instruction that keeps repeating an action until a specific condition is met. 

When used in a protocol, loops automate repetitive steps such as aspirating and dispensing liquids from a reservoir to a a range of wells, or all the wells, in a well plate. For example, this code sample loops through the numbers 0 to 7, and uses the loop's current value to transfer liquid from all the wells in a reservoir to all the wells in a 96-well plate. 

.. tabs::

    .. tab:: Flex

        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api

            requirements = {'robotType': 'Flex', 'apiLevel':'|apiLevel|'}

            def run(protocol: protocol_api.ProtocolContext):
                plate = protocol.load_labware(
                    load_name='corning_96_wellplate_360ul_flat',
                    location="D1")
                tiprack_1 = protocol.load_labware(
                    load_name='opentrons_flex_96_tiprack_200ul',
                    location="D2")
                reservoir = protocol.load_labware(
                    load_name='usascientific_12_reservoir_22ml',
                    location="D3")
                pipette_1 = protocol.load_instrument(
                    instrument_name='flex_1channel_1000',
                    mount='left',
                    tip_racks=[tiprack_1])
                
                # distribute 20uL from reservoir:A1 -> plate:row:1
                # distribute 20uL from reservoir:A2 -> plate:row:2
                # etc...
                # range() starts at 0 and stops before 8, creating a range of 0-7
                for i in range(8):
                    pipette_1.distribute(200, reservoir.wells()[i], plate.rows()[i])

    .. tab:: OT-2

        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api

            metadata = {'apiLevel': '|apiLevel|'}

            def run(protocol: protocol_api.ProtocolContext):
                plate = protocol.load_labware(
                    load_name='corning_96_wellplate_360ul_flat',
                    location=1)
                tiprack_1 = protocol.load_labware(
                    load_name='opentrons_96_tiprack_300ul',
                    location=2)
                reservoir = protocol.load_labware(
                    load_name='usascientific_12_reservoir_22ml',
                    location=4)
                p300 = protocol.load_instrument(
                    instrument_name='p300_single',
                    mount='left',
                    tip_racks=[tiprack_1])
                
                # distribute 20uL from reservoir:A1 -> plate:row:1
                # distribute 20uL from reservoir:A2 -> plate:row:2
                # etc...
                # range() starts at 0 and stops before 8, creating a range of 0-7
                for i in range(8):
                    p300.distribute(200, reservoir.wells()[i], plate.rows()[i])

Notice here how `Python's range class <https://docs.python.org/3/library/stdtypes.html#range>`_ (e.g., ``range(8)``) determines how many times the code loops. Also, in Python, a range of numbers is *exclusive* of the end value and counting starts at 0, not 1. For the Corning 96-well plate used here, this means well A1=0, B1=1, C1=2, and so on to the last well in the row, which is H1=7.

Multiple Air Gaps
=================

Opentrons electronic pipettes can do some things that a human cannot do with a pipette, like accurately alternate between aspirating and creating air gaps within the same tip. The protocol shown below shows you how to aspirate from the first five wells in the reservoir, while creating an air gap between each sample.

.. tabs::

    .. tab:: Flex

        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api

            requirements = {'robotType': 'Flex', 'apiLevel':'2.15'}

            def run(protocol: protocol_api.ProtocolContext):
                plate = protocol.load_labware(
                    load_name='corning_96_wellplate_360ul_flat',
                    location="D1")
                tiprack_1 = protocol.load_labware(
                    load_name='opentrons_flex_96_tiprack_200ul',
                    location="D2")
                reservoir = protocol.load_labware(
                    load_name='usascientific_12_reservoir_22ml',
                    location="C1")
                pipette_1 = protocol.load_instrument(
                    instrument_name='flex_1channel_1000', 
                    mount='left',
                    tip_racks=[tiprack_1])

                pipette_1.pick_up_tip()

                # aspirate from the first 5 wells
                for well in reservoir.wells()[:4]:
                    pipette_1.aspirate(volume=35, location=well)
                    pipette_1.air_gap(10)
        
                pipette_1.dispense(225, plate['A1'])

                pipette_1.return_tip()

    .. tab:: OT-2

        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api

            metadata = {'apiLevel': '|apiLevel|'}

            def run(protocol: protocol_api.ProtocolContext):
                plate = protocol.load_labware(
                    load_name='corning_96_wellplate_360ul_flat',
                    location=1)
                tiprack_1 = protocol.load_labware(
                    load_name='opentrons_96_tiprack_300ul',
                    location=2)
                reservoir = protocol.load_labware(
                    load_name='usascientific_12_reservoir_22ml',
                    location=4)
                p300 = protocol.load_instrument(
                    instrument_name='p300_single', 
                    mount='right',
                    tip_racks=[tiprack_1])

                p300.pick_up_tip()

                # aspirate from the first 5 wells
                for well in reservoir.wells()[:4]:
                    p300.aspirate(volume=35, location=well)
                    p300.air_gap(10)
        
                p300.dispense(225, plate['A1'])

                p300.return_tip()

Notice here how `Python's slice class <https://docs.python.org/3/library/functions.html#slice>`_ (in the code sample as ``[:4]``) lets us select the first five wells of the well plate only. Also, in Python, a range of numbers is *exclusive* of the end value and counting starts at 0, not 1. For the Corning 96-well plate used here, this means well A1=0, B1=1, C1=2, and so on to the last well, which is E1=4. See also, the :ref:`tutorial-commands` section of the Tutorial.

Dilution
========

This protocol dispenses diluent to all wells of a Corning 96-well plate. Next, it dilutes eight samples from the reservoir across all 8 columns of the plate.

.. tabs::

    .. tab:: Flex

        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api

            requirements = {'robotType':'Flex', 'apiLevel': '2.15'}

            def run(protocol: protocol_api.ProtocolContext):
                plate = protocol.load_labware(
                    load_name='corning_96_wellplate_360ul_flat',
                    location="D2")
                tiprack_1 = protocol.load_labware(
                    load_name='opentrons_flex_96_tiprack_200ul',
                    location="C1")
                tiprack_2 = protocol.load_labware(
                    load_name='opentrons_flex_96_tiprack_200ul',
                    location="C2")
                reservoir = protocol.load_labware(
                    load_name='usascientific_12_reservoir_22ml',
                    location="D1")
                pipette_1 = protocol.load_instrument(
                    instrument_name='flex_1channel_1000',
                    mount='left',
                    tip_racks=[tiprack_1, tiprack_2])
                # Dispense diluent
                pipette_1.distribute(50, reservoir['A12'], plate.wells())

                # loop through each row
                for i in range(8):
                    # save the source well and destination column to variables
                    source = reservoir.wells()[i]
                    row = plate.rows()[i]

                # transfer 30uL of source to first well in column
                pipette_1.transfer(30, source, row[0], mix_after=(3, 25))

                # dilute the sample down the column
                pipette_1.transfer(
                    30, row[:11], row[1:],
                    mix_after=(3, 25))
    
    .. tab:: OT-2

        .. code-block:: python
            :substitutions:

            from opentrons import protocol_api

            metadata = {'apiLevel': '2.15'}

            def run(protocol: protocol_api.ProtocolContext):
                plate = protocol.load_labware(
                    load_name='corning_96_wellplate_360ul_flat',
                    location=1)
                tiprack_1 = protocol.load_labware(
                    load_name='opentrons_96_tiprack_300ul',
                    location=2)
                tiprack_2 = protocol.load_labware(
                    load_name='opentrons_96_tiprack_300ul',
                    location=3)
            reservoir = protocol.load_labware(
                    load_name='usascientific_12_reservoir_22ml',
                    location=4)
            p300 = protocol.load_instrument(
                    instrument_name='p300_single',
                    mount='right',
                    tip_racks=[tiprack_1, tiprack_2])
            # Dispense diluent
            p300.distribute(50, reservoir['A12'], plate.wells())

            # loop through each row
            for i in range(8):
                # save the source well and destination column to variables
                source = reservoir.wells()[i]
                source = reservoir.wells()[i]
                row = plate.rows()[i]

            # transfer 30uL of source to first well in column
            p300.transfer(30, source, row[0], mix_after=(3, 25))

            # dilute the sample down the column
            p300.transfer(
                30, row[:11], row[1:],
                mix_after=(3, 25))

Notice here how the code sample loops through the rows and uses slicing to distribute the diluent. For information about these features, see Loops and Air Gaps above. The :ref:`tutorial-commands` section of the Tutorial as well. 

Plate Mapping
=============

This example deposits various volumes of liquids into the same plate of wells and automatically refill the tip volume when it runs out.

.. code-block:: python
    :substitutions:

    from opentrons import protocol_api

    metadata = {'apiLevel': '|apiLevel|'}

    def run(protocol: protocol_api.ProtocolContext):
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat', 1)
        tiprack_1 = protocol.load_labware('opentrons_96_tiprack_300ul', 2)
        tiprack_2 = protocol.load_labware('opentrons_96_tiprack_300ul', 3)
        reservoir = protocol.load_labware('usascientific_12_reservoir_22ml', 4)
        p300 = protocol.load_instrument('p300_single', 'right', tip_racks=[tiprack_1, tiprack_2])

        # these uL values were created randomly for this example
        water_volumes = [
            1,  2,  3,  4,  5,  6,  7,  8,
            9,  10, 11, 12, 13, 14, 15, 16,
            17, 18, 19, 20, 21, 22, 23, 24,
            25, 26, 27, 28, 29, 30, 31, 32,
            33, 34, 35, 36, 37, 38, 39, 40,
            41, 42, 43, 44, 45, 46, 47, 48,
            49, 50, 51, 52, 53, 54, 55, 56,
            57, 58, 59, 60, 61, 62, 63, 64,
            65, 66, 67, 68, 69, 70, 71, 72,
            73, 74, 75, 76, 77, 78, 79, 80,
            81, 82, 83, 84, 85, 86, 87, 88,
            89, 90, 91, 92, 93, 94, 95, 96
          ]

        p300.distribute(water_volumes, reservoir['A12'], plate.wells())
