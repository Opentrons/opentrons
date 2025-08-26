from opentrons import protocol_api
from opentrons import types
import json
import math
import numpy as np
from opentrons.protocol_engine.errors import ProtocolCommandFailedError

# Metadata

metadata = {
    "protocolName": "Sequencing Library Preparation using PBMC cells",
    "author": "Vasudha Nair <vasudha.nair@opentrons.com>",
    "description": "Fragmentation, End Prep, post-fragmentation and end prep size selection , Adapter Ligation, post-ligation purification, Barcoding Round 4 protocol using the Flex with Parse Evercode WT v3 kit",
}

# Requirements

requirements = {
    "robotType": "Flex", 
    "apiLevel": "2.20",
}

def add_parameters(parameters):
    
    parameters.add_int(
        display_name="Sample sublibrary",
        variable_name="sample_sublibrary",
        default=8,
        minimum=1,
        maximum=8,
        description="How many sample sublibraries to process", 
    )

    parameters.add_int(
        display_name="PCR Cycles",
        variable_name="pcr_cycles",
        default=10,
        minimum=7,
        maximum=13,
        description="How many pcr cycles for indexing PCR based on cDNA input (ng)", 
    )

    parameters.add_bool(
        display_name="Dry Run",
        variable_name="dry_run",
        description="Skip pauses, incubation delays and reduce mix steps",  
        default=False
    )


# Protocol Run Function

def run(protocol: protocol_api.ProtocolContext):
      

    # Deck Set Up and Labware

    # ======================================== FIRST ROW =========================================

    heatershaker   = protocol.load_module('heaterShakerModuleV1','D1')
    hs_adapter     = heatershaker.load_adapter('opentrons_96_pcr_adapter')
    mag_block      = protocol.load_module('magneticBlockV1', 'D2')
    default_trash  = protocol.load_waste_chute()

    # ======================================== SECOND ROW ==========================================================

    temp_block1    = protocol.load_module('temperature module gen2', 'C1')
    tubes          = temp_block1.load_labware('opentrons_24_aluminumblock_nest_1.5ml_snapcap', 'Tubes')
    sample_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','C2', 'Sample_plate_1')
    tiprack_200_2  = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'C3')

    # ======================================== THIRD ROW ===========================================================

    thermocycler   = protocol.load_module('thermocycler module gen2', 'B1')
    tiprack_50_1   = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'B2')
    tiprack_50_2   = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'B3')

    # ======================================== FOURTH ROW ========================================

    tiprack_200_3   = protocol.load_labware('opentrons_flex_96_tiprack_200ul','A2')
    tiprack_200_1  = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'A3')

    # ===================================================================================================
    
    waste          = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','D4', 'waste')
    tiprack_200_4  = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'B4')

    # ===================================================================================================

    # Parameters

    USE_GRIPPER = True
    dry_run=False
    sample_sublibrary=protocol.params.sample_sublibrary
    pcr_cycles=protocol.params.pcr_cycles

    # Pipettes

    p50 = protocol.load_instrument("flex_8channel_50", mount="left", tip_racks=[tiprack_50_1,tiprack_50_2])
    p1000 = protocol.load_instrument("flex_1channel_1000", mount="right", tip_racks=[tiprack_200_1,tiprack_200_2, tiprack_200_3, tiprack_200_4])
    
    # Reagents

    NFW   =tubes['A1']
    FEPB  =tubes['A2']
    FEPE  =tubes['A3']
    AMPB  =tubes['A5']
    LA    =tubes['B1']
    ALE   =tubes['B2']
    ALB   =tubes['B3']
    LAM   =tubes['B4'] 
    FEPMM =tubes['B5']    
    ALMM  =tubes['B6']
    ETOH  =tubes['C6']  
    ETOH1 =tubes['D1']    
    ETOH2 =tubes['D2']
    ETOH3 =tubes['D3']
    ETOH4 =tubes['D4']
    ETOH5 =tubes['D5']
    ETOH6 =tubes['D6']
    
    NFW_vol   = 100
    NFW_vol1  = 23
    NFW_vol2  = 19.25
    FEPB_vol  = 5.5
    FEPE_vol  = 11
    FEPMM_vol = 15
    ALB_vol   = 22
    ALE_vol   = 11
    LA_vol    = 2.8
    LAM_vol   = 25
    ALMM_vol  = 50
    AMPB_vol  = 30
    ETOH_vol  = 100
    
    # Liquid Definitions

    NFW_=protocol.define_liquid(name="Nuclease Free Water",description="Nuclease Free Water", display_color="#6699ff")#00d2e6
    for well in tubes.rows()[0][0:1]:
        well.load_liquid(liquid=NFW_, volume=NFW_vol*sample_sublibrary*1.3)
    FEPB_=protocol.define_liquid(name="Fragmentation End Prep Buffer", description="Fragmentation End Prep Buffer",display_color="#ff6699")
    for well in tubes.rows()[0][1:2]:
        well.load_liquid(liquid=FEPB_, volume=FEPB_vol*sample_sublibrary*1.3)
    FEPE_=protocol.define_liquid(name="Fragmentation End Prep Enzyme", description="Fragmentation End Prep Enzyme",display_color="#ffcc99")
    for well in tubes.rows()[0][2:3]:
        well.load_liquid(liquid=FEPE_, volume=FEPE_vol*sample_sublibrary*1.3)
    AMPB_=protocol.define_liquid(name="Ampure Beads", description="Ampure Beads",display_color="#cc3399")
    for well in tubes.rows()[0][4:5]:
        well.load_liquid(liquid=AMPB_, volume=AMPB_vol*6)        
    FEPMM_=protocol.define_liquid(name="Fragmentation End Prep Master Mix", description="Fragmentation End Prep Master Mix",display_color="#00cc99")
    for well in tubes.rows()[1][4:5]:
        well.load_liquid(liquid=FEPMM_, volume=FEPMM_vol*sample_sublibrary*1.3)    
    ALB_=protocol.define_liquid(name="Adapter Ligation Buffer", description="Adapter Ligation Buffer",display_color="#99001a")
    for well in tubes.rows()[1][2:3]:
        well.load_liquid(liquid=ALB_, volume=ALB_vol*sample_sublibrary*1.3)
    ALE_=protocol.define_liquid(name="Adapter Ligation Enzyme", description="Round2 Ligation Enzyme",display_color="#ff9966")
    for well in tubes.rows()[1][1:2]:
        well.load_liquid(liquid=ALE_, volume=ALE_vol*sample_sublibrary*1.3)
    LA_=protocol.define_liquid(name="Ligation Adapter", description= "Ligation Adapter",display_color="#008000")
    for well in tubes.rows()[1][0:1]:
        well.load_liquid(liquid=LA_, volume=LA_vol*sample_sublibrary*1.3)
    LAM_=protocol.define_liquid(name="Library AMP Mix", description="Library AMP Mix",display_color="#cc99ff")
    for well in tubes.rows()[1][3:4]:
        well.load_liquid(liquid=LAM_, volume=LAM_vol*sample_sublibrary*1.3)
    ALMM_=protocol.define_liquid(name="Adapter Ligation Master Mix", description="Adapter Ligation Master Mix",display_color="#ffff00")
    for well in tubes.rows()[1][5:6]:
        well.load_liquid(liquid=ALMM_, volume=ALMM_vol*sample_sublibrary*1.3)
    ETOH_=protocol.define_liquid(name="Ethanol", description="Ethanol",display_color="#ddd3c9")
    for well in tubes.rows()[2][5:6]:
        well.load_liquid(liquid=ETOH_, volume=ETOH_vol*sample_sublibrary*2)
    ETOH1_=protocol.define_liquid(name="Ethanol", description="Ethanol",display_color="#ddd3c9")
    for well in tubes.rows()[3][0:1]:
        well.load_liquid(liquid=ETOH1_, volume=ETOH_vol*sample_sublibrary*2)
    ETOH2_=protocol.define_liquid(name="Ethanol", description="Ethanol",display_color="#ddd3c9")
    for well in tubes.rows()[3][1:2]:
        well.load_liquid(liquid=ETOH2_, volume=ETOH_vol*sample_sublibrary*2)
    ETOH3_=protocol.define_liquid(name="Ethanol", description="Ethanol",display_color="#ddd3c9")
    for well in tubes.rows()[3][2:3]:
        well.load_liquid(liquid=ETOH3_, volume=ETOH_vol*sample_sublibrary*2)
    ETOH4_=protocol.define_liquid(name="Ethanol", description="Ethanol",display_color="#ddd3c9")
    for well in tubes.rows()[3][3:4]:
        well.load_liquid(liquid=ETOH4_, volume=ETOH_vol*sample_sublibrary*2)
    ETOH5_=protocol.define_liquid(name="Ethanol", description="Ethanol",display_color="#ddd3c9")
    for well in tubes.rows()[3][4:5]:
        well.load_liquid(liquid=ETOH3_, volume=ETOH_vol*sample_sublibrary*2)
    ETOH6_=protocol.define_liquid(name="Ethanol", description="Ethanol",display_color="#ddd3c9")
    for well in tubes.rows()[3][5:6]:
        well.load_liquid(liquid=ETOH4_, volume=ETOH_vol*sample_sublibrary*2)
    

    # MAG BLOCK OFFSETS

    mb_drop_offset={'x':0,'y':0.,'z':0}
    mb_pick_up_offset={'x':0,'y':0,'z':0}

    def move_from_deck(labware, new_location):
        protocol.move_labware(
        labware,
        new_location,
        use_gripper=False,
        )
    def move_offdeck(labware,new_location): # manually move labware from off deck locations onto deck
        protocol.move_labware(
        labware,
        new_location,
        use_gripper=False,
        )

    # Commands

    # ============ Temp module at 4C ============

    temp_block1.set_temperature(4)   

    # =============================== FRAGMENTATION AND END PREP ===============================

    # Prepare diluted cDNA -- Keep 10uL of cDNA on sample_plate_1  

    # ==== Addition of Nuclease-free water ====

    wells = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    for well in wells:
        p1000.pick_up_tip()  
        p1000.aspirate(NFW_vol/4, NFW) 
        p1000.dispense(NFW_vol/4, sample_plate_1[well], rate=0.10) 
        p1000.mix(5, 24, sample_plate_1[well], rate=0.15) 
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip() 


    # ==== Cool Thermocycler prior to use -- Fragmentation and End prep ====

    if dry_run == False:
        protocol.comment("Fragmentation and End Prep")
        thermocycler.set_lid_temperature(70)
        thermocycler.close_lid()
        thermocycler.set_block_temperature(temperature=4, hold_time_minutes=5, block_max_volume=50) 
        thermocycler.open_lid()

    # ==== Prepare the Fragmentation and End Prep Master Mix in a new 1.5mL tube ====
    
    total_FEPB_vol = FEPB_vol * sample_sublibrary * 1.1
    total_FEPE_vol = FEPE_vol * sample_sublibrary * 1.1

    # Add Fragm/End prep buffer ==== ==== ==== ==== ==== ====

    p1000.pick_up_tip()
    p1000.aspirate(total_FEPB_vol, FEPB)  # for 1 reaction the volume is 5.5uL
    p1000.dispense(total_FEPB_vol, FEPMM, rate=0.10)
    p1000.blow_out()
    p1000.drop_tip()

    # Add Fragm/End prep Enzymes ==== ==== ==== ==== ==== ====

    p1000.pick_up_tip()
    p1000.aspirate(total_FEPE_vol, FEPE, rate=0.10)  # for 1 reaction the volume is 11uL
    p1000.dispense(total_FEPE_vol, FEPMM, rate=0.10)
    p1000.blow_out()
    p1000.drop_tip()

    # Mix the master mix ==== ==== ==== ==== ==== ====

    p1000.pick_up_tip()
    p1000.mix(7, 14 * sample_sublibrary, FEPMM, rate=0.15)
    p1000.blow_out(FEPMM.top(z=-1))
    p1000.drop_tip()
   

    # Add the Frag. and End prep master mix ==== ==== ==== ==== ==== ====

    wells = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(FEPMM_vol, FEPMM, rate=0.10)
        p1000.dispense(FEPMM_vol, sample_plate_1[well].bottom(z=0.4), rate=0.10)
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()
    wells = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    for well in wells: 
        p1000.pick_up_tip()
        p1000.mix(10, 30, sample_plate_1[well], rate=0.10)
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()

    protocol.move_labware(
             labware=sample_plate_1,
             new_location=thermocycler,
             use_gripper=USE_GRIPPER,
    )

    # Fragmentation and End prep continued ==== ==== ==== ==== ==== ==== ==== ==== ==== ADD PLATE SEAL

    protocol.comment("Add plate seal")
    protocol.pause("Ready")
    if dry_run == False:
        protocol.comment("Fragmentation")
        thermocycler.set_lid_temperature(70)
        thermocycler.close_lid()
        thermocycler.set_block_temperature(temperature=32, hold_time_minutes=10, block_max_volume=50)
        thermocycler.set_block_temperature(temperature=65, hold_time_minutes=30, block_max_volume=50) 
        thermocycler.set_block_temperature(temperature=4, hold_time_minutes=5, block_max_volume=50) 
        thermocycler.open_lid()            

    # ================= POST-FRAGMENTATION AND END PREP SIZE SELECTION ========================== 

    temp_block1.set_temperature(24)

    # Keep tube A5 containing beads after temp reaches 24 # Add Ampure XP beads to the end prepped DNA ==== ==== ==== ==== ==== 

    # remove seal before this step

    protocol.move_labware(
             labware=sample_plate_1,
             new_location='C2',
             use_gripper=USE_GRIPPER,
    )

    protocol.comment("Remove plate seal")
    protocol.pause("Ready")

    wells = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(AMPB_vol, AMPB, rate= 0.10)                        
        p1000.dispense(AMPB_vol, sample_plate_1[well], rate= 0.10)
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()

    wells = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.mix(5, 60, sample_plate_1[well], rate=0.10)
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()    

    # Incubate for 5 min at RT -- make use of gripper
    
    if dry_run == False:
        protocol.delay(minutes=5)

    # Place plate on magnetic block ==== ==== ==== ==== ==== ==== ==== ====

    # USE GRIPPER TO MOVE PLATE FROM C2 TO MAG PLATE
        
    protocol.move_labware(
             labware=sample_plate_1,
             new_location=mag_block,
             use_gripper=USE_GRIPPER,
    )
               
    # Incubate until solution is clear (3 min)

    if dry_run == False:
        protocol.delay(minutes=3)

    # Transfer the supernatant ==== ==== ==== ==== ==== ==== ==== ==== ====
    
    wells3 = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    wells4 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well3, well4 in zip(wells3, wells4):
        p1000.pick_up_tip()
        p1000.aspirate(75, sample_plate_1[well3].bottom(z=1), rate=0.25)
        p1000.dispense(75, sample_plate_1[well4].bottom(z=1), rate=0.25)
        p1000.blow_out(sample_plate_1[well4].top(z=-1))
        p1000.drop_tip()

    # Extra step 20uL included to transfer any remnant

    wells3 = ["A4"]                                                          
    wells4 = ["A2"]
    for well3, well4 in zip(wells3, wells4):
        p50.pick_up_tip()
        p50.aspirate(20, sample_plate_1[well3].bottom(z=0.4), rate=0.20)
        protocol.delay(seconds=5)
        p50.dispense(20, sample_plate_1[well4].bottom(z=0.4), rate=0.20)
        p50.blow_out(sample_plate_1[well4].top(z=-1))
        p50.drop_tip()

    protocol.move_labware(
             labware=sample_plate_1,
             new_location='C2',
             use_gripper=USE_GRIPPER,
    )   

    # Add Ampure beads 10uL

    wells4 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(AMPB_vol/3, AMPB, rate= 0.10)                        
        p1000.dispense(AMPB_vol/3, sample_plate_1[well4], rate= 0.10)
        p1000.blow_out(sample_plate_1[well4].top(z=-1))
        p1000.drop_tip() 

    wells4 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.mix(5, 60, sample_plate_1[well4], rate=0.10)
        p1000.blow_out(sample_plate_1[well4].top(z=-1))
        p1000.drop_tip()    

    # Incubate for 5 min at RT -- make use of gripper
    
    if dry_run == False:
        protocol.delay(minutes=5) 

    protocol.move_labware(
             labware=sample_plate_1,
             new_location=mag_block,
             use_gripper=USE_GRIPPER,
    )

    # Wait for solution to be clear 

    if dry_run == False:
        protocol.delay(minutes=4) 

    
    # REMOVE SUPERNATANT

    protocol.move_labware(
             labware=waste,
             new_location='C2',
             use_gripper=USE_GRIPPER,
    ) 
    
    wells4 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(85, sample_plate_1[well4], rate=0.10)
        p1000.dispense(85, waste[well4], rate=0.10)
        p1000.blow_out(waste[well4].top(z=-1))
        p1000.drop_tip()

    # Add 85% ethanol --- 180uL of ethanol divided as two 107uL volumes ==== ==== 

    p1000.flow_rate.blow_out=40
    wells4 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(ETOH_vol*1.07, ETOH.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH.top(z=-5))
        p1000.dispense(ETOH_vol, sample_plate_1[well4].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()     

    p1000.flow_rate.blow_out=40
    wells4 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(ETOH_vol*1.07, ETOH1.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH1.top(z=-5))
        p1000.dispense(ETOH_vol, sample_plate_1[well4].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()

    # Incubate for 1 min at RT

    protocol.delay(minutes=1)

    # Remove the supernatant ==== ==== ==== ==== ==== ==== ==== ==== ====

    wells4 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    wells5 = [f"{chr(65+i)}11" for i in range(sample_sublibrary)]
    for well4, well5 in zip(wells4, wells5):
        p1000.pick_up_tip()
        p1000.aspirate(100, sample_plate_1[well4].bottom(z=0.2), rate=0.15)
        p1000.dispense(100, waste[well5])
        p1000.aspirate(100, sample_plate_1[well4].bottom(z=0.2), rate=0.15)
        p1000.dispense(100, waste[well5])
        p1000.drop_tip()

    wells4 = ["A2"]                                                          
    wells5 = ["A11"]
    for well4, well5 in zip(wells4, wells5):
        p50.pick_up_tip()
        p50.aspirate(40, sample_plate_1[well4].bottom(z=0.4), rate=0.10)
        p50.dispense(40, waste[well5])
        p50.drop_tip()

    # Add 85% ethanol to each tube ==== ==== ==== ==== ==== ==== ==== ==== 

    p1000.flow_rate.blow_out=40
    wells4 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(ETOH_vol*1.07, ETOH2.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH2.top(z=-5))
        p1000.dispense(ETOH_vol, sample_plate_1[well4].top(z=-2), rate=0.15)
        p1000.drop_tip()    

    p1000.flow_rate.blow_out=40
    wells4 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(ETOH_vol*1.07, ETOH3.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH3.top(z=-5))
        p1000.dispense(ETOH_vol, sample_plate_1[well4].top(z=-2), rate=0.15)
        p1000.drop_tip() 

    # Incubate for 1 min at RT

    protocol.delay(minutes=1)

    # Remove the supernatant ==== ==== ==== ==== ==== ==== ==== ==== ====

    wells4 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    wells5 = [f"{chr(65+i)}10" for i in range(sample_sublibrary)]
    for well4, well5 in zip(wells4, wells5):
        p1000.pick_up_tip()
        p1000.aspirate(100, sample_plate_1[well4].bottom(z=0.2), rate=0.15)
        p1000.dispense(100, waste[well5])
        p1000.aspirate(100, sample_plate_1[well4].bottom(z=0.2), rate=0.15)
        p1000.dispense(100, waste[well5])
        p1000.drop_tip()

    wells4 = ["A2"]                                                          
    wells5 = ["A10"]
    for well4, well5 in zip(wells4, wells5):
        p50.pick_up_tip()
        p50.aspirate(40, sample_plate_1[well4].bottom(z=0.4), rate=0.10)
        p50.dispense(40, waste[well5])
        p50.drop_tip()


    # Air dry the Ampure XP beads ==== ==== ==== ==== ==== ==== ==== ==== ====

    protocol.delay(seconds=30)

    protocol.move_labware(
             labware=waste,
             new_location='D4',
             use_gripper=USE_GRIPPER,
    )

    # Use gripper to move plate to C2

    protocol.move_labware(
             labware=sample_plate_1,
             new_location='C2',
             use_gripper=USE_GRIPPER,
             )

    # Add nuclease free water ==== ==== ==== ==== ==== ==== ==== ==== ====

    wells4 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well4 in wells4:
        p1000.pick_up_tip()
        p1000.aspirate(NFW_vol/2, NFW)
        p1000.dispense(NFW_vol/2, sample_plate_1[well3])
        p1000.mix(7,30,sample_plate_1[well4], rate=0.15) 
        p1000.blow_out(sample_plate_1[well4].top(z=-1))
        p1000.drop_tip()

    # Incubate for 5 min at RT ==== ==== ==== ==== ==== ==== ==== ==== ====

    if dry_run == False:
        protocol.delay(minutes=5)

    # USE GRIPPER TO MOVE PLATE FROM C2 TO MAG PLATE
        
    protocol.move_labware(
             labware=sample_plate_1,
             new_location=mag_block,
             use_gripper=USE_GRIPPER,
    )

    # Incubate for 3 min at RT until the solution clears

    if dry_run ==False:
        protocol.delay(minutes=4)   

    # Transfer 50uL of the supernatant into a new plate  

    wells4 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    wells6 = [f"{chr(65+i)}6" for i in range(sample_sublibrary)]
    for well4, well6 in zip(wells4, wells6):
        p1000.pick_up_tip()
        p1000.aspirate(50, sample_plate_1[well4].bottom(z=1), rate=0.25)
        p1000.dispense(50, sample_plate_1[well6].bottom(z=1), rate=0.25)
        p1000.blow_out(sample_plate_1[well6].top(z=-1))
        p1000.drop_tip()

    # Safe stopping point The size selected fragmented and end prepped DNA 
    # can be stored at 4C for up to 18 hours or at -20 for 2 weeks
    
    # ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== 

    # ============================== ADAPTER LIGATION ==============================

    # Prepare Adapter Ligation Master Mix in a new 1.5mL tube 

    total_NFW_vol = NFW_vol2 * sample_sublibrary * 1.1
    total_ALB_vol = ALB_vol * sample_sublibrary * 1.1
    total_ALE_vol = ALE_vol * sample_sublibrary * 1.1
    total_LA_vol = LA_vol * sample_sublibrary * 1.1

    # Add nuclease free water ==========

    p1000.pick_up_tip()
    p1000.aspirate(total_NFW_vol, NFW)
    p1000.dispense(total_NFW_vol, ALMM)
    p1000.blow_out(ALMM.top(z=-1))
    p1000.drop_tip()

    # Add Adapter Ligation Buffer ==========

    p1000.pick_up_tip()
    p1000.aspirate(total_ALB_vol, ALB, rate=0.10)
    p1000.dispense(total_ALB_vol, ALMM, rate=0.10)
    p1000.blow_out(ALMM.top(z=-1))
    p1000.drop_tip()

    # Add Adapter Ligation Enzyme ==========

    p1000.pick_up_tip()
    p1000.aspirate(total_ALE_vol, ALE, rate=0.10)
    p1000.dispense(total_ALE_vol, ALMM, rate=0.10)
    p1000.blow_out(ALMM.top(z=-1))
    p1000.drop_tip()

    # Add Ligation Adapter ==========

    p1000.pick_up_tip()
    p1000.aspirate(total_LA_vol, LA, rate=0.15)
    p1000.dispense(total_LA_vol, ALMM, rate=0.15)
    p1000.blow_out(ALMM.top(z=-1))
    p1000.drop_tip()

    p1000.pick_up_tip()
    p1000.mix(7, 23 * sample_sublibrary, ALMM, rate=0.15)
    p1000.blow_out(ALMM.top(z=-1))
    p1000.drop_tip()

    # ========== Add Adapter Ligation Master Mix to each tube of purified fragmented and end prepped DNA ==========

    thermocycler.open_lid()
    wells6 = [f"{chr(65+i)}6" for i in range(sample_sublibrary)]
    for well6 in wells6:
        p1000.pick_up_tip()
        p1000.aspirate(ALMM_vol, ALMM, rate=0.15)
        p1000.dispense(ALMM_vol, sample_plate_1[well6].bottom(z=2), rate=0.15)
        p1000.blow_out(sample_plate_1[well6].top(z=-1))
        p1000.drop_tip()    

    wells6 = [f"{chr(65+i)}6" for i in range(sample_sublibrary)]
    for well6 in wells6:
        p1000.pick_up_tip()
        p1000.mix(7, 70, sample_plate_1[well6], rate=0.15)
        p1000.blow_out(sample_plate_1[well6].top(z=-1))
        p1000.drop_tip()

    protocol.move_labware(
             labware=sample_plate_1,
             new_location=thermocycler,
             use_gripper=USE_GRIPPER,
    )
    
    if dry_run == False:
        protocol.comment("Add plate seal")
        protocol.pause("Ready")
        protocol.comment("Adapter Ligation")
        thermocycler.close_lid()
        thermocycler.set_block_temperature(temperature=20, hold_time_minutes=15, block_max_volume=100)
        thermocycler.set_block_temperature(temperature=4, hold_time_minutes=2, block_max_volume=100) 
        thermocycler.open_lid()
        protocol.comment("Remove plate seal") 
        protocol.pause("Ready")

    # ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== 

    protocol.move_labware(
             labware=sample_plate_1,
             new_location='C2',
             use_gripper=USE_GRIPPER,
    )

    # ============================== POST LIGATION PURIFICATION ========================================

    # Adapter ligated DNA is purified with Ampure XP cleanup ==========

    # Add Ampure XP beads ========== addition of sample to Ampure beads 

    sample_plate  = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','C4', 'sample_plate')

    thermocycler.open_lid()
    protocol.move_labware(
             labware=sample_plate,
             new_location=thermocycler,
             use_gripper=USE_GRIPPER,
    )

    wells6 = [f"{chr(65+i)}6" for i in range(sample_sublibrary)]
    wells2 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well6, well2 in zip(wells6, wells2):                                  # wells2 has 80uL Ampure beads in sample plate on thermocycler
        p1000.pick_up_tip()
        p1000.aspirate(100, sample_plate_1[well6].bottom(z=1), rate=0.10)
        p1000.dispense(100, sample_plate[well2].top(z=-2), rate=0.10)
        p1000.blow_out(sample_plate[well2].top(z=-1))
        p1000.drop_tip()

    wells6 = ["A6"]                                                          
    wells2 = ["A2"]
    for well6, well2 in zip(wells6, wells2):   
        p50.pick_up_tip()                                                     # extra step
        p50.aspirate(20, sample_plate_1['A6'].bottom(z=0.4), rate=0.10)   
        protocol.delay(seconds=5)
        p50.dispense(20, sample_plate['A2'].bottom(z=0.4), rate=0.10)
        p50.blow_out(sample_plate['A2'].top(z=-1))
        p50.drop_tip()  

    protocol.move_labware(
             labware=sample_plate_1,
             new_location=default_trash,
             use_gripper=USE_GRIPPER,
    )   

    protocol.move_labware(
             labware=sample_plate,
             new_location='C2',
             use_gripper=USE_GRIPPER,
    )                                                                      
                                                                                 
    wells2 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well2 in wells2:
        p1000.pick_up_tip()                                                        
        p1000.mix(5, 140, sample_plate[well2].bottom(z=0.4), rate=0.10)
        p1000.aspirate(120, sample_plate[well2].bottom(z=0.8), rate=0.15)
        p1000.dispense(120, sample_plate[well2].top(z=-1), rate=0.10)
        p1000.aspirate(120, sample_plate[well2].bottom(z=1), rate=0.15)
        p1000.dispense(120, sample_plate[well2].top(z=-1), rate=0.10)
        p1000.aspirate(120, sample_plate[well2].bottom(z=1), rate=0.10)
        p1000.dispense(120, sample_plate[well2].top(z=-1), rate=0.10)
        p1000.aspirate(120, sample_plate[well2].bottom(z=0.7), rate=0.10)
        p1000.dispense(120, sample_plate[well2].top(z=-1), rate=0.10)
        p1000.aspirate(120, sample_plate[well2].bottom(z=0.7), rate=0.10)
        p1000.dispense(120, sample_plate[well2].top(z=-1), rate=0.10)
        p1000.blow_out(sample_plate[well2].top(z=-1))  
        p1000.drop_tip()

    # Incubate at RT for 5 min ========== 

    if dry_run ==False:
        protocol.delay(minutes=5)

    # Use gripper to move the plate to mag Block ========== 

    protocol.move_labware(
             labware=sample_plate,
             new_location=mag_block,
             use_gripper=USE_GRIPPER,
    )
    
    if dry_run ==False:
        protocol.delay(minutes=10)     # Incubate till solution clears

    protocol.move_labware(
             labware=waste,
             new_location='C2',
             use_gripper=USE_GRIPPER,
    )                                 

    # Remove the supernatant while still on Mag block ========== 

    wells2 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    wells12 = [f"{chr(65+i)}12" for i in range(sample_sublibrary)]
    for well2, well12 in zip(wells2, wells12):
        p1000.pick_up_tip()
        p1000.aspirate(100, sample_plate[well2].bottom(z=1), rate=0.25)
        p1000.dispense(100, waste[well12].bottom(z=1), rate=0.25)
        p1000.aspirate(100, sample_plate[well2].bottom(z=1), rate=0.25)
        p1000.dispense(100, waste[well12].bottom(z=1), rate=0.25)
        p1000.drop_tip() 

    wells2 = ["A2"]                                    
    wells12 = ["A12"]
    for well2, well12 in zip(wells2, wells12):
        p50.pick_up_tip()                                                 # extra step
        p50.aspirate(25, sample_plate[well2].bottom(z=0.4), rate=0.20)   
        protocol.delay(seconds=3)
        p50.dispense(25, waste[well12])
        p50.drop_tip()      

    # Add 85% ethanol while still on Mag block =========================  

    p1000.flow_rate.blow_out=40  
    wells2 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well2 in wells2:
        p1000.pick_up_tip()
        p1000.aspirate(ETOH_vol*1.07, ETOH4.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH4.top(z=-5))
        p1000.dispense(ETOH_vol, sample_plate[well2].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()
                                      

    p1000.flow_rate.blow_out=40
    wells2 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well2 in wells2:
        p1000.pick_up_tip()
        p1000.aspirate(ETOH_vol*1.07, ETOH5.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH5.top(z=-5))
        p1000.dispense(ETOH_vol, sample_plate[well2].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()

    # Incubate at RT for 1 min ========== 
    
    if dry_run ==False:
        protocol.delay(minutes=1)    

    # Remove the supernatant while still on Mag block ========== 
  
    wells2 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    wells9 = [f"{chr(65+i)}9" for i in range(sample_sublibrary)]
    for well2, well9 in zip(wells2, wells9):
        p1000.pick_up_tip()
        p1000.aspirate(100, sample_plate[well2].bottom(z=1), rate=0.15)
        p1000.dispense(100, waste[well9])
        p1000.aspirate(100, sample_plate[well2].bottom(z=1), rate=0.15)
        p1000.dispense(100, waste[well9])
        p1000.drop_tip()

    # Remaining ethanol extra step

    wells2 = ["A2"]
    wells9 = ["A9"]
    for well2, well9 in zip(wells2, wells9):
        p50.pick_up_tip()
        p50.aspirate(40, sample_plate[well2].bottom(z=0.4), rate=0.20)
        p50.dispense(40, waste[well9]) 
        p50.drop_tip()
        
        
    # Add 85% ethanol while still on Mag block ========== 

    p1000.flow_rate.blow_out=40
    wells2 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well2 in wells2:
        p1000.pick_up_tip()
        p1000.aspirate(ETOH_vol*1.07, ETOH6.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH6.top(z=-5))
        p1000.dispense(ETOH_vol, sample_plate[well2].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()

    p1000.flow_rate.blow_out=40 
    wells2 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well2 in wells2:
        p1000.pick_up_tip()
        p1000.aspirate(ETOH_vol*1.07, ETOH1.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH1.top(z=-5))
        p1000.dispense(ETOH_vol, sample_plate[well2].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()

    # Incubate at RT for 1 min ========== 

    protocol.delay(minutes=1) 

    # Remove the supernatant while still on Mag block ========== 

    wells2 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    wells8 = [f"{chr(65+i)}8" for i in range(sample_sublibrary)]
    for well2, well8 in zip(wells2, wells8):
        p1000.pick_up_tip()
        p1000.aspirate(100, sample_plate[well2].bottom(z=1), rate=0.25)
        p1000.dispense(100, waste[well8])
        p1000.aspirate(100, sample_plate[well2].bottom(z=1), rate=0.25)
        p1000.dispense(100, waste[well8])
        p1000.drop_tip()

    # Remove any remaining supernatant while still on Mag block with p50 ========== 

    wells2 = ["A2"]
    wells8 = ["A8"]
    for well2, well8 in zip(wells2, wells8):
        p50.pick_up_tip()
        p50.aspirate(40, sample_plate[well2].bottom(z=0.4), rate=0.20)
        p50.dispense(40, waste[well8]) 
        p50.drop_tip()

    # Air dry Ampure XP beads ========== 

    if dry_run ==False:
        protocol.delay(minutes=2) 

    protocol.move_labware(
             labware=waste,
             new_location='D4',
             use_gripper=USE_GRIPPER,
    )

    # Remove plate from magnetic block ========== 

    protocol.move_labware(
             labware=sample_plate,
             new_location='C2',
             use_gripper=USE_GRIPPER,
    )

    # Resuspend the bead pellet with nuclease free water ========== 

    wells2 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well2 in wells2:
        p1000.pick_up_tip()
        p1000.aspirate(NFW_vol1, NFW)
        p1000.dispense(NFW_vol1, sample_plate[well2])
        p1000.blow_out(sample_plate[well2].top(z=-1))
        p1000.drop_tip()

    wells2 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well2 in wells2:       
        p1000.pick_up_tip()
        p1000.mix(7, 15, sample_plate[well2], rate=0.10)
        p1000.blow_out(sample_plate[well2].top(z=-1))    
        p1000.drop_tip()

    # Incubate for 5 min at RT ========== 
    
    if dry_run ==False:
        protocol.delay(minutes=5)

    protocol.move_labware(
             labware=sample_plate,
             new_location=mag_block,
             use_gripper=USE_GRIPPER,
    )

    # Incubate for 5 min at RT ========== WAit for solution to clear

    if dry_run ==False:
        protocol.delay(minutes=4)

    # While still on the magnetic block, transfer the supernatant containing the purified adapter ligated DNA ========== 
    # into new 0.2mL tubes. Store on ice

    wells2 = ["A2"]
    wells5 = ["A5"]
    for well3, well4 in zip(wells2, wells5):
        p50.pick_up_tip()
        p50.aspirate(21, sample_plate[well2].bottom(z=0.4), rate=0.20)
        p50.dispense(21, sample_plate[well5].bottom(z=0.4), rate=0.20)
        p50.blow_out(sample_plate[well5].top(z=-1))
        p50.drop_tip()

    # ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== ========== 

    # ======================================== BARCODING ROUND 4 ======================================== 

    # Centrifuge the UDI plate WT at 100g for 1 min -- wipe the surface of the plate with 70% ethanol and allow to dry ========== 

    # Transfer 4uL from a chosen unused well of the UDI plate WT to its corresponding tube of purified adapter ligated DNA  ========== 

    wells5 = ["A5"]               # 4 uL already in the wells3, and addition of sample to the well containing UDI WT reagent
    wells3 = ["A3"]
    for well5, well3 in zip(wells5, wells3):
        p50.pick_up_tip()
        p50.aspirate(21, sample_plate[well5].bottom(z=0.4), rate=0.10)
        p50.dispense(21, sample_plate[well3].bottom(z=0.4), rate=0.10)
        p50.blow_out(sample_plate[well3].top(z=-1))
        p50.drop_tip() 

    wells3 = ["A3"]
    for well3 in wells3:
        p50.pick_up_tip()
        p50.mix(5, 15, sample_plate[well3], rate=0.10)
        p50.blow_out(sample_plate[well3].top(z=-1))
        p50.drop_tip()


    # Add 25uL of Library Amp Mix to each tube. Mix by pipetting 10X with a pipette set to 25uL ========== 
 
    wells3 = [f"{chr(65+i)}3" for i in range(sample_sublibrary)]
    for well3 in wells3:
        p1000.pick_up_tip()
        p1000.aspirate(LAM_vol, LAM, rate=0.10)
        p1000.dispense(LAM_vol, sample_plate[well3].bottom(z=1), rate= 0.15)
        p1000.mix(7, 30, sample_plate[well3], rate=0.15)
        p1000.blow_out(sample_plate[well3].top(z=-1))
        p1000.drop_tip()

    protocol.move_labware(
             labware=sample_plate,
             new_location=thermocycler,
             use_gripper=USE_GRIPPER,
    )

    # Number of PCR cycles required for the indexing PCR based on the concentration of cDNA added to the fragmentation ========== 

    # and end prep reaction as recorded ==========  # Indexing PCR ========== 

    # Place the plate on a thermocycler and run the following program ========== 
    
    protocol.comment("Add plate seal")
    protocol.pause("Ready")
    if dry_run == False:
        protocol.comment("Indexing PCR")
        thermocycler.set_lid_temperature(105)
        thermocycler.close_lid()
        thermocycler.set_block_temperature(temperature=95, hold_time_minutes=3, block_max_volume=50)
        profile_round = [
            {'temperature': 98, 'hold_time_seconds': 20},
            {'temperature': 67, 'hold_time_seconds': 20},
            {'temperature': 72, 'hold_time_minutes': 1},
            ] 
        thermocycler.execute_profile(steps=profile_round, repetitions=pcr_cycles, block_max_volume=50)   
        thermocycler.set_block_temperature(temperature=72, hold_time_minutes=5, block_max_volume=50)
        thermocycler.set_block_temperature(temperature=4)
        thermocycler.open_lid()
    protocol.pause("Ready")
    protocol.comment("Remove plate seal and add 30uL to A7 well location of plate") 

    # ======================================== POST-BARCODING ROUND 4 SIZE SELECTION ======================================== 

    # Add 30uL of Ampure XP beads to each sequencing library tube 

    thermocycler.open_lid()

    protocol.move_labware(
             labware=sample_plate,
             new_location='C2',
             use_gripper=USE_GRIPPER,
    )
 
    wells3 = [f"{chr(65+i)}3" for i in range(sample_sublibrary)]
    wells7 = [f"{chr(65+i)}7" for i in range(sample_sublibrary)]
    for well3, well7 in zip(wells3, wells7):                                    # 30uL ampure XP beads in A7
        p1000.pick_up_tip()
        p1000.aspirate(50, sample_plate[well3].bottom(z=1), rate=0.15)
        p1000.dispense(50, sample_plate[well7].bottom(z=1), rate=0.15)
        p1000.blow_out(sample_plate[well7].top(z=-1))
        p1000.drop_tip()

    wells3 = [f"{chr(65+i)}3" for i in range(sample_sublibrary)]
    wells7 = [f"{chr(65+i)}7" for i in range(sample_sublibrary)]
    for well3, well7 in zip(wells3, wells7): 
        p1000.pick_up_tip()
        p1000.mix(7, 50, sample_plate[well7], rate=0.10)
        p1000.blow_out(sample_plate[well7].top(z=-1))
        p1000.drop_tip()

    #  Incubate for 5 min at RT 

    if dry_run ==False:
        protocol.delay(minutes=5)

    # Use gripper to move the plate to mag Block 

    protocol.move_labware(
             labware=sample_plate,
             new_location=mag_block,
             use_gripper=USE_GRIPPER,
    )
        
    # Place it on mag block and incubate until the solution clears for 2 minutes 

    if dry_run ==False:
        protocol.delay(minutes=3)

    # While still on the mag rack, transfer 75uL of the supernatant containing the DNA into new well of the plate

    wells7 = [f"{chr(65+i)}7" for i in range(sample_sublibrary)]
    wells9 = [f"{chr(65+i)}9" for i in range(sample_sublibrary)]
    for well7, well9 in zip(wells7, wells9):
        p1000.pick_up_tip()
        p1000.aspirate(75, sample_plate[well7].bottom(z=1), rate=0.10)
        p1000.dispense(75, sample_plate[well9].bottom(z=1), rate=0.10)
        p1000.blow_out(sample_plate[well9].top(z=-1))
        p1000.drop_tip()

    wells7 = ["A7"]                                                          # Extra step
    wells9 = ["A9"]
    for well7, well9 in zip(wells7, wells9):
        p50.pick_up_tip()
        p50.aspirate(20, sample_plate[well7].bottom(z=0.4), rate=0.20)
        protocol.delay(seconds=5)
        p50.dispense(20, sample_plate[well9].bottom(z=0.4), rate=0.20)
        p50.blow_out(sample_plate[well9].top(z=-1))
        p50.drop_tip()
    
    protocol.move_labware(
             labware=sample_plate,
             new_location='C2',
             use_gripper=USE_GRIPPER,
    )

    protocol.pause("Ready")
    protocol.comment("add 10uL of Ampure XP beads to A4 of plate") 

    wells9 = [f"{chr(65+i)}9" for i in range(sample_sublibrary)]
    wells4 = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    for well9, well4 in zip(wells9, wells4):
        p1000.pick_up_tip()
        p1000.aspirate(75, sample_plate[well9].bottom(z=1), rate=0.25)       # Low volume of Ampure XP beads in A4 - 10uL
        p1000.dispense(75, sample_plate[well4].bottom(z=1), rate=0.25)
        p1000.mix(10, 60, sample_plate[well4], rate=0.15)
        p1000.blow_out(sample_plate[well4].top(z=-1))
        p1000.drop_tip()

    # Extra step 20uL included to transfer any remnant

    wells9 = ["A9"] 
    wells4 = ["A4"]                      
    for well9, well4 in zip(wells9, wells4):
        p50.pick_up_tip()
        p50.aspirate(20, sample_plate[well9].bottom(z=0.4), rate=0.20)
        protocol.delay(seconds=5)
        p50.dispense(20, sample_plate[well4].bottom(z=0.4), rate=0.20)
        p50.blow_out(sample_plate[well4].top(z=-1))
        p50.drop_tip()    
    

    #  Incubate for 5 min at RT 

    if dry_run ==False:
        protocol.delay(minutes=5)

    # Use gripper to move the plate from mag Block 
        
    # Place it on mag block and incubate until the solution clears for 3 min 

    protocol.move_labware(
             labware=sample_plate,
             new_location=mag_block,
             use_gripper=USE_GRIPPER,
    )

    protocol.delay(minutes=6) # increasing from 3 to 6 minutes

    protocol.move_labware(
             labware=waste,
             new_location='C2',
             use_gripper=USE_GRIPPER,
    )
    
    protocol.move_labware(
             labware=tiprack_200_1,
             new_location='C4',
             use_gripper=USE_GRIPPER,
    )
    
    protocol.move_labware(
             labware=tiprack_200_4,
             new_location='A3',
             use_gripper=USE_GRIPPER,
    )

    # Remove supernatant

    wells4 = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    wells1 = [f"{chr(65+i)}1" for i in range(sample_sublibrary)]
    for well4, well1 in zip(wells4, wells1):
        p1000.pick_up_tip(tiprack_200_4)
        p1000.aspirate(85, sample_plate[well4].bottom(z=1), rate=0.25)
        p1000.dispense(85, waste[well1])
        p1000.drop_tip()

    wells4 = ["A4"] 
    wells1 = ["A1"]                      
    for well4, well1 in zip(wells4, wells1):
        p50.pick_up_tip()
        p50.aspirate(20, sample_plate[well4].bottom(z=0.4), rate=0.20)
        protocol.delay(seconds=5)
        p50.dispense(20, waste[well1].bottom(z=0.4), rate=0.20)
        p50.blow_out(waste[well1].top(z=-1))
        p50.drop_tip()

    # While still on the mag rack, add 85% ethanol to each tube

    p1000.flow_rate.blow_out=40
    wells4 = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    for well4 in wells4:
        p1000.pick_up_tip(tiprack_200_4)
        p1000.aspirate(ETOH_vol*1.07, ETOH2.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH2.top(z=-5))
        p1000.dispense(ETOH_vol, sample_plate[well4].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()

    p1000.flow_rate.blow_out=40
    wells4 = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    for well4 in wells4:
        p1000.pick_up_tip(tiprack_200_4)
        p1000.aspirate(ETOH_vol*1.07, ETOH3.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH3.top(z=-5))
        p1000.dispense(ETOH_vol, sample_plate[well4].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()

      
    # Incubate for 1 min at RT 

    protocol.delay(minutes=1)

    # While still on the mag rack, remove and discard the supernatant

    wells4 = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    wells2 = [f"{chr(65+i)}2" for i in range(sample_sublibrary)]
    for well4, well2 in zip(wells4, wells2):
        p1000.pick_up_tip(tiprack_200_4)
        p1000.aspirate(100, sample_plate[well4].bottom(z=0.1), rate=0.25)
        p1000.dispense(100, waste[well2])
        p1000.aspirate(100, sample_plate[well4].bottom(z=0.1), rate=0.25)
        p1000.dispense(100, waste[well2])
        p1000.drop_tip()

    wells4 = ["A4"]
    wells2 = ["A2"]
    for well4, well2 in zip(wells4, wells2):
        p50.pick_up_tip()
        p50.aspirate(30, sample_plate[well4].bottom(z=0.4), rate=0.20)
        p50.dispense(30, waste[well2].top(z=0.4), rate=0.20)
        p50.drop_tip()
        
    # While still on the mag rack, add 85% ethanol to each tube

    p1000.flow_rate.blow_out=40 
    wells4 = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    for well4 in wells4:
        p1000.pick_up_tip(tiprack_200_4)
        p1000.aspirate(ETOH_vol*1.07, ETOH4.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH4.top(z=-5))
        p1000.dispense(ETOH_vol, sample_plate[well4].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()
    
    p1000.flow_rate.blow_out=40  
    wells4 = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    for well4 in wells4:
        p1000.pick_up_tip(tiprack_200_4)
        p1000.aspirate(ETOH_vol*1.07, ETOH5.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH5.top(z=-5))
        p1000.dispense(ETOH_vol, sample_plate[well4].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()

    # Incubate for 1 min at RT 

    protocol.delay(minutes=1)

    # While still on the mag rack, remove and discard the supernatant

    wells4 = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    wells3 = [f"{chr(65+i)}3" for i in range(sample_sublibrary)]
    for well4, well3 in zip(wells4, wells3):
        p1000.pick_up_tip(tiprack_200_4)
        p1000.aspirate(100, sample_plate[well4].bottom(z=0.1), rate=0.25)
        p1000.dispense(100, waste[well3])
        p1000.aspirate(100, sample_plate[well4].bottom(z=0.1), rate=0.25)
        p1000.dispense(100, waste[well3])
        p1000.drop_tip()

    wells4 = ["A4"]
    wells3 = ["A3"]
    for well4, well3 in zip(wells4, wells3):
        p50.pick_up_tip()
        p50.aspirate(40, sample_plate[well4].bottom(z=0.4), rate=0.20)
        p50.dispense(40, waste[well3].top(z=-2), rate=0.15)
        p50.drop_tip()

    protocol.move_labware(
             labware=waste,
             new_location='D4',
             use_gripper=USE_GRIPPER,
    )

    # Remove the tube from the magnetic rack. Fully resuspend each bead pellet with 20uL of nuclease free water

    protocol.move_labware(
             labware=sample_plate,
             new_location='C2',
             use_gripper=USE_GRIPPER,
    )

    # Add Nuclease free water
     
    wells4 = [f"{chr(65+i)}4" for i in range(sample_sublibrary)]
    for well4 in wells4:
        p1000.pick_up_tip(tiprack_200_4)
        p1000.aspirate(NFW_vol/5, NFW, rate=0.15)
        p1000.dispense(NFW_vol/5, sample_plate[well4], rate=0.15)
        p1000.drop_tip()
    wells4 = ['A4']    
    p50.pick_up_tip()   
    p50.mix(10, 12.4, sample_plate[well4]) 
    p50.blow_out(sample_plate[well4].top(z=-1))
    p50.drop_tip()

    # Incubate for 5 min at RT 

    if dry_run == False:
        protocol.delay(minutes=5)
      
    # Place the tubes on the low position of the magnetic rack . Incubate until the solution clears in 2 min

    protocol.move_labware(
             labware=sample_plate,
             new_location=mag_block,
             use_gripper=USE_GRIPPER,
    )

    if dry_run == False:
        protocol.delay(minutes=3)

    # While still on the magnetic rack transfer the supernatant into 0.2 mL tube. Store on ice

    wells4  = ["A4"]
    wells10 = ["A10"]
    for well4, well10 in zip(wells4, wells10):
        p50.pick_up_tip()
        p50.aspirate(20, sample_plate[well4].bottom(z=1), rate=0.25)
        p50.dispense(20, sample_plate[well10].bottom(z=1), rate=0.25)
        p50.blow_out(sample_plate[well10].top(z=-1))
        p50.drop_tip()


    # Safe stopping point : Sequencing libraries can be stored at -20C for up to 3months


        # Sequencing Library quantification
        # Measure the conc of each purified sequencing library with the Qubit dsDNA HS Assay kit 
        # Assess the size distribution of each purified sequencing library with a HS DNA kit or HS D1000 screen tape and reagents
        # on Agilent Tapestation

