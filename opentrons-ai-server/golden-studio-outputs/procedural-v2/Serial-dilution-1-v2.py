from opentrons import protocol_api

metadata = {
    "protocolName": "Serial-dilution-1-v2",
    "description": "serial dilution",
    "author": "New API User",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28"
}


def run(protocol: protocol_api.ProtocolContext):
    # Load labware
    tips = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "D1")
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", "D2")
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", "D3")
    trash = protocol.load_trash_bin("A3")

    # Load pipette
    left_pipette = protocol.load_instrument(
        "flex_1channel_1000", "left", tip_racks=[tips]
    )

    # Define liquids
    diluent_liquid = protocol.define_liquid(
        name="Diluent",
        description="Diluent liquid used to dilute the solution",
        display_color="#33FF33"
    )
    solution_liquid = protocol.define_liquid(
        name="Solution",
        description="Concentrated solution to be serially diluted",
        display_color="#FF0000"
    )

    # Assign liquids to wells before pipetting
    # Diluent occupies well A1 of the reservoir; enough for all distributions and row transfers
    reservoir["A1"].load_liquid(liquid=diluent_liquid, volume=0.8 * reservoir["A1"].max_volume)
    # Solution occupies well A2 of the reservoir; enough for all 8 row transfers
    reservoir["A2"].load_liquid(liquid=solution_liquid, volume=0.8 * reservoir["A2"].max_volume)

    # distribute diluent to all wells of the plate
    left_pipette.transfer(100, reservoir["A1"], plate.wells())

    # loop through each row
    for i in range(8):
        # save the destination row to a variable
        row = plate.rows()[i]

        # transfer solution to first well in row
        left_pipette.transfer(100, reservoir["A2"], row[0], mix_after=(3, 50))

        # dilute the sample down the row
        left_pipette.transfer(100, row[:11], row[1:], mix_after=(3, 50))
