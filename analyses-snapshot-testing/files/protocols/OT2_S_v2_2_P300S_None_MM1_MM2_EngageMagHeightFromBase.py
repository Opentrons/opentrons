metadata = {"apiLevel": "2.2"}


def run(ctx):
    # trough = ctx.load_labware('usascientific_12_reservoir_22ml', 2)
    # tiprack1= ctx.load_labware_by_name('opentrons_96_tiprack_300ul', 6)

    magdeck = ctx.load_module("magnetic module", 1)
    magdeck_gen2 = ctx.load_module("magnetic module gen2", 4)

    tip_rack = ctx.load_labware("opentrons_96_tiprack_300ul", 5)
    pipette = ctx.load_instrument("p300_single_gen2", mount="left", tip_racks=[tip_rack])

    # You should now specify magnetic module engage height using the height_from_base
    magdeck.engage(height_from_base=15)
    magdeck_gen2.engage(height_from_base=15)

    # Return tip will now use pre-defined heights from hardware testing
    # When using the return tip function, tips are no longer added back into the tip tracker

    pipette.pick_up_tip()  # picks up tip_rack:A1
    pipette.return_tip()
    pipette.pick_up_tip()  # picks up tip_rack:B1
