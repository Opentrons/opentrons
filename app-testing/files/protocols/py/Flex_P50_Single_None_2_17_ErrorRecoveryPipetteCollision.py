metadata = {
    "protocolName": "Error Recovery Testing Protocol - Pipette Collision",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {"robotType": "Flex", "apiLevel": "2.17"}


def run(ctx):
    tip_rack = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "D2")
    left_pipette = ctx.load_instrument("flex_1channel_50", mount="left")

    ctx.load_trash_bin("A3")
    d1_position = ctx.deck.position_for("D1")
    d2_position = ctx.deck.position_for("D2")
    left_pipette.move_to(d1_position)

    # Very slowly crash the pipette into the tip rack
    left_pipette.move_to(d2_position, speed=50)

    # Enter error recovery state

    # After error recovery, pipette should be un-crashed (if that is a word)
    left_pipette.pick_up_tip(tip_rack)
    