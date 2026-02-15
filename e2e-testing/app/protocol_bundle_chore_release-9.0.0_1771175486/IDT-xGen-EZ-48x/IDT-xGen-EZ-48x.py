from opentrons import protocol_api
from opentrons import types
import math

metadata = {'protocolName': 'IDT xGen EZ 48x','author': 'Opentrons <protocols@opentrons.com>','source': 'Protocol Library',}
requirements = {"robotType": "Flex","apiLevel": "2.26",}

#>>> Changelog summary
#>>> 9/16/25 Revisions --> Z bottom Audit
#>>> 1/14/26 Revisions --> Update to v8.8

def add_parameters(parameters):
    # ======================== RUNTIME PARAMETERS ========================
    parameters.add_bool(
        display_name="Dry Run",
        variable_name="DRYRUN",
        default=False,
        description="Whether to perform a dry run or not.")
    parameters.add_str(
        display_name="Adapter Type",
        variable_name="ADAPTERTYPE",
        default="Stubby",
        description="Adapter Type",
        choices=[
        {"display_name": "UNI","value": "UNI"},
        {"display_name": "Stubby","value": "Stubby"}
        ])
    parameters.add_int(
        display_name="Number of Samples",
        variable_name="num_samples",
        description=" Number of Samples",
        default=48,
        minimum=1,
        maximum=48,
        )
    parameters.add_int(
        display_name="Fragmentation Time (Min)",
        variable_name="FRAGTIME",
        default=38,minimum=10,maximum=60,
        description="Length of Fragmentation Incubation.")
    parameters.add_int(
        display_name="PCR Cycles",
        variable_name="PCRCYCLES",
        default=4,minimum=1,maximum=20,
        description="How many PCR Cycles to for amplification.")

def run(protocol: protocol_api.ProtocolContext):
    # ======================== DOWNLOADED PARAMETERS ========================
    DRYRUN                  = protocol.params.DRYRUN
    ADAPTERTYPE             = protocol.params.ADAPTERTYPE
    num_samples             = protocol.params.num_samples    
    FRAGTIME                = protocol.params.FRAGTIME
    PCRCYCLES               = protocol.params.PCRCYCLES

    # =================================================================================================
    # ====================================== ADVANCED PARAMETERS ======================================
    # =================================================================================================
    #-------PROTOCOL STEP-------
    STEP_FXENZ              = True      # Set to False to skip block of commands
    STEP_LIG                = True      # Set to False to skip block of commands
    STEP_CLEANUP_1          = True      # Set to False to skip block of commands
    STEP_PCR                = True      # Set to False to skip block of commands
    STEP_CLEANUP_2          = True      # Set to False to skip block of commands

    #---NON RUNTIME PARAMETERS--
    MULTIDISPENSE           = False     # Set to True to have the same tip dispense wash reagents above the well in order to save tips
    HAVESTACKERS            = False     # Set to True to include 2 Labware stackers in positions A4 and B4, as is the general setup for the NGS workstation, this avoids having to remove them and accounts for height differences.

    #---DEVELOPMENT PARAMETERS--
    DEACTIVATE_TEMP         = True      # Default True    | True = Temp and / or Thermocycler deactivate at end of run, False = remain on, such as leaving at 4 degrees 
    TIP_MIX                 = False     # Default False   | Use Tip Mixing instead of Heatershaker
    ONDECK_THERMO           = True      # Default True    | True = On Deck Thermocycler, False = No Thermocycler protocol pauses and requires manual intervention.
    ONDECK_HEATERSHAKER     = True      # Default True    | True = On Deck Heater Shaker, False = No heatershaker and increased tip mixing reps.
    ONDECK_TEMP             = True      # Default True    | True = On Deck Temperature module, False = No Temperature Module
    USE_GRIPPER             = True      # Default True    | True = Uses the FLEX Gripper, False = No Gripper Movement, protocol pauses and requires manual intervention.
    LABEL                   = True      # Default True    | True = Include Setup Liquid Labeling, False = Setup Liquid Labeling is not included
    
    #--------- BARCODE ---------
    BarcodeColumn_1         = '1'      # Set to Barcode Column for Samples in Column 1
    BarcodeColumn_2         = '2'      # Set to Barcode Column for Samples in Column 2
    BarcodeColumn_3         = '3'      # Set to Barcode Column for Samples in Column 3
    BarcodeColumn_4         = '4'      # Set to Barcode Column for Samples in Column 4
    BarcodeColumn_5         = '5'      # Set to Barcode Column for Samples in Column 5
    BarcodeColumn_6         = '6'      # Set to Barcode Column for Samples in Column 6

    #-----SAMPLE MAX CHECK------
    COLUMNS = math.ceil(num_samples / 8)    
    WASTEVOL = 0                       # Number - Total volume of Discarded Liquid Waste

    # ======================= SIMPLE SETUP ARRANGEMENT ======================
    # ======= STACKER COLUMN [4]==========
    if HAVESTACKERS == True:
        stacker_200_A4 = protocol.load_module("flexStackerModuleV1", "A4")
        stacker_200_A4.set_stored_labware("opentrons_flex_96_tiprack_200ul", count=6, lid="opentrons_flex_tiprack_lid")
        tiprack_200_3 = stacker_200_A4.load_labware('opentrons_flex_96_tiprack_200ul')
        stacker_50_B4 = protocol.load_module("flexStackerModuleV1", "B4")
        stacker_50_B4.set_stored_labware("opentrons_flex_96_tiprack_50ul", count=6, lid="opentrons_flex_tiprack_lid")
        tiprack_50_3 = stacker_50_B4.load_labware('opentrons_flex_96_tiprack_50ul')
    if HAVESTACKERS == False:
        tiprack_200_3 = protocol.load_labware('opentrons_flex_96_tiprack_200ul','A4')
        tiprack_50_3 = protocol.load_labware('opentrons_flex_96_tiprack_50ul','B4')
    sample_plate_3 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','C4')
    sample_plate_2 = sample_plate_3.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt')
    lid_stack = 'D4'
    lids = protocol.load_lid_stack("opentrons_tough_pcr_auto_sealing_lid", lid_stack, 3)
    # ========== FIRST ROW [A] ===========
    if ONDECK_THERMO == True:
        thermocycler = protocol.load_module('thermocycler module gen2')
        sample_plate_1 = thermocycler.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','sample_plate_1')
    else:
        thermocycler = 'B1'        
        sample_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt',thermocycler,'sample_plate_1')
    tiprack_200_1 = protocol.load_labware('opentrons_flex_96_tiprack_200ul','A2')
    tiprack_200_2 = protocol.load_labware('opentrons_flex_96_tiprack_200ul','A3')
    # ======== SECOND ROW [B] ===========
    tiprack_50_1 = protocol.load_labware('opentrons_flex_96_tiprack_50ul','B2')
    tiprack_50_2 = protocol.load_labware('opentrons_flex_96_tiprack_50ul','B3')
    # ========= THIRD ROW [C] ===========
    if ONDECK_TEMP == True:
        temp_block = protocol.load_module('temperature module gen2', 'C1')
        temp_adapter = temp_block.load_adapter('opentrons_96_well_aluminum_block')
        reagent_plate_1 = temp_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','reagent_plate_1')
    else:
        reagent_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'C1','reagent_plate_1')
    reservoir = protocol.load_labware('nest_96_wellplate_2ml_deep','C2', 'reservoir')
    barcode_plate = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','C3','barcode_plate')
    # ======== FOURTH ROW [D] ===========
    if ONDECK_HEATERSHAKER == True:
        heatershaker = protocol.load_module('heaterShakerModuleV1','D1')
        cleanup_plate_1 = heatershaker.load_labware('nest_96_wellplate_2ml_deep','cleanup_plate_1')
    else:
        cleanup_plate_1 = protocol.load_labware('nest_96_wellplate_2ml_deep', 'D1','cleanup_plate_1')
    mag_block = protocol.load_module('magneticBlockV1', 'D2')
    TRASH = protocol.load_waste_chute()

    # =============================== PIPETTE ===============================
    p200_list =[tiprack_200_1,tiprack_200_2,tiprack_200_3]
    p50_list = [tiprack_50_1,tiprack_50_2,tiprack_50_3]
    #------DEFAULT SPEEDS-------
    p1000m  = protocol.load_instrument('flex_8channel_1000', 'left', tip_racks=p200_list)
    p50m  = protocol.load_instrument('flex_8channel_50', 'right', tip_racks=p50_list)
    p1000_flow_rate_aspirate_default = 716
    p1000_flow_rate_dispense_default = 716
    p1000_flow_rate_blow_out_default = 716
    p200_flow_rate_aspirate_default = 716
    p200_flow_rate_dispense_default = 716
    p200_flow_rate_blow_out_default = 716
    p50_flow_rate_aspirate_default  = 35
    p50_flow_rate_dispense_default  = 35
    p50_flow_rate_blow_out_default  = 35
    p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default
    p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default
    p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default
    p50m.flow_rate.aspirate = p50_flow_rate_aspirate_default
    p50m.flow_rate.dispense = p50_flow_rate_dispense_default
    p50m.flow_rate.blow_out = p50_flow_rate_blow_out_default

    # ========================== reagent_plate_1 ============================
    FRERAT              = reagent_plate_1['A1']
    LIG                 = reagent_plate_1['A2']
    if ADAPTERTYPE == 'UNI':
        UnivPrimer         = reagent_plate_1['A3']
    if ADAPTERTYPE == 'Stubby':
        Adapter            = reagent_plate_1['A4']
    PCR                 = reagent_plate_1['A5']
    #                   = A6
    #                   = A7
    #                   = A8
    #                   = A9
    #                   = A10
    #                   = A11
    #                   = A12

    # ============================ reservoir ================================
    CleanupBead         = reservoir['A1']
    RSB                 = reservoir['A2']
    #                   = A3
    #EtOH               = reservoir['A4']
    #EtOH               = reservoir['A5']
    #                   = A6
    #                   = A7
    #                   = A8
    Liquid_trash_well_4 = reservoir['A9']
    Liquid_trash_well_3 = reservoir['A10']
    Liquid_trash_well_2 = reservoir['A11']
    Liquid_trash_well_1 = reservoir['A12']

    # ------------------- TIP PICKUP HANDLER -------------------
    global tiprack_p200_counter
    global tiprack_p50_counter
    global p200_pickups
    global p50_pickups
    tiprack_p200_counter = 3
    tiprack_p50_counter = 3
    p200_pickups = 0
    p50_pickups = 0
    global OCCUPIED_p200
    global OCCUPIED_p50
    
    def p1000m_auto_pick_up_tip():
        global OCCUPIED_p200
        global tiprack_p200_counter
        global p200_pickups
        p200_pickups +=1
        try:
            p1000m.pick_up_tip()
        except:
            try: # REMOVING THE EXISTING TIPRACKS ON DECK
                # MOVING: tiprack_200_1 = A2 --> TRASH
                protocol.move_labware(labware=tiprack_200_1,new_location=TRASH,use_gripper=USE_GRIPPER)
                # MOVING: tiprack_200_2 = A3 --> TRASH
                protocol.move_labware(labware=tiprack_200_2,new_location=TRASH,use_gripper=USE_GRIPPER)
                # MOVING: tiprack_200_3 = stacker_200_A4 --> A2
                protocol.move_labware(labware=tiprack_200_3,new_location='A2',use_gripper=USE_GRIPPER)
                OCCUPIED_p200 = tiprack_200_3
                p1000m.pick_up_tip()
            except:  # CONVEYOR BELT ADD TIPRACKS FROM stacker_200_A4 TO A2
                # MOVING: OCCUPIED_p200 = A2 --> TRASH
                protocol.move_labware(labware=OCCUPIED_p200,new_location=TRASH,use_gripper=USE_GRIPPER)             
                # Dispensing RACK
                tiprack_p200_counter +=1
                Current_rack_name = f"tiprack_200_{tiprack_p200_counter}"
                if HAVESTACKERS == True:
                    # STACKER: stacker_200_A4 = DISPENSING TIPRACK #1
                    try:
                        Current_rack_name = stacker_200_A4.retrieve()
                        protocol.move_lid(Current_rack_name, TRASH, use_gripper=USE_GRIPPER)
                    except:
                        # STACKER: REFILL STACKER
                        protocol.pause('Refill stacker_200_A4')
                        stacker_200_A4.set_stored_labware("opentrons_flex_96_tiprack_200ul", count=6, lid="opentrons_flex_tiprack_lid")
                        Current_rack_name = stacker_200_A4.retrieve()
                        protocol.move_lid(Current_rack_name, TRASH, use_gripper=USE_GRIPPER)
                else:
                    # Defining A labware off deck, (instead of a stacker retrieving a labware)
                    Current_rack_name = protocol.load_labware('opentrons_flex_96_tiprack_200ul', protocol_api.OFF_DECK)
                    # MOVING (Manually): Current_rack_name = protocol_api.OFF_DECK --> A4
                    protocol.move_labware(labware=Current_rack_name,new_location='A4',use_gripper=False)
                # MOVING: Current_rack_name = A4  --> A2
                OCCUPIED_p200 = Current_rack_name
                protocol.move_labware(labware=Current_rack_name,new_location='A2',use_gripper=USE_GRIPPER)
                p200_list.append(Current_rack_name)
                p1000m.pick_up_tip()

    def p50m_auto_pick_up_tip():
        global OCCUPIED_p50
        global tiprack_p50_counter
        global p50_pickups
        p50_pickups +=1
        try:
            p50m.pick_up_tip()
        except:
            try: # REMOVING THE EXISTING TIPRACKS ON DECK
                # MOVING: tiprack_50_1 = B2 --> TRASH
                protocol.move_labware(labware=tiprack_50_1,new_location=TRASH,use_gripper=USE_GRIPPER)
                # MOVING: tiprack_50_2 = B3 --> TRASH
                protocol.move_labware(labware=tiprack_50_2,new_location=TRASH,use_gripper=USE_GRIPPER)
                # MOVING: tiprack_50_3 = D4 --> B2
                protocol.move_labware(labware=tiprack_50_3,new_location='B2',use_gripper=USE_GRIPPER)
                OCCUPIED_p50 = tiprack_50_3
                p50m.pick_up_tip()
            except:  # CONVEYOR BELT ADD TIPRACKS FROM stacker_50_B4 to A2
                # MOVING: OCCUPIED_p50 = B2 --> TRASH
                protocol.move_labware(labware=OCCUPIED_p50,new_location=TRASH,use_gripper=USE_GRIPPER)            
                # Dispensing RACK
                tiprack_p50_counter +=1
                Current_rack_name = f"tiprack_50_{tiprack_p50_counter}"
                if HAVESTACKERS == True:
                    # STACKER: stacker_50_B4 = DISPENSING TIPRACK #1
                    try:
                        Current_rack_name = stacker_50_B4.retrieve()
                        protocol.move_lid(Current_rack_name, TRASH, use_gripper=USE_GRIPPER)
                    except:
                        # STACKER: REFILL STACKER
                        protocol.pause('Refill stacker_50_B4')
                        stacker_50_B4.set_stored_labware("opentrons_flex_96_tiprack_50ul", count=6, lid="opentrons_flex_tiprack_lid")
                        Current_rack_name = stacker_50_B4.retrieve()
                        protocol.move_lid(Current_rack_name, TRASH, use_gripper=USE_GRIPPER)
                else:
                    # Defining A labware off deck, (instead of a stacker retrieveing a labware)
                    Current_rack_name = protocol.load_labware('opentrons_flex_96_tiprack_50ul', protocol_api.OFF_DECK)
                    # MOVING (Manually): Current_rack_name = protocol_api.OFF_DECK --> B4
                    protocol.move_labware(labware=Current_rack_name,new_location='B4',use_gripper=False)
                # MOVING: Current_rack_name = B4  --> B3
                OCCUPIED_p50 = Current_rack_name
                protocol.move_labware(labware=Current_rack_name,new_location='B3',use_gripper=USE_GRIPPER)
                p50_list.append(Current_rack_name)
                p50m.pick_up_tip()

    # ======================= TIP AND SAMPLE TRACKING =======================
    if COLUMNS == 1:
        column_1_list = ['A1']                              # sample_plate_1: Input, Frag, ERAT, Lig
        column_2_list = ['A1']                              # cleanup_plate_1: Cleanup 1
        column_3_list = ['A1']                              # sample_plate_2: PCR
        column_4_list = ['A5']                              # cleanup_plate_1: Cleanup 2
        column_5_list = ['A1']                              # sample_plate_3: Final
        ETOH_1_list = ['A4']
        ETOH_2_list = ['A5']
        if ADAPTERTYPE == 'UNI':
            FullLengthAdapter  = [BarcodeColumn_1]
        if ADAPTERTYPE == 'Stubby':
            IndexPrimers       = [BarcodeColumn_1]
    if COLUMNS == 2:
        column_1_list = ['A1','A2']                         # sample_plate_1: Input, Frag, ERAT, Lig
        column_2_list = ['A1','A2']                         # cleanup_plate_1: Cleanup 1
        column_3_list = ['A1','A2']                         # sample_plate_2: PCR
        column_4_list = ['A5','A6']                         # cleanup_plate_1: Cleanup 2
        column_5_list = ['A1','A2']                         # sample_plate_3: Final
        ETOH_1_list = ['A4','A4']
        ETOH_2_list = ['A5','A5']
        if ADAPTERTYPE == 'UNI':
            FullLengthAdapter  = [BarcodeColumn_1,BarcodeColumn_2]
        if ADAPTERTYPE == 'Stubby':
            IndexPrimers       = [BarcodeColumn_1,BarcodeColumn_2]
    if COLUMNS == 3:
        column_1_list = ['A1','A2','A3']                    # sample_plate_1: Input, Frag, ERAT, Lig
        column_2_list = ['A1','A2','A3']                    # cleanup_plate_1: Cleanup 1
        column_3_list = ['A1','A2','A3']                    # sample_plate_2: PCR
        column_4_list = ['A5','A6','A7']                    # cleanup_plate_1: Cleanup 2
        column_5_list = ['A1','A2','A3']                    # sample_plate_3: Final
        ETOH_1_list = ['A4','A4','A4']
        ETOH_2_list = ['A5','A5','A5']
        if ADAPTERTYPE == 'UNI':
            FullLengthAdapter  = [BarcodeColumn_1,BarcodeColumn_2,BarcodeColumn_3]
        if ADAPTERTYPE == 'Stubby':
            IndexPrimers       = [BarcodeColumn_1,BarcodeColumn_2,BarcodeColumn_3]
    if COLUMNS == 4:
        column_1_list = ['A1','A2','A3','A4']               # sample_plate_1: Input, Frag, ERAT, Lig
        column_2_list = ['A1','A2','A3','A4']               # cleanup_plate_1: Cleanup 1
        column_3_list = ['A1','A2','A3','A4']               # sample_plate_2: PCR
        column_4_list = ['A5','A6','A7','A8']               # cleanup_plate_1: Cleanup 2
        column_5_list = ['A1','A2','A3','A4']               # sample_plate_3: Final
        ETOH_1_list = ['A4','A4','A4','A4']
        ETOH_2_list = ['A5','A5','A5','A5']
        if ADAPTERTYPE == 'UNI':
            FullLengthAdapter  = [BarcodeColumn_1,BarcodeColumn_2,BarcodeColumn_3,BarcodeColumn_4]
        if ADAPTERTYPE == 'Stubby':
            IndexPrimers       = [BarcodeColumn_1,BarcodeColumn_2,BarcodeColumn_3,BarcodeColumn_4]
    if COLUMNS == 5:
        column_1_list = ['A1','A2','A3','A4','A5']           # sample_plate_1: Input, Frag, ERAT, Lig
        column_2_list = ['A1','A2','A3','A4','A5']           # cleanup_plate_1: Cleanup 1
        column_3_list = ['A1','A2','A3','A4','A5']           # sample_plate_2: PCR
        column_4_list = ['A7','A8','A9','A10','A11']         # cleanup_plate_1: Cleanup 2
        column_5_list = ['A1','A2','A3','A4','A5']           # sample_plate_3: Final
        ETOH_1_list = ['A4','A4','A4','A4','A4']
        ETOH_2_list = ['A5','A5','A5','A5','A5']
        if ADAPTERTYPE == 'UNI':
            FullLengthAdapter  = [BarcodeColumn_1,BarcodeColumn_2,BarcodeColumn_3,BarcodeColumn_4,BarcodeColumn_5]
        if ADAPTERTYPE == 'Stubby':
            IndexPrimers       = [BarcodeColumn_1,BarcodeColumn_2,BarcodeColumn_3,BarcodeColumn_4,BarcodeColumn_5]
    if COLUMNS == 6:
        column_1_list = ['A1','A2','A3','A4','A5','A6']      # sample_plate_1: Input, Frag, ERAT, Lig
        column_2_list = ['A1','A2','A3','A4','A5','A6']      # cleanup_plate_1: Cleanup 1
        column_3_list = ['A1','A2','A3','A4','A5','A6']      # sample_plate_2: PCR
        column_4_list = ['A7','A8','A9','A10','A11','A12']   # cleanup_plate_1: Cleanup 2
        column_5_list = ['A1','A2','A3','A4','A5','A6']      # sample_plate_3: Final
        ETOH_1_list = ['A4','A4','A4','A4','A4','A4']
        ETOH_2_list = ['A5','A5','A5','A5','A5','A5']
        if ADAPTERTYPE == 'UNI':
            FullLengthAdapter  = [BarcodeColumn_1,BarcodeColumn_2,BarcodeColumn_3,BarcodeColumn_4,BarcodeColumn_5,BarcodeColumn_6]
        if ADAPTERTYPE == 'Stubby':
            IndexPrimers       = [BarcodeColumn_1,BarcodeColumn_2,BarcodeColumn_3,BarcodeColumn_4,BarcodeColumn_5,BarcodeColumn_6]

    # =================================================================================================
    # ========================================= PROTOCOL START ========================================
    # =================================================================================================
    if ONDECK_THERMO == True: thermocycler.open_lid()
    if ONDECK_HEATERSHAKER == True: heatershaker.open_labware_latch()
    if DRYRUN == False:
        protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
        if ONDECK_THERMO == True: thermocycler.set_block_temperature(4)
        if ONDECK_THERMO == True: thermocycler.set_lid_temperature(70)    
        if ONDECK_TEMP == True: temp_block.set_temperature(4)
    protocol.pause("Temperatures are Set, Place any required Sample Plate and/or Reagent Plate(s) and Resume when ready")
    if ONDECK_HEATERSHAKER == True: heatershaker.close_labware_latch() 
    Liquid_trash = Liquid_trash_well_1
    # =================================================================================================
    # ========================================= PROTOCOL START ========================================
    # =================================================================================================

    if STEP_FXENZ == True:
        protocol.comment('==============================================')
        protocol.comment('--> FX')
        protocol.comment('==============================================')

        # Input Sample Volume = 19.5 in sample_plate_1

        protocol.comment('--> Adding FX')
        FRERATVol    = 10.5
        FRERATMixRep = 15 if DRYRUN == False else 1
        FRERATMixVol = 25
        FRERATBuffPremix = 2 if DRYRUN == False else 1
        p50m.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50m.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50m.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_1_list):
            p50m_auto_pick_up_tip()
            p50m.mix(FRERATBuffPremix,FRERATMixVol+1, FRERAT.bottom(z=0.5))
            p50m.aspirate(FRERATVol, FRERAT.bottom(z=0.5))
            p50m.dispense(FRERATVol, sample_plate_1.wells_by_name()[X].bottom(z=0.5))
            p50m.mix(FRERATMixRep,FRERATMixVol)
            p50m.move_to(sample_plate_1[X].top(z=-3))
            protocol.delay(seconds=3)
            p50m.blow_out(sample_plate_1[X].top(z=-3))
            p50m.return_tip() if DRYRUN == True else p50m.drop_tip()
        #===============================================

        ############################################################################################################################################
        # MOVING: lid_1 = lid_stack --> sample_plate_1
        protocol.move_lid(source_location=lid_stack, new_location=sample_plate_1, use_gripper=USE_GRIPPER)

        # Current Lid Temp = 70
        # Current Block Temp = 4

        if ONDECK_THERMO == True:
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_FRERAT = [
                    {'temperature': 32, 'hold_time_minutes': FRAGTIME},
                    {'temperature': 65, 'hold_time_minutes': 30}
                    ]
                thermocycler.execute_profile(steps=profile_FRERAT, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(4)
            thermocycler.open_lid()
        else:
            if DRYRUN == False:
                protocol.pause('Pausing to run Fragmentation and End Repair on an off deck Thermocycler ~45min')
            else:
                protocol.comment('Pausing to run Fragmentation and End Repair on an off deck Thermocycler ~45min')
        
        # MOVING: lid_1 = sample_plate_1 --> TRASH
        protocol.move_lid(source_location=sample_plate_1, new_location=TRASH, use_gripper=USE_GRIPPER)
        ############################################################################################################################################

    if STEP_LIG == True:
        protocol.comment('==============================================')
        protocol.comment('--> Adapter Ligation')
        protocol.comment('==============================================')

        # Deactivating Thermocycler Lid
        if ONDECK_THERMO == True:
            if DRYRUN == False:
                thermocycler.deactivate_lid()

        # Current Volume = 30 in sample_plate_1

        protocol.comment('--> Adding Lig')
        LIGVol = 25
        LIGMixRep = 30 if DRYRUN == False else 1
        LIGMixVol = 55
        LIGMixPremix = 2 if DRYRUN == False else 1
        p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_1_list):
            p1000m_auto_pick_up_tip()
            p1000m.mix(LIGMixPremix,LIGVol+2, LIG.bottom(z=0.5))
            p1000m.aspirate(LIGVol+2, LIG.bottom(z=0.5))
            p1000m.dispense(2, LIG.bottom(z=0.5))
            p1000m.default_speed = 100
            p1000m.move_to(LIG.top(z=5))
            protocol.delay(seconds=1)
            p1000m.default_speed = 400
            p1000m.dispense(LIGVol, sample_plate_1[X].bottom(z=0.5))
            p1000m.move_to(sample_plate_1[X].bottom(z=1))
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.25
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.25
            p1000m.mix(LIGMixRep,LIGMixVol)
            p1000m.default_speed = 100
            p1000m.move_to(sample_plate_1[X].top(z=-3))
            protocol.delay(seconds=3)
            p1000m.blow_out(sample_plate_1[X].top(z=-3))
            p1000m.default_speed = 400
            p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
        #===============================================

        if ADAPTERTYPE == 'UNI':

            # Current Volume = 55 in sample_plate_1

            protocol.comment('--> Adding Full Length Adapter')
            FullLengthAdapterVol    = 5
            FullLengthAdapterMixRep = 5 if DRYRUN == False else 1
            FullLengthAdapterMixVol = 40
            p50m.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
            p50m.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
            p50m.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
            X = 'A1'
            #===============================================
            for loop, X in enumerate(column_1_list):
                p50m_auto_pick_up_tip()
                p50m.aspirate(FullLengthAdapterVol, barcode_plate['A'+FullLengthAdapter[loop]].bottom(z=0.5))
                p50m.dispense(FullLengthAdapterVol, sample_plate_1.wells_by_name()[X].bottom(z=1))
                p50m.mix(FullLengthAdapterMixRep,FullLengthAdapterMixVol)
                p50m.move_to(sample_plate_1[X].top(z=-3))
                protocol.delay(seconds=1)
                p50m.blow_out(sample_plate_1[X].top(z=-3))
                p50m.return_tip() if DRYRUN == True else p50m.drop_tip()
            #===============================================

        if ADAPTERTYPE == 'Stubby':

            # Current Volume = 55 in sample_plate_1

            protocol.comment('--> Adding Stubby Adapter')
            AdapterVol    = 5
            AdapterMixRep = 5 if DRYRUN == False else 1
            AdapterMixVol = 40
            p50m.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
            p50m.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
            p50m.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
            X = 'A1'
            #===============================================
            for loop, X in enumerate(column_1_list):
                p50m_auto_pick_up_tip()
                p50m.aspirate(AdapterVol, Adapter.bottom(z=0.5))
                p50m.dispense(AdapterVol, sample_plate_1.wells_by_name()[X].bottom(z=1))
                p50m.mix(AdapterMixRep,AdapterMixVol)
                p50m.move_to(sample_plate_1[X].top(z=-3))
                protocol.delay(seconds=1)
                p50m.blow_out(sample_plate_1[X].top(z=-3))
                p50m.return_tip() if DRYRUN == True else p50m.drop_tip()
            #===============================================

        ############################################################################################################################################
        # MOVING: lid_2 = lid_stack --> sample_plate_1
        protocol.move_lid(source_location=lid_stack, new_location=sample_plate_1, use_gripper=USE_GRIPPER)

        # Current Lid Temp = OFF
        # Current Block Temp = 4

        if ONDECK_THERMO == True:
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_LIG = [
                    {'temperature': 20, 'hold_time_minutes': 20}
                    ]
                thermocycler.execute_profile(steps=profile_LIG, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(4)
            thermocycler.open_lid()
        else:
            if DRYRUN == False:
                protocol.pause('Pausing to run Ligation on an off deck Thermocycler ~20min')
            else:
                protocol.comment('Pausing to run Ligation on an off deck Thermocycler ~20min')
        
        # MOVING: lid_2 = sample_plate_1 --> TRASH
        protocol.move_lid(source_location=sample_plate_1, new_location=TRASH, use_gripper=USE_GRIPPER)
        ############################################################################################################################################

    if STEP_CLEANUP_1 == True:
        protocol.comment('==============================================')
        protocol.comment('--> CLEANUP_1')
        protocol.comment('==============================================')

        # Deactivating Thermocycler Lid and Block
        if ONDECK_THERMO == True:
            if DRYRUN == False:
                thermocycler.deactivate_lid()
                thermocycler.deactivate_block()

        # Current Volume = 60 in sample_plate_1

        # Following Directions for Direct Sequencing (ratio: 0.8)

        if MULTIDISPENSE == False: # Adding beads and transferring samples with same tip to conserve tips 
            protocol.comment('--> ADDING CleanupBead (0.8x)')
            CleanupBeadVol = 48
            TransferSup = 60
            CleanupBeadMixRPM = 1600
            CleanupBeadMixTime = 5*60 if DRYRUN == False else 0.1*60
            CleanupBeadPremix = 3 if DRYRUN == False else 1
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            for loop, X in enumerate(column_1_list):
                p1000m_auto_pick_up_tip()

                protocol.comment('--> ADDING CleanupBead (0.8x)')
                #================================
                p1000m.mix(CleanupBeadPremix,CleanupBeadVol+3, CleanupBead.bottom(z=1))
                p1000m.aspirate(CleanupBeadVol+3, CleanupBead.bottom(z=1))
                p1000m.dispense(3, CleanupBead.bottom(z=1))
                p1000m.default_speed = 100
                p1000m.move_to(CleanupBead.top(z=-3))
                p1000m.touch_tip(speed=100)
                p1000m.dispense(CleanupBeadVol, cleanup_plate_1[column_2_list[loop]].bottom(z=0.5))

                protocol.comment('--> Transferring Samples')
                #================================
                p1000m.move_to(sample_plate_1[X].bottom(z=0.5))
                p1000m.aspirate(TransferSup/2)
                protocol.delay(seconds=0.2)
                p1000m.move_to(sample_plate_1[X].bottom(z=0.5))
                p1000m.aspirate((TransferSup/2)+10)
                p1000m.dispense(TransferSup+10, cleanup_plate_1[column_2_list[loop]].bottom(z=1))
                p1000m.default_speed = 100
                p1000m.move_to(cleanup_plate_1[column_2_list[loop]].bottom(z=3))
                if TIP_MIX == True:
                    CleanupBeadMix = 20 if DRYRUN == False else 1
                if TIP_MIX == False:
                    CleanupBeadMix = 3 if DRYRUN == False else 1
                for Mix in range(CleanupBeadMix):
                    p1000m.aspirate(70)
                    p1000m.move_to(cleanup_plate_1[column_2_list[loop]].bottom(z=0.5))
                    p1000m.aspirate(20)
                    p1000m.dispense(20)
                    p1000m.move_to(cleanup_plate_1[column_2_list[loop]].bottom(z=3))
                    p1000m.dispense(70)
                p1000m.move_to(cleanup_plate_1[column_2_list[loop]].top(z=-3))
                protocol.delay(seconds=1)
                p1000m.blow_out(cleanup_plate_1[column_2_list[loop]].top(z=-3))
                p1000m.touch_tip(speed=100)
                p1000m.default_speed = 400
                p1000m.move_to(cleanup_plate_1[column_2_list[loop]].top(z=5))
                p1000m.move_to(cleanup_plate_1[column_2_list[loop]].top(z=0))
                p1000m.move_to(cleanup_plate_1[column_2_list[loop]].top(z=5))
                p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
            #===============================================
            if TIP_MIX == False:
                heatershaker.set_and_wait_for_shake_speed(rpm=CleanupBeadMixRPM)
                protocol.delay(CleanupBeadMixTime)
                heatershaker.deactivate_shaker()

        if MULTIDISPENSE == True: # Using seperate tips for adding beads and transferring sample
            protocol.comment('--> Transferring Samples')
            TransferSup = 60
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            for loop, X in enumerate(column_1_list):
                p1000m_auto_pick_up_tip()
                p1000m.move_to(sample_plate_1[X].bottom(z=0.5))
                p1000m.aspirate(TransferSup/2)
                protocol.delay(seconds=0.2)
                p1000m.move_to(sample_plate_1[X].bottom(z=0.5))
                p1000m.aspirate((TransferSup/2)+5)
                p1000m.dispense(TransferSup+5, cleanup_plate_1[column_2_list[loop]].bottom(z=1))
                p1000m.move_to(cleanup_plate_1[column_2_list[loop]].top(z=-3))
                protocol.delay(seconds=1)
                p1000m.blow_out(cleanup_plate_1[column_2_list[loop]].top(z=-3))
                p1000m.touch_tip(speed=100)
                p1000m.default_speed = 400
                p1000m.move_to(cleanup_plate_1[column_2_list[loop]].top(z=5))
                p1000m.move_to(cleanup_plate_1[column_2_list[loop]].top(z=0))
                p1000m.move_to(cleanup_plate_1[column_2_list[loop]].top(z=5))
                p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
            #===============================================

            protocol.comment('--> ADDING CleanupBead (0.8x)')
            CleanupBeadVol = 48
            CleanupBeadMixRPM = 1600
            CleanupBeadMixTime = 5*60 if DRYRUN == False else 0.1*60
            CleanupBeadPremix = 3 if DRYRUN == False else 1
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            for loop, X in enumerate(column_2_list):
                p1000m_auto_pick_up_tip()
                p1000m.mix(CleanupBeadPremix,CleanupBeadVol+3, CleanupBead.bottom(z=1))
                p1000m.aspirate(CleanupBeadVol+3, CleanupBead.bottom(z=1))
                p1000m.dispense(3, CleanupBead.bottom(z=1))
                p1000m.default_speed = 100
                p1000m.move_to(CleanupBead.top(z=-3))
                p1000m.touch_tip(speed=100)
                p1000m.dispense(CleanupBeadVol, cleanup_plate_1[X].bottom(z=0.5))
                if TIP_MIX == True:
                    CleanupBeadMix = 20 if DRYRUN == False else 1
                if TIP_MIX == False:
                    CleanupBeadMix = 3 if DRYRUN == False else 1
                for Mix in range(CleanupBeadMix):
                    p1000m.aspirate(70)
                    p1000m.move_to(cleanup_plate_1[X].bottom(z=0.5))
                    p1000m.aspirate(20)
                    p1000m.dispense(20)
                    p1000m.move_to(cleanup_plate_1[X].bottom(z=3))
                    p1000m.dispense(70)
                p1000m.move_to(cleanup_plate_1[X].top(z=-3))
                protocol.delay(seconds=1)
                p1000m.blow_out(cleanup_plate_1[X].top(z=-3))
                p1000m.touch_tip(speed=100)
                p1000m.default_speed = 400
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.move_to(cleanup_plate_1[X].top(z=0))
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
            #===============================================
            if TIP_MIX == False:
                heatershaker.set_and_wait_for_shake_speed(rpm=CleanupBeadMixRPM)
                protocol.delay(CleanupBeadMixTime)
                heatershaker.deactivate_shaker()

        #============================================================================================
        # MOVING: cleanup_plate_1 = D1 / heatershaker --> mag_block
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=cleanup_plate_1,new_location=mag_block,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=cleanup_plate_1,new_location=mag_block,use_gripper=USE_GRIPPER)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=4)

        # Current Volume = 108 in cleanup_plate_1

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        ActualRemoveSup = 110
        p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #=============================
        for loop, X in enumerate(column_2_list):
            p1000m_auto_pick_up_tip()
            p1000m.move_to(cleanup_plate_1[X].bottom(z=2))
            p1000m.aspirate(RemoveSup-100)
            protocol.delay(seconds=5)
            p1000m.move_to(cleanup_plate_1[X].bottom(z=0.5))
            p1000m.aspirate(100)
            p1000m.default_speed = 200
            p1000m.move_to(cleanup_plate_1[X].top(z=2))
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul to '+str(WASTEVOL))
            if WASTEVOL <14400:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400 and WASTEVOL <28800:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=28800 and WASTEVOL <43200:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=43200:
                Liquid_trash = Liquid_trash_well_4
            #================================ 
            p1000m.dispense(ActualRemoveSup, Liquid_trash.top(z=-3))
            protocol.delay(seconds=5)
            p1000m.blow_out()
            p1000m.touch_tip(speed=100)
            p1000m.default_speed = 400
            p1000m.move_to(Liquid_trash.top(z=5))
            p1000m.move_to(Liquid_trash.top(z=0))
            p1000m.move_to(Liquid_trash.top(z=5))
            p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
        #=============================

        if MULTIDISPENSE == False: # Using new tips per sample column 
            protocol.comment('--> ETOH Wash 1')
            ETOHMaxVol = 150
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            for loop, X in enumerate(column_2_list):
                p1000m_auto_pick_up_tip()
                p1000m.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_1_list[loop]].bottom(z=1))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_1_list[loop]].top(z=0))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_1_list[loop]].top(z=-5))
                p1000m.touch_tip(speed=100)
                # Tip in the well, above sample
                p1000m.move_to(cleanup_plate_1[X].bottom(z=20))
                p1000m.dispense(ETOHMaxVol)
                protocol.delay(seconds=5)
                p1000m.blow_out()
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.move_to(cleanup_plate_1[X].top(z=0))
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
            #===============================================

        if MULTIDISPENSE == True: # Using 1 set of tips and dispensing ETOH from the top 
            protocol.comment('--> ETOH Wash 1 - Multi')
            ETOHMaxVol = 150
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.75
            #===============================================
            p1000m_auto_pick_up_tip()
            for loop, X in enumerate(column_2_list):
                p1000m.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_1_list[loop]].bottom(z=1))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_1_list[loop]].top(z=0))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_1_list[loop]].top(z=-5))
                p1000m.touch_tip(speed=100)
                # Tip above the well
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.75
                p1000m.dispense(ETOHMaxVol)
                protocol.delay(seconds=5)
                p1000m.blow_out()
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.move_to(cleanup_plate_1[X].top(z=0))
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
            p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
            #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)

        protocol.comment('--> Remove ETOH Wash 1')
        RemoveSup = 200
        ActualRemoveSup = 160
        p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_2_list):
            p1000m_auto_pick_up_tip()
            p1000m.move_to(cleanup_plate_1[X].bottom(z=3))
            p1000m.aspirate(RemoveSup-100)
            protocol.delay(seconds=3)
            p1000m.move_to(cleanup_plate_1[X].bottom(z=0.75))
            p1000m.aspirate(100)
            p1000m.default_speed = 100
            p1000m.move_to(cleanup_plate_1[X].top(z=-2))
            p1000m.default_speed = 200
            p1000m.touch_tip(speed=100)
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul to '+str(WASTEVOL))
            if WASTEVOL <14400:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400 and WASTEVOL <28800:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=28800 and WASTEVOL <43200:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=43200:
                Liquid_trash = Liquid_trash_well_4
            #================================ 
            p1000m.dispense(200, Liquid_trash.top(z=-3))
            protocol.delay(seconds=2)
            p1000m.blow_out()
            p1000m.touch_tip(speed=100)
            p1000m.move_to(Liquid_trash.top(z=-5))
            p1000m.move_to(Liquid_trash.top(z=0))
            p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
        #===============================================

        if MULTIDISPENSE == False: # Using new tips per sample column 
            protocol.comment('--> ETOH Wash 2')
            ETOHMaxVol = 150
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            for loop, X in enumerate(column_2_list):
                p1000m_auto_pick_up_tip()
                p1000m.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_1_list[loop]].bottom(z=1))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_1_list[loop]].top(z=0))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_1_list[loop]].top(z=-5))
                p1000m.touch_tip(speed=100)
                # Tip in the well, above sample
                p1000m.move_to(cleanup_plate_1[X].bottom(z=20))
                p1000m.dispense(ETOHMaxVol)
                protocol.delay(seconds=5)
                p1000m.blow_out()
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.move_to(cleanup_plate_1[X].top(z=0))
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
            #===============================================

        if MULTIDISPENSE == True: # Using 1 set of tips and dispensing ETOH from the top 
            protocol.comment('--> ETOH Wash 2 - Multi')
            ETOHMaxVol = 150
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.75
            #===============================================
            p1000m_auto_pick_up_tip()
            for loop, X in enumerate(column_2_list):
                p1000m.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_1_list[loop]].bottom(z=1))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_1_list[loop]].top(z=0))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_1_list[loop]].top(z=-5))
                p1000m.touch_tip(speed=100)
                # Tip above the well
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.75
                p1000m.dispense(ETOHMaxVol)
                protocol.delay(seconds=5)
                p1000m.blow_out()
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.move_to(cleanup_plate_1[X].top(z=0))
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
            p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
            #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)

        protocol.comment('--> Remove ETOH Wash 2')
        RemoveSup = 200
        ActualRemoveSup = 160
        p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_2_list):
            p1000m_auto_pick_up_tip()
            p1000m.move_to(cleanup_plate_1[X].bottom(z=3))
            p1000m.aspirate(RemoveSup-100)
            protocol.delay(seconds=3)
            p1000m.move_to(cleanup_plate_1[X].bottom(z=0.75))
            p1000m.aspirate(100)
            p1000m.default_speed = 100
            p1000m.move_to(cleanup_plate_1[X].top(z=-2))
            p1000m.default_speed = 200
            p1000m.touch_tip(speed=100)
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul to '+str(WASTEVOL))
            if WASTEVOL <14400:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400 and WASTEVOL <28800:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=28800 and WASTEVOL <43200:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=43200:
                Liquid_trash = Liquid_trash_well_4
            #================================ 
            p1000m.dispense(200, Liquid_trash.top(z=-3))
            protocol.delay(seconds=2)
            p1000m.blow_out()
            p1000m.touch_tip(speed=100)
            p1000m.move_to(Liquid_trash.top(z=-5))
            p1000m.move_to(Liquid_trash.top(z=0))
            p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=1)
        
        protocol.comment('--> Removing Residual Wash')
        RemoveSup = 50
        ActualRemoveSup = 20
        p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_2_list):
            p1000m_auto_pick_up_tip()
            p1000m.move_to(cleanup_plate_1[X].bottom(z=0.5))
            p1000m.aspirate(RemoveSup)
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul to '+str(WASTEVOL))
            if WASTEVOL <14400:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400 and WASTEVOL <28800:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=28800 and WASTEVOL <43200:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=43200:
                Liquid_trash = Liquid_trash_well_4
            #================================ 
            p1000m.dispense(RemoveSup, Liquid_trash)
            p1000m.move_to(Liquid_trash.top(z=5))
            protocol.delay(seconds=5)
            p1000m.blow_out(Liquid_trash.top(z=-3))
            p1000m.move_to(Liquid_trash.top(z=5))
            p1000m.move_to(Liquid_trash.top(z=0))
            p1000m.move_to(Liquid_trash.top(z=5))
            p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)

        #============================================================================================
        # MOVING: cleanup_plate_1 =  mag_block --> D1 / heatershaker
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=cleanup_plate_1,new_location=heatershaker,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=cleanup_plate_1,new_location='D1',use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> Adding RSB')
        RSBVol = 21
        RSBMixRPM = 2000
        RSBMixTime = 2*60 if DRYRUN == False else 0.1*60
        p50m.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50m.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50m.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_2_list):
            p50m_auto_pick_up_tip()
            p50m.aspirate(RSBVol, RSB.bottom(z=1))
            p50m.dispense(RSBVol,cleanup_plate_1.wells_by_name()[X].bottom(z=1))
            if TIP_MIX == True:
                RSBMix = 20 if DRYRUN == False else 1
            if TIP_MIX == False:
                RSBMix = 5 if DRYRUN == False else 1
            for Mix in range(RSBMix):
                p50m.aspirate(RSBVol, cleanup_plate_1.wells_by_name()[X].bottom(z=1))
                p50m.dispense(RSBVol, cleanup_plate_1.wells_by_name()[X].bottom(z=1))
            p50m.blow_out(cleanup_plate_1.wells_by_name()[X].top(z=-3))
            p50m.return_tip() if DRYRUN == True else p50m.drop_tip()
        #===============================================
        if ONDECK_HEATERSHAKER == True:
            heatershaker.set_and_wait_for_shake_speed(rpm=RSBMixRPM)
            protocol.delay(RSBMixTime)
            heatershaker.deactivate_shaker()

        #============================================================================================
        # MOVING: cleanup_plate_1 = D1 / heatershaker --> mag_block
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=cleanup_plate_1,new_location=mag_block,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=cleanup_plate_1,new_location=mag_block,use_gripper=USE_GRIPPER)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=3)

        #============================================================================================
        # MOVING: sample_plate_1 = thermocycler --> TRASH
        protocol.move_labware(labware=sample_plate_1,new_location=TRASH,use_gripper=USE_GRIPPER)
        # MOVING: sample_plate_2 = C4 --> thermocycler
        protocol.move_labware(labware=sample_plate_2,new_location=thermocycler,use_gripper=USE_GRIPPER)
        #============================================================================================

        # Current Volume = 21 in cleanup_plate_1

        protocol.comment('--> Transferring Supernatant')
        TransferSup = 20
        p50m.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50m.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50m.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_2_list):
            p50m_auto_pick_up_tip()
            p50m.move_to(cleanup_plate_1[X].bottom(z=0.5))
            p50m.aspirate(TransferSup/2)
            protocol.delay(seconds=2)
            p50m.move_to(cleanup_plate_1[X].bottom(z=0.5))
            p50m.aspirate(TransferSup/2)
            p50m.dispense(TransferSup, sample_plate_2[column_3_list[loop]].bottom(z=1))
            p50m.blow_out(sample_plate_2[column_3_list[loop]].top(z=-3))
            p50m.return_tip() if DRYRUN == True else p50m.drop_tip()
        #===============================================

    if STEP_PCR == True:
        protocol.comment('==============================================')
        protocol.comment('--> Amplification')
        protocol.comment('==============================================')

        # Not Carrying out Optional Size Selection for PCR-Free

        # Current Volume = 20 in sample_plate_2

        if ADAPTERTYPE == 'UNI':
            protocol.comment('--> Adding PCR Mix')
            PCRVol = 25
            PCRMixRep = 3 if DRYRUN == False else 1
            PCRMixVol = 40
            PCRPremix = 2 if DRYRUN == False else 1
            p50m.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
            p50m.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
            p50m.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
            X = 'A1'
            #===============================================
            for loop, X in enumerate(column_3_list):
                p50m_auto_pick_up_tip()
                p50m.move_to(PCR.bottom(z=0.5))
                p50m.mix(PCRPremix, PCRMixVol)
                p50m.aspirate(PCRVol, PCR.bottom(z=0.5))
                p50m.dispense(PCRVol, sample_plate_2[X].bottom(z=0.5))
                p50m.mix(PCRMixRep, PCRMixVol)
                p50m.move_to(sample_plate_2[X].top(z=-3))
                protocol.delay(seconds=3)
                p50m.blow_out(sample_plate_2[X].top(z=-3))
                p50m.return_tip() if DRYRUN == True else p50m.drop_tip()
            #===============================================

            # Current Volume = 45 in sample_plate_2

            protocol.comment('--> Adding Universal Primers')
            UnivPrimerVol = 5
            UnivPrimerMixRep = 10 if DRYRUN == False else 1
            UnivPrimerMixVol = 40
            p50m.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
            p50m.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
            p50m.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
            X = 'A1'
            #===============================================
            for loop, X in enumerate(column_3_list):
                p50m_auto_pick_up_tip()
                p50m.aspirate(UnivPrimerVol, UnivPrimer.bottom(z=0.5))
                p50m.dispense(UnivPrimerVol, sample_plate_2[X].bottom(z=0.5))
                p50m.mix(UnivPrimerMixRep, UnivPrimerMixVol)
                p50m.move_to(sample_plate_2[X].top(z=-3))
                protocol.delay(seconds=3)
                p50m.blow_out(sample_plate_2[X].top(z=-3))
                p50m.return_tip() if DRYRUN == True else p50m.drop_tip()
            #===============================================

        if ADAPTERTYPE == 'Stubby':
            protocol.comment('--> Adding PCR Mix')
            PCRVol = 25
            PCRMixRep = 3 if DRYRUN == False else 1
            PCRMixVol = 40
            PCRPremix = 2 if DRYRUN == False else 1
            IndexPrimersVol = 5
            IndexPrimersMixRep = 10 if DRYRUN == False else 1
            IndexPrimersMixVol = 40
            p50m.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
            p50m.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
            p50m.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
            X = 'A1'
            #===============================================
            for loop, X in enumerate(column_3_list):
                p50m_auto_pick_up_tip()

                protocol.comment('--> Adding PCR Mix')
                #================================ 
                p50m.aspirate(PCRVol, PCR.bottom(z=0.5))
                p50m.dispense(PCRVol, sample_plate_2[X].bottom(z=0.5))
                p50m.mix(PCRMixRep, PCRMixVol)
                p50m.move_to(sample_plate_2[X].top(z=-3))
                protocol.delay(seconds=3)
                p50m.blow_out(sample_plate_2[X].top(z=-3))

                protocol.comment('--> Adding Index Primers')
                #================================ 
                p50m.aspirate(IndexPrimersVol, barcode_plate['A'+IndexPrimers[loop]].bottom(z=0.5))
                p50m.dispense(IndexPrimersVol, sample_plate_2[X].bottom(z=0.5))
                p50m.mix(IndexPrimersMixRep, IndexPrimersMixVol)
                p50m.move_to(sample_plate_2[X].top(z=-3))
                protocol.delay(seconds=3)
                p50m.blow_out(sample_plate_2[X].top(z=-3))
                p50m.return_tip() if DRYRUN == True else p50m.drop_tip()
            #===============================================

        ############################################################################################################################################
        # MOVING: lid_3 = lid_stack --> sample_plate_2
        protocol.move_lid(source_location=lid_stack, new_location=sample_plate_2, use_gripper=USE_GRIPPER)

        # Current Lid Temp = OFF
        # Current Block Temp = OFF

        if ONDECK_THERMO == True: 
            if DRYRUN == False:
                thermocycler.set_lid_temperature(105)  
                thermocycler.set_block_temperature(4)

        if ONDECK_THERMO == True:
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_PCR_1 = [
                    {'temperature': 98, 'hold_time_seconds': 45}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_1, repetitions=1, block_max_volume=50)
                profile_PCR_2 = [
                    {'temperature': 98, 'hold_time_seconds': 15},
                    {'temperature': 60, 'hold_time_seconds': 30},
                    {'temperature': 72, 'hold_time_seconds': 30}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_2, repetitions=PCRCYCLES, block_max_volume=50)
                profile_PCR_3 = [
                    {'temperature': 72, 'hold_time_minutes': 1}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_3, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(4)
            thermocycler.open_lid()
        else:
            if DRYRUN == False:
                protocol.pause('Pausing to run PCR on an off deck Thermocycler ~20min')
            else:
                protocol.comment('Pausing to run PCR on an off deck Thermocycler ~20min')

        # MOVING: lid_3 = sample_plate_2 --> TRASH
        protocol.move_lid(source_location=sample_plate_2, new_location=TRASH, use_gripper=USE_GRIPPER)
        ############################################################################################################################################

    if STEP_CLEANUP_2 == True:
        protocol.comment('==============================================')
        protocol.comment('--> Cleanup 2')
        protocol.comment('==============================================')

        #============================================================================================
        # MOVING: cleanup_plate_1 = mag_block --> D1 / heatershaker
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=cleanup_plate_1,new_location=heatershaker,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=cleanup_plate_1,new_location='D1',use_gripper=USE_GRIPPER)
        #============================================================================================

        # Current Volume = 50 in sample_plate_2

        # Following Directions for Direct Sequencing (ratio: 0.65)

        if MULTIDISPENSE == False: # Adding beads and transferring samples with same tip to conserve tips 
            protocol.comment('--> ADDING CleanupBead (0.65x)')
            CleanupBeadVol = 32.5
            TransferSup = 50
            CleanupBeadMixRPM = 1600
            CleanupBeadMixTime = 5*60 if DRYRUN == False else 0.1*60
            CleanupBeadPremix = 3 if DRYRUN == False else 1
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            for loop, X in enumerate(column_3_list):
                p1000m_auto_pick_up_tip()

                protocol.comment('--> ADDING CleanupBead (0.65x)')
                #================================
                p1000m.mix(CleanupBeadPremix,CleanupBeadVol+3, CleanupBead.bottom(z=1))
                p1000m.aspirate(CleanupBeadVol+3, CleanupBead.bottom(z=1))
                p1000m.dispense(3, CleanupBead.bottom(z=1))
                p1000m.default_speed = 100
                p1000m.move_to(CleanupBead.top(z=-3))
                p1000m.touch_tip(speed=100)
                p1000m.dispense(CleanupBeadVol, cleanup_plate_1[column_4_list[loop]].bottom(z=0.5))

                protocol.comment('--> Transferring Samples')
                #================================                
                p1000m.move_to(sample_plate_2[X].bottom(z=0.5))
                p1000m.aspirate(TransferSup/2)
                protocol.delay(seconds=0.2)
                p1000m.move_to(sample_plate_2[X].bottom(z=0.5))
                p1000m.aspirate((TransferSup/2)+10)
                p1000m.dispense(TransferSup+10, cleanup_plate_1[column_4_list[loop]].bottom(z=1))
                p1000m.default_speed = 100
                p1000m.move_to(cleanup_plate_1[X].bottom(z=3))
                if TIP_MIX == True:
                    CleanupBeadMix = 20 if DRYRUN == False else 1
                if TIP_MIX == False:
                    CleanupBeadMix = 3 if DRYRUN == False else 1
                for Mix in range(CleanupBeadMix):
                    p1000m.aspirate(50)
                    p1000m.move_to(cleanup_plate_1[column_4_list[loop]].bottom(z=0.5))
                    p1000m.aspirate(20)
                    p1000m.dispense(20)
                    p1000m.move_to(cleanup_plate_1[column_4_list[loop]].bottom(z=2))
                    p1000m.dispense(50)
                p1000m.move_to(cleanup_plate_1[column_4_list[loop]].top(z=-3))
                protocol.delay(seconds=1)
                p1000m.blow_out(cleanup_plate_1[column_4_list[loop]].top(z=-3))
                p1000m.touch_tip(speed=100)
                p1000m.default_speed = 400
                p1000m.move_to(cleanup_plate_1[column_4_list[loop]].top(z=5))
                p1000m.move_to(cleanup_plate_1[column_4_list[loop]].top(z=0))
                p1000m.move_to(cleanup_plate_1[column_4_list[loop]].top(z=5))
                p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
            #===============================================
            if TIP_MIX == False:
                heatershaker.set_and_wait_for_shake_speed(rpm=CleanupBeadMixRPM)
                protocol.delay(CleanupBeadMixTime)
                heatershaker.deactivate_shaker()

        if MULTIDISPENSE == True: # Using seperate tips for adding beads and transferring sample
            protocol.comment('--> Transferring Samples')
            TransferSup = 50
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            for loop, X in enumerate(column_3_list):
                p50m_auto_pick_up_tip()            
                p50m.move_to(sample_plate_2[X].bottom(z=0.5))
                p50m.aspirate(TransferSup/2)
                protocol.delay(seconds=0.2)
                p50m.move_to(sample_plate_2[X].bottom(z=0.5))
                p50m.aspirate((TransferSup/2))
                p50m.dispense(TransferSup, cleanup_plate_1[column_4_list[loop]].bottom(z=1))
                p50m.blow_out(cleanup_plate_1[column_4_list[loop]].top(z=-3))
                p50m.touch_tip(speed=100)
                p50m.move_to(cleanup_plate_1[column_4_list[loop]].top(z=5))
                p50m.move_to(cleanup_plate_1[column_4_list[loop]].top(z=0))
                p50m.move_to(cleanup_plate_1[column_4_list[loop]].top(z=5))
                p50m.return_tip() if DRYRUN == True else p50m.drop_tip()
            #===============================================

            protocol.comment('--> ADDING CleanupBead (0.8x)')
            CleanupBeadVol = 32.5
            CleanupBeadMixRPM = 1600
            CleanupBeadMixTime = 5*60 if DRYRUN == False else 0.1*60
            CleanupBeadPremix = 3 if DRYRUN == False else 1
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            for loop, X in enumerate(column_4_list):
                p1000m_auto_pick_up_tip()
                p1000m.mix(CleanupBeadPremix,CleanupBeadVol+3, CleanupBead.bottom(z=1))
                p1000m.aspirate(CleanupBeadVol+3, CleanupBead.bottom(z=1))
                p1000m.dispense(3, CleanupBead.bottom(z=1))
                p1000m.default_speed = 100
                p1000m.move_to(CleanupBead.top(z=-3))
                p1000m.touch_tip(speed=100)
                p1000m.dispense(CleanupBeadVol, cleanup_plate_1[X].bottom(z=0.5))   
                if TIP_MIX == True:
                    CleanupBeadMix = 20 if DRYRUN == False else 1
                if TIP_MIX == False:
                    CleanupBeadMix = 3 if DRYRUN == False else 1
                for Mix in range(CleanupBeadMix):
                    p1000m.aspirate(50)
                    p1000m.move_to(cleanup_plate_1[X].bottom(z=0.5))
                    p1000m.aspirate(20)
                    p1000m.dispense(20)
                    p1000m.move_to(cleanup_plate_1[X].bottom(z=3))
                    p1000m.dispense(50)
                p1000m.move_to(cleanup_plate_1[X].top(z=-3))
                protocol.delay(seconds=1)
                p1000m.blow_out(cleanup_plate_1[X].top(z=-3))
                p1000m.touch_tip(speed=100)
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.move_to(cleanup_plate_1[X].top(z=0))
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
            #===============================================
            if TIP_MIX == False:
                heatershaker.set_and_wait_for_shake_speed(rpm=CleanupBeadMixRPM)
                protocol.delay(CleanupBeadMixTime)
                heatershaker.deactivate_shaker()

        #============================================================================================
        # MOVING: cleanup_plate_1 = D1 / heatershaker --> mag_block
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=cleanup_plate_1,new_location=mag_block,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=cleanup_plate_1,new_location=mag_block,use_gripper=USE_GRIPPER)
        #============================================================================================
        
        if DRYRUN == False:
            protocol.delay(minutes=4)

        # Current Volume = 82.5 in cleanup_plate_1

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 100
        ActualRemoveSup = 90
        p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_4_list):
            p1000m_auto_pick_up_tip()
            p1000m.move_to(cleanup_plate_1[X].bottom(z=0.5))
            p1000m.aspirate(RemoveSup)
            p1000m.default_speed = 200
            p1000m.move_to(cleanup_plate_1[X].top(z=-2))
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul to '+str(WASTEVOL))
            if WASTEVOL <14400:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400 and WASTEVOL <28800:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=28800 and WASTEVOL <43200:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=43200:
                Liquid_trash = Liquid_trash_well_4
            #================================ 
            p1000m.dispense(RemoveSup, Liquid_trash.top(z=-3))
            protocol.delay(seconds=1)
            p1000m.blow_out()
            p1000m.touch_tip(speed=100)
            p1000m.move_to(Liquid_trash.top(z=-5))
            p1000m.move_to(Liquid_trash.top(z=0))
            p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
        #===============================================

        if MULTIDISPENSE == False: # Using new tips per sample column 
            protocol.comment('--> ETOH Wash 1')
            ETOHMaxVol = 150
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            for loop, X in enumerate(column_4_list):
                p1000m_auto_pick_up_tip()
                p1000m.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_2_list[loop]].bottom(z=1))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_2_list[loop]].top(z=0))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_2_list[loop]].top(z=-5))
                p1000m.touch_tip(speed=100)
                # Tip in the well, above sample
                p1000m.move_to(cleanup_plate_1[X].bottom(z=20))
                p1000m.dispense(ETOHMaxVol)
                protocol.delay(seconds=5)
                p1000m.blow_out()
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.move_to(cleanup_plate_1[X].top(z=0))
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
            #===============================================

        if MULTIDISPENSE == True: # Using 1 set of tips and dispensing ETOH from the top 
            protocol.comment('--> ETOH Wash 1 - Multi')
            ETOHMaxVol = 150
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.75
            #===============================================
            p1000m_auto_pick_up_tip()
            for loop, X in enumerate(column_4_list):
                p1000m.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_2_list[loop]].bottom(z=1))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_2_list[loop]].top(z=0))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_2_list[loop]].top(z=-5))
                p1000m.touch_tip(speed=100)
                # Tip above the well
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.75
                p1000m.dispense(ETOHMaxVol)
                protocol.delay(seconds=5)
                p1000m.blow_out()
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.move_to(cleanup_plate_1[X].top(z=0))
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
            p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
            #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)

        protocol.comment('--> Remove ETOH Wash 1')
        RemoveSup = 180
        ActualRemoveSup = 150
        p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_4_list):
            p1000m_auto_pick_up_tip()
            p1000m.move_to(cleanup_plate_1[X].bottom(z=3))
            p1000m.aspirate(RemoveSup-100)
            protocol.delay(seconds=3)
            p1000m.move_to(cleanup_plate_1[X].bottom(z=0.75))
            p1000m.aspirate(100)
            p1000m.default_speed = 100
            p1000m.move_to(cleanup_plate_1[X].top(z=-2))
            p1000m.default_speed = 200
            p1000m.touch_tip(speed=100)
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul to '+str(WASTEVOL))
            if WASTEVOL <14400:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400 and WASTEVOL <28800:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=28800 and WASTEVOL <43200:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=43200:
                Liquid_trash = Liquid_trash_well_4
            #================================ 
            p1000m.dispense(RemoveSup, Liquid_trash.top(z=-3))
            protocol.delay(seconds=2)
            p1000m.blow_out()
            p1000m.touch_tip(speed=100)
            p1000m.move_to(Liquid_trash.top(z=-5))
            p1000m.move_to(Liquid_trash.top(z=0))
            p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
        #===============================================

        if MULTIDISPENSE == False: # Using new tips per sample column 
            protocol.comment('--> ETOH Wash 2')
            ETOHMaxVol = 150
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            for loop, X in enumerate(column_4_list):
                p1000m_auto_pick_up_tip()
                p1000m.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_2_list[loop]].bottom(z=1))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_2_list[loop]].top(z=0))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_2_list[loop]].top(z=-5))
                p1000m.touch_tip(speed=100)
                # Tip in the well, above sample
                p1000m.move_to(cleanup_plate_1[X].bottom(z=20))
                p1000m.dispense(ETOHMaxVol)
                protocol.delay(seconds=5)
                p1000m.blow_out()
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.move_to(cleanup_plate_1[X].top(z=0))
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
            #===============================================

        if MULTIDISPENSE == True: # Using 1 set of tips and dispensing ETOH from the top 
            protocol.comment('--> ETOH Wash 2 - Multi')
            ETOHMaxVol = 150
            p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.75
            #===============================================
            p1000m_auto_pick_up_tip()
            for loop, X in enumerate(column_4_list):
                p1000m.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_2_list[loop]].bottom(z=1))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_2_list[loop]].top(z=0))
                p1000m.move_to(reservoir.wells_by_name()[ETOH_2_list[loop]].top(z=-5))
                p1000m.touch_tip(speed=100)
                # Tip above the well
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.75
                p1000m.dispense(ETOHMaxVol)
                protocol.delay(seconds=5)
                p1000m.blow_out()
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
                p1000m.move_to(cleanup_plate_1[X].top(z=0))
                p1000m.move_to(cleanup_plate_1[X].top(z=5))
            p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
            #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)

        protocol.comment('--> Remove ETOH Wash 2')
        RemoveSup = 180
        ActualRemoveSup = 150
        p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_4_list):
            p1000m_auto_pick_up_tip()
            p1000m.move_to(cleanup_plate_1[X].bottom(z=3))
            p1000m.aspirate(RemoveSup-100)
            protocol.delay(seconds=3)
            p1000m.move_to(cleanup_plate_1[X].bottom(z=0.75))
            p1000m.aspirate(100)
            p1000m.default_speed = 100
            p1000m.move_to(cleanup_plate_1[X].top(z=-2))
            p1000m.default_speed = 200
            p1000m.touch_tip(speed=100)
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul to '+str(WASTEVOL))
            if WASTEVOL <14400:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400 and WASTEVOL <28800:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=28800 and WASTEVOL <43200:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=43200:
                Liquid_trash = Liquid_trash_well_4
            #================================ 
            p1000m.dispense(RemoveSup, Liquid_trash.top(z=-3))
            protocol.delay(seconds=2)
            p1000m.blow_out()
            p1000m.touch_tip(speed=100)
            p1000m.move_to(Liquid_trash.top(z=-5))
            p1000m.move_to(Liquid_trash.top(z=0))
            p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=1)

        protocol.comment('--> Removing Residual Wash')
        ActualRemoveSup = 20
        p1000m.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000m.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000m.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_4_list):
            p1000m_auto_pick_up_tip()
            p1000m.move_to(cleanup_plate_1[X].bottom(z=1))
            p1000m.aspirate(50)
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul to '+str(WASTEVOL))
            if WASTEVOL <14400:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400 and WASTEVOL <28800:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=28800 and WASTEVOL <43200:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=43200:
                Liquid_trash = Liquid_trash_well_4
            #================================ 
            p1000m.dispense(50, Liquid_trash)
            p1000m.move_to(Liquid_trash.top(z=5))
            protocol.delay(minutes=0.1)
            p1000m.blow_out(Liquid_trash.top(z=-3))
            p1000m.move_to(Liquid_trash.top(z=5))
            p1000m.move_to(Liquid_trash.top(z=0))
            p1000m.move_to(Liquid_trash.top(z=5))
            p1000m.return_tip() if DRYRUN == True else p1000m.drop_tip()
        #===============================================
        
        if DRYRUN == False:
            protocol.delay(minutes=0.5)

        #============================================================================================
        # MOVING: cleanup_plate_1 =  mag_block --> D1 / heatershaker
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=cleanup_plate_1,new_location=heatershaker, use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=cleanup_plate_1,new_location='D1', use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> Adding RSB')
        RSBVol = 21        
        RSBMixRPM = 2000
        RSBMixTime = 5*60 if DRYRUN == False else 0.1*60
        p50m.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50m.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50m.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_4_list):
            p50m_auto_pick_up_tip()
            p50m.aspirate(RSBVol, RSB.bottom(z=1))
            p50m.dispense(RSBVol,cleanup_plate_1.wells_by_name()[X].bottom(z=1))
            if TIP_MIX == True:
                RSBMix = 20 if DRYRUN == False else 1
            if TIP_MIX == False:
                RSBMix = 5 if DRYRUN == False else 1
            for Mix in range(RSBMix):
                p50m.aspirate(RSBVol, cleanup_plate_1.wells_by_name()[X].bottom(z=1))
                p50m.dispense(RSBVol, cleanup_plate_1.wells_by_name()[X].bottom(z=1))
            p50m.blow_out(cleanup_plate_1.wells_by_name()[X].top(z=-3))
            p50m.return_tip() if DRYRUN == True else p50m.drop_tip()
        #===============================================
        if ONDECK_HEATERSHAKER == True:
            heatershaker.set_and_wait_for_shake_speed(rpm=RSBMixRPM)
            protocol.delay(RSBMixTime)
            heatershaker.deactivate_shaker()

        #============================================================================================
        # MOVING: cleanup_plate_1 = D1 / heatershaker --> mag_block
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=cleanup_plate_1,new_location=mag_block,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=cleanup_plate_1,new_location=mag_block,use_gripper=USE_GRIPPER)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=3)

        #============================================================================================
        # MOVING: sample_plate_2 = thermocycler --> TRASH
        protocol.move_labware(labware=sample_plate_2,new_location=TRASH,use_gripper=USE_GRIPPER)
        # MOVING: sample_plate_3 = C4 --> thermocycler
        protocol.move_labware(labware=sample_plate_3,new_location=thermocycler,use_gripper=USE_GRIPPER)
        #============================================================================================

        # Current Volume = 21 in cleanup_plate_1

        protocol.comment('--> Transferring Supernatant')
        TransferSup = 20
        p50m.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50m.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50m.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_4_list):
            p50m_auto_pick_up_tip()
            p50m.move_to(cleanup_plate_1[X].bottom(z=0.5))
            p50m.aspirate(TransferSup/2)
            protocol.delay(seconds=1)
            p50m.move_to(cleanup_plate_1[X].bottom(z=0.5))
            p50m.aspirate(TransferSup/2)
            p50m.dispense(TransferSup, sample_plate_3[column_5_list[loop]].bottom(z=0.5))
            p50m.return_tip() if DRYRUN == True else p50m.drop_tip()
        #===============================================

    # =================================================================================================
    # ========================================== PROTOCOL END =========================================
    # =================================================================================================
    if DEACTIVATE_TEMP == True:
        if ONDECK_THERMO == True: thermocycler.deactivate_block()
        if ONDECK_THERMO == True: thermocycler.deactivate_lid()
        if ONDECK_TEMP == True: temp_block.deactivate()
    if ONDECK_HEATERSHAKER == True: heatershaker.open_labware_latch()
    # =================================================================================================
    # ========================================== PROTOCOL END =========================================
    # =================================================================================================
    
    protocol.comment('==============================================')
    protocol.comment('--> LIQUID LABELING')
    protocol.comment('==============================================')
    # This is a section that is used to define liquids, and label wells, this is optional, and unconnected from the rest of the protocol, used only for the App and Website
    # This is at the end because it adds lines of code to the runtime that can be at the end rather than the beginning, since it has no effect on the protocol steps.
    
    if LABEL == True:
       # PROTOCOL SETUP - LABELING

        # ====== CALCULATING LIQUIDS ======
        Sample_Volume = 19.8
        CleanupBead_Volume = COLUMNS*(80.5)
        ETOH_Volume = COLUMNS*(600)
        RSB_Volume = COLUMNS*(52)
        PCR_Volume = COLUMNS*(25)
        FRERAT_Volume = COLUMNS*(10.5)
        LIG_Volume = COLUMNS*(25)

        TotalColumn = ['A','B','C','D','E','F','G','H']

        # ======== DEFINING LIQUIDS =======
        CleanupBead = protocol.define_liquid(name="EtOH", description="CleanupBead Beads", display_color="#704848")                             #704848 = 'CleanupBead Brown'
        EtOH = protocol.define_liquid(name="EtOH", description="80% Ethanol", display_color="#9ACECB")                                          #9ACECB = 'Ethanol Blue'
        RSB = protocol.define_liquid(name="RSB", description="Resuspension Buffer", display_color="#00FFF2")                                    #00FFF2 = 'Base Light Blue'
        Liquid_trash_well = protocol.define_liquid(name="Liquid_trash_well", description="Liquid Trash", display_color="#9B9B9B")               #9B9B9B = 'Liquid Trash Grey'
        Sample = protocol.define_liquid(name="Sample", description="Sample", display_color="#52AAFF")                                           #52AAFF = 'Sample Blue'
        Placeholder_Sample = protocol.define_liquid(name="Placeholder_Sample", description="Excess Sample", display_color="#82A9CF")            #82A9CF = 'Placeholder Sample Blue'
        PCR = protocol.define_liquid(name="PCR", description="PCR Mix", display_color="#FF0000")                                                #FF0000 = 'Base Red'
        FRERAT = protocol.define_liquid(name="FRERAT", description="Frag Enzyme", display_color="#FFA000")                                      #FFA000 = 'Base Orange'
        LIG = protocol.define_liquid(name="LIG", description="Ligation Mix", display_color="#0EFF00")                                           #0EFF00 = 'Base Green'
        UnivPrimer = protocol.define_liquid(name="UnivPrimer", description="UnivPrimer", display_color="#0EFF00")                               #0EFF00 = 'Base Green'
        Adapter = protocol.define_liquid(name="Adapter", description="Adapter", display_color="#0EFF00")                                        #0EFF00 = 'Base Green'
        FullLengthAdapter = protocol.define_liquid(name="FullLengthAdapter", description="FullLengthAdapter", display_color="#7DFFC4")          #7DFFC4 = 'Barcode Green'
        IndexPrimers = protocol.define_liquid(name="IndexPrimers", description="IndexPrimers", display_color="#7DFFC4")                         #7DFFC4 = 'Barcode Green'
        H20 = protocol.define_liquid(name="H20", description="H20", display_color="#AABFBF")                                                    #AABFBF = 'H20'
        Final_Sample = protocol.define_liquid(name="Final_Sample", description="Final Sample", display_color="#82A9CF")                         #82A9CF = 'Placeholder Blue'

        # ======== LOADING LIQUIDS =======
        for loop, X in enumerate(TotalColumn):
            reservoir.wells_by_name()[X+'1'].load_liquid(liquid=CleanupBead, volume=CleanupBead_Volume)
            reservoir.wells_by_name()[X+'2'].load_liquid(liquid=RSB, volume=RSB_Volume)
            reservoir.wells_by_name()[X+'4'].load_liquid(liquid=EtOH, volume=(ETOH_Volume/2))
            reservoir.wells_by_name()[X+'5'].load_liquid(liquid=EtOH, volume=(ETOH_Volume/2))
            reservoir.wells_by_name()[X+'9'].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()[X+'10'].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()[X+'11'].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()[X+'12'].load_liquid(liquid=Liquid_trash_well, volume=0)     
        if COLUMNS >= 1:
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'1'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_2.wells_by_name()[X+'1'].load_liquid(liquid=Placeholder_Sample, volume=0)
                sample_plate_3.wells_by_name()[X+'1'].load_liquid(liquid=Final_Sample, volume=0)
                if ADAPTERTYPE == 'UNI':
                    barcode_plate.wells_by_name()[X+BarcodeColumn_1].load_liquid(liquid=FullLengthAdapter, volume=5)
                if ADAPTERTYPE == 'Stubby':
                    barcode_plate.wells_by_name()[X+BarcodeColumn_1].load_liquid(liquid=IndexPrimers, volume=5)
                cleanup_plate_1.wells_by_name()[X+'1'].load_liquid(liquid=Placeholder_Sample, volume=0)
                cleanup_plate_1.wells_by_name()[X+'7'].load_liquid(liquid=Placeholder_Sample, volume=0)
        if COLUMNS >= 2:
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'2'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_2.wells_by_name()[X+'2'].load_liquid(liquid=Placeholder_Sample, volume=0)
                sample_plate_3.wells_by_name()[X+'2'].load_liquid(liquid=Final_Sample, volume=0)
                if ADAPTERTYPE == 'UNI':
                    barcode_plate.wells_by_name()[X+BarcodeColumn_2].load_liquid(liquid=FullLengthAdapter, volume=5)
                if ADAPTERTYPE == 'Stubby':
                    barcode_plate.wells_by_name()[X+BarcodeColumn_2].load_liquid(liquid=IndexPrimers, volume=5)
                cleanup_plate_1.wells_by_name()[X+'2'].load_liquid(liquid=Placeholder_Sample, volume=0)
                cleanup_plate_1.wells_by_name()[X+'8'].load_liquid(liquid=Placeholder_Sample, volume=0)
        if COLUMNS >= 3:    
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'3'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_2.wells_by_name()[X+'3'].load_liquid(liquid=Placeholder_Sample, volume=0)
                sample_plate_3.wells_by_name()[X+'3'].load_liquid(liquid=Final_Sample, volume=0)
                if COLUMNS >4:
                    sample_plate_1.wells_by_name()[X+'9'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_2.wells_by_name()[X+'3'].load_liquid(liquid=Final_Sample, volume=0)
                if ADAPTERTYPE == 'UNI':
                    barcode_plate.wells_by_name()[X+BarcodeColumn_3].load_liquid(liquid=FullLengthAdapter, volume=5)
                if ADAPTERTYPE == 'Stubby':
                    barcode_plate.wells_by_name()[X+BarcodeColumn_3].load_liquid(liquid=IndexPrimers, volume=5)
                cleanup_plate_1.wells_by_name()[X+'3'].load_liquid(liquid=Placeholder_Sample, volume=0)
                cleanup_plate_1.wells_by_name()[X+'9'].load_liquid(liquid=Placeholder_Sample, volume=0)
        if COLUMNS >= 4:    
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'4'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_2.wells_by_name()[X+'4'].load_liquid(liquid=Placeholder_Sample, volume=0)
                sample_plate_3.wells_by_name()[X+'4'].load_liquid(liquid=Final_Sample, volume=0)
                if COLUMNS >4:
                    sample_plate_1.wells_by_name()[X+'10'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_2.wells_by_name()[X+'4'].load_liquid(liquid=Final_Sample, volume=0)
                if ADAPTERTYPE == 'UNI':
                    barcode_plate.wells_by_name()[X+BarcodeColumn_4].load_liquid(liquid=FullLengthAdapter, volume=5)
                if ADAPTERTYPE == 'Stubby':
                    barcode_plate.wells_by_name()[X+BarcodeColumn_4].load_liquid(liquid=IndexPrimers, volume=5)
                cleanup_plate_1.wells_by_name()[X+'4'].load_liquid(liquid=Placeholder_Sample, volume=0)
                cleanup_plate_1.wells_by_name()[X+'10'].load_liquid(liquid=Placeholder_Sample, volume=0)
        if COLUMNS >= 5:    
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_2.wells_by_name()[X+'5'].load_liquid(liquid=Placeholder_Sample, volume=0)
                sample_plate_3.wells_by_name()[X+'5'].load_liquid(liquid=Final_Sample, volume=0)
                if ADAPTERTYPE == 'UNI':
                    barcode_plate.wells_by_name()[X+BarcodeColumn_5].load_liquid(liquid=FullLengthAdapter, volume=5)
                if ADAPTERTYPE == 'Stubby':
                    barcode_plate.wells_by_name()[X+BarcodeColumn_5].load_liquid(liquid=IndexPrimers, volume=5)
                cleanup_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=Placeholder_Sample, volume=0)
                cleanup_plate_1.wells_by_name()[X+'11'].load_liquid(liquid=Placeholder_Sample, volume=0)
        if COLUMNS == 6:    
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'6'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_2.wells_by_name()[X+'6'].load_liquid(liquid=Placeholder_Sample, volume=0)
                sample_plate_3.wells_by_name()[X+'6'].load_liquid(liquid=Final_Sample, volume=0)
                if ADAPTERTYPE == 'UNI':
                    barcode_plate.wells_by_name()[X+BarcodeColumn_6].load_liquid(liquid=FullLengthAdapter, volume=5)
                if ADAPTERTYPE == 'Stubby':
                    barcode_plate.wells_by_name()[X+BarcodeColumn_6].load_liquid(liquid=IndexPrimers, volume=5)
                cleanup_plate_1.wells_by_name()[X+'6'].load_liquid(liquid=Placeholder_Sample, volume=0)
                cleanup_plate_1.wells_by_name()[X+'12'].load_liquid(liquid=Placeholder_Sample, volume=0)
        for loop, X in enumerate(TotalColumn):
            reagent_plate_1.wells_by_name()[X+'1'].load_liquid(liquid=FRERAT, volume=FRERAT_Volume)
            reagent_plate_1.wells_by_name()[X+'2'].load_liquid(liquid=LIG, volume=LIG_Volume)
            if ADAPTERTYPE == 'UNI':
                reagent_plate_1.wells_by_name()[X+'3'].load_liquid(liquid=UnivPrimer, volume=5)
            if ADAPTERTYPE == 'Stubby':
                reagent_plate_1.wells_by_name()[X+'4'].load_liquid(liquid=Adapter, volume=5)
            reagent_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=PCR, volume=PCR_Volume)
