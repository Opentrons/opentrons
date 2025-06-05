from opentrons import protocol_api
from opentrons import types
import json
import math
import numpy as np
from opentrons.protocol_engine.errors import ProtocolCommandFailedError

# metadata
metadata = {
    "protocolName": "cDNA capture and Amplification using PBMC cells",
    "author": 'Vasudha Nair <vasudha.nair@opentrons.com>',
    "description": "cDNA Capture and Amplification protocol using the Flex with Evercode WT v3 kit",
}

# requirements
requirements = {
    "robotType": "Flex", 
    "apiLevel": "2.20",
}

def add_parameters(parameters):
    
    parameters.add_int(
        display_name=" Number of Sublibrary lysates",
        variable_name="num_sublib",
        default=1,
        minimum=1,
        maximum=8,
        description="How many sublibrary lysates to process", 
    )

    parameters.add_int(
        display_name="PCR Cycles",
        variable_name="pcr_cycles",
        default=9,
        minimum=8,
        maximum=13,
        description="How many pcr cycles to be performed for cDNA amplification based on number of cells in sublibrary", 
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

    # ==================== FIRST ROW =====================================================================

    heatershaker   = protocol.load_module('heaterShakerModuleV1','D1')
    hs_adapter     = heatershaker.load_adapter('opentrons_96_pcr_adapter')
    sample_plate_1 = hs_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    magnetic_block = protocol.load_module('magneticBlockV1', 'D2')
    reservoir      = magnetic_block.load_labware('nest_96_wellplate_2ml_deep','Reservoir')
    default_trash  = protocol.load_waste_chute()

    # =========================== SECOND ROW =============================================================

    temp_block     = protocol.load_module('temperature module gen2', 'C1')
    tubes          = temp_block.load_labware('opentrons_24_aluminumblock_nest_1.5ml_snapcap', 'Tubes')
    tiprack_200_3  = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'C3')

    # =========================== THIRD ROW ===============================================================

    thermocycler   = protocol.load_module('thermocycler module gen2', 'B1')
    tiprack_50_1   = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'B2')
    tiprack_50_2   = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'B3')

    # =========================== FOURTH ROW ==============================================================

    tiprack_200_1   = protocol.load_labware('opentrons_flex_96_tiprack_200ul','A2')
    tiprack_200_2 = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'A3')

    # ==================================== OFF DECK =======================================================

    # Parameters

    USE_GRIPPER = True
    dry_run=False
    num_sublib=protocol.params.num_sublib
    pcr_cycles=protocol.params.pcr_cycles 
        
    # Load pipettes
    p1000 = protocol.load_instrument("flex_1channel_1000", mount="right", tip_racks=[tiprack_200_1,tiprack_200_2, tiprack_200_3])
    p50 = protocol.load_instrument("flex_8channel_50", mount="left", tip_racks=[tiprack_50_1,tiprack_50_2])


    # MAG BLOCK OFFSETS

    mb_drop_offset={'x':0,'y':0.,'z':0}
    mb_pick_up_offset={'x':0,'y':0,'z':0}

    def move_from_deck(labware, new_location):
        protocol.move_labware(
        labware,
        new_location,
        use_gripper=False,
        )
    def move_offdeck(labware,new_location): #manually move labware from off deck locations onto deck
        protocol.move_labware(
        labware,
        new_location,
        use_gripper=False,
        )

    # Pipettes    

    CE       =sample_plate_1['A3']
    STREPB   =reservoir['A2']
    WB3      =reservoir['A3']
    BWB      =tubes['A1']
    BB       =tubes['A2']
    WB1      =tubes['A3']
    WB2      =tubes['A4']    
    TSB      =tubes['A5']
    TSMM     =tubes['A6']
    TSP      =tubes['B1']
    TSE      =tubes['B2']
    CDNAAM   =tubes['B3']
    CDNAAMM  =tubes['B4']
    CDNAAP   =tubes['B5']
    AMPB     =tubes['C4'] 
    NFW      =tubes['C5']
    ETOH     =tubes['C6'] 
    ETOH1    =tubes['D4']
    ETOH2    =tubes['D5']
    ETOH3    =tubes['D6']
    
    # Volumes

    Lib_Ly_vol1= 25
    Lib_Ly_vol2= 30
    STREPB_vol = 44
    BWB_vol    = 50
    BB_vol     = 55
    BB_vol1    = 50
    WB1_vol    = 125
    WB2_vol    = 125
    WB3_vol    = 125
    TSB_vol    = 101.75
    TSP_vol    = 2.75
    TSE_vol    = 5.5
    CDNAAM_vol = 60.5
    CDNAAP_vol = 60.5
    AMPB_vol   = 72
    NFW_vol    = 25
    ETOH_vol   =100


    # Liquid Definitions
    CE_=protocol.define_liquid(name="Capture Enhancer",description="Capture Enhancer", display_color="#cc3399")
    for well in sample_plate_1.rows()[0][2:3]:
        well.load_liquid(liquid=CE_, volume=2.5*num_sublib*1.3)
    STREPB_=protocol.define_liquid(name="Streptavidin Beads", description="Streptavidin beads",display_color="#704848") 
    for well in reservoir.rows()[0][1:2]:
        well.load_liquid(liquid=STREPB_, volume=STREPB_vol*num_sublib*1.3)
    BWB_=protocol.define_liquid(name="Bead Wash Buffer", description="Bead Wash Buffer",display_color="#ffcc99")
    for well in tubes.rows()[0][0:1]:
        well.load_liquid(liquid=BWB_, volume=BWB_vol*num_sublib*3)
    BB_=protocol.define_liquid(name="Binding Buffer", description="Binding Buffer",display_color="#ff9933")
    for well in tubes.rows()[0][1:2]:
        well.load_liquid(liquid=BB_, volume=BB_vol * num_sublib * 1.2)
    WB1_=protocol.define_liquid(name="Wash Buffer 1", description="Wash Buffer 1",display_color="#cc99ff")
    for well in tubes.rows()[0][2:3]:
        well.load_liquid(liquid=WB1_, volume=WB1_vol*num_sublib*3)        
    WB2_=protocol.define_liquid(name="Wash Buffer 2", description="Wash Buffer 2",display_color="#00cc99")
    for well in tubes.rows()[0][3:4]:
        well.load_liquid(liquid=WB2_, volume=WB2_vol*num_sublib*1.3)    
    TSB_=protocol.define_liquid(name="Template Switch Buffer", description="Template Switch Buffer",display_color="#330099")
    for well in tubes.rows()[0][4:5]:
        well.load_liquid(liquid=TSB_, volume=TSB_vol*num_sublib*1.3)
    TSP_=protocol.define_liquid(name="Template Switch Primer", description="Template Switch Primer",display_color="#ffc61a")
    for well in tubes.rows()[1][5:6]:
        well.load_liquid(liquid=TSP_, volume=TSP_vol*num_sublib*1.3)
    TSE_=protocol.define_liquid(name="Template Switch Enzyme", description= "Template Switch Enzyme",display_color="#008000")
    for well in tubes.rows()[1][1:2]:
        well.load_liquid(liquid=TSE_, volume=TSE_vol*num_sublib*1.3)
    AMPB_=protocol.define_liquid(name="Ampure Beads", description="Ampure Beads",display_color="#a88448")
    for well in tubes.rows()[2][3:4]:
        well.load_liquid(liquid=AMPB_, volume=AMPB_vol*num_sublib*1.3) 
    NFW_=protocol.define_liquid(name="Nuclease Free Water", description="Nuclease Free Water",display_color="#6699ff")
    for well in tubes.rows()[2][4:5]:
        well.load_liquid(liquid=NFW_, volume=NFW_vol*num_sublib*1.3)   
    CDNAAM_=protocol.define_liquid(name="cDNA Amp Mix", description="cDNA Amp Mix",display_color="#e64d00")
    for well in tubes.rows()[1][2:3]:
        well.load_liquid(liquid=CDNAAM_, volume=CDNAAM_vol*num_sublib*1.3)
    CDNAAP_=protocol.define_liquid(name="cDNA Amp Primers", description="cDNA Amp Primers",display_color="#ffff00")
    for well in tubes.rows()[1][4:5]:
        well.load_liquid(liquid=CDNAAP_, volume=CDNAAP_vol*num_sublib*1.3)
    WB3_=protocol.define_liquid(name="Wash Buffer 3", description="Wash Buffer 3",display_color="#ff6699")
    for well in reservoir.rows()[0][2:3]:
        well.load_liquid(liquid=WB3_, volume=WB3_vol*num_sublib*1.3)
    ETOH_=protocol.define_liquid(name="Ethanol", description="Ethanol",display_color="#ddd3c9")
    for well in tubes.rows()[2][5:6]:
        well.load_liquid(liquid=ETOH_, volume=ETOH_vol*num_sublib*1.3)
    ETOH1_=protocol.define_liquid(name="Ethanol", description="Ethanol",display_color="#ddd3c9")
    for well in tubes.rows()[3][3:4]:
        well.load_liquid(liquid=ETOH1_, volume=ETOH_vol*num_sublib*1.3)
    ETOH2_=protocol.define_liquid(name="Ethanol", description="Ethanol",display_color="#ddd3c9")
    for well in tubes.rows()[3][4:5]:
        well.load_liquid(liquid=ETOH2_, volume=ETOH_vol*num_sublib*1.3)
    ETOH3_=protocol.define_liquid(name="Ethanol", description="Ethanol",display_color="#ddd3c9")
    for well in tubes.rows()[3][5:6]:
        well.load_liquid(liquid=ETOH3_, volume=ETOH_vol*num_sublib*1.3)

    # Commands

    # Temp module at 4C
    temp_block.set_temperature(4)

    # Addition of Capture Enhancer to each tube of lysate
    heatershaker.close_labware_latch()
    p50.pick_up_tip()
    p50.aspirate(Lib_Ly_vol1, sample_plate_1['A2'].bottom(0))
    p50.dispense(Lib_Ly_vol1, CE)
    p50.blow_out(CE.top(z=-1))
    p50.drop_tip()
    p50.configure_for_volume(30)
    p50.pick_up_tip()
    p50.aspirate(Lib_Ly_vol2, sample_plate_1['A2'].bottom(0))
    p50.dispense(Lib_Ly_vol2, CE)
    p50.blow_out(CE.top(z=-1))
    p50.drop_tip()
    p50.pick_up_tip()
    p50.mix(5, 40, CE, rate=0.25)
    p50.blow_out(CE.top(z=-1))
    p50.drop_tip()

    # Incubation for 10 min at Room Temperature
    if dry_run == False:
        protocol.delay(minutes=10)

    # ======= Remove the supernatant after 2 minutes ============= # A2 of reservoir has 44 uL of Streptavidin beads for 1 lysate

    protocol.pause("Ready")
    total_volume = STREPB_vol * num_sublib
    p1000.pick_up_tip()
    p1000.aspirate(total_volume/2, STREPB.bottom(z=0.5),rate=0.25)
    p1000.dispense(total_volume/2,reservoir['A12'])
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(total_volume/2, STREPB.bottom(z=0.5),rate=0.25)
    p1000.dispense(total_volume/2,reservoir['A12'])
    p1000.drop_tip()

    # ============= Place the reservoir on C2 ==============

    protocol.comment('Move reservoir')
    protocol.move_labware(reservoir, 'C2',use_gripper=True)

    # ======== Resuspend bead pellet in Bead Wash Buffer ====== 1st wash ====== # A1 of tubes has Bead Wash Buffer

    total_volume = BWB_vol*num_sublib
    p1000.pick_up_tip()
    p1000.aspirate(total_volume/2, BWB)
    p1000.dispense(total_volume/2, STREPB)
    p1000.aspirate(total_volume/2, BWB)
    p1000.dispense(total_volume/2, STREPB)
    p1000.mix(7,total_volume/2, STREPB)
    p1000.blow_out(STREPB.top(z=-1))
    p1000.drop_tip()

    # ====== Place the reservoir on the magnetic rack  until solution clears ======

    protocol.comment('Move reservoir')
    protocol.move_labware(reservoir,magnetic_block,use_gripper=True)

    # ========= Remove the supernatant after 2 minutes ===========
    if dry_run == False:
        protocol.delay(minutes=2)

    sup_vol=50
    total_volume = sup_vol*num_sublib
    p1000.pick_up_tip()
    p1000.aspirate(total_volume/2, STREPB.bottom(z=0.5), rate=0.25)
    p1000.dispense(total_volume/2, reservoir['B12'])  
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(total_volume/2, STREPB.bottom(z=0.5), rate=0.25)
    p1000.dispense(total_volume/2, reservoir['B12']) 
    p1000.drop_tip()    
       

    # ====== Repeat steps for addition of Bead wash buffer followed by placing reservoir on mag rack for 2 more washes ======
    # ======== Resuspend bead pellet in Bead Wash Buffer--2nd wash ========
    
    protocol.comment('Move reservoir')
    protocol.move_labware(reservoir, 'C2',use_gripper=True)

    total_volume = BWB_vol*num_sublib
    p1000.pick_up_tip()
    p1000.aspirate(total_volume/2, BWB)
    p1000.dispense(total_volume/2, STREPB)
    p1000.aspirate(total_volume/2, BWB)
    p1000.dispense(total_volume/2, STREPB)
    p1000.mix(7,total_volume/2, STREPB)
    p1000.blow_out(STREPB.top(z=-1))
    p1000.drop_tip()

    # ======== Place the reservoir on the magnetic rack  until solution clears ====== 
    
    protocol.comment('Move reservoir')
    protocol.move_labware(reservoir,magnetic_block,use_gripper=True)

    protocol.pause("Ready")

    # ======== Remove the supernatant after 2 minutes ================= 

    sup_vol=50
    total_volume = sup_vol*num_sublib
    p1000.pick_up_tip()
    p1000.aspirate(total_volume/2, STREPB.bottom(z=0.5), rate=0.25)
    p1000.dispense(total_volume/2, reservoir['C12'])  
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(total_volume/2, STREPB.bottom(z=0.5), rate=0.25)
    p1000.dispense(total_volume/2, reservoir['C12']) 
    p1000.drop_tip()

    #====== Resuspend bead pellet in Bead Wash Buffer--3rd wash ====== 

    protocol.comment('Move reservoir')
    protocol.move_labware(reservoir, 'C2',use_gripper=True)  

    total_volume = BWB_vol*num_sublib
    p1000.pick_up_tip()
    p1000.aspirate(total_volume/2, BWB)
    p1000.dispense(total_volume/2, STREPB)
    p1000.aspirate(total_volume/2, BWB)
    p1000.dispense(total_volume/2, STREPB)
    p1000.mix(7,total_volume/2, STREPB)
    p1000.blow_out(STREPB.top(z=-1))
    p1000.drop_tip()

    # ===== Place the reservoir on the magnetic rack  until solution clears ===== 

    protocol.comment('Move reservoir') 
    protocol.move_labware(reservoir,magnetic_block,use_gripper=True)

    # ================== Remove the supernatant after 2 min ================== 

    protocol.pause("Ready")
    sup_vol=50
    total_volume = sup_vol*num_sublib
    p1000.pick_up_tip()
    p1000.aspirate(total_volume/2, STREPB.bottom(z=0.5), rate=0.25)
    p1000.dispense(total_volume/2, reservoir['D12'])  
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(total_volume/2, STREPB.bottom(z=0.5), rate=0.25)
    p1000.dispense(total_volume/2, reservoir['D12']) 
    p1000.drop_tip()

    # =========== Place the reservoir on C2 deck slot ================= 

    protocol.comment('Move reservoir')
    protocol.move_labware(reservoir,'C2',use_gripper=True)

    # ====== Resuspend pellet in Binding Buffer and store at room temperature ====== 

    total_volume1 = BB_vol * num_sublib
    p1000.pick_up_tip()
    p1000.aspirate(total_volume1/2.5, BB)
    p1000.dispense(total_volume1/2.5, STREPB)
    p1000.aspirate(total_volume1/2.5, BB)
    p1000.dispense(total_volume1/2.5, STREPB)
    p1000.aspirate(total_volume1/5, BB)
    p1000.dispense(total_volume1/5, STREPB)
    p1000.blow_out(STREPB.top(z=-1))
    p1000.mix(7,total_volume1/2.5, STREPB)
    p1000.blow_out(STREPB.top(z=-1))
    p1000.drop_tip() 

    # ======= Add 50uL of Streptavidin Beads in Binding Buffer to each well of lysate ====

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.mix(2, BB_vol1, STREPB)
        p1000.aspirate(BB_vol1, STREPB)
        p1000.dispense(BB_vol1, sample_plate_1[well])
        p1000.mix(2, 80, sample_plate_1[well])
        p1000.blow_out(sample_plate_1[well].top(z=-1)) 
        p1000.drop_tip()
    p50.configure_for_volume(50)
    p50.pick_up_tip()
    p50.mix(3,40,sample_plate_1['A3'])
    p50.drop_tip()

    # ============ Plate on Heater Shaker and add a new plate seal ============ 

    protocol.comment('Add plate seal')
    heatershaker.open_labware_latch()
    protocol.pause("Ready")
    heatershaker.close_labware_latch()
    heatershaker.set_and_wait_for_shake_speed(rpm=1000)
    protocol.delay(minutes=30)
    heatershaker.deactivate_shaker()

    # ======== Place sample plate on mag block ======== # REMOVE PLATE SEAL

    heatershaker.open_labware_latch()
    protocol.comment('Remove plate seal from sample_plate_1')                            
    protocol.pause("Ready")
    protocol.comment('Move sample_plate_1')
    protocol.move_labware(sample_plate_1,magnetic_block ,use_gripper=True)
    protocol.pause("ready")            # PLEASE INCLUDE THIS LINE IN MAIN FILE---416th line
    # =========== Remove the supernatant after 2 min =============

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    wells1= [f"{chr(65+i)}12" for i in range(num_sublib)]
    for well, well1 in zip(wells, wells1):
        p1000.pick_up_tip()
        p1000.aspirate(105, sample_plate_1[well].bottom(z=1), rate=0.25)    
        protocol.delay(seconds=10)
        p1000.dispense(105, reservoir[well1])
        p1000.drop_tip()
        p50.pick_up_tip()                                                 # extra step
        p50.aspirate(25, sample_plate_1[well].bottom(z=0.4), rate=0.20)   
        protocol.delay(seconds=5)
        p50.dispense(25, reservoir[well1])
        p50.drop_tip()

    protocol.comment('Move reservoir')
    protocol.move_labware(reservoir,'C4' ,use_gripper=True)
    protocol.comment('Move sample_plate_1')
    protocol.move_labware(sample_plate_1,'C2' ,use_gripper=True)

    # ======= Fully resuspend bead pellet with 125uL Wash Buffer 1 ========

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(WB1_vol, WB1)
        p1000.dispense(WB1_vol, sample_plate_1[well])
        p1000.blow_out(sample_plate_1[well].top(z=-1)) 
        p1000.drop_tip()
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(WB1_vol,sample_plate_1[well])
        protocol.delay(seconds=10)
        p1000.dispense(WB1_vol,sample_plate_1[well])
        p1000.mix(8,110,sample_plate_1[well], rate=0.25) 
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()                                                # extra step            
        p1000.aspirate(120, sample_plate_1[well].bottom(z=3), rate=0.15)
        p1000.dispense(120,sample_plate_1[well])
        p1000.aspirate(120, sample_plate_1[well].bottom(z=3), rate=0.15)
        p1000.dispense(120,sample_plate_1[well])
        p1000.aspirate(120, sample_plate_1[well].bottom(z=3), rate=0.15)
        p1000.dispense(120,sample_plate_1[well])
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()

    # ========= Incubate for 1 min at RT ========  

    protocol.delay(seconds=30)

    #  ======== Move the sample plate 1 to magblock ======= 

    protocol.comment('Move Sample_plate_1')
    protocol.move_labware(sample_plate_1, magnetic_block,use_gripper=True)
    protocol.comment('Move reservoir')
    protocol.move_labware(reservoir,'C2' ,use_gripper=True)

    #  ======== Remove supernatant from sample plate 1 after solution clears =======

    protocol.delay(minutes=3)

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    wells1= [f"{chr(65+i)}11" for i in range(num_sublib)]
    for well, well1 in zip(wells, wells1):
        p1000.pick_up_tip()
        p1000.aspirate(WB1_vol, sample_plate_1[well].bottom(z=1), rate=0.25)
        p1000.dispense(WB1_vol, reservoir[well1])                               
        p1000.drop_tip()
    wells = ["A3"]                                                          
    wells1 = ["A11"]
    for well, well1 in zip(wells, wells1):
        p50.pick_up_tip()                                                 # extra step
        p50.aspirate(25, sample_plate_1[well].bottom(z=0.4), rate=0.20)   
        protocol.delay(seconds=5)
        p50.dispense(25, reservoir[well1])
        p50.drop_tip()

    #  ============ Move sample plate to Heater Shaker ======== 

    protocol.comment('Move Sample_plate_1')
    protocol.move_labware(sample_plate_1, hs_adapter,use_gripper=True)

    #  ====== Resuspend bead pellet in Wash Buffer 1  ====== 

    # SECOND WASH WITH WASH BUFFER 1

    heatershaker.close_labware_latch()
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(WB1_vol, WB1)
        p1000.dispense(WB1_vol, sample_plate_1[well])
        p1000.blow_out(sample_plate_1[well].top(z=-1)) 
        p1000.drop_tip()
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(WB1_vol,sample_plate_1[well])
        protocol.delay(seconds=10)
        p1000.dispense(WB1_vol,sample_plate_1[well])
        p1000.mix(8,120,sample_plate_1[well], rate=0.25) 
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()                                                # extra step            
        p1000.aspirate(120, sample_plate_1[well].bottom(z=3), rate=0.15)
        p1000.dispense(120,sample_plate_1[well])
        p1000.aspirate(120, sample_plate_1[well].bottom(z=3), rate=0.15)
        p1000.dispense(120,sample_plate_1[well])
        p1000.aspirate(120, sample_plate_1[well].bottom(z=3), rate=0.15)
        p1000.dispense(120,sample_plate_1[well])
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()

    #  ============ Move the sample plate 1 to magblock ============ 

    protocol.comment('Move Sample_plate_1')
    heatershaker.open_labware_latch()
    protocol.move_labware(sample_plate_1, magnetic_block,use_gripper=USE_GRIPPER)

    #  ====== Incubate till solution clears - 3 minutes ====== 

    protocol.delay(minutes=3)

    #  ======== Remove supernatant from sample plate 1 =========

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    wells1= [f"{chr(65+i)}10" for i in range(num_sublib)]
    for well, well1 in zip(wells, wells1):
        p1000.pick_up_tip()
        p1000.aspirate(WB1_vol, sample_plate_1[well].bottom(z=1), rate=0.25)
        p1000.dispense(WB1_vol, reservoir[well1])                               
        p1000.drop_tip()
    wells = ["A3"]                                                          
    wells1 = ["A10"]
    for well, well1 in zip(wells, wells1):
        p50.pick_up_tip()                                                 # extra step
        p50.aspirate(25, sample_plate_1[well].bottom(z=0.4), rate=0.20)   
        protocol.delay(seconds=5)
        p50.dispense(25, reservoir[well1])
        p50.drop_tip()
    protocol.comment('Move reservoir')
    protocol.move_labware(reservoir,'C4' ,use_gripper=True)

    #  ======= Move sample plate to C2 ========= 

    protocol.comment('Move Sample_plate_1')
    protocol.move_labware(sample_plate_1, 'C2',use_gripper=USE_GRIPPER)   

    #  ====== Resuspend the bead pellet in Wash Buffer 2 ========= 

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(WB2_vol,WB2)
        p1000.dispense(WB2_vol,sample_plate_1[well])
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(WB2_vol,sample_plate_1[well])
        protocol.delay(seconds=10)
        p1000.dispense(WB2_vol,sample_plate_1[well])
        p1000.mix(8,120,sample_plate_1[well], rate=0.25) 
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()                                                # extra step            
        p1000.aspirate(120, sample_plate_1[well].bottom(z=3), rate=0.15)
        p1000.dispense(120,sample_plate_1[well])
        p1000.aspirate(120, sample_plate_1[well].bottom(z=3), rate=0.15)
        p1000.dispense(120,sample_plate_1[well])
        p1000.aspirate(120, sample_plate_1[well].bottom(z=3), rate=0.15)
        p1000.dispense(120,sample_plate_1[well])
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()

    # ========= Incubate for 30 sec at RT ========  

    protocol.delay(seconds=30)

    #  =============== cDNA Template Switch ================== 

    #  ======= Prepare the Template Switch master mix   ======= # tubes A6 has the Template Switch Master Mix # tubes A5 Template Switch buffer

    TSB_vol= 101.75
    total_TSB_vol = TSB_vol*num_sublib*1.1
    p1000.pick_up_tip()
    p1000.aspirate(total_TSB_vol/4.52, TSB)
    p1000.dispense(total_TSB_vol/4.52, TSMM)
    p1000.blow_out(TSMM.top(z=-1))
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(total_TSB_vol/4.52, TSB)
    p1000.dispense(total_TSB_vol/4.52, TSMM)
    p1000.blow_out(TSMM.top(z=-1))
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(total_TSB_vol/4.52, TSB)
    p1000.dispense(total_TSB_vol/4.52, TSMM)
    p1000.blow_out(TSMM.top(z=-1))
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(total_TSB_vol/4.52, TSB)
    p1000.dispense(total_TSB_vol/4.52, TSMM)
    p1000.blow_out(TSMM.top(z=-1))
    p1000.drop_tip()
    # p1000.pick_up_tip()
    # p1000.aspirate(11.75*num_sublib, TSB)
    # p1000.dispense(11.75*num_sublib, TSMM)
    # p1000.blow_out(TSMM.top(z=-1))
    # p1000.drop_tip()

    # tubes B1 has the template switch primer
    total_TSP_vol = TSP_vol * num_sublib * 1.1
    p1000.pick_up_tip()
    p1000.aspirate(total_TSP_vol, TSP)  
    p1000.dispense(total_TSP_vol,TSMM)
    p1000.blow_out(TSMM.top(z=-1))
    p1000.drop_tip()
    
    # tubes B2 template switch enzyme
    total_TSE_vol = TSE_vol * num_sublib * 1.1
    p1000.pick_up_tip()
    p1000.aspirate(total_TSE_vol, TSE, rate=0.15)  
    p1000.dispense(total_TSE_vol,TSMM, rate=0.15)
    p1000.blow_out(TSMM.bottom(z=1.5))
    p1000.drop_tip()
    
    # Mix the master mix ==== ==== ==== ==== ==== ====

    vol = 95 if num_sublib == 1 else 180

    p1000.pick_up_tip()
    p1000.aspirate(vol, TSMM, rate=0.15)
    p1000.dispense(vol, TSMM, rate=0.15)
    # Mix with a volume based on condition
    p1000.mix(8, vol, TSMM, rate=0.15)
    p1000.drop_tip()

    # ========== Move the sample plate 1 to magblock =========

    protocol.comment('Move Sample_plate_1')
    protocol.move_labware(sample_plate_1, magnetic_block,use_gripper=True)

    #  =============== Incubate until the solution clears =============== 
    protocol.delay(minutes=3)

    #  =====  While still on magnet remove and discard the supernatant  ========== 

    protocol.move_labware(reservoir, 'C2',use_gripper=USE_GRIPPER)

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    wells1= [f"{chr(65+i)}9" for i in range(num_sublib)]
    for well, well1 in zip(wells, wells1):
        p1000.pick_up_tip()
        p1000.aspirate(WB2_vol, sample_plate_1[well].bottom(z=1), rate=0.25)
        p1000.dispense(WB2_vol, reservoir[well1])                               
        p1000.drop_tip()
    wells = ["A3"]                                                          
    wells1 = ["A9"]
    for well, well1 in zip(wells, wells1):
        p50.pick_up_tip()                                                 # extra step
        p50.aspirate(25, sample_plate_1[well].bottom(z=0.4), rate=0.20)   
        protocol.delay(seconds=5)
        p50.dispense(25, reservoir[well1])
        p50.drop_tip()

    # ============== Wash Buffer 3 addition =============

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(WB3_vol, WB3)
        p1000.dispense(WB3_vol, sample_plate_1[well])
        p1000.drop_tip()

    #  =========== Incubate for 1 min at RT ============= 

    protocol.delay(minutes=1)

    #  ======== While still on magnet remove and discard the Wash buffer 3  ======= 

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    wells1= [f"{chr(65+i)}8" for i in range(num_sublib)]
    for well, well1 in zip(wells, wells1):
        p1000.pick_up_tip()
        p1000.aspirate(WB3_vol, sample_plate_1[well].bottom(z=1), rate=0.25)
        p1000.dispense(WB3_vol, reservoir[well1])                               
        p1000.drop_tip()
    wells  = ["A3"]                                                          
    wells1 = ["A8"]
    for well, well1 in zip(wells, wells1):
        p50.pick_up_tip()                                                 # extra step
        p50.aspirate(25, sample_plate_1[well].bottom(z=0.4), rate=0.20)   
        protocol.delay(seconds=5)
        p50.dispense(25, reservoir[well1])
        p50.drop_tip()
    
    # ========== Move reservoir to C4 ==========

    protocol.move_labware(reservoir,'C4',use_gripper=USE_GRIPPER)

    # ===== Move from mag block to C2 deck slot =====

    protocol.comment('Move Sample_plate_1')  
    protocol.move_labware(sample_plate_1,'C2',use_gripper=True)
    
    #  ======== Addition of Template switch master mix after removing from Magnetic Block  =========

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(100, TSMM, rate=0.15)
        p1000.dispense(100, sample_plate_1[well], rate=0.15)
        p1000.mix(7,70,sample_plate_1[well], rate=0.10)
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()

    #  ======== Incubate for 30 min  ============ 

    protocol.delay(minutes=30)

    # ======= Move from  C2 to thermocycler deck slot ========== 

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.mix(7,70,sample_plate_1[well], rate=0.10)
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()
    
    protocol.comment('Move Sample_plate_1')  
    thermocycler.open_lid()
    protocol.move_labware(sample_plate_1,thermocycler,use_gripper=USE_GRIPPER)

    #  ====================== Template switch on thermocycler ====================== # ADD A NEW SEAL

    protocol.comment("TEMPLATE SWITCH")
    thermocycler.set_lid_temperature(70)
    thermocycler.close_lid()
    thermocycler.set_block_temperature(temperature=42, hold_time_minutes=60, block_max_volume=100)
    thermocycler.set_block_temperature(temperature=4)
    temp_block.set_temperature(4)
    thermocycler.open_lid()
    protocol.pause("Ready")

    #  ====== Store samples in wash buffer 2 if stopping prior to cDNA amplification- Safe stopping point - 4C for upto 18 hours  ====== 
    
    # ==================================================================================================================================

    # ========== Prepare the cDNA Amplification Master Mix ===================== 

    CDNAAM_vol=60.75*1.1
    total_CDNAAM = CDNAAM_vol*num_sublib
    p1000.pick_up_tip()
    p1000.aspirate(total_CDNAAM/4, CDNAAM)           # Addition of cDNA Amp mix
    p1000.dispense(total_CDNAAM/4, CDNAAMM)
    p1000.blow_out(CDNAAMM.top(z=-1))
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(total_CDNAAM/4, CDNAAM)
    p1000.dispense(total_CDNAAM/4, CDNAAMM)
    p1000.blow_out(CDNAAMM.top(z=-1))
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(total_CDNAAM/4, CDNAAM)
    p1000.dispense(total_CDNAAM/4, CDNAAMM)
    p1000.blow_out(CDNAAMM.top(z=-1))
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(total_CDNAAM/4, CDNAAM)
    p1000.dispense(total_CDNAAM/4, CDNAAMM)
    p1000.blow_out(CDNAAMM.top(z=-1))
    p1000.drop_tip()

    CDNAAP_vol=60.75*1.1
    total_CDNAAP = CDNAAP_vol*num_sublib
    p1000.pick_up_tip()
    p1000.aspirate(total_CDNAAP/4, CDNAAP)           # Addition of cDNA Amp primers
    p1000.dispense(total_CDNAAP/4, CDNAAMM)
    p1000.blow_out(CDNAAMM.top(z=-1))
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(total_CDNAAP/4, CDNAAP)
    p1000.dispense(total_CDNAAP/4, CDNAAMM)
    p1000.blow_out(CDNAAMM.top(z=-1))
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(total_CDNAAP/4, CDNAAP)
    p1000.dispense(total_CDNAAP/4, CDNAAMM)
    p1000.blow_out(CDNAAMM.top(z=-1))
    p1000.drop_tip()
    p1000.pick_up_tip()
    p1000.aspirate(total_CDNAAP/4, CDNAAP)
    p1000.dispense(total_CDNAAP/4, CDNAAMM)
    p1000.blow_out(CDNAAMM.top(z=-1))
    p1000.drop_tip()

    vol1 = 90 if num_sublib == 1 else 180    
    p1000.pick_up_tip()
    p1000.aspirate(vol1, CDNAAMM)           
    p1000.dispense(vol1, CDNAAMM)
    p1000.mix(7,vol1/1.1,CDNAAMM, rate=0.15)
    p1000.blow_out(CDNAAMM.top(z=-1))
    p1000.drop_tip()        

    #  ==== If storage buffer used above, remove the buffer followed by addition of Wash buffer 3 ====== 
    
    protocol.comment('Move Sample_plate_1')  
    thermocycler.open_lid()
    protocol.move_labware(sample_plate_1, magnetic_block, use_gripper=USE_GRIPPER)  

    # ========= Remove supernatant from template switched cDNA =========

    protocol.comment('Move reservoir')
    protocol.move_labware(reservoir,'C2' ,use_gripper=True)

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    wells1 = [f"{chr(65+i)}7" for i in range(num_sublib)]
    for well, well1 in zip(wells, wells1):
        p1000.pick_up_tip()
        p1000.aspirate(100, sample_plate_1[well].bottom(z=1), rate=0.10)
        p1000.dispense(100, reservoir[well1])
        p1000.drop_tip()

    wells = ["A3"]                                                          
    wells1 = ["A7"]
    for well, well1 in zip(wells, wells1):
        p50.pick_up_tip()
        p50.aspirate(25, sample_plate_1[well].bottom(z=0.4), rate=0.10)
        protocol.delay(seconds=5)
        p50.dispense(25, reservoir[well1])
        p50.drop_tip()

    # ============= Addition of wash buffer 3 ===================== 

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(WB3_vol, WB3)
        p1000.dispense(WB3_vol, sample_plate_1[well])                               
        p1000.drop_tip()
    
    #  ============ Incubate for 1 min at RT ====================== 

    protocol.pause("Ready")   

    #  ====== While still on magnet remove and discard the Wash buffer 3 ========== 
    
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    wells1= [f"{chr(65+i)}6" for i in range(num_sublib)]
    for well, well1 in zip(wells, wells1):
        p1000.pick_up_tip()
        p1000.aspirate(WB3_vol, sample_plate_1[well].bottom(z=1), rate=0.25)
        p1000.dispense(WB3_vol, reservoir[well1])                               
        p1000.drop_tip()
    wells  = ["A3"]                                                          
    wells1 = ["A6"]
    for well, well1 in zip(wells, wells1):
        p50.pick_up_tip()                                                 # extra step
        p50.aspirate(25, sample_plate_1[well].bottom(z=0.4), rate=0.20)   
        protocol.delay(seconds=5)
        p50.dispense(25, reservoir[well1])
        p50.drop_tip()

    protocol.comment('Move Reservoir')
    protocol.move_labware(reservoir, 'B4', use_gripper=USE_GRIPPER)


    #  ========== Addition of cDNA Amp Master Mix  ==========

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(100, CDNAAMM)
        p1000.dispense(100, sample_plate_1[well])
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.mix(8,80,sample_plate_1[well], rate=0.15) 
        p1000.blow_out(sample_plate_1[well].top(z=-1))
        p1000.drop_tip()

    thermocycler.open_lid()
    protocol.comment('Move Sample_plate_1')
    protocol.move_labware(sample_plate_1, thermocycler,use_gripper=USE_GRIPPER)

    # ==============  cDNA Amplication on Thermocycler  =================== # ADD A NEW SEAL

    protocol.comment("cDNA Amplification")
    thermocycler.set_lid_temperature(105)
    thermocycler.close_lid()
    thermocycler.set_block_temperature(temperature=95, hold_time_minutes=3, block_max_volume=100)
    profile_round = [
        {'temperature': 98, 'hold_time_seconds': 20},
        {'temperature': 65, 'hold_time_seconds': 45},
        {'temperature': 72, 'hold_time_minutes': 3},
        ] 
    thermocycler.execute_profile(steps=profile_round, repetitions=5, block_max_volume=100)   
    profile_round1 = [    
        {'temperature': 98, 'hold_time_seconds': 20},
        {'temperature': 67, 'hold_time_seconds': 20},
        {'temperature': 72, 'hold_time_minutes': 3},
        ]
    thermocycler.execute_profile(steps=profile_round1, repetitions=pcr_cycles, block_max_volume=100)  # Cells are PBMCs and pcr_cycles is based on number of cells/sublibrary 
    thermocycler.set_block_temperature(temperature=72, hold_time_minutes=5, block_max_volume=100)
    thermocycler.set_block_temperature(temperature=4)
    temp_block.set_temperature(4)
    thermocycler.open_lid()
    protocol.pause("Ready")

    # ==========  Safe stopping point: Amplified cDNA can be stored at 4--- Post Amplification purification ==========

    protocol.move_labware(sample_plate_1, magnetic_block, use_gripper=USE_GRIPPER)

    # ========== Wait till solution clears close to 3min ==========

    protocol.delay(minutes=4)

    # ========== Post Amplification Purification ==========purify cDNA

    sample_plate_2  = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','D4','Sample_plate_2')

    protocol.move_labware(sample_plate_2,'C2',use_gripper=True)
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(90, sample_plate_1[well].bottom(z=1), rate=0.10)
        p1000.dispense(90, sample_plate_2[well].bottom(z=1), rate=0.10)
        p1000.blow_out(sample_plate_2[well].top(z=-1))
        p1000.drop_tip()
    p50.pick_up_tip()                                                 # extra step
    p50.aspirate(20, sample_plate_1['A3'].bottom(z=0.4), rate=0.10)   
    protocol.delay(seconds=5)
    p50.dispense(20, sample_plate_2['A3'].bottom(z=0.4), rate=0.10)
    p50.blow_out(sample_plate_2['A3'].top(z=-1))
    p50.drop_tip()

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(AMPB_vol, AMPB, rate= 0.15)
        p1000.dispense(AMPB_vol, sample_plate_2[well], rate= 0.15)
        p1000.mix(8,120,sample_plate_2[well], rate=0.15) 
        p1000.blow_out(sample_plate_2[well].top(z=-1))
        p1000.drop_tip()

    # ========== Incubate for 5 min at RT ==========

    protocol.delay(minutes=5)

    # Place the plate and Incubate until the solution clears # on magnetic block- remove supernatant  # Move the sample plate 2 to magblock

    protocol.move_labware(sample_plate_1, 'D4', use_gripper=USE_GRIPPER)
    protocol.comment('Move Sample_plate_2')
    protocol.move_labware(sample_plate_2, magnetic_block, use_gripper=USE_GRIPPER)

    protocol.delay(minutes=11)                                       # solution takes more time to clear as vol is 162uL
    protocol.move_labware(reservoir, 'C2', use_gripper=USE_GRIPPER)

    # Removing supernatant 

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    wells1= [f"{chr(65+i)}5" for i in range(num_sublib)]
    for well, well1 in zip(wells, wells1):
        p1000.pick_up_tip()
        p1000.aspirate(80, sample_plate_2[well].bottom(z=1), rate=0.25)       
        p1000.dispense(80, reservoir[well1])
        p1000.aspirate(82, sample_plate_2[well].bottom(z=1), rate=0.25)       
        p1000.dispense(82, reservoir[well1]) 
        p1000.drop_tip()

    wells  = ["A3"]                                                          
    wells1 = ["A5"]
    for well, well1 in zip(wells, wells1):
        p50.pick_up_tip()                                                 # extra step
        p50.aspirate(25, sample_plate_2[well].bottom(z=0.4), rate=0.20)   
        protocol.delay(seconds=5)
        p50.dispense(25, reservoir[well1])
        p50.return_tip()
    
    # Addition of 85% ethanol # 180uL ethanol

    p1000.flow_rate.blow_out=40
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(ETOH_vol*1.07, ETOH.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH.top(z=-5))
        p1000.dispense(100, sample_plate_2[well].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()
    p1000.flow_rate.blow_out=40
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(ETOH_vol*1.07, ETOH1.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH1.top(z=-5))
        p1000.dispense(100, sample_plate_2[well].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()

    # Incubate for 1 minute at RT  

    protocol.delay(minutes=1)

    # Remove the supernatant 
    
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    wells1= [f"{chr(65+i)}4" for i in range(num_sublib)]
    for well, well1 in zip(wells, wells1):
        p1000.pick_up_tip()
        p1000.aspirate(100, sample_plate_2[well].bottom(z=1), rate=0.15)
        p1000.dispense(100, reservoir[well1].bottom(z=1), rate=0.15)
        p1000.aspirate(100, sample_plate_2[well].bottom(z=1), rate=0.15)
        p1000.dispense(100, reservoir[well1].bottom(z=1), rate=0.15)
        p1000.drop_tip()

    # 2nd wash 85% # Addition of 85% ethanol

    p1000.flow_rate.blow_out=40
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(ETOH_vol*1.07, ETOH2.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH2.top(z=-5))
        p1000.dispense(100, sample_plate_2[well].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()
    p1000.flow_rate.blow_out=40
    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip()
        p1000.aspirate(ETOH_vol*1.07, ETOH3.bottom(z=1), rate=0.15)
        p1000.move_to(ETOH3.top(z=-5))
        p1000.dispense(100, sample_plate_2[well].top(z=-2), rate=0.15)
        p1000.blow_out()
        p1000.drop_tip()

    # Incubate for 1 minute at RT   

    protocol.delay(minutes=1)

    protocol.move_labware(tiprack_200_3, 'A4', use_gripper=USE_GRIPPER)
    tiprack_200_4  = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'B4')
    protocol.move_labware(tiprack_200_4, 'C3', use_gripper=USE_GRIPPER)

    # on magnetic block- remove supernatant

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    wells1= [f"{chr(65+i)}4" for i in range(num_sublib)]
    for well, well1 in zip(wells, wells1):
        p1000.pick_up_tip(tiprack_200_4)
        p1000.aspirate(100, sample_plate_2[well].bottom(z=1), rate=0.15)
        p1000.dispense(100, reservoir[well1].bottom(z=1), rate=0.15)
        p1000.aspirate(100, sample_plate_2[well].bottom(z=1), rate=0.15)
        p1000.dispense(100, reservoir[well1].bottom(z=1), rate=0.15)
        p1000.drop_tip()

    # Remove residual ethanol with p50

    wells = ["A3"]
    wells1 =["A4"]
    for well, well1 in zip(wells, wells1):
        p50.pick_up_tip()
        p50.aspirate(40, sample_plate_2[well].bottom(z=0.4), rate=0.20)
        p50.dispense(40, reservoir[well1]) 
        p50.drop_tip()
    
    # While still on the magnetic rack, air dry the Ampure XP beads

    protocol.pause("Ready")     # Air dry Ampure XP beads
    protocol.move_labware(reservoir, default_trash, use_gripper=USE_GRIPPER)
    protocol.move_labware(sample_plate_2, 'C2', use_gripper=USE_GRIPPER)

    # Resuspend with 25uL of nuclease free water

    wells = [f"{chr(65+i)}3" for i in range(num_sublib)]
    for well in wells:
        p1000.pick_up_tip(tiprack_200_4)
        p1000.aspirate(25, NFW)
        p1000.dispense(25, sample_plate_2[well])
        p1000.mix(5,18,sample_plate_2[well], rate=0.15) 
        p1000.blow_out(sample_plate_2[well].top(z=-1))
        p1000.drop_tip()

    thermocycler.open_lid()  
    protocol.move_labware(sample_plate_2, thermocycler, use_gripper=USE_GRIPPER)

    # Incubate for 10 minutes in a thermocycler 

    protocol.pause("Ready")          # Add new plate seal

    thermocycler.open_lid()   
    protocol.comment("INCUBATION")
    thermocycler.set_lid_temperature(37)
    thermocycler.close_lid()
    thermocycler.set_block_temperature(temperature=37, hold_time_minutes=10, block_max_volume=25)
    thermocycler.set_block_temperature(temperature=23)
    thermocycler.open_lid()
    protocol.pause("Ready")

    # Place the tube on the magnetic block

    protocol.comment('Move Sample_plate_2')

    protocol.move_labware(sample_plate_2, magnetic_block,use_gripper=USE_GRIPPER)

    protocol.delay(minutes=3)

    wells  = [f"{chr(65+i)}3" for i in range(num_sublib)]
    wells1 = [f"{chr(65+i)}10" for i in range(num_sublib)]
    for well, well1 in zip(wells, wells1):
        p1000.pick_up_tip(tiprack_200_4)
        p1000.aspirate(25, sample_plate_2[well])
        p1000.dispense(25, sample_plate_2[well1])
        p1000.drop_tip()

    # Safe stopping point: Amplified cDNA can be stored at 4 for up to 48 hours or at -20 for 3 months

    # cDNA quantification 
    # Concentration of each tube of purified cDNA with the Qubit dsDNA HS Assay kit 
    # Assess the size distribution of each tube of purified cDNA with HS D5000 screen tape 
    # Safe stopping point: Amplified cDNA can be stored at 4 for up to 48 hours or at -20 for 3 months


















