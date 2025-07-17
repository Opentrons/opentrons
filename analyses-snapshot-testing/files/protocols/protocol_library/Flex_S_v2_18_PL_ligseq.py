from opentrons import protocol_api
from opentrons import types
import math
import numpy as np

metadata = {
    'protocolName': 'Nanopore Genomic Ligation 24x v5',
    'author': 'Opentrons <protocols@opentrons.com>',
    'source': 'Protocol Library',
    }

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.18",
}


# PROTOCOL BLOCKS
STEP_ERAT           = 1
STEP_ERATDECK       = 1
STEP_POSTERAT       = 1
STEP_LIG            = 1
STEP_LIGDECK        = 1
STEP_POSTLIG        = 1
STEP_ELUTDECK       = 1

############################################################################################################################################
############################################################################################################################################
############################################################################################################################################

p200_tips = 0
p50_tips  = 0
p200_tipracks_count = 0
p50_tipracks_count  = 0
WasteVol            = 0
Resetcount          = 0


def add_parameters(parameters):
    

    parameters.add_bool(
        variable_name="DRYRUN",
        display_name="Dry Run",
        description="Skip incubation delays and shorten mix steps.",
        default=False
    )


    parameters.add_bool(
        variable_name="TIP_TRASH",
        display_name="Trash tip",
        description="tip thrases after every use",
        default=True
    )

    parameters.add_bool(
        variable_name="DEACTIVATE_TEMP",
        display_name="deactivate temperature",
        description="thermocycler temperature deactivates if running from start",
        default=True
    )

    parameters.add_int(
        variable_name="samples",
        display_name="number of samples",
        description="How many samples to be perform for library prep",
        default=8,
        minimum=8,
        maximum=48,
    )

    parameters.add_int(
        variable_name="COLUMNS",
        display_name="number of columns",
        description="How many column to be perform for library prep",
        default=1,
        minimum=1,
        maximum=3,
    )


    parameters.add_int(
        variable_name="ERVOL",
        display_name="End Repair Volume",
        description="Input End repair Volume",
        default=13,
        minimum=13,
        maximum=30,
    )

    parameters.add_int(
        variable_name="ADAPVOL",
        display_name="Adapter Ligation Volume",
        description="Fragmentation time in thermocycler",
        default=40,
        minimum=40,
        maximum=80,
    )

    parameters.add_str(
        display_name="Resevoir Type",
        variable_name="RES_TYPE",
        choices=[
            {"display_name": "nest_12_reservoir_15ml", "value": "12x15ml"},
            {"display_name": "nest_96_wellplate_2ml_deep", "value": "96x2ml"},
        ],
        default="96x2ml",
        description="Select Resevoir type for Room temperature Reagents",
    )
def run(protocol: protocol_api.ProtocolContext):

    # SCRIPT SETTINGS
    DRYRUN              = protocol.params.DRYRUN          # True = skip incubation times, shorten mix, for testing purposes
    USE_GRIPPER         = True          # True = Uses Gripper, False = Manual Move
    TIP_TRASH           = protocol.params.TIP_TRASH         # True = Used tips go in Trash, False = Used tips go back into rack
    DEACTIVATE_TEMP     = protocol.params.DEACTIVATE_TEMP        # True = Deactivates Temp Block and Thermocycler, False = Leaves Temp Block and Thermocycler on (if leaving finished plates on deck)

    # PROTOCOL SETTINGS
    COLUMNS             = protocol.params.COLUMNS            # 1-3             
    samples             = protocol.params.samples
    ERVOL               = protocol.params.ERVOL
    ADAPVOL             = protocol.params.ADAPVOL
    #TIP SAVING SETTINGS
    RES_TYPE            = protocol.params.RES_TYPE     # '12x15ml' or '96x2ml'
    AirMultiDispense    = False
    REuse_TIPS          = False

    ABR_TEST            = False
    if ABR_TEST == True:
        COLUMNS         = 3
        DRYRUN          = False           # Overrides to only DRYRUN
        TIP_TRASH       = True          # Overrides to only REUSING TIPS
        RUN             = 3              # Repetitions
    else:
        RUN             = 1
   

    global p200_tips
    global p50_tips
    global p200_tipracks_count
    global p50_tipracks_count
    global WasteVol
    global Resetcount

    if ABR_TEST == True:
        protocol.comment('THIS IS A ABR RUN WITH '+str(RUN)+' REPEATS') 
    protocol.comment('THIS IS A DRY RUN') if DRYRUN == True else protocol.comment('THIS IS A REACTION RUN')
    protocol.comment('USED TIPS WILL GO IN TRASH') if TIP_TRASH == True else protocol.comment('USED TIPS WILL BE RE-RACKED')

# DECK SETUP AND LABWARE
    # ========== FIRST ROW ===========
    heatershaker        = protocol.load_module('heaterShakerModuleV1','D1')
    temp_block          = protocol.load_module('temperature module gen2', 'C1')
    reagent_plate       = temp_block.load_labware('nest_96_wellplate_100ul_pcr_full_skirt')
    if RES_TYPE == '12x15ml':
        reservoir       = protocol.load_labware('nest_12_reservoir_15ml','C2', 'Reservoir')
    if RES_TYPE == '96x2ml':
        reservoir       = protocol.load_labware('nest_96_wellplate_2ml_deep','C2', 'Reservoir')
    # ========== SECOND ROW ==========
    MAG_PLATE_SLOT      = protocol.load_module(module_name='magneticBlockV1',location='D2')
    tiprack_200_1       = protocol.load_labware('opentrons_flex_96_tiprack_200ul',  'B2')
    tiprack_50_1        = protocol.load_labware('opentrons_flex_96_tiprack_50ul',  'C3')
    # ========== THIRD ROW ===========
    thermocycler        = protocol.load_module('thermocycler module gen2')
    sample_plate_1      = thermocycler.load_labware('nest_96_wellplate_100ul_pcr_full_skirt')
    tiprack_200_2       = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'A2')
    tiprack_200_4        = protocol.load_labware('opentrons_flex_96_tiprack_200ul','B3')
    # ========== FOURTH ROW ==========
    tiprack_200_3       = protocol.load_labware('opentrons_flex_96_tiprack_200ul',  'A3')
    default_trash       = protocol.load_trash_bin(location = "D3")



# ======== ESTIMATING LIQUIDS =======
        
    #  NAME             = Number of columns x volume per reaction x 110% for overage = volume to be filled in each well (of 8 well column)
    Sample_Volume       = 40
    AMPure_Volume       = COLUMNS*(180)*1.1
    ETOH_Volume         = COLUMNS*(900)*1.1
    RSB_Volume          = COLUMNS*(95)*1.1
    LFB_Volume          = COLUMNS*(95)*1.1
    Elut_Volume         = COLUMNS*(95)*1.1
    ERAT_Volume         = samples*(13)*1.1
    LIG_Volume          = samples*(13)*1.1

    TotalColumn = ['A','B','C','D','E','F','G','H']
    UsedColumn = ['A','B','C','D','E','F','G','H']

 # ======== DEFINING LIQUIDS =======
    AMPure = protocol.define_liquid(name="AMPure", description="AMPure Beads", display_color="#704848")                                       #704848 = 'AMPure Brown'
    EtOH = protocol.define_liquid(name="EtOH", description="80% Ethanol", display_color="#9ACECB")                                          #9ACECB = 'Ethanol Blue'
    RSB = protocol.define_liquid(name="RSB", description="Resuspension Buffer", display_color="#00FFF2")                                    #00FFF2 = 'Base Light Blue'
    LFB = protocol.define_liquid(name="LFB", description="LFB", display_color="#9B9B9B") 
    Elut = protocol.define_liquid(name="Elut", description="Elution", display_color="#52AAFF") 
    Liquid_trash_well = protocol.define_liquid(name="Liquid_trash_well", description="Liquid Trash", display_color="#9B9B9B")               #9B9B9B = 'Liquid Trash Grey'
    Sample = protocol.define_liquid(name="Sample", description="Sample", display_color="#52AAFF")                                           #52AAFF = 'Sample Blue'                              #8400FF = 'Base Purple'
    Final_Sample = protocol.define_liquid(name="Final_Sample", description="Final Sample", display_color="#82A9CF")                         #82A9CF = 'Placeholder Blue'
    Placeholder_Sample = protocol.define_liquid(name="Placeholder_Sample", description="Placeholder Sample", display_color="#82A9CF")       #82A9CF = 'Placeholder Blue'
    ERAT = protocol.define_liquid(name="ERAT", description="End Repair", display_color="#FF0000")
    LIG = protocol.define_liquid (name="LIG", description="Ligation", display_color="#FFA000")
    # ======== LOADING LIQUIDS =======

    # Filling Reservoirs
    if RES_TYPE == '12x15ml':
        reservoir.wells_by_name()['A1'].load_liquid(liquid=AMPure, volume=AMPure_Volume)
        reservoir.wells_by_name()['A4'].load_liquid(liquid=EtOH, volume=ETOH_Volume)
        reservoir.wells_by_name()['A5'].load_liquid(liquid=RSB, volume=RSB_Volume)
        reservoir.wells_by_name()['A6'].load_liquid(liquid=LFB, volume=LFB_Volume)        
        reservoir.wells_by_name()['A7'].load_liquid(liquid=Elut, volume=Elut_Volume)
        reservoir.wells_by_name()['A12'].load_liquid(liquid=Liquid_trash_well, volume=0)

    if RES_TYPE == '96x2ml':
        for loop, X in enumerate(UsedColumn):
            reservoir.wells_by_name()[X+'1'].load_liquid(liquid=AMPure, volume=AMPure_Volume)
            reservoir.wells_by_name()[X+'4'].load_liquid(liquid=EtOH, volume=ETOH_Volume)
            reservoir.wells_by_name()[X+'5'].load_liquid(liquid=RSB, volume=RSB_Volume)
            reservoir.wells_by_name()[X+'6'].load_liquid(liquid=LFB, volume=LFB_Volume)
            reservoir.wells_by_name()[X+'7'].load_liquid(liquid=Elut, volume=Elut_Volume)        
            reservoir.wells_by_name()[X+'12'].load_liquid(liquid=Liquid_trash_well, volume=0)

    # Filling Reagent plate

    for loop, X in enumerate(TotalColumn):
        reagent_plate.wells_by_name()[X+'1'].load_liquid(liquid=ERAT, volume=ERAT_Volume)
        reagent_plate.wells_by_name()[X+'2'].load_liquid(liquid=LIG, volume=LIG_Volume)
 
# Filling sample and / or reagent wells, Sample count DEPENDENT
    if COLUMNS >= 1:
        for loop, X in enumerate(TotalColumn):
            sample_plate_1.wells_by_name()[X+'1'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'4'].load_liquid(liquid=Placeholder_Sample, volume=0)
            sample_plate_1.wells_by_name()[X+'7'].load_liquid(liquid=Final_Sample, volume=0)
    if COLUMNS >= 2:
        for loop, X in enumerate(TotalColumn):
            sample_plate_1.wells_by_name()[X+'2'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=Placeholder_Sample, volume=0)            
            sample_plate_1.wells_by_name()[X+'8'].load_liquid(liquid=Final_Sample, volume=0)
    if COLUMNS >= 3:    
        for loop, X in enumerate(TotalColumn):
            sample_plate_1.wells_by_name()[X+'3'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'6'].load_liquid(liquid=Placeholder_Sample, volume=0)
            sample_plate_1.wells_by_name()[X+'9'].load_liquid(liquid=Final_Sample, volume=0)

    # REAGENT PLATE
    ERAT                = reagent_plate.wells_by_name()['A1']
    LIG                 = reagent_plate.wells_by_name()['A2']

    # RESERVOIR
    AMPure              = reservoir['A1']
    EtOH                = reservoir['A4']
    RSB                 = reservoir['A5']
    LFB                 = reservoir['A6']
    Elut                = reservoir['A7']
    Liquid_trash_well_1 = reservoir['A12']

    # pipette
    p1000 = protocol.load_instrument("flex_8channel_1000", "left", tip_racks=[tiprack_200_1,tiprack_200_2,tiprack_200_3,tiprack_200_4])
    p50 = protocol.load_instrument("flex_8channel_50", "right", tip_racks=[tiprack_50_1])
    
    # SAMPLE TRACKING

    if COLUMNS == 1:
        column_1_list = ['A1']                      # sample_plate_1 initial Wells and Cleanup_1
        column_2_list = ['A4']                      # sample_plate_1 Amplification and Cleanup_2
        column_3_list = ['A7']                      # sample_plate_1 Final Libraries
        barcodes = ['A7']
    if COLUMNS == 2:
        column_1_list = ['A1','A2']                 # sample_plate_1 initial Wells and Cleanup_1
        column_2_list = ['A4','A5']                 # sample_plate_1 Amplification and Cleanup_2
        column_3_list = ['A7','A8']                # sample_plate_1 Final Libraries
        barcodes = ['A7','A8']
    if COLUMNS == 3:
        column_1_list = ['A1','A2','A3']            # sample_plate_1 initial Wells and Cleanup_1
        column_2_list = ['A4','A5','A6']            # sample_plate_1 Amplification and Cleanup_2
        column_3_list = ['A7','A8','A9']          # sample_plate_1 Final Libraries
        barcodes = ['A7','A8','A9']
    if COLUMNS == 4:
        column_1_list = ['A1','A2','A3','A4']       # sample_plate_1 initial Wells and Cleanup_1
        column_2_list = ['A5','A6','A7','A8']       # sample_plate_1 Amplification and Cleanup_2
        column_3_list = ['A9','A10','A11','A12']    # sample_plate_1 Final Libraries
        barcodes = ['A7','A8','A9','A10']

#Pipette Flow Rate
    p1000.flow_rate.aspirate = 150
    p1000.flow_rate.dispense = 150
    p1000.flow_rate.blow_out = 150
    p200_tipracks = 4
    p50_tipracks = 2

    def tipcheck(tiptype):
        global p200_tips
        global p50_tips
        global p200_tipracks_count
        global p50_tipracks_count
        global Resetcount
        if tiptype == 200:
            if p200_tips == p200_tipracks*12:
                if ABR_TEST == True: 
                    p1000.reset_tipracks()
                else:
                    protocol.pause('RESET p200 TIPS')
                    p1000.reset_tipracks()
                Resetcount += 1
                p200_tipracks_count += 1
                p200_tips = 0 
        if tiptype == 50:
            if p50_tips == p50_tipracks*12:
                if ABR_TEST == True: 
                    p50.reset_tipracks()
                else:
                    protocol.pause('RESET p50 TIPS')
                    p50.reset_tipracks()
                Resetcount += 1
                p50_tipracks_count += 1
                p50_tips = 0
    Liquid_trash = Liquid_trash_well_1

    def DispWasteVol(Vol):
        global WasteVol
        WasteVol += int(Vol)
        if WasteVol <1500:
            Liquid_trash = Liquid_trash_well_1
        if WasteVol >=1500 and WasteVol <3000:
            Liquid_trash = Liquid_trash_well_2
        if WasteVol >=3000:
            Liquid_trash = Liquid_trash_well_3

############################################################################################################################################
############################################################################################################################################
############################################################################################################################################
    # commands
    for loop in range(RUN):
        thermocycler.open_lid()
        heatershaker.open_labware_latch()
        if DRYRUN == False:
            protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
            thermocycler.set_block_temperature(6)
            thermocycler.set_lid_temperature(100)    
            temp_block.set_temperature(6)
        protocol.pause("Ready")
        heatershaker.close_labware_latch()
        Liquid_trash = Liquid_trash_well_1

        # Sample Plate contains 100ng of DNA in 47ul Nuclease Free Water

        if STEP_ERAT == 1:
            protocol.comment('==============================================')
            protocol.comment('--> End Repair / A-Tailing')
            protocol.comment('==============================================')
            #Standard Setup

            protocol.comment('--> Adding FRERAT')
            ERATVol    = ERVOL
            ERATMixRep = 10 if DRYRUN == False else 1
            ERATMixVol = 60
            for loop, X in enumerate(column_1_list):
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.aspirate(ERATVol, ERAT.bottom(z=0.1))
                p1000.dispense(ERATVol, sample_plate_1[X].bottom(z=0.1))
                p1000.move_to(sample_plate_1[X].bottom(z=0.25))
                p1000.mix(ERATMixRep,ERATMixVol)
                p1000.blow_out(sample_plate_1[X].top(z=-1))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                

        if STEP_ERATDECK == 1:
        ############################################################################################################################################
            protocol.comment('Seal, Run ERAT (~10min)')
            if DRYRUN == False:
                thermocycler.close_lid()
                profile_ERAT = [
                {'temperature': 20, 'hold_time_minutes': 5},
                {'temperature': 65, 'hold_time_minutes': 5}
                ]
                thermocycler.execute_profile(steps=profile_ERAT, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(4)
                ############################################################################################################################################
                thermocycler.open_lid()
                protocol.pause("Remove Seal")


        if STEP_POSTERAT == 1:
            protocol.comment('==============================================')
            protocol.comment('--> Cleanup 1')
            protocol.comment('==============================================')
            #Standard Setup

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM THERMOCYCLER TO HEATERSHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=heatershaker,
                use_gripper=True
            )
            heatershaker.close_labware_latch()
            #============================================================================================

            protocol.comment('--> ADDING AMPure (0.8x)')
            AMPureVol = 60
            SampleVol = 60
            AMPureMixRPM = 1800
            AirMultiDispense = False
            AMPureMixTime = 5*60 if DRYRUN == False else 0.1*60 # Seconds
            AMPurePremix = 3 if DRYRUN == False else 1
            #======== DISPENSE ===========
            if AirMultiDispense == True:
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.mix(AMPurePremix,40, AMPure.bottom(z=1))
                for loop, X in enumerate(column_1_list):
                    p1000.aspirate(AMPureVol, AMPure.bottom(z=1), rate=0.25)
                    p1000.dispense(AMPureVol, sample_plate_1[X].top(z=1), rate=1)
                    protocol.delay(seconds=0.2)
                    p1000.blow_out(sample_plate_1[X].top(z=-1))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                
            else:
                for loop, X in enumerate(column_1_list):
                    tipcheck(200)
                    p1000.pick_up_tip()
                    p1000.mix(AMPurePremix,AMPureVol+10, AMPure.bottom(z=1))
                    p1000.aspirate(AMPureVol, AMPure.bottom(z=1), rate=0.25)
                    p1000.dispense(AMPureVol, sample_plate_1[X].bottom(z=1), rate=0.25)
                    p1000.default_speed = 5
                    p1000.move_to(sample_plate_1[X].bottom(z=3.5))
                    for Mix in range(2):
                        p1000.aspirate(50, rate=0.5)
                        p1000.move_to(sample_plate_1[X].bottom(z=1))
                        p1000.aspirate(30, rate=0.5)
                        p1000.dispense(30, rate=0.5)
                        p1000.move_to(sample_plate_1[X].bottom(z=3.5))
                        p1000.dispense(50,rate=0.5)
                        Mix += 1
                    p1000.blow_out(sample_plate_1[X].top(z=2))
                    p1000.default_speed = 400
                    p1000.move_to(sample_plate_1[X].top(z=5))
                    p1000.move_to(sample_plate_1[X].top(z=0))
                    p1000.move_to(sample_plate_1[X].top(z=5))
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                    
            #==============================
            heatershaker.set_and_wait_for_shake_speed(rpm=AMPureMixRPM)
            protocol.delay(AMPureMixTime)
            heatershaker.deactivate_shaker()

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM HEATER SHAKER TO MAG PLATE
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=MAG_PLATE_SLOT,
                use_gripper=True
            )
            heatershaker.close_labware_latch()

            #============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=4)

            protocol.comment('--> Removing Supernatant')
            RemoveSup = 200
            for loop, X in enumerate(column_1_list):
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_1[X].bottom(z=3.5))
                p1000.aspirate(RemoveSup-100, rate=0.25)
                protocol.delay(minutes=0.1)
                p1000.move_to(sample_plate_1[X].bottom(z=0.5))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(sample_plate_1[X].top(z=2))
                p1000.default_speed = 200
                p1000.dispense(200, Liquid_trash.top(z=0), rate=0.5)
                protocol.delay(minutes=0.1)
                p1000.blow_out(Liquid_trash.top(z=-2))
                p1000.default_speed = 400
                p1000.move_to(Liquid_trash.top(z=-5))
                p1000.move_to(Liquid_trash.top(z=0))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                
            
            for X in range(2):
                protocol.comment('--> ETOH Wash')
                ETOHMaxVol = 150
                AirMultiDispense = True
                #======== DISPENSE ===========
                if AirMultiDispense == True:
                    p1000.pick_up_tip()
                    for loop, X in enumerate(column_1_list):
                        tipcheck(200)
                        p1000.aspirate(ETOHMaxVol, EtOH.bottom(z=1))
                        p1000.move_to(EtOH.top(z=0))
                        p1000.move_to(EtOH.top(z=-5))
                        p1000.move_to(EtOH.top(z=0))
                        p1000.move_to(sample_plate_1[X].top(z=-1))
                        p1000.dispense(ETOHMaxVol, rate=1)
                        protocol.delay(minutes=0.1)
                        p1000.blow_out(sample_plate_1[X].top(z=-1))
                        p1000.move_to(sample_plate_1[X].top(z=5))
                        p1000.move_to(sample_plate_1[X].top(z=0))
                        p1000.move_to(sample_plate_1[X].top(z=5))
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                    
                else:
                    for loop, X in enumerate(column_1_list):
                        tipcheck(200)
                        p1000.pick_up_tip()
                        p1000.aspirate(ETOHMaxVol, EtOH.bottom(z=1))
                        p1000.move_to(EtOH.top(z=0))
                        p1000.move_to(EtOH.top(z=-5))
                        p1000.move_to(EtOH.top(z=0))
                        p1000.move_to(sample_plate_1[X].top(z=-2))
                        p1000.dispense(ETOHMaxVol, rate=1)
                        protocol.delay(minutes=0.1)
                        p1000.blow_out()
                        p1000.move_to(sample_plate_1[X].top(z=5))
                        p1000.move_to(sample_plate_1[X].top(z=0))
                        p1000.move_to(sample_plate_1[X].top(z=5))
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
                                            
                #==============================
                if DRYRUN == False:
                    protocol.delay(minutes=0.5)
                
                protocol.comment('--> Remove ETOH Wash')
                for loop, X in enumerate(column_1_list):
                    tipcheck(200)
                    p1000.pick_up_tip()
                    p1000.move_to(sample_plate_1[X].bottom(z=3.5))
                    p1000.aspirate(RemoveSup-100, rate=0.25)
                    protocol.delay(minutes=0.1)
                    p1000.move_to(sample_plate_1[X].bottom(z=0.5))
                    p1000.aspirate(100, rate=0.25)
                    p1000.default_speed = 5
                    p1000.move_to(sample_plate_1[X].top(z=2))
                    p1000.default_speed = 200
                    p1000.dispense(200, Liquid_trash.top(z=0))
                    protocol.delay(minutes=0.1)
                    p1000.blow_out()
                    p1000.default_speed = 400
                    p1000.move_to(Liquid_trash.top(z=-5))
                    p1000.move_to(Liquid_trash.top(z=0))
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                    

            if DRYRUN == False:
                protocol.delay(minutes=1)

            protocol.comment('--> Removing Residual Wash')
            for loop, X in enumerate(column_1_list):
                tipcheck(50)
                p50.pick_up_tip() #<---------------- Tip Pickup
                p50.move_to(sample_plate_1[X].bottom(1))
                p50.aspirate(20, rate=0.25)
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
                

            if DRYRUN == False:
                protocol.delay(minutes=0.5)

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM MAG PLATE TO HEATER SHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=heatershaker,
                use_gripper=True
            )
            heatershaker.close_labware_latch()

            #============================================================================================

            protocol.comment('--> Adding nuclease Free water')
            RSBVol = 61
            RSBMixRPM = 2000
            AirMultiDispense = True
            RSBMixRep = 5*60 if DRYRUN == False else 0.1*60
            #======== DISPENSE ===========
            if AirMultiDispense == True:
                
                for loop, X in enumerate(column_1_list):
                    tipcheck(200)
                    p1000.pick_up_tip()
                    p1000.aspirate(RSBVol, RSB.bottom(z=1))
                    p1000.move_to(sample_plate_1.wells_by_name()[X].top(z=3))
                    p1000.dispense(RSBVol, rate=2)
                    p1000.blow_out(sample_plate_1.wells_by_name()[X].top(z=3))
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                
            else:
                for loop, X in enumerate(column_1_list):
                    tipcheck(200)
                    p1000.pick_up_tip() #<---------------- Tip Pickup
                    p1000.aspirate(RSBVol, RSB.bottom(z=1))
                    p1000.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
                    p1000.dispense(RSBVol, rate=1)
                    p1000.blow_out(sample_plate_1.wells_by_name()[X].top())
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                    
            #===============================
            heatershaker.set_and_wait_for_shake_speed(rpm=RSBMixRPM)
            protocol.delay(RSBMixRep)
            heatershaker.deactivate_shaker()

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM HEATERSHAKER TO MAG PLATE
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=MAG_PLATE_SLOT,
                use_gripper=True
            )
            heatershaker.close_labware_latch()

            #============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=4)

            protocol.comment('--> Transferring Supernatant')
            TransferSup = 60
            for loop, X in enumerate(column_1_list):
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.move_to(sample_plate_1[X].bottom(z=0.5))
                p1000.aspirate(TransferSup, rate=0.25)
                p1000.dispense(TransferSup, sample_plate_1[column_2_list[loop]].bottom(z=1))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM MAG PLATE to Heatershaker
            heatershaker.open_labware_latch()
            protocol.move_labware(
                    labware=sample_plate_1,
                    new_location=heatershaker,
                    use_gripper=True
            )
            heatershaker.close_labware_latch()

            #============================================================================================

        if STEP_LIG == 1:
            protocol.comment('==============================================')
            protocol.comment('--> Adapter Ligation')
            protocol.comment('==============================================')
            #Standard Setup

            protocol.comment('--> Adding Lig')
            LIGVol = ADAPVOL
            LIGMixRep = 20 if DRYRUN == False else 1
            LIGMixVol = 100
            for loop, X in enumerate(column_2_list):
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.mix(3,LIGVol, LIG.bottom(z=0.25), rate=0.5)
                p1000.aspirate(LIGVol, LIG.bottom(z=0.1), rate=0.2)
                p1000.default_speed = 5
                p1000.move_to(LIG.top(5))
                protocol.delay(seconds=0.2)
                p1000.default_speed = 400
                p1000.dispense(LIGVol, sample_plate_1[X].bottom(z=0.1), rate=0.25)
                p1000.move_to(sample_plate_1[X].bottom(z=0.25))
                p1000.mix(LIGMixRep,LIGMixVol, rate=0.25)
                p1000.blow_out(sample_plate_1[X].top(z=-1))
                protocol.delay(seconds=0.2)
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                

        if STEP_LIGDECK == 1:
                protocol.comment('--> INCUBATING AT RT for 10 MIN')
                protocol.delay(minutes=10)

        if STEP_POSTLIG == 1:
            protocol.comment('==============================================')
            protocol.comment('--> Cleanup 2')
            protocol.comment('==============================================')
            
            # Setting Labware to Resume at Cleanup 2           
            protocol.comment('--> ADDING AMPure (0.65x)')
            AMPureVol = 40
            SampleVol = 140
            AMPureMixRPM = 1800
            AirMultiDispense = False
            AMPureMixTime = 5*60 if DRYRUN == False else 0.1*60 # Seconds
            AMPurePremix = 3 if DRYRUN == False else 1
            #======== DISPENSE ===========
            if AirMultiDispense == True:
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.mix(AMPurePremix,40, AMPure.bottom(z=1))
                for loop, X in enumerate(column_2_list):
                    p1000.aspirate(AMPureVol, AMPure.bottom(z=1), rate=0.25)
                    p1000.dispense(AMPureVol, sample_plate_1[X].top(z=1), rate=1)
                    protocol.delay(seconds=0.2)
                    p1000.blow_out(sample_plate_1[X].top(z=-1))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                
            else:
                for loop, X in enumerate(column_2_list):
                    tipcheck(200)
                    p1000.pick_up_tip()
                    p1000.aspirate(AMPureVol, AMPure.bottom(z=1), rate=0.25)
                    p1000.dispense(AMPureVol, sample_plate_1[X].top(z=1), rate=1)
                    protocol.delay(seconds=0.2)
                    p1000.blow_out(sample_plate_1[X].top(z=-1))
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                    
            #==============================
            heatershaker.set_and_wait_for_shake_speed(rpm=AMPureMixRPM)
            protocol.delay(AMPureMixTime)
            heatershaker.deactivate_shaker()

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM HEATER SHAKER TO MAG PLATE
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=MAG_PLATE_SLOT,
                use_gripper=True
            )   
            heatershaker.close_labware_latch()
            #============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=4)

            protocol.comment('--> Removing Supernatant')
            RemoveSup = 200
            for loop, X in enumerate(column_2_list):
                tipcheck(200)
                p1000.pick_up_tip() #<---------------- Tip Pickup
                p1000.move_to(sample_plate_1[X].bottom(z=3.5))
                p1000.aspirate(RemoveSup-100, rate=0.25)
                protocol.delay(minutes=0.1)
                p1000.move_to(sample_plate_1[X].bottom(z=0.5))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(sample_plate_1[X].top(z=2))
                p1000.default_speed = 200
                p1000.dispense(200, Liquid_trash.top(z=0))
                protocol.delay(minutes=0.1)
                p1000.blow_out()
                p1000.default_speed = 400
                p1000.move_to(Liquid_trash.top(z=-5))
                p1000.move_to(Liquid_trash.top(z=0))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                
            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM MAG PLATE to Heatershaker
            heatershaker.open_labware_latch()
            protocol.move_labware(
                    labware=sample_plate_1,
                    new_location=heatershaker,
                    use_gripper=True
            )
            heatershaker.close_labware_latch()
            #============================================================================================
            #LFB wash 1
            for X in range(1):
                protocol.comment('--> LFB Wash 1')
                LFBVol = 61
                LFBMixRPM = 2000
                AirMultiDispense = True
                LFBMixRep = 1*60 if DRYRUN == False else 0.1*60
                #======== DISPENSE ===========
                if AirMultiDispense == True:
                    
                    for loop, X in enumerate(column_2_list):
                        tipcheck(200)
                        p1000.pick_up_tip()
                        p1000.aspirate(LFBVol, LFB.bottom(z=1))
                        p1000.move_to(sample_plate_1.wells_by_name()[X].top(z=3))
                        p1000.dispense(LFBVol, rate=2)
                        p1000.blow_out(sample_plate_1.wells_by_name()[X].top(z=3))
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
                    
                else:
                    for loop, X in enumerate(column_2_list):
                        tipcheck(200)
                        p1000.pick_up_tip() #<---------------- Tip Pickup
                        p1000.aspirate(LFBVol, LFB.bottom(z=1))
                        p1000.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
                        p1000.dispense(LFBVol, rate=1)
                        p1000.blow_out(sample_plate_1.wells_by_name()[X].top())
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
                        
                #===============================
                heatershaker.set_and_wait_for_shake_speed(rpm=LFBMixRPM)
                protocol.delay(LFBMixRep)
                heatershaker.deactivate_shaker()
                #==============================
                if DRYRUN == False:
                    protocol.delay(minutes=0.5)
                #============================================================================================
                # GRIPPER MOVE sample_plate_1 FROM HEATER SHAKER TO MAG PLATE
                heatershaker.open_labware_latch()
                protocol.move_labware(
                    labware=sample_plate_1,
                    new_location=MAG_PLATE_SLOT,
                    use_gripper=True
                )   
                heatershaker.close_labware_latch()
                #============================================================================================
                if DRYRUN == False:
                    protocol.delay(minutes=3)
                #===================================================  
                protocol.comment('--> Remove LFB Wash 1')
                for loop, X in enumerate(column_2_list):
                    tipcheck(200)
                    p1000.pick_up_tip()
                    p1000.move_to(sample_plate_1[X].bottom(z=3.5))
                    p1000.aspirate(RemoveSup-100, rate=0.25)
                    protocol.delay(minutes=0.1)
                    p1000.move_to(sample_plate_1[X].bottom(z=0.5))
                    p1000.aspirate(100, rate=0.25)
                    p1000.default_speed = 5
                    p1000.move_to(sample_plate_1[X].top(z=2))
                    p1000.default_speed = 200
                    p1000.dispense(200, Liquid_trash.top(z=0))
                    protocol.delay(minutes=0.1)
                    p1000.blow_out()
                    p1000.default_speed = 400
                    p1000.move_to(Liquid_trash.top(z=-5))
                    p1000.move_to(Liquid_trash.top(z=0))
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                    
            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM MAG PLATE to Heatershaker
            heatershaker.open_labware_latch()
            protocol.move_labware(
                    labware=sample_plate_1,
                    new_location=heatershaker,
                    use_gripper=True
            )
            heatershaker.close_labware_latch()
            #============================================================================================
            #LFB Wash 2
            for X in range(1):
                protocol.comment('--> LFB wash 2')
                LFBVol = 61
                LFBMixRPM = 2000
                AirMultiDispense = True
                LFBMixRep = 1*60 if DRYRUN == False else 0.1*60
                #======== DISPENSE ===========
                if AirMultiDispense == True:
                    
                    for loop, X in enumerate(column_2_list):
                        tipcheck(200)
                        p1000.pick_up_tip()
                        p1000.aspirate(LFBVol, LFB.bottom(z=1))
                        p1000.move_to(sample_plate_1.wells_by_name()[X].top(z=3))
                        p1000.dispense(LFBVol, rate=2)
                        p1000.blow_out(sample_plate_1.wells_by_name()[X].top(z=3))
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
                    
                else:
                    for loop, X in enumerate(column_2_list):
                        tipcheck(200)
                        p1000.pick_up_tip() #<---------------- Tip Pickup
                        p1000.aspirate(LFBVol, LFB.bottom(z=1))
                        p1000.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
                        p1000.dispense(LFBVol, rate=1)
                        p1000.blow_out(sample_plate_1.wells_by_name()[X].top())
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
                        
                #===============================
                heatershaker.set_and_wait_for_shake_speed(rpm=LFBMixRPM)
                protocol.delay(LFBMixRep)
                heatershaker.deactivate_shaker()
                #==============================
                if DRYRUN == False:
                    protocol.delay(minutes=0.5)
                #============================================================================================
                # GRIPPER MOVE sample_plate_1 FROM HEATER SHAKER TO MAG PLATE
                heatershaker.open_labware_latch()
                protocol.move_labware(
                    labware=sample_plate_1,
                    new_location=MAG_PLATE_SLOT,
                    use_gripper=True
                )   
                heatershaker.close_labware_latch()
                #============================================================================================
                if DRYRUN == False:
                    protocol.delay(minutes=3)
                #===================================================    
                protocol.comment('--> Remove LFB Wash 2')
                for loop, X in enumerate(column_2_list):
                    tipcheck(200)
                    p1000.pick_up_tip()
                    p1000.move_to(sample_plate_1[X].bottom(z=3.5))
                    p1000.aspirate(RemoveSup-100, rate=0.25)
                    protocol.delay(minutes=0.1)
                    p1000.move_to(sample_plate_1[X].bottom(z=0.5))
                    p1000.aspirate(100, rate=0.25)
                    p1000.default_speed = 5
                    p1000.move_to(sample_plate_1[X].top(z=2))
                    p1000.default_speed = 200
                    p1000.dispense(200, Liquid_trash.top(z=0))
                    protocol.delay(minutes=0.1)
                    p1000.blow_out()
                    p1000.default_speed = 400
                    p1000.move_to(Liquid_trash.top(z=-5))
                    p1000.move_to(Liquid_trash.top(z=0))
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
                    

            if DRYRUN == False:
                protocol.delay(minutes=1)

            protocol.comment('--> Removing Residual LFB Wash')
            for loop, X in enumerate(column_2_list):
                tipcheck(50)
                p50.pick_up_tip() #<---------------- Tip Pickup
                p50.move_to(sample_plate_1[X].bottom(1))
                p50.aspirate(20, rate=0.25)
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
                

            if DRYRUN == False:
                protocol.delay(minutes=0.5)

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM MAG PLATE TO HEATER SHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=heatershaker,
                use_gripper=True
            )
            heatershaker.close_labware_latch()

            #============================================================================================  
            protocol.comment('--> Adding Elution')
            ElutVol = 18        
            ElutMixRPM = 2000
            AirMultiDispense = True
            ElutMixRep = 5*60 if DRYRUN == False else 0.1*60
            #======== DISPENSE ===========
            if AirMultiDispense == True:
                tipcheck(50)
                p50.pick_up_tip()
                for loop, X in enumerate(column_2_list): 
                    p50.aspirate(ElutVol, Elut.bottom(z=1))
                    p50.move_to(sample_plate_1.wells_by_name()[X].top(z=0.5))
                    p50.dispense(ElutVol, rate=1)
                    p50.blow_out(sample_plate_1.wells_by_name()[X].top(z=1))
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
                
            else:
                for loop, X in enumerate(column_2_list):
                    tipcheck(50)
                    p50.pick_up_tip() #<---------------- Tip Pickup
                    p50.aspirate(ElutVol, Elut.bottom(z=1))
                    p50.move_to(sample_plate_1.wells_by_name()[X].bottom(z=1))
                    p50.dispense(ElutVol, rate=1)
                    p50.blow_out(sample_plate_1.wells_by_name()[X].top())
                    p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                    p50_tips += 1
                    
            #==============================
            heatershaker.set_and_wait_for_shake_speed(rpm=ElutMixRPM)
            protocol.delay(ElutMixRep)
            heatershaker.deactivate_shaker()

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM HEATER SHAKER TO Thermocycler
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=thermocycler,
                use_gripper=True
            )
            heatershaker.close_labware_latch()
            #============================================================================================
        if STEP_ELUTDECK == 1:
            ############################################################################################################################################
            protocol.comment('Seal, Run ELUT (~10min)')
            if DRYRUN == False:
                thermocycler.set_lid_temperature(50)
                thermocycler.close_lid()
                profile_ERAT = [
                {'temperature': 37, 'hold_time_minutes': 10},
                ]
                thermocycler.execute_profile(steps=profile_ERAT, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(25)
                ############################################################################################################################################
                thermocycler.open_lid()
                protocol.pause("Remove Seal")

            #============================================================================================
            # GRIPPER MOVE sample_plate_1 FROM Thermocycler TO MAG PLATE
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=MAG_PLATE_SLOT,
                use_gripper=True
            )
            #============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=4)

            protocol.comment('--> Transferring Supernatant')
            TransferSup = 15
            for loop, X in enumerate(column_2_list):
                tipcheck(200)
                p1000.pick_up_tip() #<---------------- Tip Pickup
                p1000.move_to(sample_plate_1[X].bottom(z=0.5))
                p1000.aspirate(TransferSup, rate=0.25)
                p1000.dispense(TransferSup, sample_plate_1[column_3_list[loop]].bottom(z=1))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
                

        if ABR_TEST == True:
            protocol.comment('==============================================')
            protocol.comment('--> Resetting Run')
            protocol.comment('==============================================')

        heatershaker.open_labware_latch()
        if DEACTIVATE_TEMP == True:
            thermocycler.deactivate_block()
            thermocycler.deactivate_lid()
            temp_block.deactivate()
        protocol.comment('Number of Resets: '+str(Resetcount))
        protocol.comment('Number of p200 Tips Used: '+str(p200_tips+(12*p200_tipracks*p200_tipracks_count)))
        protocol.comment('Number of p50 Tips Used: '+str(p50_tips+(12*p50_tipracks*p50_tipracks_count)))
