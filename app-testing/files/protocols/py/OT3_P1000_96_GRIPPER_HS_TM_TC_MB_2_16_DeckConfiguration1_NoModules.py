from opentrons import protocol_api

metadata = {
    "protocolName": "QA Protocol - Deck Configuration 1 - No Modules",
    "author": "Derek Maggio <derek.maggio@opentrons.com>",
}

requirements = {
    "robotType": "OT-3",
    "apiLevel": "2.16",
}

HEATER_SHAKER_NAME = "heaterShakerModuleV1"
MAGNETIC_BLOCK_NAME = "magneticBlockV1"
PCR_PLATE_96_NAME = "nest_96_wellplate_100ul_pcr_full_skirt"
STARTING_VOL = 100
TEMPERATURE_MODULE_NAME = "temperature module gen2"
THERMOCYCLER_NAME = "thermocycler module gen2"
TIPRACK_96_NAME = "opentrons_flex_96_tiprack_1000ul"
TRANSFER_VOL = 10
USING_GRIPPER = True
TIP_RACK_LOCATION_1 = "C3"
TIP_RACK_LOCATION_2 = "D2"


def default_well(tiprack: protocol_api.labware) -> protocol_api.labware.Well:
    return tiprack["A1"]


def run(ctx: protocol_api.ProtocolContext) -> None:

    ################
    ### FIXTURES ###
    ################

    trash_bin_1 = ctx.load_trash_bin("C1")
    trash_bin_2 = ctx.load_trash_bin("D1")
    waste_chute = ctx.load_waste_chute()

    ###############
    ### LABWARE ###
    ###############

    pcr_plate_1 = ctx.load_labware(PCR_PLATE_96_NAME, "B2")
    pcr_plate_2 = ctx.load_labware(PCR_PLATE_96_NAME, "C2")

    tip_rack_96_1 = ctx.load_labware(TIPRACK_96_NAME, TIP_RACK_LOCATION_1)
    tip_rack_96_2 = ctx.load_labware(TIPRACK_96_NAME, TIP_RACK_LOCATION_2)
    tip_rack_96_3 = ctx.load_labware(TIPRACK_96_NAME, protocol_api.OFF_DECK)
    tip_rack_96_4 = ctx.load_labware(TIPRACK_96_NAME, protocol_api.OFF_DECK)

    tip_rack_96_staging_area_1 = ctx.load_labware(TIPRACK_96_NAME, "C4")  # Staging Area
    tip_rack_96_staging_area_2 = ctx.load_labware(TIPRACK_96_NAME, "D4")  # Staging Area

    tip_racks = [
        tip_rack_96_1,
        tip_rack_96_2,
        tip_rack_96_staging_area_1,
        tip_rack_96_staging_area_2,
        tip_rack_96_3,
        tip_rack_96_4,
    ]

    ##########################
    ### PIPETTE DEFINITION ###
    ##########################

    pipette_96_channel = ctx.load_instrument("flex_96channel_1000", mount="left", tip_racks=tip_racks)

    ########################
    ### LOAD SOME LIQUID ###
    ########################

    water = ctx.define_liquid(name="water", description="High Quality H₂O", display_color="#42AB2D")

    acetone = ctx.define_liquid(name="acetone", description="C₃H₆O", display_color="#38588a")

    [
        well.load_liquid(liquid=water if i % 2 == 0 else acetone, volume=STARTING_VOL)
        for i, column in enumerate(pcr_plate_1.columns())
        for well in column
    ]

    ########################
    ### MOVE SOME LIQUID ###
    ########################

    pipette_96_channel.pick_up_tip(default_well(tip_rack_96_1))
    pipette_96_channel.transfer(TRANSFER_VOL, default_well(pcr_plate_1), default_well(pcr_plate_2), new_tip="never")
    pipette_96_channel.drop_tip(waste_chute)

    pipette_96_channel.pick_up_tip(default_well(tip_rack_96_2))
    pipette_96_channel.transfer(TRANSFER_VOL, default_well(pcr_plate_1), default_well(pcr_plate_2), new_tip="never")
    pipette_96_channel.drop_tip(trash_bin_1)

    ##################################
    ### THROW AWAY EMPTY TIP RACKS ###
    ##################################

    ctx.move_labware(tip_rack_96_1, waste_chute, use_gripper=USING_GRIPPER)
    ctx.move_labware(tip_rack_96_2, waste_chute, use_gripper=USING_GRIPPER)

    ###################################
    ### MOVE STAGING AREA TIP RACKS ###
    ###################################

    ctx.move_labware(tip_rack_96_staging_area_1, TIP_RACK_LOCATION_1, use_gripper=USING_GRIPPER)
    ctx.move_labware(tip_rack_96_staging_area_2, TIP_RACK_LOCATION_2, use_gripper=USING_GRIPPER)

    #############################
    ### MOVE SOME MORE LIQUID ###
    #############################

    pipette_96_channel.pick_up_tip(default_well(tip_rack_96_staging_area_1))
    pipette_96_channel.transfer(TRANSFER_VOL, default_well(pcr_plate_1), default_well(pcr_plate_2), new_tip="never")
    pipette_96_channel.drop_tip(waste_chute)

    pipette_96_channel.pick_up_tip(default_well(tip_rack_96_staging_area_2))
    pipette_96_channel.transfer(TRANSFER_VOL, default_well(pcr_plate_1), default_well(pcr_plate_2), new_tip="never")
    pipette_96_channel.drop_tip(trash_bin_2)

    ##################################
    ### THROW AWAY EMPTY TIP RACKS ###
    ##################################

    ctx.move_labware(tip_rack_96_staging_area_1, waste_chute, use_gripper=USING_GRIPPER)
    ctx.move_labware(tip_rack_96_staging_area_2, waste_chute, use_gripper=USING_GRIPPER)

    ###############################
    ### MOVE OFF DECK TIP RACKS ###
    ###############################

    ctx.move_labware(tip_rack_96_3, TIP_RACK_LOCATION_1, use_gripper=not USING_GRIPPER)
    ctx.move_labware(tip_rack_96_4, TIP_RACK_LOCATION_2, use_gripper=not USING_GRIPPER)

    pipette_96_channel.pick_up_tip(default_well(tip_rack_96_3))
    pipette_96_channel.transfer(TRANSFER_VOL, default_well(pcr_plate_1), default_well(pcr_plate_2), new_tip="never")
    pipette_96_channel.drop_tip(waste_chute)

    pipette_96_channel.pick_up_tip(default_well(tip_rack_96_4))
    pipette_96_channel.transfer(TRANSFER_VOL, default_well(pcr_plate_1), default_well(pcr_plate_2), new_tip="never")
    pipette_96_channel.drop_tip(waste_chute)

    ##########################################
    ### MAKE THIS PROTOCOL TOTALLY USELESS ###
    ##########################################

    ctx.move_labware(pcr_plate_1, waste_chute, use_gripper=USING_GRIPPER)
    ctx.move_labware(pcr_plate_2, waste_chute, use_gripper=USING_GRIPPER)
