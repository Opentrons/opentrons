from opentrons import protocol_api

metadata = {
    "protocolName": "Serial-dilution-3-v2",
    "author": "New API User",
    "description": """This protocol is the outcome of following the
                   Python Protocol API Tutorial located at
                   https://docs.opentrons.com/v2/tutorial.html. It takes a
                   solution and progressively dilutes it by transferring it
                   stepwise across a plate.""",
    "source": "OpentronsAI",
}

requirements = {"robotType": "OT-2", "apiLevel": "2.28"}


def run(protocol: protocol_api.ProtocolContext):
    # Labware
    tips = protocol.load_labware("opentrons_96_tiprack_300ul", "1")
    reservoir = protocol.load_labware("nest_12_reservoir_15ml", "2")
    plate = protocol.load_labware("nest_96_wellplate_200ul_flat", "3")

    # Pipette
    left_pipette = protocol.load_instrument("p300_single_gen2", "left", tip_racks=[tips])

    # Define liquids
    diluent = protocol.define_liquid(
        name="Diluent",
        description="Diluent used to fill all wells of the plate",
        display_color="#33AAFF",
    )
    solution = protocol.define_liquid(
        name="Solution",
        description="Solution to be serially diluted down each row",
        display_color="#FF3355",
    )

    # Label liquids in the reservoir (before any pipetting uses these wells)
    # Diluent: 96 wells x 100 uL = 9600 uL needed, plus overage
    # Solution: 8 rows x 100 uL = 800 uL needed, plus overage
    reservoir.load_liquid(wells=[reservoir["A1"]], volume=10000, liquid=diluent)
    reservoir.load_liquid(wells=[reservoir["A2"]], volume=1000, liquid=solution)

    # Distribute diluent to all wells of the plate (one tip)
    left_pipette.transfer(100, reservoir["A1"], plate.wells(), new_tip="once")

    # Loop through each of the 8 rows
    for i in range(8):
        row = plate.rows()[i]

        # Transfer solution to first well of the row, mix 3x with 50 uL
        left_pipette.transfer(
            100, reservoir["A2"], row[0], mix_after=(3, 50), new_tip="once"
        )

        # Serial dilution down the row: 11 transfers, mix 3x with 50 uL after each
        left_pipette.transfer(
            100, row[:11], row[1:], mix_after=(3, 50), new_tip="once"
        )
