from opentrons import protocol_api

# metadata
metadata = {
    'protocolName': 'Error Recovery Testing Protocol - Drop Tip Failure',
    'author': 'Sara Kowalski',
    'description': 'Simple Protocol that user can use to trigger a Drop Tip Error for single and multi',
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.17",
}

DRYRUN = 'YES'

# protocol run function
def run(protocol: protocol_api.ProtocolContext):

    # modules/fixtures
    trashbin = protocol.load_trash_bin(location = "A3")
    wastechute = protocol.load_waste_chute()

    #labware
    tiprack1 = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'A2')  
    tiprack2 = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'B2')
    sample_plate = protocol.load_labware('armadillo_96_wellplate_200ul_pcr_full_skirt','C3')

    #instruments
    p1000 = protocol.load_instrument('flex_8channel_1000', mount = 'left', tip_racks=[tiprack1]) ## will need a modified pipette that doesn't have the ejector(?)
    p50 = protocol.load_instrument('flex_1channel_50', mount = 'right', tip_racks=[tiprack2]) ## will need a modified pipette that doesn't have the ejector(?)

    
    #####You can optionally comment out each section to isolate the pipette and location#####


    ###########################################    
    #####If you want to test return_tip()######
    ###########################################

    #p1000.pick_up_tip()
    #p1000.aspirate(50, sample_plate['A1'])
    #p1000.dispense(50,sample_plate['A1'])
    #p1000.return_tip()
    #p1000.reset_tipracks()

    #Enter error recovery state 
    #(robot will be paused, you will have to mannually remove tip)
    #After error recovery, we expect the tip to have either been dropped in wastechute/trashbin or returned, or step skipped

    #p50.pick_up_tip()
    #p50.aspirate(25, sample_plate['C1'])
    #p50.dispense(25, sample_plate['C2'])
    #p50.return_tip()
    #p50.reset_tipracks()

    #Enter error recovery state 
    #(robot will be paused, you will have to mannually remove tip)
    #After error recovery, we expect the tip to have either been dropped in wastechute/trashbin or returned, or step skipped

    #################################################################    
    #####If you want to test drop_tip() at a specified location######
    #################################################################

    p1000.pick_up_tip()
    p1000.aspirate(50, sample_plate['A1'])
    p1000.dispense(50,sample_plate['A1'])
    p1000.aspirate(66,sample_plate["A2"])
    p1000.dispense(66,sample_plate['A2'])
    p1000.drop_tip(trashbin)

    #Enter error recovery state 
    #(robot will be paused, you will have to mannually remove tip)
    #After error recovery, we expect the tip to have either been dropped in wastechute/trashbin or returned, or step skipped

    p50.pick_up_tip()
    p50.aspirate(25, sample_plate['C1'])
    p50.dispense(25, sample_plate['C2'])
    p50.aspirate(45, sample_plate['E2'])
    p50.dispense(45, sample_plate['F2'])
    p50.drop_tip(wastechute)

    #Enter error recovery state
    #(robot will be paused, you will have to mannually remove tip)
    #After error recovery, we expect the tip to have either been dropped in wastechute/trashbin or returned, or step skipped

    