from opentrons import protocol_api

requirements = {"robotType": "OT-2", "apiLevel": "2.16"}


def run(ctx: protocol_api.ProtocolContext) -> None:
    tipracks = [ctx.load_labware("opentrons_96_tiprack_300ul", "5")]
    m300 = ctx.load_instrument("p300_multi_gen2", "right", tipracks)

    m300.pick_up_tip()
    m300.drop_tip()
