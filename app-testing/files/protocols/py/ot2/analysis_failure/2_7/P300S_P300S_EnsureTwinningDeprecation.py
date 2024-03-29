# metadata
metadata = {
    "protocolName": "My Protocol",
    "author": "Name <email@address.com>",
    "description": "Simple paired pipette protocol",
    "apiLevel": "2.7",
}


def run(ctx):
    tiprack = ctx.load_labware("opentrons_96_tiprack_300ul", 1)
    labware = ctx.load_labware("usascientific_12_reservoir_22ml", 2)
    other_labware = ctx.load_labware("corning_96_wellplate_360ul_flat", 3)
    right_pipette = ctx.load_instrument("p300_single_gen2", "right", tip_racks=[tiprack])
    left_pipette = ctx.load_instrument("p300_single_gen2", "left", tip_racks=[tiprack])
    left_pipette.pick_up_tip()
    left_pipette.aspirate(20, other_labware["A1"])
    left_pipette.dispense(20, other_labware["A1"])
    left_pipette.drop_tip()
    # In this scenario, the left pipette is the primary pipette
    # while the right pipette is the secondary pipette. All XY
    # locations will be based on the right pipette.
    left_paired_with_right = left_pipette.pair_with(right_pipette)

