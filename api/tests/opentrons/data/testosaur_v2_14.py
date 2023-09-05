from opentrons import protocol_api, types

metadata = {
    "protocolName": "Testosaur",
    "author": "Opentrons <engineering@opentrons.com>",
    "description": 'A variant on "Dinosaur" for testing',
    "source": "Opentrons Repository",
    "apiLevel": "2.14",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    ctx.home()
    tr = ctx.load_labware("opentrons_96_tiprack_1000ul", 1)
    right = ctx.load_instrument("p1000_single", types.Mount.RIGHT, [tr])
    lw = ctx.load_labware("corning_96_wellplate_360ul_flat", 2)
    right.pick_up_tip()
    right.aspirate(100, lw.wells()[0].bottom())
    right.dispense(100, lw.wells()[1].bottom())
    right.drop_tip(tr.wells()[-1].top())
