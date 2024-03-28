requirements = {"robotType": "Flex", "apiLevel": "2.17"}


def run(ctx):
    full_tip_rack = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "D2")
    empty_tip_rack = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "D3")
    left_pipette = ctx.load_instrument("flex_1channel_50", mount="left")

    ctx.load_trash_bin("A3")
    left_pipette.pick_up_tip(empty_tip_rack)

    # Enter error recovery state

    # After error recovery, there should be a tip on the pipette
    left_pipette.return_tip()
