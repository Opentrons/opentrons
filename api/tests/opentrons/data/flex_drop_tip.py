from opentrons import protocol_api

requirements = {"robotType": "Flex", "apiLevel": "2.16"}


def run(ctx: protocol_api.ProtocolContext) -> None:
    ctx.load_trash_bin("A3")
    tipracks = [ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")]
    m1000 = ctx.load_instrument("flex_8channel_1000", "right", tipracks)

    m1000.pick_up_tip()
    m1000.drop_tip()
