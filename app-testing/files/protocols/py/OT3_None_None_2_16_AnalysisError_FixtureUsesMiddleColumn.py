from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol - Invalid Deck Configuration 1 - Fixture Uses Middle Column",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.16",
}

THERMOCYCLER_NAME = "thermocycler module gen2"
MAGNETIC_BLOCK_NAME = "magneticBlockV1"
PCR_PLATE_96_NAME = "nest_96_wellplate_100ul_pcr_full_skirt"
TIPRACK_96_NAME = "opentrons_flex_96_tiprack_1000ul"
HEATER_SHAKER_NAME = "heaterShakerModuleV1"
TEMPERATURE_MODULE_NAME = "temperature module gen2"

USING_GRIPPER = True


def run(ctx: protocol_api.ProtocolContext) -> None:

    ################
    ### FIXTURES ###
    ################

    trash_bin_1 = ctx.load_trash_bin("C2")
