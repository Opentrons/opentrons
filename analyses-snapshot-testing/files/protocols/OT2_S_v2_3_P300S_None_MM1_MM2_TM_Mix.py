metadata = {"apiLevel": "2.3"}


def run(ctx):
    # trough = ctx.load_labware('usascientific_12_reservoir_22ml', 2)
    # tiprack1= ctx.load_labware_by_name('opentrons_96_tiprack_300ul', 6)

    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", 2)

    tip_rack = ctx.load_labware("opentrons_96_tiprack_300ul", 5)
    pipette = ctx.load_instrument("p300_single_gen2", mount="left", tip_racks=[tip_rack])
    # Magnetic Modules GEN2 and Temperature Modules GEN2 are now supported
    magdeck = ctx.load_module("magnetic module", 1)
    magdeck_gen2 = ctx.load_module("magnetic module gen2", 4)
    tempdeck = ctx.load_module("temperature module gen2", 6)
    # During a Mix, the pipette will no longer move up to clear the liquid in between every dispense and following aspirate
    pipette.pick_up_tip()
    pipette.mix(4, 100, plate["A1"])
