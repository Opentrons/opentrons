from opentrons import protocol_api, types
import dataclasses
import typing


TIPRACK_NAME = "opentrons_flex_96_tiprack_1000ul"
PLATE_NAME = "nest_96_wellplate_200ul_flat"
RESERVOIR_NAME = "nest_12_reservoir_15ml"
PIPETTE_SINGLE_CHANNEL_NAME = "flex_1channel_1000"
TRASH_NAME = "opentrons_1_trash_1100ml_fixed"

metadata = {
    "protocolName": "Liquid presence detection enable/disable"
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.20"
}   

def run(ctx: protocol_api.ProtocolContext):
    tiprack = (ctx.load_labware(TIPRACK_NAME, 'D1')).wells_by_name()
    reservoir = (ctx.load_labware(RESERVOIR_NAME, 'C2')).wells_by_name()
    plate = (ctx.load_labware(PLATE_NAME, 'D2')).wells_by_name()
    trash_bin = ctx.load_trash_bin('B3')
    pipette = ctx.load_instrument(PIPETTE_SINGLE_CHANNEL_NAME, mount="left", liquid_presence_detection=False)
    assert pipette.liquid_detection == False
    
    
    water = ctx.define_liquid(name="water", description="Normal water", display_color="#42AB2D")
    reservoir["A1"].load_liquid(liquid=water, volume=10000)
    reservoir["A2"].load_liquid(liquid=water, volume=10000)
    reservoir["A3"].load_liquid(liquid=water, volume=10000)

    
    # ####### FIRST CYCLE, SHOULD NOT DO LLD #######
    pipette.pick_up_tip(tiprack["A1"])
    pipette.aspirate(100, reservoir["A1"])
    pipette.dispense(100, plate["B2"])
    pipette.drop_tip(trash_bin) 
    
    
    ####### SECOND CYCLE, SHOULD DO LLD #######
    pipette.liquid_detection = True
    pipette.pick_up_tip(tiprack["A2"])
    pipette.aspirate(100, reservoir["A2"])
    pipette.dispense(100, plate["A10"])
    pipette.drop_tip(trash_bin)
    
    
    ####### THIRD CYCLE, SHOULD NOT DO LLD #######
    pipette.liquid_detection = False
    pipette.pick_up_tip(tiprack["A3"])
    pipette.aspirate(100, reservoir["A3"])
    pipette.dispense(100, plate["A11"])
    pipette.drop_tip(trash_bin)
    
    ###### FOURTH CYCLE, SHOULD DO LLD #######
    pipette.pick_up_tip(tiprack["A4"])
    pipette.require_liquid_presence(plate["A6"]) #should run without error
    pipette.drop_tip(trash_bin)
    
    
    ####### FIFTH CYCLE, SHOULD TRY TO DO LLD #######
    pipette.pick_up_tip(tiprack["A5"])
    pipette.require_liquid_presence(plate["D10"]) #should error because no liquid in there but provide chance for recovery
    pipette.drop_tip(trash_bin)
    
    
    ####### SIXTH CYCLE, SHOULD DO LLD #######
    pipette.pick_up_tip(tiprack["A6"])
    assert pipette.detect_liquid_presence(plate["A2"]) is True
    pipette.drop_tip(trash_bin)
    
    
    ####### SEVENTH CYCLE, SHOULD DO LLD #######
    pipette.pick_up_tip(tiprack["A7"])
    if pipette.detect_liquid_presence(plate["H7"]) is False:
        pipette.drop_tip(trash_bin)
    ### THE BELOW LINE IS A PROBLEM
    # assert pipette.detect_liquid_presence(plate["H7"]) is False
    