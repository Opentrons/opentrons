from opentrons import protocol_api
from opentrons import types
import json
import math
import numpy as np
from opentrons.protocol_engine.errors import ProtocolCommandFailedError

metadata = {
    'protocolName': 'In Situ Cell Barcoding using PBMCs',
    'author': 'Vasudha Nair <vasudha.nair@opentrons.com>',
    'description': 'Barcoding protocol using the Flex with Parse Biosciences Version 3 WT Kit',
    }

requirements = {
    "robotType": "Flex", 
    "apiLevel": "2.20",
}

def add_parameters(parameters):
    
    parameters.add_bool(
        display_name="Dry Run",
        variable_name="dry_run",
        description="Skip pauses, incubation delays, reduce mix steps, return tips to their racks",  
        default=False
    )

# Protocol Run Function

def run(protocol: protocol_api.ProtocolContext):
    
    # Commands
    
    # Deck Set Up and Labware

    # ======================================== FIRST ROW ==================================================

    temp_block     = protocol.load_module('temperature module gen2', 'D1')
    temp_adapter   = temp_block.load_adapter('opentrons_96_well_aluminum_block')
    sampleplate    = temp_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'sampleplate')
    tubes1         = protocol.load_labware('opentrons_15_tuberack_falcon_15ml_conical', 'D2')
    default_trash  = protocol.load_waste_chute()

    # ======================================= SECOND ROW ===================================================

    temp_block1    = protocol.load_module('temperature module gen2', 'C1')
    tubes          = temp_block1.load_labware('opentrons_24_aluminumblock_eppendorf_1.5ml_snapcap', 'Tubes')
    reservoir      = protocol.load_labware('eppendorf_96_wellplate_semiskirted_250ul','C2', 'Reservoir') # semiskirted plate
    tiprack_1000_1 = protocol.load_labware('opentrons_flex_96_tiprack_1000ul', 'C3')

    # ==================================== THIRD ROW =======================================================

    thermocycler   = protocol.load_module('thermocycler module gen2', 'B1')
    plate          = thermocycler.load_labware('eppendorf_96_wellplate_semiskirted_250ul', 'Plate')
    tiprack_50_1   = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'B2')
    tiprack_50_2   = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'B3')

    # ==================================== FOURTH ROW ======================================================

    tiprack_50_3   = protocol.load_labware('opentrons_flex_96_tiprack_50ul','A2')
    tiprack_200_1  = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'A3')

    # ==================================== OFF DECK =======================================================

    tiprack_50_4   = protocol.load_labware('opentrons_flex_96_tiprack_50ul','A4')
    tiprack_50_5   = protocol.load_labware('opentrons_flex_96_tiprack_50ul','B4')
    tiprack_50_6   = protocol.load_labware('opentrons_flex_96_tiprack_50ul','C4')

    # ======================================================================================================

    # PARAMETERS

    USE_GRIPPER = True
    dry_run     = protocol.params.dry_run

    # Pipettes
    p50 = protocol.load_instrument("flex_8channel_50", mount="right", tip_racks=[tiprack_50_1,tiprack_50_2,tiprack_50_3,tiprack_50_4,tiprack_50_5,tiprack_50_6])
    p1000 = protocol.load_instrument("flex_1channel_1000", mount="left", tip_racks=[tiprack_200_1,tiprack_1000_1])
    
    # REAGENTS

    SA    =tubes['A1']
    RB    =tubes['A2']
    RB1   =tubes['A3']
    R2LB  =tubes['A4']
    R2LB1 =tubes['A5']    
    R2LE  =tubes['A6']
    R2SB  =tubes['B1'] 
    PLDB  =tubes['B2']
    R3LE  =tubes['B3']
    LE    =tubes['B4']
    Sample1=sampleplate.rows()[0][0:13]
    Sample1=sampleplate.rows()[1][0:13]
    Sample1=sampleplate.rows()[2][0:13]
    Sample1=sampleplate.rows()[3][0:13]
    vol            = 14                       # Diluted Sample volume (with Sample Dilution buffer)
    SA_vol1        = 9.6                      # Spin Additive volume 1
    R2SB_vol       = 10                       # Round2 Stop Buffer volume
    PLDB_vol       = 60                       # Pre Lysis Dilution Buffer volume
    R2LE_vol       = 20                       # Round 2 Ligation Enzyme volume
    LB_vol         = 220                      # Lysis Buffer Volume 
    LE_vol         = 44                       # Lysis Enzyme volume
    SA_vol2        = 70                       # Spin Additive volume 2
    R3LE_vol       = 20                       # Round 3 Ligation Enzyme volume 


    # LIQUID DEFINITIONS

    SA_=protocol.define_liquid(name="Spin Additive",description="Spin Additive", display_color="#cc3399")
    for well in tubes.rows()[0][0:1]:
        well.load_liquid(liquid=SA_, volume=85)
    RB_=protocol.define_liquid(name="Resuspension Buffer", description="Resuspension Buffer",display_color="#ff6699")
    for well in tubes.rows()[0][1:2]:
        well.load_liquid(liquid=RB_, volume=1000)
    RB1_=protocol.define_liquid(name="Resuspension Buffer1", description="Resuspension Buffer1",display_color="#ff6699")
    for well in tubes.rows()[0][2:3]:
        well.load_liquid(liquid=RB1_, volume=1000)
    R2LB_=protocol.define_liquid(name="Round2 Ligation Buffer", description="Round2 Ligation Buffer",display_color="#ffcc99")
    for well in tubes.rows()[0][3:4]:
        well.load_liquid(liquid=R2LB_, volume=1000)
    R2LB1_=protocol.define_liquid(name="Round2 Ligation Buffer1", description="Round2 Ligation Buffer1",display_color="#ffcc99")
    for well in tubes.rows()[0][4:5]:
        well.load_liquid(liquid=R2LB1_, volume=1000)
    R2LE_=protocol.define_liquid(name="Round2 Ligation Enzyme", description="Round2 Ligation Enzyme",display_color="#ff9966")
    for well in tubes.rows()[0][5:6]:
        well.load_liquid(liquid=R2LE_, volume=20)
    R2SB_=protocol.define_liquid(name="Round2 Stop Buffer", description="Round 2 Stop Buffer",display_color="#00cc99")
    for well in tubes.rows()[1][0:1]:
        well.load_liquid(liquid=R2SB_, volume=960)
    PLDB_=protocol.define_liquid(name="Pre Lysis Dilution Buffer", description="Pre Lysis Dilution Buffer",display_color="#6699ff")
    for well in tubes.rows()[1][1:2]:
        well.load_liquid(liquid=PLDB_, volume=200)
    R3LE_=protocol.define_liquid(name="Round 3 Ligation Enzyme",description="Round 3 Ligation Enzyme",display_color="#cc99ff")
    for well in tubes.rows()[1][2:3]:
        well.load_liquid(liquid=R3LE_, volume=20)
    LE_ =protocol.define_liquid(name="Lysis Enzyme",description="Lysis Enzyme",display_color="#8b4513")
    for well in tubes.rows()[1][3:4]:
        well.load_liquid(liquid=LE_, volume=50)
    Sample_=protocol.define_liquid(name="Sample", description="Sample",display_color="#00d2e6")
    for well in sampleplate.rows()[0][0:13]:
        well.load_liquid(liquid=Sample_, volume=vol*13)
    Sample_=protocol.define_liquid(name="Sample", description="Sample",display_color="#00d2e6")
    for well in sampleplate.rows()[1][0:13]:
        well.load_liquid(liquid=Sample_, volume=vol*13)
    Sample_=protocol.define_liquid(name="Sample", description="Sample",display_color="#00d2e6")
    for well in sampleplate.rows()[2][0:13]:
        well.load_liquid(liquid=Sample_, volume=vol*13)
    Sample_=protocol.define_liquid(name="Sample", description="Sample",display_color="#00d2e6")
    for well in sampleplate.rows()[3][0:13]:
        well.load_liquid(liquid=Sample_, volume=vol*13)
    
    
    # THERMOCYCLER OFFSETS
    tc_drop_offset={'x':0,'y':0,'z':0}
    tc_pick_up_offset={'x':0,'y':0,'z':0}

    # TEMP BLOCK OFFSETS
    tb_drop_offset={'x':0,'y':0.,'z':0}
    tb_pick_up_offset={'x':0,'y':0,'z':0}
    
    def move_from_deck(labware, new_location):
        protocol.move_labware(
        labware,
        new_location,
        )
    def move_offdeck(labware,new_location): # Manually move labware from off deck locations onto deck
        protocol.move_labware(
        labware,
        new_location,
        )

    # COMMANDS
    # ===== Set temperature module on deck slot C1 to 4C ========  # temp block set in the beginning to 4C before starting the protocol run to save on time 
    # Once Temp block reaches 4C, the tubes are placed on the 24 well aluminum block
    # ======== Thawing Round 1 Plate ====== 26uL vol Eppendorf ▲❖▶︎▲❖▶︎ THERMOCYCLER ▲❖▶︎▲❖▶︎ # Centrifuge for 100g for 1 min at 4C  then ====== REMOVE PLATE SEAL
    # sampleplate has diluted sample/samples which one prepares manually according to the sample number and seeds it to the 48 wells of the Opentrons Tough PCR 96 well plate
    # The location of the sample/samples is prepared using the Parse WT loading table provided on the Parse Biosciences website

    # ========= Addition of 14uL of diluted sample to appropriate wells of Plate (ON Thermocycler) ====== 

    thermocycler.open_lid()
    thermocycler.set_block_temperature(temperature=4)                                       # DONT REUSE TIPS DURING THIS STEP 
    num_samples = []
    wells = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6','A7', 'A8', 'A9', 'A10','A11','A12']      
    for well in wells:  
        p50.pick_up_tip(tiprack_50_1)
        p50.mix(2, 10, sampleplate[well])
        p50.aspirate(vol, sampleplate[well])
        p50.dispense(vol, plate[well])                                                      # Round 1 Plate provided in Parse Biosciences Evercode WT v3 kit
        p50.mix(3, 30, plate[well])
        p50.drop_tip()

    protocol.comment("Moving sampleplate to trash")                                 
    protocol.move_labware(sampleplate, default_trash,use_gripper=USE_GRIPPER)  
    
    # ====== Barcoding Round 1 ========= # ADD NEW PLATE SEAL  Used off-deck commercial thermocycler Eppendorf ▲❖▶︎▲❖▶︎ THERMOCYCLER  ▲❖▶︎▲❖▶︎

    protocol.pause("Ready")

    # ========== Transfer Round 1 plate from off deck to Thermocycler module ======== from commercial to Opentrons Thermocycler
    # ========= Thawing Round 2 Plate ====== # Centrifuge for 60sec  at 100g 4 degree Eppendorf ▲❖▶︎▲❖▶︎ THERMOCYCLER ▲❖▶︎▲❖▶︎

    # ====== Columnwise Pooling of Round 1 Plate ======   

    protocol.pause("Ready")                                                                 # REMOVE PLATE SEAL from Round 1 plate

    # Mapping of source wells to destination wells ====== 

    well_mappings = {                                                     
    'A12': ['A1', 'A2', 'A3'],
    'A11': ['A4', 'A5', 'A6'],
    'A10': ['A7', 'A8', 'A9']
    }
    # Loop through each destination well and its corresponding source wells            
    p50.pick_up_tip(tiprack_50_2)
    for destination, source_wells in well_mappings.items():
        for well in source_wells:
            p50.mix(3, 25, plate[well])                                   
            p50.aspirate(25, plate[well])
            p50.dispense(25, plate[destination])
            p50.mix(3, 10, plate[well])
            p50.aspirate(20, plate[well].bottom(z=0.2))
            p50.dispense(20, plate[destination])
    p50.drop_tip() 

    # ====== Transfer the ROUND 1 contents into 15 mL falcon tube  ======  
   
    rows = ['A', 'B', 'C', 'D']                                                            # Define wells to aspirate from by row and column --- COLUMN WISE # 1920uL
    columns = ['12', '11', '10']           
    p1000.pick_up_tip(tiprack_200_1)
    dispenseHeight = 0
    for column in columns:                  
        for row in rows:
            well = row + column
            p1000.mix(3, 150, plate[well])                                                 # MIX STEP before aspirating 180 uL incorporated
            p1000.aspirate(180, plate[well], rate=0.7)
            p1000.dispense(180, tubes1['A1'].bottom(z=dispenseHeight))
            dispenseHeight=dispenseHeight+1.8
    for column in columns:                  
        for row in rows:
            well = row + column
            p1000.aspirate(16, plate[well].bottom(z=0.3), rate=0.7)
    p1000.dispense(192, tubes1['A1'].bottom(z=20))
    p1000.blow_out(tubes1['A1'].bottom(z=20))
    p1000.drop_tip()

    # ====== Addition of Spin Additive ====== Invert 3 times after SA addition --------- MANUAL     

    p1000.flow_rate.aspirate = 716
    p1000.pick_up_tip(tiprack_200_1)
    p1000.aspirate(SA_vol1,SA)
    p1000.dispense(SA_vol1,tubes1['A1'].bottom(z=20))
    p1000.drop_tip()
    thermocycler.set_block_temperature(temperature=25)
    
    # Centrifuge the 15mL tube in swinging bucket rotor for 5-10 min at 400g at 4C

    protocol.pause("Ready")                                                              # MOVE the tubes1['A1'] to a centrifuge # Add new plate to Thermocycler

    # ====== Move the semiskirted Round 2 plate from Temp module to Waste Chute ====== 
    # ====== After Centrifugation for 10 min at 400g is done, now removal of supernatant ====== 

    protocol.pause("Ready")                                                              # Centrifuged tube placed back into location tubes1['A1'] after 10 minutes

    p1000.pick_up_tip(tiprack_1000_1)      
    p1000.flow_rate.aspirate = 150
    p1000.aspirate(1000, tubes1['A1'].bottom(12.25)) 
    p1000.dispense(1000, tubes1['B1'].top(z=-10))
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_1000_1)
    p1000.flow_rate.aspirate = 75                                                        # Remove the remaining supernatant, determine flow rate so that pellet is not dislodged, 40uL will remain
    p1000.aspirate(1000, tubes1['A1'].bottom(7.125))     
    p1000.dispense(1000, tubes1['B1'].top(z=-10))                                        # B1 waste tube; save tips, dispense at higher height in waste tube     
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_200_1)
    p1000.flow_rate.aspirate = 20                                        
    p1000.aspirate(200, tubes1['A1'].bottom(2.5))
    p1000.dispense(200, tubes1['B1'])
    p1000.drop_tip()
    p1000.flow_rate.aspirate = 716     

    # ====== Addition of Resuspension Buffer to Resuspend Pellet GENTLY RESUSPEND ======

    p1000.pick_up_tip(tiprack_1000_1)
    p1000.aspirate(1000, RB, rate=0.80)
    p1000.dispense(1000, tubes1['A1'].bottom(z=2))
    p1000.move_to(tubes1['A1'].bottom(z=30))
    p1000.blow_out()
    p1000.flow_rate.aspirate = 500               
    p1000.mix(5, 950, tubes1['A1'])              
    p1000.move_to(tubes1['A1'].bottom(z=35))
    p1000.blow_out()  
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_1000_1)
    p1000.aspirate(1000, RB1, rate=0.80)
    p1000.dispense(1000, tubes1['A1'].bottom(z=5))
    p1000.move_to(tubes1['A1'].bottom(z=30))
    p1000.blow_out()
    p1000.mix(5, 1000, tubes1['A1']) 
    p1000.move_to(tubes1['A1'].bottom(z=35))
    p1000.blow_out()
    p1000.drop_tip()     
    
    # ====== Preparation of Round 2 Ligation Master Mix ====== 

    # ====== Addition of Round 2 Ligation Buffer to Sample -- 1.95mL ======
    p1000.flow_rate.aspirate = 716
    p1000.pick_up_tip(tiprack_1000_1)
    p1000.aspirate(1000, R2LB)
    p1000.dispense(1000, tubes1['A1'])
    p1000.move_to(tubes1['A1'].top(z=-20))
    p1000.blow_out()
    protocol.delay(0.5)
    p1000.move_to(tubes1['A1'].top().move(types.Point(x=4,z=-3)))
    p1000.move_to(tubes1['A1'].top().move(types.Point(x=-4,z=-3)))
    p1000.blow_out()
    p1000.drop_tip()    
    p1000.pick_up_tip(tiprack_1000_1)
    p1000.aspirate(950, R2LB1) 
    p1000.dispense(950, tubes1['A1'])
    p1000.move_to(tubes1['A1'].top(z=-20))
    p1000.blow_out()
    protocol.delay(0.5)
    p1000.move_to(tubes1['A1'].top().move(types.Point(x=4,z=-3)))
    p1000.move_to(tubes1['A1'].top().move(types.Point(x=-4,z=-3)))
    p1000.blow_out()
    p1000.drop_tip() 

    # ====== Addition of Round 2 Ligation Enzyme  ====== 
    p1000.pick_up_tip(tiprack_200_1)
    p1000.aspirate(R2LE_vol, R2LE)
    p1000.dispense(R2LE_vol, tubes1['A1'])
    p1000.blow_out()
    p1000.drop_tip() 
    p1000.pick_up_tip(tiprack_1000_1)
    p1000.aspirate(800, tubes1['A1'], rate=0.698)
    p1000.dispense(800, tubes1['A1'])
    p1000.aspirate(800, tubes1['A1'], rate=0.698)
    p1000.dispense(800, tubes1['A1'])
    p1000.mix(5, 800, tubes1['A1'])                                    
    p1000.blow_out()
    p1000.drop_tip()

    # ====== Move the Reservoir from Slot C2 to Temp module on D1  ====== Reservoir is an Eppendorf semiskirted twin plate

    protocol.comment('Move reservoir')
    protocol.move_labware(reservoir, temp_adapter, use_gripper=USE_GRIPPER)    

    # ====== Transfer Round 2 Ligation Master Mix to Reservoir with P1000--- Round 2 Plate  ====== 
    # Reservoir (2mL sample + 1.95mL round 2 lig buffer + 20uL round 2 lig enz = 3.97) 
    # Here Reservoir is a semi skirted plate from Eppendorf accomodating more volume per well
    locations = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1']     
    for location in locations:
        p1000.pick_up_tip(tiprack_1000_1)
        p1000.aspirate(242, tubes1['A1'])
        p1000.dispense(242, reservoir[location].top(z=-5))
        p1000.drop_tip()                                                     
    locations1 = ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2']
    for location1 in locations1:
        p1000.pick_up_tip(tiprack_1000_1)
        p1000.aspirate(242, tubes1['A1'])
        p1000.dispense(242, reservoir[location1].top(z=-5))
        p1000.drop_tip()                                                     

    # ######### ADD TIPRACKS ############

    protocol.comment('Move_tiprack_50_1 to chute')
    protocol.move_labware(tiprack_50_1, default_trash, use_gripper=USE_GRIPPER)
    protocol.comment('Move tiprack_50_4 to deck B2')
    protocol.move_labware(tiprack_50_4, new_location='B2', use_gripper=True)                                                                                                   

    # DIFFERENT TIPS FOR EACH OF THE WELL-- DO NOT REUSE TIPS --- Addition of Round 2 Master Mix to Round 2 Plate
    # ====== 3970 uL of round 2 master mix ( column 1 to 12 ) Keep semiskirted Round 2 Plate (from Parse Biosciences Evercode WT v3 Kit) on the Thermocycler GEN2

    thermocycler.set_block_temperature(temperature=4)          
    source_destinations = {                                  
    "A1": ["A1", "A2", "A3", "A4", "A5", "A6"],         
    "A2": ["A7", "A8", "A9","A10", "A11", "A12"]
    }
    # Loop through each source and its corresponding destinations
    for source, destinations in source_destinations.items():
        for destination in destinations:
            p50.pick_up_tip(tiprack_50_4)
            p50.mix(2, 40, reservoir[source])
            p50.aspirate(40, reservoir[source])
            p50.dispense(40, plate[destination])
            p50.mix(2, 35, plate[destination])      
            p50.drop_tip()  
    
    # ====== Round 2 Plate Barcoding Round 2 ====== Keep plate on commercial thermocycler (off-deck) # ADD NEW PLATE SEAL before the barcoding step; Eppendorf ▲❖▶︎▲❖▶︎ THERMOCYCLER       
    # After barcoding REMOVE PLATE SEAL                             

    # ====== Transfer Round 2 Stop Buffer (B1 of tubes) to reservoir (COLUMN A4 to H4 location is stop buffer) ====== 
    
    p1000.pick_up_tip(tiprack_200_1)                               
    for well in ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4']:
        p1000.aspirate(140, R2SB)
        p1000.dispense(140, reservoir[well])   
    p1000.drop_tip()                             
    protocol.pause("Ready")                                                              # Round 2 plate after barcoding, REMOVE PLATE SEAL and place on Thermocycler GEN2

    # ====== Addition of Round 2 Stop Buffer 10uL ====== # DO NOT REUSE ANY TIPS DURING THIS STEP 

    for well in ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12']:
        p50.pick_up_tip(tiprack_50_3)
        p50.aspirate(R2SB_vol, reservoir["A4"])
        p50.dispense(R2SB_vol, plate[well])
        p50.mix(3, 35, plate[well])
        p50.drop_tip()                   

    # Add new plate seal
    protocol.pause("Ready")

    # ====== Round 2 Stop Protocol ====== # Thermocycler GEN2 run on-deck 

    if dry_run == False:
        protocol.comment("Round2 stop")
        thermocycler.set_block_temperature(temperature=16, hold_time_minutes=5, block_max_volume=60)
        thermocycler.set_block_temperature(temperature=4)
        thermocycler.open_lid()
        protocol.pause("Ready")                                                          # Getting semiskirted Round 3 plate(from Parse Biosciences Evercode WT v3 Kit) to temp_block

    # ====== Move Reservoir on Temp module to C2 ====== 

    protocol.comment('Move reservoir to C2')
    protocol.move_labware(reservoir, 'C2', use_gripper=USE_GRIPPER)

    # ====== Round 3 thaw plate ====== # Centrifuge for 1min at 100g at 4 degree C  Eppendorf ▲❖▶︎▲❖▶︎ THERMOCYCLER 
 
    # ====== Transfer Round 2 liquid into a new 15mL tube ====== # REMOVE PLATE SEAL after Round 2 stop protocol

    p50.pick_up_tip(tiprack_50_2)    
    for i in range(1, 12, 2):                                                           # Iterate over pairs of wells (1-2, 3-4, 5-6, ..., 11-12)
        source = f'A{i}'
        target = f'A{i+1}'
        p50.mix(3, 38, plate[source])
        p50.aspirate(30, plate[source])
        p50.dispense(30, plate[target].bottom(z=3))
        p50.aspirate(38, plate[source].bottom(z=0.5))
        p50.dispense(38, plate[target].bottom(z=3))
    p50.drop_tip()
    well_groups = [
    ['A2', 'A4', 'A6', 'A8', 'A10', 'A12'],                               
    ['B2', 'B4', 'B6', 'B8', 'B10', 'B12'],
    ['C2', 'C4', 'C6', 'C8', 'C10', 'C12'],
    ['D2', 'D4', 'D6', 'D8', 'D10', 'D12'],
    ['E2', 'E4', 'E6', 'E8', 'E10', 'E12'],
    ['F2', 'F4', 'F6', 'F8', 'F10', 'F12'],
    ['G2', 'G4', 'G6', 'G8', 'G10', 'G12'],
    ['H2', 'H4', 'H6', 'H8', 'H10', 'H12']
    ]
    p1000.pick_up_tip(tiprack_1000_1)
    for wells in well_groups:
        for well in wells:
            p1000.mix(2, 100, plate[well], rate=0.7)
            p1000.aspirate(120, plate[well].bottom(0), rate=0.7)                       # It is 50+10 + 60 = 120uL after pooling cells with 50uL pipette
        p1000.dispense(720, tubes1["A2"].bottom(40))
    p1000.drop_tip()                                
    p1000.pick_up_tip(tiprack_200_1)
    for wells in well_groups:                                                          # Iterate over each group of wells and perform the operations
        for well in wells:
            p1000.aspirate(32, plate[well].bottom(z=0.5), rate=0.7)
        p1000.dispense(192, tubes1["A2"].bottom(40))
    p1000.drop_tip()      

    # ====== Sample through strainer ====== # (60X96)= 5760uL total volume

    p1000.flow_rate.aspirate = 716
    p1000.pick_up_tip(tiprack_1000_1)
    for _ in range(5):
        p1000.aspirate(1000, tubes1['A2'])                                   
        p1000.dispense(1000, tubes1['B2'].top(z=-10.0), rate=0.488)
        p1000.blow_out()
    p1000.aspirate(1000, tubes1['A2'].bottom(z=0.5))                                   # Perform repetitive aspirate and dispense actions
    p1000.dispense(1000, tubes1['B2'].top(z=-10.0), rate=0.488)
    p1000.blow_out()                                                                   # Final aspirate and dispense with extra volume
    protocol.delay(0.3)
    p1000.drop_tip()      
    
    # ====== Addition of Round 3 Ligation Enzyme ======

    p1000.pick_up_tip(tiprack_1000_1)
    p1000.aspirate(R3LE_vol, R3LE)
    p1000.dispense(R3LE_vol, tubes1["B2"])
    p1000.blow_out()
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_1000_1)
    p1000.mix(10, 800, tubes1["B2"].bottom(35))   
    p1000.mix(10, 800, tubes1["B2"].bottom(20))   
    p1000.drop_tip()
    protocol.comment('Move_tiprack_50_4 to chute')
    protocol.move_labware(tiprack_50_4, default_trash,use_gripper=True)
    protocol.comment('Move tiprack_50_5 to deck B2')
    protocol.move_labware(tiprack_50_5, 'B2',use_gripper=USE_GRIPPER) 
    protocol.comment('Move_tiprack_50_3 to chute')
    protocol.move_labware(tiprack_50_3, default_trash, use_gripper=USE_GRIPPER)    
    protocol.comment('Move tiprack_50_6 to deck A2')
    protocol.move_labware(tiprack_50_6, new_location='A2', use_gripper=True)  

    # ====== Barcoding Round 3 Loading pooled cells with round 3 ligation enzyme onto Round 3 plate ====== 

    p1000.pick_up_tip(tiprack_1000_1)
    p1000.mix(2, 1000, tubes1['B2'])
    p1000.drop_tip()
    protocol.comment('Move reservoir to Temperature Module')
    protocol.move_labware(reservoir, temp_adapter, use_gripper=USE_GRIPPER)   
    p1000.pick_up_tip(tiprack_1000_1)
    for well in ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6']:                     # Here Reservoir is an Eppendorf semiskirted plate accomodating more volume per well
        p1000.aspirate(210, tubes1['B2'])
        p1000.dispense(210, reservoir[well].top(z=-5))
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_1000_1)                                                      
    for well in ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7']:
        p1000.aspirate(210, tubes1['B2'])
        p1000.dispense(210, reservoir[well].top(z=-5))
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_1000_1)
    for well in ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8']:
        p1000.aspirate(210, tubes1['B2'])
        p1000.dispense(210, reservoir[well].top(z=-5))
    p1000.drop_tip()
    reservoir_map = {                                                                 # DONT REUSE TIPS DURING THIS STEP ; Add a NEW PLATE SEAL to Round 3 Plate
    "A6": ["A1", "A2", "A3", "A4"],
    "A7": ["A5", "A6", "A7", "A8"],
    "A8": ["A9", "A10", "A11", "A12"]
    }
    for reservoir_well, plate_wells in reservoir_map.items():
        for plate_well in plate_wells:
            p50.pick_up_tip(tiprack_50_5)
            p50.mix(2, 40, reservoir[reservoir_well])
            p50.aspirate(50, reservoir[reservoir_well])
            p50.dispense(50, plate[plate_well])
            p50.mix(2, 40, plate[plate_well])
            p50.drop_tip()                                                                                       
       
    # ====== Round 3 Plate --- Thermocycler GEN2 run ====== # ADD NEW PLATE SEAL

    protocol.pause("Ready")    
    if dry_run == False:
        protocol.comment("Barcoding round 3")
        thermocycler.set_block_temperature(temperature=16, hold_time_minutes=15, block_max_volume=60)
        thermocycler.set_block_temperature(temperature=4)
        temp_block.set_temperature(4)
        thermocycler.open_lid()
        protocol.pause("Ready")            
    
    # ====== Round 3 Stop Buffer manually kept ready in a reservoir (96 wells with 20ul each on slot C2) (Opentrons Tough 96 well PCR plate) ====== 

    reservoir_SB      = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','D4','Reservoir_SB')
    protocol.comment('Move reservoir_SB from D4 to deck C2')
    protocol.move_labware(reservoir_SB, new_location='C2', use_gripper=True)                                       

    # ====== Round 3 Plate Stop Buffer to Round 3 Plate ======                       # check if tips are dropped after each transfer

    def pipette_sequence(pipette, source_wells, destination_plate, volume=20, mix_volume=20, mix_cycles=3):
        for well in source_wells:
            pipette.pick_up_tip(tiprack_50_6)
            pipette.mix(mix_cycles, mix_volume, reservoir_SB[well])
            pipette.aspirate(volume, reservoir_SB[well])
            pipette.dispense(volume, destination_plate[well])
            pipette.mix(mix_cycles, mix_volume, destination_plate[well])
            pipette.drop_tip()

    # Define the source wells you need to process
    source_wells = ["A" + str(i) for i in range(1, 13)]

    # Example of how to use the function
    pipette_sequence(p50, source_wells, plate)                                       # DONT REUSE TIPS DURING THIS STEP 

    # ====== Transfer contents of Round 3 plate with P1000 to 15mL tube ======  
       
    thermocycler.open_lid()            
    p50.pick_up_tip(tiprack_50_2)
    for i in range(1, 12, 2):                                                        # Iterate over pairs of wells (1-2, 3-4, 5-6, ..., 11-12)
        source = f'A{i}'
        target = f'A{i+1}'
        p50.mix(3, 40, plate[source])
        p50.aspirate(30, plate[source])
        p50.dispense(30, plate[target].bottom(z=3))
        p50.mix(1,30, plate[target])
        p50.aspirate(30, plate[source].bottom(z=0.6))
        p50.dispense(30, plate[target].bottom(z=3))
        p50.aspirate(30, plate[source].bottom(z=0.4))
        p50.dispense(30, plate[target].bottom(z=3))
        p50.mix(2,40, plate[target])
    p50.drop_tip()                                    
    
    well_groups = [                                                                  # Define the wells for each row                                                           
        ['A2', 'A4', 'A6', 'A8', 'A10', 'A12'],         
        ['B2', 'B4', 'B6', 'B8', 'B10', 'B12'],
        ['C2', 'C4', 'C6', 'C8', 'C10', 'C12'],
        ['D2', 'D4', 'D6', 'D8', 'D10', 'D12'],
        ['E2', 'E4', 'E6', 'E8', 'E10', 'E12'],
        ['F2', 'F4', 'F6', 'F8', 'F10', 'F12'],
        ['G2', 'G4', 'G6', 'G8', 'G10', 'G12'],
        ['H2', 'H4', 'H6', 'H8', 'H10', 'H12']
    ] 
    p1000.pick_up_tip(tiprack_1000_1)   
    for wells in well_groups:                                                       # Iterate over each group of wells and perform the operations
        for well in wells:
            p1000.mix(2, 100, plate[well], rate=0.7)
            p1000.aspirate(160, plate[well].bottom(0), rate=0.8)
        p1000.dispense(960, tubes1["A3"].bottom(40))
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_200_1)
    for wells in well_groups:                                                       
        for well in wells:
            p1000.aspirate(32, plate[well].bottom(z=0.6), rate=0.7)             
        p1000.dispense(192, tubes1["A3"].bottom(40))
    p1000.drop_tip()
    
    # ====== Sample passed through cell strainer into a new 15mL tube with 1000uL tips =====
                                                           
    p1000.pick_up_tip(tiprack_1000_1)                                               # 7680uL to be passed through strainer
    depths = [40, 30, 25, 25, 12.5, 6.25, 3.125,3.125]
    volumes = [1000, 1000, 1000, 1000, 1000, 1000, 1000,680]
    for depth, volume in zip(depths, volumes):
        p1000.flow_rate.aspirate = 150
        p1000.flow_rate.dispense = 350                         
        p1000.aspirate(volume, tubes1['A3'].bottom(depth))
        p1000.dispense(volume, tubes1['A4'].top(z=-10.0))
    protocol.delay(0.3)
    p1000.drop_tip()
    p1000.flow_rate.aspirate = 716

    # Add 70uL of Spin Additive to the 15mL tube with the sample -- GENTLY invert once to mix after addition of Spin Additive

    p1000.pick_up_tip(tiprack_200_1)
    p1000.aspirate(SA_vol2, SA)
    p1000.dispense(SA_vol2, tubes1['A4'].bottom(40))                               # check at what height the tip containing spin additive needs to be at, as the volume of sample is more than 7.5mL
    p1000.drop_tip()

    thermocycler.set_block_temperature(temperature=25) 

    # Centrifuge 15mL falcon tube for 5-10 min at 400g at 4 degree C

    protocol.pause("Ready")

    # Remove supernatant until 40uL remains without disturbing the pellet          # 7750uL total volume, but 40uL residual volume to be left behind
    # Remove supernatant with P1000 pipette 
    
    depths = [55, 48, 41, 34, 27, 20, 12, 4, 2.5]                              
    volumes = [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 250]
    aspirateSpeeds = [150, 150, 150, 150, 150,150, 150, 75, 20]
    p1000.pick_up_tip(tiprack_1000_1)
    for aspirateSpeed, depth, volume in zip(aspirateSpeeds, depths, volumes):
        p1000.flow_rate.aspirate = aspirateSpeed
        p1000.aspirate(volume, tubes1['A4'].bottom(depth))
        p1000.dispense(volume, tubes1['B4'].bottom(100))                           # supernatant collecting tube 
        p1000.blow_out()
    p1000.drop_tip()
    p1000.flow_rate.aspirate = 716   

    # ====== Add Pre-Lysis Wash buffer ======                                      # tubes1 pre-lysis wash buffer

    p1000.pick_up_tip(tiprack_1000_1)
    p1000.aspirate(1000,tubes1['A5'])
    p1000.dispense(1000,tubes1['A4'])
    p1000.aspirate(800,tubes1['A4'])                                               # Instead of mixing, aspirate, dispense incorporated as there are bubbles in mix step
    p1000.dispense(800,tubes1['A4'])
    p1000.aspirate(800,tubes1['A4'])
    p1000.dispense(800,tubes1['A4'])
    p1000.move_to(tubes1['A4'].bottom(z=25))
    p1000.blow_out()
    p1000.move_to(tubes1['A4'].top().move(types.Point(x=4,z=-3)))
    p1000.move_to(tubes1['A4'].top().move(types.Point(x=-4,z=-3)))
    p1000.blow_out()
    protocol.delay(0.3)
    p1000.blow_out()
    p1000.drop_tip()

    p1000.pick_up_tip(tiprack_1000_1)
    for i in range(3):
        p1000.transfer(
        volume=1000,
        source=tubes1['A5'],
        dest=tubes1['A4'],
        new_tip="never"
    )
    p1000.drop_tip()      

    # ====== Centrifuge 15mL for 5-10 min at 400g at 4 degree C -- MANUAL ====== 

    protocol.pause("Ready")

    # Remove supernatant 4mL

    depths = [34, 27, 20, 12, 4, 2.5]
    volumes = [1000, 1000, 1000, 1000, 1000, 250]
    aspirateSpeeds = [150, 150, 150, 150, 75, 20]
    p1000.pick_up_tip(tiprack_1000_1)
    for aspirateSpeed, depth, volume in zip(aspirateSpeeds,depths, volumes):
        p1000.flow_rate.aspirate = aspirateSpeed
        p1000.aspirate(volume, tubes1['A4'].bottom(depth))
        p1000.dispense(volume, tubes1['B4'].bottom(100))                            # waste tube
        p1000.blow_out()
    p1000.drop_tip()
    p1000.flow_rate.aspirate = 716  

    # ====== Addition of Pre Lysis Dilution Buffer ====== 

    p1000.pick_up_tip(tiprack_200_1)
    p1000.aspirate(PLDB_vol, PLDB)
    p1000.dispense(PLDB_vol, tubes1['A4'])
    p1000.drop_tip()
    
    # ====== Count cells with haemocytometer ====== 

    protocol.pause("Ready")

    # Do not add more than 12,500 cells to a sublibrary --- WT version 3 kit---8 different wells; Volume of 25uL dilution with pre lysis dilution buffer after counting cells 

    # ====== Preparation of the Lysis Master Mix ====== 

    # ====== Addition of Lysis Buffer ====== 
    p1000.pick_up_tip(tiprack_1000_1)
    p1000.aspirate(LB_vol, tubes1['B1'])
    p1000.dispense(LB_vol, tubes1['B2'])
    p1000.drop_tip()

    # ====== Addition of Lysis Enzyme ====== 
    p1000.pick_up_tip(tiprack_200_1)
    p1000.aspirate(LE_vol, LE)
    p1000.dispense(LE_vol, tubes1['B2'])
    p1000.drop_tip()
    p1000.pick_up_tip(tiprack_1000_1)
    p1000.mix(3, 240, tubes1['B2'])
    p1000.drop_tip()

    
    protocol.comment('Move reservoir_SB from C2 to chute')
    protocol.move_labware(reservoir_SB, default_trash, use_gripper=USE_GRIPPER)
    plate4 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','D4','Plate4')
    protocol.comment('Move Plate4 from D4 to C2')                                 # Plate 4 is off deck # OPENTRONS TOUGH PLATE
    protocol.move_labware(plate4, new_location='C2', use_gripper=True)

    # ======  Addition of Lysis Master Mix to wells of plate with diluted cells ====== 

    for well in ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1']:
        p1000.pick_up_tip(tiprack_200_1)
        p1000.aspirate(30, tubes1['B2'])
        p1000.dispense(30, plate4[well])
        p1000.drop_tip()                                                         # Vortex briefly and centrifuge 30 sec 

    # ====== Sublibrary lysates on Thermocycler GEN2 ====== 

    protocol.pause("Ready")                                                      # Moving Plate 4 from centrifuge to thermocycler        
    if dry_run == False:
        protocol.comment("Cell Lysis")
        thermocycler.set_lid_temperature(80)
        thermocycler.close_lid()
        thermocycler.set_block_temperature(temperature=65, hold_time_minutes=15, block_max_volume=55)
        thermocycler.set_block_temperature(temperature=4)
        thermocycler.open_lid()
        protocol.pause("Ready")                                                  # Store the sublibrary lysates at -80     