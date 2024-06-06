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
    left_paired_with_right.pick_up_tip()
    left_paired_with_right.aspirate(20, labware["A1"])
    left_paired_with_right.air_gap(10)
    left_paired_with_right.dispense(30, labware["A1"])
    left_paired_with_right.touch_tip(radius=0.5)
    left_paired_with_right.drop_tip()

    left_paired_with_right.pick_up_tip()
    left_paired_with_right.mix(volume=20, location=labware["A1"])
    left_paired_with_right.aspirate(volume=20)
    left_paired_with_right.dispense(volume=20)
    left_paired_with_right.mix(volume=200)
    left_paired_with_right.touch_tip(v_offset=-3)
    left_paired_with_right.drop_tip()

    left_paired_with_right.pick_up_tip()
    left_paired_with_right.mix(location=labware["A1"])
    left_paired_with_right.blow_out()
    left_paired_with_right.aspirate()
    left_paired_with_right.dispense()
    left_paired_with_right.touch_tip(other_labware["A1"])
    left_paired_with_right.drop_tip()

    for _ in range(8):
        left_paired_with_right.pick_up_tip()
        left_paired_with_right.return_tip()
