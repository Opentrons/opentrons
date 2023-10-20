from opentrons import protocol_api


requirements = {
    "apiLevel": "2.16",
    "robotType": "Flex",
}


def run(protocol: protocol_api.ProtocolContext) -> None:
    tip_rack = protocol.load_labware("opentrons_flex_96_tiprack_1000ul", "C2")

    waste_chute = protocol.load_waste_chute(orifice="columnar_slit")

    pipette = protocol.load_instrument("flex_8channel_1000", mount="left")

    for column in tip_rack.columns():
        pipette.pick_up_tip(column[0])
        pipette.drop_tip(waste_chute)
