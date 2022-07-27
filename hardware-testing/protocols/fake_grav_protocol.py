metadata = {"apiLevel": "2.12"}


def run(ctx):
    tiprack = ctx.load_labware('opentrons_96_tiprack_300uL', '8')
    vial = ctx.load_labware('radwag_pipette_calibration_vial', '6')
    pipette = ctx.load_instrument('p300_single_gen2', 'left', tip_racks=[tiprack])
    pipette.pick_up_tip()
    pipette.aspirate(pipette.min_volume, vial['A1'])
    pipette.dispense(pipette.min_volume, vial['A1'])
    pipette.drop_tip()
