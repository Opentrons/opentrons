.. _new-examples:

########
Examples
########

All examples on this page use a ``'corning_96_wellplate_360ul_flat'`` (`an ANSI standard 96-well plate <https://labware.opentrons.com/corning_96_wellplate_360ul_flat>`_) in slot 1, and two ``'opentrons_96_tiprack_300ul'`` (`the Opentrons standard 300 µL tiprack <https://labware.opentrons.com/opentrons_96_tiprack_300ul>`_) in slots 2 and 3. They also require a P300 Single attached to the right mount. Some examples also use a ``'usascientific_12_reservoir_22ml'`` (`a USA Scientific 12-row reservoir <https://labware.opentrons.com/usascientific_12_reservoir_22ml>`_) in slot 4.

******************************

**************
Basic Transfer
**************

Moving 100 µL from one well to another:

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.0'}

    def run(protocol: protocol_api.ProtocolContext):
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat', 1)
        tiprack_1 = protocol.load_labware('opentrons_96_tiprack_300ul', 2)
        p300 = protocol.load_instrument('p300_single', 'right', tip_racks=[tiprack_1])

        p300.transfer(100, plate['A1'], plate['B1'])


This accomplishes the same thing as the following basic commands:

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.0'}

    def run(protocol: protocol_api.ProtocolContext):
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat', 1)
        tiprack_1 = protocol.load_labware('opentrons_96_tiprack_300ul', 2)
        p300 = protocol.load_instrument('p300_single', 'right', tip_racks=[tiprack_1])

        p300.pick_up_tip()
        p300.aspirate(100, plate.wells('A1'))
        p300.dispense(100, plate.wells('A1'))
        p300.return_tip()

******************************

*****
Loops
*****

Loops in Python allow your protocol to perform many actions, or act upon many wells, all within just a few lines. The below example loops through the numbers ``0`` to ``11``, and uses that loop's current value to transfer from all wells in a reservoir to each row of a plate:

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.0'}

    def run(protocol: protocol_api.ProtocolContext):
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat', 1)
        tiprack_1 = protocol.load_labware('opentrons_96_tiprack_300ul', 2)
        reservoir = protocol.load_labware('usascientific_12_reservoir_22ml', 4)
        p300 = protocol.load_instrument('p300_single', 'right', tip_racks=[tiprack_1])
        # distribute 20uL from reservoir:A1 -> plate:row:1
        # distribute 20uL from reservoir:A2 -> plate:row:2
        # etc...

        # range() starts at 0 and stops before 8, creating a range of 0-7
        for i in range(8):
            p300.distribute(200, reservoir.wells()[i], plate.rows()[i])

******************************

*****************
Multiple Air Gaps
*****************

The OT-2 pipettes can do some things that a human cannot do with a pipette, like accurately alternate between aspirating and creating air gaps within the same tip. The below example will aspirate from five wells in the reservoir, while creating an air gap between each sample.

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.0'}

    def run(protocol: protocol_api.ProtocolContext):
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat', 1)
        tiprack_1 = protocol.load_labware('opentrons_96_tiprack_300ul', 2)
        reservoir = protocol.load_labware('usascientific_12_reservoir_22ml', 4)
        p300 = protocol.load_instrument('p300_single', 'right', tip_racks=[tiprack_1])
        p300.pick_up_tip()

        for well in reservoir.wells():
            p300.aspirate(35, well)
            p300.air_gap(10)
            p300.dispense(45, plate['A1'])

        p300.return_tip()

******************************

********
Dilution
********

This example first spreads a diluent to all wells of a plate. It then dilutes 8 samples from the reservoir across the 8 columns of the plate.

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.0'}

    def run(protocol: protocol_api.ProtocolContext):
        plate = protocol.load_labware('corning_96_wellplate_360ul_flat', 1)
        tiprack_1 = protocol.load_labware('opentrons_96_tiprack_300ul', 2)
        tiprack_2 = protocol.load_labware('opentrons_96_tiprack_300ul', 3)
        reservoir = protocol.load_labware('usascientific_12_reservoir_22ml', 4)
        p300 = protocol.load_instrument('p300_single', 'right', tip_racks=[tiprack_1, tiprack_2])
        p300.distribute(50, reservoir['A12'], plate.wells())  # dilutent

        # loop through each row
        for i in range(8):

            # save the source well and destination column to variables
            source = reservoir.wells()[i]
            row = plate.rows()[i]

            # transfer 30uL of source to first well in column
            p300.transfer(30, source, row[0], mix_after=(3, 25))

            # dilute the sample down the column
            p300.transfer(
                30, row[:11], row[1:],
                mix_after=(3, 25))

******************************

*************
Plate Mapping
*************

This example deposits various volumes of liquids into the same plate of wells and automatically refill the tip volume when it runs out.

.. code-block:: python

    from opentrons import protocol_api

    metadata = {'apiLevel': '2.0'}

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
