from opentrons import types

metadata = {
    "protocolName": "Testosaur Version 3",
    "author": "Opentrons <engineering@opentrons.com>",
    "description": 'A variant on "Dinosaur" for testing with Protocol API v3',
    "source": "Opentrons Repository",
    "apiLevel": "3.0",
}


def run(ctx):
    tip_rack = ctx.load_labware("opentrons_96_tiprack_300ul", 8)
    source = ctx.load_labware("nest_12_reservoir_15ml", 1)
    dest = ctx.load_labware("corning_96_wellplate_360ul_flat", 2)

    pipette = ctx.load_instrument("p300_single_gen2", types.Mount.RIGHT, [])

    for i in range(4):
        pipette.pick_up_tip(tip_rack.wells()[i])
        pipette.aspirate(50, source.wells_by_name()["A1"])
        pipette.dispense(50, dest.wells()[i])
        pipette.drop_tip(tip_rack.wells()[i])
