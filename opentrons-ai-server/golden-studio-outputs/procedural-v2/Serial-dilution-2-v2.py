from opentrons import protocol_api

metadata = {
    "protocolName": "Serial-dilution-2-v2",
    "author": "OpentronsAI",
    "description": """This protocol is the outcome of following the
                   Python Protocol API Tutorial located at
                   https://docs.opentrons.com/v2/tutorial.html. It takes a
                   solution and progressively dilutes it by transferring it
                   stepwise across a plate.""",
    "source": "OpentronsAI",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28"
}


def run(protocol: protocol_api.ProtocolContext):
    # Load labware
    tips = protocol.load_labware("opentrons_96_tiprack_300ul", "D1")
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", "D2")
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", "D3")

    # Load trash bin
    trash = protocol.load_trash_bin("A3")

    # Load pipette
    pipette = protocol.load_instrument(
        "flex_8channel_1000",
        "right",
        tip_racks=[tips]
    )

    # Define liquids
    diluent_liquid = protocol.define_liquid(
        name="Diluent",
        description="Diluent liquid used for serial dilution",
        display_color="#33FF33"
    )
    solution_liquid = protocol.define_liquid(
        name="Solution",
        description="Concentrated solution to be serially diluted",
        display_color="#FF0000"
    )

    # Assign liquids to wells before pipetting
    # Diluent in reservoir well A1 (enough for 11 transfers of 100 uL to row A of plate)
    reservoir["A1"].load_liquid(liquid=diluent_liquid, volume=15000)
    # Solution in reservoir well A2
    reservoir["A2"].load_liquid(liquid=solution_liquid, volume=15000)
    # Plate wells start empty
    for well in plate.rows()[0]:
        well.load_liquid(liquid=diluent_liquid, volume=0)

    # Distribute diluent to the first row of the plate
    pipette.transfer(100, reservoir["A1"], plate.rows()[0])

    # Transfer solution to the first well of the first row, mix after
    row = plate.rows()[0]
    pipette.transfer(100, reservoir["A2"], row[0], mix_after=(3, 50))

    # Perform serial dilution down the row (11 transfers)
    pipette.transfer(100, row[:11], row[1:], mix_after=(3, 50))
