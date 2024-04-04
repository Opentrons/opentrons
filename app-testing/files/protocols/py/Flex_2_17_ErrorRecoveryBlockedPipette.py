from opentrons import protocol_api

# metadata
metadata = {
    'protocolName': 'Error Recovery Testing Protocol - Blocked Pipette Failure',
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
    # trashbin = protocol.load_trash_bin(location = "B3")
    # wastechute = protocol.load_waste_chute()

    #labware
    tiprack1 = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'A2')  
    tiprack2 = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'B2')
    tiprack3 = protocol.load_labware('opentrons_flex_96_tiprack_1000ul', 'C2') 
    sample_plate = protocol.load_labware('armadillo_96_wellplate_200ul_pcr_full_skirt','C3') #only if you're using 96ch for testing
    reservoir = protocol.load_labware('nest_12_reservoir_15ml', 'A3')

    #instruments
    pip8 = protocol.load_instrument('flex_8channel_1000', mount = 'left')
    pip96 = protocol.load_instrument('flex_96channel_1000', mount = 'left') # only if you're using 96ch for testing

    
    #####You can optionally comment out each section to isolate the pipette and location#####


    ####################################################################   
    #####If you want to test tip blockages with different tip sizes##### 
    ##############use tape to cover the tip opening#####################
    ####################################################################


    ## 8-Channel Pipette ##

    ## 50ul Tips
    pip8.pick_up_tip(tiprack1) 
    pip8.aspirate(5, reservoir['A1'])
    pip8.dispense(5, reservoir['A1'])
    pip8.aspirate(25, reservoir['A1'])
    pip8.dispense(25, reservoir['A1'])
    pip8.aspirate(45, reservoir['A1'])
    pip8.dispense(45, reservoir['A1'])
    #Enter error recovery state
    #After error recovery, liquid blowout / drop tip and proceed from next step, or error was ignored
    pip8.return_tip()
    pip8.reset_tipracks()

    ## 200ul Tips
    pip8.pick_up_tip(tiprack2)
    pip8.aspirate(10, reservoir['A1'])
    pip8.dispense(10, reservoir['A1'])
    pip8.aspirate(100, reservoir['A1'])
    pip8.dispense(100, reservoir['A1'])
    pip8.aspirate(200, reservoir['A1'])
    pip8.dispense(200, reservoir['A1'])
    #Enter error recovery state
    #After error recovery,
    pip8.return_tip()
    pip8.reset_tipracks()

    ## 1000ul Tips
    pip8.pick_up_tip(tiprack3)
    pip8.aspirate(50, reservoir['A1'])
    pip8.dispense(50, reservoir['A1'])
    pip8.aspirate(500, reservoir['A1'])
    pip8.dispense(500, reservoir['A1'])
    pip8.aspirate(900, reservoir['A1'])
    pip8.dispense(900, reservoir['A1'])
    #Enter error recovery state
    #After error recovery, liquid blowout / drop tip and proceed from next step, or error was ignored
    pip8.return_tip()
    pip8.reset_tipracks()
    
    ## 96-Channel Pipette ##

    # pip96.pick_up_tip(tiprack1) 
    # pip96.aspirate(5, sample_plate['A1'])
    # pip96.dispense(5, sample_plate['A1'])
    # pip96.aspirate(25, sample_plate['A1'])
    # pip96.dispense(25, sample_plate['A1'])
    # pip96.aspirate(45, sample_plate['A1'])
    # pip96.dispense(45, sample_plate['A1'])
    # #Enter error recovery state
    # #After error recovery, liquid blowout / drop tip and proceed from next step, or error was ignored
    # pip96.return_tip()
    # pip96.reset_tipracks()

    # ## 200ul Tips
    # pip96.pick_up_tip(tiprack2)
    # pip96.aspirate(10, sample_plate['A1'])
    # pip96.dispense(10, sample_plate['A1'])
    # pip96.aspirate(100, sample_plate['A1'])
    # pip96.dispense(100, sample_plate['A1'])
    # pip96.aspirate(200, sample_plate['A1'])
    # pip96.dispense(200, sample_plate['A1'])
    # #Enter error recovery state
    # #After error recovery,
    # pip8.return_tip()
    # pip96.reset_tipracks()

    # ## 1000ul Tips
    # pip96.pick_up_tip(tiprack3)
    # pip96.aspirate(50, sample_plate['A1'])
    # pip96.dispense(50, sample_plate['A1'])
    # pip96.aspirate(500, sample_plate['A1'])
    # pip96.dispense(500, sample_plate['A1'])
    # pip96.aspirate(900, sample_plate['A1'])
    # pip96.dispense(900, sample_plate['A1'])
    # #Enter error recovery state
    # #After error recovery, liquid blowout / drop tip and proceed from next step, or error was ignored
    # pip96.return_tip()
    # pip96.reset_tipracks()