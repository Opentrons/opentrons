from opentrons import protocol_api

metadata = {
    "protocolName": "Flex Testosaur",
    "author": "Opentrons <engineering@opentrons.com>",
    "description": 'A Flex variant on "Dinosaur" for testing',
    "source": "Opentrons Repository",
}

requirements = {"robotType": "Flex", "apiLevel": "2.16"}


def run(ctx: protocol_api.ProtocolContext) -> None:
    ctx.load_trash_bin("A3")
    tr = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "D1")
    right = ctx.load_instrument("flex_1channel_1000", "right", tip_racks=[tr])
    lw = ctx.load_labware("corning_96_wellplate_360ul_flat", "D2")
    right.pick_up_tip()
    right.aspirate(100, lw.wells()[0].bottom())
    right.dispense(100, lw.wells()[1].bottom())
    right.drop_tip()
