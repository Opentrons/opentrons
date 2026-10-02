from opentrons import protocol_api

metadata = {
    "protocolName": "Serial-dilution-3-v2",
    "description": """This protocol is the outcome of following the
                   Python Protocol API Tutorial located at
                   https://docs.opentrons.com/v2/tutorial.html. It takes a
                   solution and progressively dilutes it by transferring it
                   stepwise across a plate.""",
    "author": "New API User"
}

requirements = {
    "robotType": "OT-2",
    "apiLevel": "2.28"
}


def run(protocol: protocol_api.ProtocolContext):
    # Load labware
    tips = protocol.load_labware("opentrons_96_tiprack_300ul", 1)
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", 2)
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", 3)

    # Load pipette
    left_pipette = protocol.load_instrument(
        "p300_single_gen2",
        "left",
        tip_racks=[tips]
    )

    # Define liquids
    diluent_liquid = protocol.define_liquid(
        name="Diluent",
        description="Diluent liquid used to dilute the solution",
        display_color="#33FF33"
    )
    solution_liquid = protocol.define_liquid(
        name="Solution",
        description="Solution to be serially diluted",
        display_color="#FF0000"
    )

    # Load liquids into wells before pipetting
    diluent_well = reservoir["A1"]
    solution_well = reservoir["A2"]

    diluent_well.load_liquid(liquid=diluent_liquid, volume=0.8 * diluent_well.max_volume)
    solution_well.load_liquid(liquid=solution_liquid, volume=0.8 * solution_well.max_volume)

    # All plate wells start empty; diluent will be added, so assign 0 volume of diluent
    # to the plate wells to declare intended future contents is unnecessary since
    # load_liquid should reflect actual starting contents. Plate wells start empty,
    # so no load_liquid call is needed for them at protocol start.

    # Distribute diluent to all wells of the plate
    left_pipette.transfer(100, diluent_well, plate.wells())

    # Perform serial dilution for each of the 8 rows
    for i in range(8):
        row = plate.rows()[i]

        # Transfer solution to the first well of the row and mix
        left_pipette.transfer(100, solution_well, row[0], mix_after=(3, 50))

        # Serial dilution down the row
        left_pipette.transfer(100, row[:11], row[1:], mix_after=(3, 50))
