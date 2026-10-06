from opentrons import protocol_api

metadata = {
    "protocolName": "Serial-dilution-4-v2",
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
    pipette = protocol.load_instrument(
        "p300_multi_gen2",
        "right",
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

    # Assign liquids to wells
    reservoir.wells_by_name()["A1"].load_liquid(liquid=diluent_liquid, volume=15000)
    reservoir.wells_by_name()["A2"].load_liquid(liquid=solution_liquid, volume=15000)

    # Distribute diluent to the first row of the plate
    pipette.transfer(100, reservoir["A1"], plate.rows()[0])

    # Transfer solution to first column, mix
    row = plate.rows()[0]
    pipette.transfer(100, reservoir["A2"], row[0], mix_after=(3, 50))

    # Perform serial dilution down the row
    pipette.transfer(100, row[:11], row[1:], mix_after=(3, 50))
