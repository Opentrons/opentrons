from opentrons import protocol_api, types

metadata = {
    "protocolName": "Testosaur",
    "author": "Opentrons <engineering@opentrons.com>",
    "description": 'A variant on "Dinosaur" for testing',
    "source": "Opentrons Repository",
    "apiLevel": "2.0",
}


def run(ctx: protocol_api.ProtocolContext) -> None:
    tr = ctx.load_labware("opentrons_96_tiprack_300ul", 5)
    right = ctx.load_instrument("p300_single_gen2", types.Mount.RIGHT, [tr])

    right.move_to(tr.wells()[0].top())
    # lw = ctx.load_labware("corning_96_wellplate_360ul_flat", 2)
    # right.pick_up_tip()
    # right.aspirate(10, lw.wells()[0].bottom())
    # right.dispense(10, lw.wells()[1].bottom())
    # right.drop_tip(tr.wells()[-1].top())
