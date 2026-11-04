from opentrons import protocol_api

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.28",
}

metadata = {
    "protocolName": "96ch partial column return tip",
    "description": "COLUMN A12; return_tip; move tips across racks.",
}


def run(protocol_context: protocol_api.ProtocolContext):
    tiprack_1 = protocol_context.load_labware("opentrons_flex_96_tiprack_50ul", "D1")
    tiprack_2 = protocol_context.load_labware("opentrons_flex_96_tiprack_50ul", "D3")
    protocol_context.load_trash_bin("A3")
    pipette = protocol_context.load_instrument("flex_96channel_200", "right")

    pipette.configure_nozzle_layout(
        protocol_api.COLUMN,
        start="A12",
        tip_racks=[tiprack_1],
    )

    pipette.pick_up_tip()
    pipette.return_tip()

    tiprack_2.set_empty()
    for source_well, target_well in zip(tiprack_1.rows()[0], tiprack_2.rows()[0]):
        pipette.pick_up_tip(source_well)
        pipette.drop_tip(target_well)
