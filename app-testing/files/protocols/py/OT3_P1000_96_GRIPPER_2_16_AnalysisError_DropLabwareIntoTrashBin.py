from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol - Analysis Error - Drop Labware in Trash Bin",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.16",
}

def run(ctx: protocol_api.ProtocolContext) -> None:
    trash_bin = ctx.load_trash_bin("C3")
    tip_rack = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A1", adapter="opentrons_flex_96_tiprack_adapter")
    pipette_96_channel = ctx.load_instrument("flex_96channel_1000", mount="left", tip_racks=[tip_rack])
    pipette_96_channel.pick_up_tip()
    pipette_96_channel.drop_tip(trash_bin)
    ctx.move_labware(tip_rack, "C3", use_gripper=True)
    
    
