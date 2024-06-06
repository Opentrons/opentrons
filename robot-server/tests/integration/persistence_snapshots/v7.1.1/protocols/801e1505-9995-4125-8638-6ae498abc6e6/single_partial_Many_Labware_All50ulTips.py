from opentrons import protocol_api
from opentrons.protocol_api import COLUMN, ALL

metadata = {
    "protocolName": "single_partial_many_labware_All50ulTips"
}
requirements = {    
    "robotType": "Flex",
    "apiLevel": "2.16",
    
}

def asp_disp(pipette, lw1_list):
        for i in lw1_list:
            pipette.move_to(i['A1'].top())
            pipette.aspirate(50, i.wells()[0].bottom(z=.5))
            pipette.dispense(50, i.wells()[0].bottom(z=.5))
# load the Labware Adapaters        
def full_tip_pick_up(pipette, tip_rack, labware_list, wasteChute, protocol_context):
    pipette.configure_nozzle_layout(style = ALL, tip_racks = [tip_rack])
    pipette.pick_up_tip(tip_rack.wells()[0])
    asp_disp(pipette, labware_list)
    pipette.drop_tip()
    protocol_context.move_labware(tip_rack, wasteChute, use_gripper = True)

def col1_partial_pick_up(pipette, tip_rack, labware_list, wasteChute, protocol_context):
    pipette.configure_nozzle_layout(style = COLUMN, start = "A12")
    pipette.pick_up_tip(tip_rack.wells()[0])
    asp_disp(pipette, labware_list)
    pipette.drop_tip()
    protocol_context.move_labware(tip_rack, wasteChute, use_gripper = True)
    

def run(protocol_context: protocol_api.ProtocolContext):
    
    adapter1 = protocol_context.load_adapter("opentrons_flex_96_tiprack_adapter", "A2")
    adapter2 = protocol_context.load_adapter("opentrons_flex_96_tiprack_adapter", "A3")

    # load the 1000 ul tipracks
    tiprack1000_1 = adapter1.load_labware("opentrons_flex_96_tiprack_50ul")
    tiprack1000_2 = adapter2.load_labware("opentrons_flex_96_tiprack_50ul")
    tiprack1000_3 = protocol_context.load_labware("opentrons_flex_96_tiprack_50ul", "B2")

    #load the 200 ul tipracks
    tiprack200_1 = protocol_context.load_labware("opentrons_flex_96_tiprack_50ul", "B3")
    tiprack200_2 = protocol_context.load_labware("opentrons_flex_96_tiprack_50ul", "A4")
    tiprack200_3 = protocol_context.load_labware("opentrons_flex_96_tiprack_50ul", "B4")

    #load the 50 ul tipracks
    tiprack50_1 = protocol_context.load_labware("opentrons_flex_96_tiprack_50ul", "C3")
    tiprack50_2 = protocol_context.load_labware("opentrons_flex_96_tiprack_50ul", "C4")
    tiprack50_3 = protocol_context.load_labware("opentrons_flex_96_tiprack_50ul", "D4")

    #load the labware
    armadillo_96 = protocol_context.load_labware('armadillo_96_wellplate_200ul_pcr_full_skirt', "B1")
    nest_12 = protocol_context.load_labware('nest_12_reservoir_15ml', "C2")
    nest_96 = protocol_context.load_labware('nest_96_wellplate_2ml_deep', "C1")
    bio_384 = protocol_context.load_labware('appliedbiosystemsmicroamp_384_wellplate_40ul', "D1")
    nest_res = protocol_context.load_labware('nest_1_reservoir_195ml', "D2")

    #load the 96 channel
    pipette = protocol_context.load_instrument(
        "flex_96channel_1000", mount="left", tip_racks=[tiprack1000_1, tiprack1000_2, tiprack1000_3, tiprack200_1, tiprack200_2, tiprack200_3, tiprack50_1, tiprack50_2, tiprack50_3]
    )

    # load the trashes
    trashA1 = protocol_context.load_trash_bin("A1") # since this is the first trash loaded, it is treated as the default trash
    wasteChute = protocol_context.load_waste_chute()


    # list of plates for 50 ul tips
    plates_50ul = [armadillo_96, nest_12, nest_96, bio_384, nest_res]
    #Perform protocol actions for tiprack 1
    pipette.configure_nozzle_layout(style=ALL, tip_racks=[tiprack1000_1])
    pipette.pick_up_tip(tiprack1000_1.wells()[0])
    asp_disp(pipette, plates_50ul)
    pipette.drop_tip()
    protocol_context.move_labware(tiprack1000_1, wasteChute, use_gripper=True)

    #Perform protocol actions for tiprack 2
    pipette.pick_up_tip(tiprack1000_2.wells()[0])
    asp_disp(pipette, plates_50ul)
    pipette.drop_tip()
    protocol_context.move_labware(tiprack1000_2, wasteChute, use_gripper=True)

    # Perform protocol actions for tiprack 3
    pipette.configure_nozzle_layout(style=COLUMN, start="A12")

    pipette.pick_up_tip(tiprack1000_3.wells()[0])
    asp_disp(pipette, plates_50ul)
    pipette.drop_tip()
    protocol_context.move_labware(tiprack1000_3, wasteChute, use_gripper=True)

    # Perform protocol actions for tiprack 4

    pipette.pick_up_tip(tiprack200_1.wells()[0])
    asp_disp(pipette, plates_50ul)
    pipette.drop_tip()
    protocol_context.move_labware(tiprack200_1, wasteChute, use_gripper=True)

    #Repopulate deck
    protocol_context.move_labware(tiprack200_2, adapter1, use_gripper=True)
    protocol_context.move_labware(tiprack200_3, adapter2, use_gripper=True)

    #Perform protocol actions for tiprack 5
    pipette.configure_nozzle_layout(style=ALL)
    pipette.pick_up_tip(tiprack200_2.wells()[0])
    asp_disp(pipette, plates_50ul)
    pipette.drop_tip()
    protocol_context.move_labware(tiprack200_2, wasteChute, use_gripper=True)
    
    #Perform protocol actions for tiprack 6
    pipette.pick_up_tip(tiprack200_3.wells()[0])
    asp_disp(pipette, plates_50ul)
    pipette.drop_tip()
    protocol_context.move_labware(tiprack200_3, wasteChute, use_gripper=True)
    
    # Move two 50 ul tip racks to adapters
    protocol_context.move_labware(tiprack50_2, adapter1, use_gripper=True)
    protocol_context.move_labware(tiprack50_3, adapter2, use_gripper=True)
    
    pipette.configure_nozzle_layout(style = ALL)
    
    pipette.pick_up_tip(tiprack50_2.wells()[0])
    asp_disp(pipette, plates_50ul)
    pipette.drop_tip()
    protocol_context.move_labware(tiprack50_2, wasteChute, use_gripper=True)

    # Perform protocol actions for tiprack 7
    pipette.configure_nozzle_layout(style=COLUMN, start="A12")
    pipette.pick_up_tip(tiprack50_1.wells()[0])
    asp_disp(pipette, plates_50ul)
    pipette.drop_tip()
    protocol_context.move_labware(tiprack50_1, wasteChute, use_gripper=True)
    
    # Repopulate last item
    protocol_context.move_labware(tiprack50_3, adapter1, use_gripper=True)

    # Perform protocol actions for tiprack 5
    pipette.configure_nozzle_layout(style=ALL)
    pipette.pick_up_tip(tiprack50_3.wells()[0])
    asp_disp(pipette, plates_50ul)
    pipette.drop_tip()
    protocol_context.move_labware(tiprack50_3, wasteChute, use_gripper=True)

    #Clean the deck
    protocol_context.move_labware(armadillo_96, wasteChute, use_gripper=True)
    protocol_context.move_labware(nest_12, wasteChute, use_gripper=True)
    protocol_context.move_labware(nest_96, wasteChute, use_gripper=True)
    protocol_context.move_labware(bio_384, wasteChute, use_gripper=True)
    protocol_context.move_labware(nest_res, wasteChute, use_gripper=True)
