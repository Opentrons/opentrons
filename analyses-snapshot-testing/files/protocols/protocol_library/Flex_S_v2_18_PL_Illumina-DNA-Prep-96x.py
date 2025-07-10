from opentrons import protocol_api
from opentrons import types
import math

metadata = {'protocolName': 'Illumina DNA Prep 96x v8','author': 'Opentrons <protocols@opentrons.com>','source': 'Protocol Library',}
requirements = {"robotType": "Flex","apiLevel": "2.18",}

def add_parameters(parameters):
    # ======================== RUNTIME PARAMETERS ========================
    parameters.add_bool(
        display_name="Dry Run",
        variable_name="DRYRUN",
        default=False,
        description="Whether to perform a dry run or not.")
    parameters.add_int(
        display_name="PCR Cycles",
        variable_name="PCRCYCLES",
        default=4,minimum=1,maximum=12,
        description="How many PCR Cycles to for amplification.")

def run(protocol: protocol_api.ProtocolContext):
    # ======================== DOWNLOADED PARAMETERS ========================
    global USE_GRIPPER              # T/F Whether or not Using the Gripper
    global STP_50_TIPS              # T/F Whether or not there are p50 Single Tip Pickups
    global STP_200_TIPS             # T/F Whether or not there are p200 Single Tip Pickups 
    global REUSE_ANY_50_TIPS        # T/F Whether or not Reusing any p50
    global REUSE_ANY_200_TIPS       # T/F Whether or not Reusing any p200
    global TIP_TRASH                # T/F whether or not the Tips are Returned
    global COLUMNS                  # Number of Columns of Samples
    global PLATE_STACKED            # Number of Plates Stacked in Stacked Position
    global p50_TIPS                 # Number of p50 tips currently available
    global p200_TIPS                # Number of p200 tips currently available
    global p50_RACK_COUNT           # Number of current total p50 racks
    global p200_RACK_COUNT          # Number of current total p200 racks
    global tiprack_200_STP          # Tiprack for p200 Single Tip Pickup
    global tiprack_200_STR          # Tiprack for p200 Single Tip Return
    global tiprack_50_STP           # Tiprack for p50 Single Tip Pickup
    global tiprack_50_STR           # Tiprack for p50 Single Tip Return
    global tiprack_50_R             # Tiprack for p50 Reuse
    global tiprack_200_R1           # Tiprack for p200 Reuse #1
    global tiprack_200_R2           # Tiprack for p200 Reuse #2
    global WASTEVOL                 # Number - Total volume of Discarded Liquid Waste
    global ETOHVOL                  # Number - Total volume of Available EtOH

    DRYRUN              = protocol.params.DRYRUN
    PCRCYCLES           = protocol.params.PCRCYCLES

    # =================================================================================================
    # ====================================== ADVANCED PARAMETERS ======================================
    # =================================================================================================
    #-------PROTOCOL STEP-------
    STEP_TAG            = True      # Default True    | True = Performs Tagmentation step, False = Skips
    STEP_WASH           = True      # Default True    | True = Performs Tagmentation Washes through EPM Resuspension, False = Skips
    STEP_PCRDECK        = True      # Default True    | True = Performs Thermocycling step, False = Skips
    STEP_CLEANUP        = True      # Default True    | True = Performs Bead cleanup step, False = Skips
    #---------------------------
    # This notifies the user that for 5-6 columns (from more than 32 samples up to 48 samples) it requires Tip reusing in order to remain walkaway.
    # This setting will override any Runtime parameter, and also pauses to notify the user.  So if the user enters 6 columns with Single Tip Use, it will pause and warn that it has to change to Reusing tips in order to remain walkaway.
    # Note that if omitting steps (i.e. skipping the last cleanup step) it is possible to do single use tips, but may vary on case by case basis.
    # Note that it is also possible to use advanced settings to include pauses that requires user intervention to replenish tipracks, making allowing a run of single Use Tips.
    TIP_SETTING         = 'Reusing Tips'
    COLUMNS             = 12

    TIP_TRASH           = True      # Default True    | True = Used tips go in Trash, False = Used tips go back into rack
    DEACTIVATE_TEMP     = True      # Default True    | True = Temp and / or Thermocycler deactivate at end of run, False = remain on, such as leaving at 4 degrees 
    TRASH_POSITION      = 'CHUTE'   # Default 'CHUTE' | 'BIN' or 'CHUTE'
    TIP_MIX             = False     # Default False   | Use Tip Mixing instead of Heatershaker
    ONDECK_THERMO       = True      # Default True    | On Deck Thermocycler
    ONDECK_HEATERSHAKER = True      # Default True    | True = On Deck Heater Shaker, False = No heatershaker and increased tip mixing reps.
    ONDECK_TEMP         = True      # Default True    | True = On Deck Temperature module, False = No Temperature Module
    USE_GRIPPER         = True      # Default True    | True = Uses the FLEX Gripper, False = No Gripper Movement, protocol pauses and requires manual intervention.
    HOTSWAP             = True      # Default False   | True = Allows replenishing tipracks on the off deck positions so the protocol can continue, False = Won't, protocol will most likely have out of tip error message.
    HOTSWAP_PAUSE       = True      # Default False   | True = Protocol pauses for replenishing the offdeck tip racks or to continue, False = Protocol won't cause, user must add tipracks at their discretion.
    SWAPOFFDECK         = False     # Default False   | True = Protocol will use an empty deck position as a temprorary place to swap new and used tip racks between on and off deck, instead of discarding in the chute, False = won't, and used tipracks will go into the chute.  Use True if there is deck space to spare and when doing troubleshooting so tips aren't being discarded with the tip racks.
    CUSTOM_OFFSETS      = False     # Default False   | True = use per instrument specific offsets, False = Don't use any offsets.  This is for per instrument, per module gripper alignment adjustments that need fine tuning without gripper recalibration.
    RES_TYPE_96x        = False     # Default False   | True = use a 96x2ml deepwell for the Reagent Reservoir to keep tips compartmentalized, False = 12x15ml Reservoir.
    WASH_AirMultiDis    = False     # Default False   | When adding WASH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
    ETOH_1_AirMultiDis  = False     # Default False   | When adding EtOH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
    COLUMN_SET_BATCH    = False     # Default False   | Whether or not remove supernatant and add RSB in batches, to prevent uneven drying in high sample count runs
    REUSE_50_TIPS_RSB   = False     # Default False   | Reusing p50 tips
    REUSE_200_TIPS_WASH = False     # Default False   | Reusing p200 tips
    REUSE_200_TIPS_ETOH = False     # Default False   | Reusing p200 tips
    NOLABEL             = True      # Default False   | True = Do no include Liquid Labeling, False = Liquid Labeling is included, adds additional lines to Protocol Step Preview at end of protocol.
    REPORT              = False     # Default False   | True = Include Extra Comments in the Protocol Step Preview for troubleshooting, False = Do Not Include

    # ============================== SETTINGS ===============================
    if COLUMNS == 12: 
        BATCHREP              = 3         # Do Final Cleanup in 3 batches of columns
    if TRASH_POSITION == 'CHUTE': 
        SWAPOFFDECK         = False     # Setting to Swap empty Tipracks to empty positions instead of dumping them
    if DRYRUN == True: 
        TIP_TRASH           = False      # True = Used tips go in Trash, False = Used tips go back into rack
        DEACTIVATE_TEMP     = True      # Whether or not to deactivate the heating and cooling modules after a run
        REPORT              = True      # Whether or not to include Extra Comments for Debugging
    if TIP_SETTING == 'Reusing Tips':
        RES_TYPE_96x        = True      # Type of Reservoir, if reusing tips or omitting rows, set True to use a 96x2ml deepwell
        WASH_AirMultiDis    = True      # When adding WASH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
        ETOH_1_AirMultiDis  = True      # When adding EtOH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
        REUSE_50_TIPS_RSB   = True      # Reusing p50 tips
        REUSE_200_TIPS_WASH = True      # Reusing p200 tips
        REUSE_200_TIPS_ETOH = True      # Reusing p200 tips
    if TIP_SETTING == 'Single Tip Use':
        RES_TYPE_96x        = True     # Type of Reservoir, if reusing tips or omitting rows, set True to use a 96x2ml deepwell
        WASH_AirMultiDis    = False     # When adding WASH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
        ETOH_1_AirMultiDis  = False     # When adding EtOH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
        REUSE_50_TIPS_RSB   = False     # Reusing p50 tips
        REUSE_200_TIPS_WASH = False     # Reusing p200 tips
        REUSE_200_TIPS_ETOH = False     # Reusing p200 tips

    # ======================== BACKGROUND PARAMETERS ========================
    p50_TIPS            = 0         # Number of p50 tips currently available
    p200_TIPS           = 0         # Number of p50 tips currently available
    RESETCOUNT          = 0         # Number of times the protocol was paused to reset tips
    p50_RACK_COUNT      = 0         # Number of current total p50 racks
    p200_RACK_COUNT     = 0         # Number of current total p200 racks
    WASTEVOL            = 0         # Number - Total volume of Discarded Liquid Waste
    ETOHVOL             = 0         # Number - Total volume of Available EtOH
    PLATE_STACKED       = 0         # Number of Plates Stacked in Stacked Position
    REUSE_50_TIPS_COUNT = 0
    REUSE_ANY_50_TIPS = False
    if REUSE_50_TIPS_RSB == True:
        REUSE_ANY_50_TIPS = True
        REUSE_50_TIPS_COUNT+= COLUMNS
    REUSE_200_TIPS_COUNT = 0
    REUSE_ANY_200_TIPS = False
    if REUSE_200_TIPS_WASH == True:
        REUSE_ANY_200_TIPS = True
        REUSE_200_TIPS_COUNT+=COLUMNS
    if REUSE_200_TIPS_ETOH == True:
        REUSE_ANY_200_TIPS = True
        REUSE_200_TIPS_COUNT+=COLUMNS

    # ================================ LISTS ================================
    p50_RACKS_PIPET         = []    # Pipette List
    p200_RACKS_PIPET        = []    # Pipette List
    AVAILABLE_POS_ONDECK    = []    # List of Available Positions ON DECK
    AVAILABLE_POS_OFFDECK   = []    # List of Available Positions OFF DECK
    RACKS_TO_DUMP           = []    # List of Emptied Racks ON DECK
    p50_RACKS_ONDECK        = []    # List of P50 Racks ON DECK
    p50_RACKS_OFFDECK       = []    # List of P50 Racks OFF DECK
    p50_RACKS_DROPPED       = []    # List of P50 Racks DROPPED
    p200_RACKS_ONDECK       = []    # List of P200 Racks ON DECK
    p200_RACKS_OFFDECK      = []    # List of P200 Racks OFF DECK
    p200_RACKS_DROPPED      = []    # List of P200 Racks DROPPED
    SWAPSPOT                = []    # List of Next Available Position for SWAP
    REUSE_50_TIPS           = []    # List of Next Available Position for SWAP
    p50_INITIALTIPS         = []    # List of Next Available Position for SWAP
    REUSE_200_TIPS_1        = []    # List of Next Available Position for SWAP
    REUSE_200_TIPS_2        = []    # List of Next Available Position for SWAP
    p200_INITIALTIPS        = []    # List of Next Available Position for SWAP
    
    # ======================= SIMPLE SETUP ARRANGEMENT ======================
    # This is a condensed, simpler deck layout arrangement based on position.  There are 2 sections, one with all the modules on deck (the NGS Workstation setup) and one without.
    # This uses the DefinePosition function listed earlier, it asks for: tiptype (None, 50 or 200), position ('A1', etc.), and Status ('OPEN' for any tip, or the special uses as below)
    # List all empty positions avaiable.
    # DefinePosition(None,'A2','OPEN')              <-- Basic, open for either tip type
    # DefinePosition(None,'A2','CLOSED')            <-- Tip Location is closed, used just for keeping track for the user
    # DefinePosition(200,'A2','REUSE_200_1TIPS')    <-- Reusable 200 tips
    # DefinePosition(200,'A2','STP_200')            <-- Single Tip Pickup 200 tips
    # DefinePosition(200,'A2','STR_200')            <-- Single Tip Return for 200 tips (testing purposes)
    # Then there is a block of code for whether or not the trash is a CHUTE or BIN, note that with a BIN position A4 is not available.
    
    # ========== FIRST ROW ===========
    if ONDECK_THERMO == True:
        thermocycler = protocol.load_module('thermocycler module gen2')
    else:
        pass
        #DefinePosition(None,'A1','OPEN') / DEV
    tiprack_50_1        = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'A2')
    tiprack_50_2        = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'A3')
    # ========== SECOND ROW ==========
    if ONDECK_THERMO == True:
        pass
    else:
        pass
    tiprack_200_1        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'B2')
    tiprack_200_2        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'B3')
    # ========== THIRD ROW ===========
    if ONDECK_TEMP == True:
        temp_block = protocol.load_module('temperature module gen2', 'C1')
        temp_adapter = temp_block.load_adapter('opentrons_96_well_aluminum_block')
        reagent_plate_1 = temp_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'Reagent Plate')
    else:
        reagent_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'C1', 'Reagent Plate')        
    reservoir = protocol.load_labware('nest_12_reservoir_15ml','C2', 'Reservoir')  if RES_TYPE_96x == False else protocol.load_labware('nest_96_wellplate_2ml_deep','C2')
    if TIP_SETTING == 'Single Tip Use':
        tiprack_200_3        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'C3')
    if TIP_SETTING == 'Reusing Tips':
        tiprack_200_1R        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'C3')
    # ========== FOURTH ROW ==========
    if ONDECK_HEATERSHAKER == True:
        heatershaker = protocol.load_module('heaterShakerModuleV1','D1')
        sample_plate_1 = heatershaker.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'Sample Plate 1')
    else:
        sample_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','D1', 'Sample Plate 1')
    mag_block = protocol.load_module('magneticBlockV1', 'D2')
    CleanupPlate = mag_block.load_labware('nest_96_wellplate_2ml_deep')
    # ============ TRASH =============
    TRASH = protocol.load_waste_chute()
    if TIP_SETTING == 'Single Tip Use':
        tiprack_200_4 = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'A4')
        tiprack_200_5 = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'B4')
        tiprack_200_6 = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'C4')
        tiprack_200_7 = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'D4')
    if TIP_SETTING == 'Reusing Tips':
        tiprack_50_R = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'B4')
        tiprack_200_2R = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'C4')
        tiprack_50_3  = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'D4')

    # =============================== PIPETTE ===============================
    if TIP_SETTING == 'Single Tip Use':
        p200_RACKS_PIPET = [tiprack_200_1,tiprack_200_2,tiprack_200_3]
        p50_RACKS_PIPET = [tiprack_50_1,tiprack_50_2]
    if TIP_SETTING == 'Reusing Tips':
        p200_RACKS_PIPET = [tiprack_200_1,tiprack_200_2]
        p50_RACKS_PIPET = [tiprack_50_1,tiprack_50_2]
    p1000 = protocol.load_instrument('flex_8channel_1000', 'left', tip_racks=p200_RACKS_PIPET)
    p50 = protocol.load_instrument("flex_8channel_50", "right", tip_racks=p50_RACKS_PIPET)
    p1000_flow_rate_aspirate_default = 200
    p1000_flow_rate_dispense_default = 200
    p1000_flow_rate_blow_out_default = 400
    p50_flow_rate_aspirate_default = 50
    p50_flow_rate_dispense_default = 50
    p50_flow_rate_blow_out_default = 100

    # ======= REAGENT PLATE_1 ========
    #TAGMIX              = reagent_plate_1['A1']
    #TAGMIX              = reagent_plate_1['A2']
    #H20                 = reagent_plate_1['A3']
    #H20                 = reagent_plate_1['A4']
    #H20                 = reagent_plate_1['A5']
    #RSB                 = reagent_plate_1['A6']
    #RSB                 = reagent_plate_1['A7']
    #RSB                 = reagent_plate_1['A8']
    #EPM                 = reagent_plate_1['A9']
    #EPM                 = reagent_plate_1['A10']
    #EPM                 = reagent_plate_1['A11']
    #EPM                 = reagent_plate_1['A12']

    # ======= SAMPLE PLATE_2 =========
    #Barcodes_1         = sample_plate_2['A1']
    #Barcodes_2         = sample_plate_2['A2']
    #Barcodes_3         = sample_plate_2['A3']
    #Barcodes_4         = sample_plate_2['A4']
    #Barcodes_5         = sample_plate_2['A5']
    #Barcodes_6         = sample_plate_2['A6']
    #Barcodes_7         = sample_plate_2['A7']
    #Barcodes_8         = sample_plate_2['A8']
    #Barcodes_9         = sample_plate_2['A9']
    #Barcodes_10        = sample_plate_2['A10']
    #Barcodes_11        = sample_plate_2['A11']
    #Barcodes_12        = sample_plate_2['A12']

    # ============================ RESERVOIR ================================
    CleanupBead         = reservoir['A1']
    TAGSTOP             = reservoir['A2'] 
    #TWB                = reservoir['A3']
    #TWB                = reservoir['A4']
    #EtOH               = reservoir['A5']
    #EtOH               = reservoir['A6']
    Liquid_trash_well_6 = reservoir['A7']
    Liquid_trash_well_5 = reservoir['A8']
    Liquid_trash_well_4 = reservoir['A9']
    Liquid_trash_well_3 = reservoir['A10']
    Liquid_trash_well_2 = reservoir['A11']
    Liquid_trash_well_1 = reservoir['A12']

    # ======================= TIP AND SAMPLE TRACKING =======================
    # This is a list of each column to be used in the protocol, as well as any intermediate or final sample positions.
    # column_1_list = [f'A{i}' for i in range(1, COLUMNS + 1)]              <-- This is a Simple list of 'A1' through 'A12', meaning a full plate.
    # Example Protocols can look like this:
    # if COLUMNS == 3: 
    #   column_1_list = ['A1','A2','A3']             <-- Initial 3 columns of Samples
    #   column_2_list = ['A4','A5','A6']             <-- Final 3 columns of Samples

    TAG_list = ['A1','A1','A1','A1','A1','A1','A2','A2','A2','A2','A2','A2']
    H20_list = ['A3','A3','A3','A3','A4','A4','A4','A4','A5','A5','A5','A5']
    RSB_list = ['A6','A6','A6','A6','A7','A7','A7','A7','A8','A8','A8','A8']
    EPM_list = ['A9','A9','A9','A10','A10','A10','A11','A11','A11','A12','A12','A12']
    TWB_list = ['A3','A3','A3','A3','A3','A3','A4','A4','A4','A4','A4','A4']
    ETOH_list = ['A5','A5','A5','A5','A5','A5','A6','A6','A6','A6','A6','A6']
    column_1_list = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] # Sample Plate 1: input and TAG
    column_2_list = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] # Cleanup Plate: WASH
    column_3_list = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] # Sample Plate 2: EPM
    column_4_list = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] # Cleanup Plate: ETOH
    column_5_list = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12'] # Sample Plate 2: Final
    barcodes = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12']

    # ============================ CUSTOM OFFSETS ===========================
    # These are Custom Offsets which are a PER INSTRUMENT Setting, to account for slight adjustments of the gripper calibration or labware.
    if CUSTOM_OFFSETS == True:
        PCRPlate_Z_offset = 0
        Deepwell_Z_offset = 1
        # HEATERSHAKER OFFSETS
        hs_drop_offset={'x':0,'y':-1,'z':0}
        hs_pick_up_offset={'x':0,'y':-1,'z':0}
        # MAG BLOCK OFFSETS
        mb_drop_offset={'x':0,'y':1.,'z':0.5}
        mb_pick_up_offset={'x':0,'y':-2,'z':0}
        # THERMOCYCLER OFFSETS
        tc_drop_offset={'x':0,'y':-1,'z':0}
        tc_pick_up_offset={'x':0,'y':0,'z':0}
        # DECK OFFSETS
        deck_drop_offset={'x':0,'y':0,'z':0}
        deck_pick_up_offset={'x':0,'y':0,'z':0}
    else:
        PCRPlate_Z_offset = 0
        Deepwell_Z_offset = 0
        # HEATERSHAKER OFFSETS
        hs_drop_offset={'x':0,'y':0,'z':0}
        hs_pick_up_offset={'x':0,'y':0,'z':0}
        # MAG BLOCK OFFSETS
        mb_drop_offset={'x':0,'y':0.,'z':0}
        mb_pick_up_offset={'x':0,'y':0,'z':0}
        # THERMOCYCLER OFFSETS
        tc_drop_offset={'x':0,'y':0,'z':0}
        tc_pick_up_offset={'x':0,'y':0,'z':0}
        # DECK OFFSETS
        deck_drop_offset={'x':0,'y':0,'z':0}
        deck_pick_up_offset={'x':0,'y':0,'z':0}

    # =================================================================================================
    # ========================================= PROTOCOL START ========================================
    # =================================================================================================
    if ONDECK_THERMO == True: thermocycler.open_lid()
    if ONDECK_HEATERSHAKER == True: heatershaker.open_labware_latch()
    if DRYRUN == False:
        protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
        if ONDECK_THERMO == True: thermocycler.set_block_temperature(4)
        if ONDECK_THERMO == True: thermocycler.set_lid_temperature(100)    
        if ONDECK_TEMP == True: temp_block.set_temperature(4)
    protocol.pause("Ready")
    if ONDECK_HEATERSHAKER == True: heatershaker.close_labware_latch() 
    Liquid_trash = Liquid_trash_well_1
    # =================================================================================================
    # ========================================= PROTOCOL START ========================================
    # =================================================================================================

    if STEP_TAG == True:
        protocol.comment('==============================================')
        protocol.comment('--> Tagment')
        protocol.comment('==============================================')

        protocol.comment('--> ADDING TAGMIX')
        TagVol = 20
        SampleVol = 50
        TagMixTime = 5*60 if DRYRUN == False else 0.1*60
        TagPremix = 3 if DRYRUN == False else 1
        TagMix = 6 if TIP_MIX == True else 2
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_1_list):
            p1000.pick_up_tip()
            p1000.mix(TagPremix,TagVol+10, reagent_plate_1.wells_by_name()[TAG_list[loop]].bottom(z=PCRPlate_Z_offset+1))
            p1000.aspirate(TagVol+3, reagent_plate_1.wells_by_name()[TAG_list[loop]].bottom(z=PCRPlate_Z_offset+0.5), rate=0.25)
            p1000.dispense(3, reagent_plate_1.wells_by_name()[TAG_list[loop]].bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p1000.dispense(TagVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p1000.mix(TagMix,SampleVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+0.75))
            p1000.move_to(sample_plate_1[X].top(z=-3))
            protocol.delay(minutes=0.1)
            p1000.blow_out(sample_plate_1[X].top(z=-3))
            p1000.move_to(sample_plate_1[X].top(z=5))
            p1000.move_to(sample_plate_1[X].top(z=0))
            p1000.move_to(sample_plate_1[X].top(z=5))
            p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
        #===============================================
        if ONDECK_HEATERSHAKER == True:
            heatershaker.set_and_wait_for_shake_speed(rpm=1600)
            protocol.delay(TagMixTime)
            heatershaker.deactivate_shaker()

        #============================================================================================
        # GRIPPER MOVE sample_plate_1 FROM HEATERSHAKER TO Thermocycler 
        if ONDECK_HEATERSHAKER == True and ONDECK_THERMO == True:        
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_1,new_location=thermocycler,use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=tc_drop_offset)
            heatershaker.close_labware_latch()
        if ONDECK_HEATERSHAKER == True and ONDECK_THERMO == False:        
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_1,new_location='B1',use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=deck_drop_offset)
            heatershaker.close_labware_latch()
        if ONDECK_HEATERSHAKER == False and ONDECK_THERMO == True:        
            protocol.move_labware(labware=sample_plate_1,new_location=thermocycler,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=tc_drop_offset)            
        if ONDECK_HEATERSHAKER == False and ONDECK_THERMO == False:        
            protocol.move_labware(labware=sample_plate_1,new_location='B1',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)            
        #============================================================================================

        ############################################################################################################################################
        if ONDECK_THERMO == True:
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_TAG = [
                    {'temperature': 55, 'hold_time_minutes': 15}
                    ]
                thermocycler.execute_profile(steps=profile_TAG, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
        else:
            protocol.comment('Pausing to run Tagmentation on an off deck Thermocycler ~15min')
        ############################################################################################################################################

        protocol.comment('--> Adding TAGSTOP')
        TAGSTOPVol    = 10
        TAGSTOPMixRep = 10 if DRYRUN == False else 1
        TAGSTOPMixVol = 20
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_1_list):
            p50.pick_up_tip()
            p50.aspirate(TAGSTOPVol+3, TAGSTOP.bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p50.dispense(3, TAGSTOP.bottom(z=PCRPlate_Z_offset+0.5), rate=0.25)
            p50.dispense(TAGSTOPVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p50.move_to(sample_plate_1[X].bottom(z=PCRPlate_Z_offset+0.75))
            p50.mix(TAGSTOPMixRep,TAGSTOPMixVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+0.75))
            p50.blow_out(sample_plate_1[X].top(z=-2))
            p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
        #===============================================

        ############################################################################################################################################
        if ONDECK_THERMO == True:        
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_TAGSTOP = [
                    {'temperature': 37, 'hold_time_minutes': 15}
                    ]
                thermocycler.execute_profile(steps=profile_TAGSTOP, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
        else:
            protocol.comment('Pausing to run Tagmentation Stop on an off deck Thermocycler ~15min')
        ############################################################################################################################################

        protocol.comment('--> Transferring Sample to Deepwell')
        TransferSup = 50
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_1_list):
            if TIP_SETTING == 'Single Tip Use':
                p1000.pick_up_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.pick_up_tip(tiprack_200_1R[X])
            p1000.aspirate(TransferSup, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+0.2), rate=0.25)
            p1000.dispense(TransferSup, CleanupPlate[column_2_list[loop]].bottom(z=Deepwell_Z_offset+1))
            p1000.return_tip()
        #===============================================

        if DRYRUN == False and ONDECK_THERMO == True:
            protocol.comment("SETTING THERMO to Room Temp")
            thermocycler.set_block_temperature(20)
            thermocycler.set_lid_temperature(37)    

        if DRYRUN == False:
            protocol.delay(minutes=4)

    if STEP_WASH == True:
        protocol.comment('==============================================')
        protocol.comment('--> Wash')
        protocol.comment('==============================================')

        if STEP_TAG == False:
            #============================================================================================
            # GRIPPER MOVE CleanupPlate FROM HEATERSHAKER TO MAG PLATE 
            if ONDECK_HEATERSHAKER == True:        
                heatershaker.open_labware_latch()
                protocol.move_labware(labware=CleanupPlate,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=mb_drop_offset)
                heatershaker.close_labware_latch()
            else:
                protocol.move_labware(labware=CleanupPlate,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)            
            #============================================================================================

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        ActualRemoveSup = 60
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_2_list):
            if TIP_SETTING == 'Single Tip Use':
                p1000.pick_up_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.pick_up_tip(tiprack_200_1R[X])
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+3.5))
            p1000.aspirate(RemoveSup-100, rate=0.25)
            protocol.delay(minutes=0.1)
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+0.75))
            p1000.aspirate(100, rate=0.25)
            p1000.move_to(CleanupPlate[X].top(z=-2))
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul tp '+str(WASTEVOL))
            if WASTEVOL <14400*1:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400*1 and WASTEVOL <14400*2:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=14400*2 and WASTEVOL <14400*3:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=14400*3 and WASTEVOL <14400*4:
                Liquid_trash = Liquid_trash_well_4
            if WASTEVOL >=14400*4 and WASTEVOL <14400*5:
                Liquid_trash = Liquid_trash_well_5
            if WASTEVOL >=14400*5:
                Liquid_trash = Liquid_trash_well_6
            #================================ 
            p1000.dispense(200, Liquid_trash.top(z=0))
            protocol.delay(minutes=0.1)
            p1000.blow_out(Liquid_trash.top(z=-3))
            p1000.move_to(Liquid_trash.top(z=5))
            p1000.move_to(Liquid_trash.top(z=0))
            p1000.move_to(Liquid_trash.top(z=5))
            if TIP_SETTING == 'Single Tip Use':
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE CleanupPlate FROM MAG PLATE TO HEATER SHAKER
        if ONDECK_HEATERSHAKER == True:        
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate,new_location=heatershaker,use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=hs_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate,new_location='D1',use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        protocol.comment('--> Wash 1')
        TWBMaxVol = 100
        TWBTime = 3*60 if DRYRUN == False else 0.1*60
        TWBMix = 6 if TIP_MIX == True else 2
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        if WASH_AirMultiDis == True:
            p1000.pick_up_tip()
            for loop, X in enumerate(column_2_list):
                p1000.aspirate(TWBMaxVol+3, reservoir.wells_by_name()[TWB_list[loop]].bottom(z=Deepwell_Z_offset+1), rate=0.25)
                p1000.dispense(3, reservoir.wells_by_name()[TWB_list[loop]].bottom(z=Deepwell_Z_offset+1), rate=0.25)
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(reservoir.wells_by_name()[TWB_list[loop]].top().move(types.Point(x=4,z=-3)))
                p1000.move_to(reservoir.wells_by_name()[TWB_list[loop]].top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================ 
                p1000.move_to(CleanupPlate[X].top(z=5))
                p1000.dispense(TWBMaxVol)
                p1000.move_to(CleanupPlate[X].top(z=1))
                protocol.delay(minutes=0.1)
                p1000.blow_out(CleanupPlate[X].top(z=-3))
                p1000.move_to(CleanupPlate[X].top(z=5))
                p1000.move_to(CleanupPlate[X].top(z=0))
                p1000.move_to(CleanupPlate[X].top(z=5))
            p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
        else:
            if TIP_SETTING == 'Single Tip Use':
                # RACKSWAP 1-A (SINGLE)
                #============================================================================================
                protocol.move_labware(labware=tiprack_200_1,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
                p200_RACKS_PIPET.append(tiprack_200_4)
                protocol.move_labware(labware=tiprack_200_4,new_location='B2',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
                #============================================================================================
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.aspirate(TWBMaxVol+3, reservoir.wells_by_name()[TWB_list[loop]].bottom(z=Deepwell_Z_offset+1), rate=0.25)
                p1000.dispense(3, reservoir.wells_by_name()[TWB_list[loop]].bottom(z=1), rate=0.25)
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(reservoir.wells_by_name()[TWB_list[loop]].top().move(types.Point(x=4,z=-3)))
                p1000.move_to(reservoir.wells_by_name()[TWB_list[loop]].top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================ 
                p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+1))
                p1000.dispense(TWBMaxVol, rate=0.25)
                p1000.mix(TWBMix,90,rate=0.5)
                p1000.move_to(CleanupPlate[X].top(z=1))
                protocol.delay(minutes=0.1)
                p1000.blow_out(CleanupPlate[X].top(z=1))
                p1000.aspirate(20)
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE CleanupPlate FROM HEATER SHAKER TO MAG PLATE
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=mb_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=3)

        protocol.comment('--> Remove Wash')
        TWBMaxVol = 100+10
        ActualRemoveSup = 100
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        if TIP_SETTING == 'Single Tip Use':
            # RACKSWAP 2-A (SINGLE)
            #============================================================================================
            protocol.move_labware(labware=tiprack_200_2,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p200_RACKS_PIPET.append(tiprack_200_5)
            protocol.move_labware(labware=tiprack_200_5,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        for loop, X in enumerate(column_2_list):
            if TIP_SETTING == 'Single Tip Use':
                p1000.pick_up_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.pick_up_tip(tiprack_200_1R[X])
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+3.5))
            p1000.aspirate(TWBMaxVol, rate=0.25)
            p1000.default_speed = 100
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+0.2))
            protocol.delay(minutes=0.1)
            p1000.aspirate(200-TWBMaxVol, rate=0.25)
            p1000.default_speed = 400
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul tp '+str(WASTEVOL))
            if WASTEVOL <14400*1:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400*1 and WASTEVOL <14400*2:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=14400*2 and WASTEVOL <14400*3:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=14400*3 and WASTEVOL <14400*4:
                Liquid_trash = Liquid_trash_well_4
            if WASTEVOL >=14400*4 and WASTEVOL <14400*5:
                Liquid_trash = Liquid_trash_well_5
            if WASTEVOL >=14400*5:
                Liquid_trash = Liquid_trash_well_6
            #================================ 
            p1000.dispense(200, Liquid_trash)
            p1000.move_to(Liquid_trash.top(z=5))
            protocol.delay(minutes=0.1)
            p1000.blow_out(Liquid_trash.top(z=-3))
            p1000.move_to(Liquid_trash.top(z=5))
            p1000.move_to(Liquid_trash.top(z=0))
            p1000.move_to(Liquid_trash.top(z=5))
            if TIP_SETTING == 'Single Tip Use':
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE CleanupPlate FROM MAG PLATE TO HEATER SHAKER
        if ONDECK_HEATERSHAKER == True:        
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate,new_location=heatershaker,use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=hs_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate,new_location='D1',use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        protocol.comment('--> Wash 2')
        TWBMaxVol = 100
        TWBTime = 3*60 if DRYRUN == False else 0.1*60
        TWBMix = 6 if TIP_MIX == True else 2
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        if WASH_AirMultiDis == True:
            p1000.pick_up_tip()
            for loop, X in enumerate(column_2_list):
                p1000.aspirate(TWBMaxVol+3, reservoir.wells_by_name()[TWB_list[loop]].bottom(z=Deepwell_Z_offset+1), rate=0.25)
                p1000.dispense(3, reservoir.wells_by_name()[TWB_list[loop]].bottom(z=Deepwell_Z_offset+1), rate=0.25)
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(reservoir.wells_by_name()[TWB_list[loop]].top().move(types.Point(x=4,z=-3)))
                p1000.move_to(reservoir.wells_by_name()[TWB_list[loop]].top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================ 
                p1000.move_to(CleanupPlate[X].top(z=5))
                p1000.dispense(TWBMaxVol)
                p1000.move_to(CleanupPlate[X].top(z=1))
                protocol.delay(minutes=0.1)
                p1000.blow_out(CleanupPlate[X].top(z=-3))
                p1000.move_to(CleanupPlate[X].top(z=5))
                p1000.move_to(CleanupPlate[X].top(z=0))
                p1000.move_to(CleanupPlate[X].top(z=5))
            p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
        else:
            # RACKSWAP 3-A (SINGLE)
            #============================================================================================
            protocol.move_labware(labware=tiprack_200_3,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p200_RACKS_PIPET.append(tiprack_200_6)
            protocol.move_labware(labware=tiprack_200_6,new_location='C3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.aspirate(TWBMaxVol+3, reservoir.wells_by_name()[TWB_list[loop]].bottom(z=Deepwell_Z_offset+1), rate=0.25)
                p1000.dispense(3, reservoir.wells_by_name()[TWB_list[loop]].bottom(z=1), rate=0.25)
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(reservoir.wells_by_name()[TWB_list[loop]].top().move(types.Point(x=4,z=-3)))
                p1000.move_to(reservoir.wells_by_name()[TWB_list[loop]].top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================ 
                p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+1))
                p1000.dispense(TWBMaxVol, rate=0.25)
                p1000.mix(TWBMix,90,rate=0.5)
                p1000.move_to(CleanupPlate[X].top(z=1))
                protocol.delay(minutes=0.1)
                p1000.blow_out(CleanupPlate[X].top(z=1))
                p1000.aspirate(20)
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE CleanupPlate FROM HEATER SHAKER TO MAG PLATE
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=mb_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=3)

        protocol.comment('--> Remove Wash')
        TWBMaxVol = 100+10
        ActualRemoveSup = 100
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        if TIP_SETTING == 'Single Tip Use':
            # RACKSWAP 4-A (SINGLE)
            #============================================================================================
            protocol.move_labware(labware=tiprack_200_4,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p200_RACKS_PIPET.append(tiprack_200_7)
            protocol.move_labware(labware=tiprack_200_7,new_location='B2',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        for loop, X in enumerate(column_2_list):
            if TIP_SETTING == 'Single Tip Use':
                p1000.pick_up_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.pick_up_tip(tiprack_200_1R[X])
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+3.5))
            p1000.aspirate(TWBMaxVol, rate=0.25)
            p1000.default_speed = 100
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+0.2))
            protocol.delay(minutes=0.1)
            p1000.aspirate(200-TWBMaxVol, rate=0.25)
            p1000.default_speed = 400
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul tp '+str(WASTEVOL))
            if WASTEVOL <14400*1:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400*1 and WASTEVOL <14400*2:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=14400*2 and WASTEVOL <14400*3:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=14400*3 and WASTEVOL <14400*4:
                Liquid_trash = Liquid_trash_well_4
            if WASTEVOL >=14400*4 and WASTEVOL <14400*5:
                Liquid_trash = Liquid_trash_well_5
            if WASTEVOL >=14400*5:
                Liquid_trash = Liquid_trash_well_6
            #================================ 
            p1000.dispense(200, Liquid_trash)
            p1000.move_to(Liquid_trash.top(z=5))
            protocol.delay(minutes=0.1)
            p1000.blow_out(Liquid_trash.top(z=-3))
            p1000.move_to(Liquid_trash.top(z=5))
            p1000.move_to(Liquid_trash.top(z=0))
            p1000.move_to(Liquid_trash.top(z=5))
            if TIP_SETTING == 'Single Tip Use':
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.return_tip()
        #===============================================
    
        #============================================================================================
        # GRIPPER MOVE CleanupPlate FROM MAG PLATE TO HEATER SHAKER
        if ONDECK_HEATERSHAKER == True:        
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate,new_location=heatershaker,use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=hs_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate,new_location='D1',use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        protocol.comment('--> Wash 3')
        TWBMaxVol = 100
        TWBTime = 3*60 if DRYRUN == False else 0.1*60
        TWBMix = 6 if TIP_MIX == True else 2
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        if WASH_AirMultiDis == True:
            p1000.pick_up_tip()
            for loop, X in enumerate(column_2_list):
                p1000.aspirate(TWBMaxVol+3, reservoir.wells_by_name()[TWB_list[loop]].bottom(z=Deepwell_Z_offset+1), rate=0.25)
                p1000.dispense(3, reservoir.wells_by_name()[TWB_list[loop]].bottom(z=Deepwell_Z_offset+1), rate=0.25)
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(reservoir.wells_by_name()[TWB_list[loop]].top().move(types.Point(x=4,z=-3)))
                p1000.move_to(reservoir.wells_by_name()[TWB_list[loop]].top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================ 
                p1000.move_to(CleanupPlate[X].top(z=5))
                p1000.dispense(TWBMaxVol)
                p1000.move_to(CleanupPlate[X].top(z=1))
                protocol.delay(minutes=0.1)
                p1000.blow_out(CleanupPlate[X].top(z=-3))
                p1000.move_to(CleanupPlate[X].top(z=5))
                p1000.move_to(CleanupPlate[X].top(z=0))
                p1000.move_to(CleanupPlate[X].top(z=5))
            p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
        else:
            if TIP_SETTING == 'Single Tip Use':
                if HOTSWAP_PAUSE == True:
                    protocol.pause('Add p200 on B4')
                tiprack_200_8        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'A4')
                tiprack_200_9        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'B4')
                tiprack_200_10       = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'C4')
                tiprack_50_3         = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'D4')
                # RACKSWAP 5-A (SINGLE)
                #============================================================================================
                protocol.move_labware(labware=tiprack_200_5,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
                p200_RACKS_PIPET.append(tiprack_200_8)
                protocol.move_labware(labware=tiprack_200_8,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
                #============================================================================================
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.aspirate(TWBMaxVol+3, reservoir.wells_by_name()[TWB_list[loop]].bottom(z=Deepwell_Z_offset+1), rate=0.25)
                p1000.dispense(3, reservoir.wells_by_name()[TWB_list[loop]].bottom(z=1), rate=0.25)
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(reservoir.wells_by_name()[TWB_list[loop]].top().move(types.Point(x=4,z=-3)))
                p1000.move_to(reservoir.wells_by_name()[TWB_list[loop]].top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================ 
                p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+1))
                p1000.dispense(TWBMaxVol, rate=0.25)
                p1000.mix(TWBMix,90,rate=0.5)
                p1000.move_to(CleanupPlate[X].top(z=1))
                protocol.delay(minutes=0.1)
                p1000.blow_out(CleanupPlate[X].top(z=1))
                p1000.aspirate(20)
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE CleanupPlate FROM HEATER SHAKER TO MAG PLATE
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=mb_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=3)

        protocol.comment('--> Remove Wash')
        TWBMaxVol = 100+10
        ActualRemoveSup = 100
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        if TIP_SETTING == 'Single Tip Use':
            # RACKSWAP 6-A (SINGLE)
            #============================================================================================
            protocol.move_labware(labware=tiprack_200_6,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p200_RACKS_PIPET.append(tiprack_200_9)
            protocol.move_labware(labware=tiprack_200_9,new_location='C3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        for loop, X in enumerate(column_2_list):
            if TIP_SETTING == 'Single Tip Use':
                p1000.pick_up_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.pick_up_tip(tiprack_200_1R[X])
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+3.5))
            p1000.aspirate(TWBMaxVol, rate=0.25)
            p1000.default_speed = 100
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+0.2))
            protocol.delay(minutes=0.1)
            p1000.aspirate(200-TWBMaxVol, rate=0.25)
            p1000.default_speed = 400
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul tp '+str(WASTEVOL))
            if WASTEVOL <14400*1:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400*1 and WASTEVOL <14400*2:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=14400*2 and WASTEVOL <14400*3:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=14400*3 and WASTEVOL <14400*4:
                Liquid_trash = Liquid_trash_well_4
            if WASTEVOL >=14400*4 and WASTEVOL <14400*5:
                Liquid_trash = Liquid_trash_well_5
            if WASTEVOL >=14400*5:
                Liquid_trash = Liquid_trash_well_6
            #================================ 
            p1000.dispense(200, Liquid_trash)
            p1000.move_to(Liquid_trash.top(z=5))
            protocol.delay(minutes=0.1)
            p1000.blow_out(Liquid_trash.top(z=-3))
            p1000.move_to(Liquid_trash.top(z=5))
            p1000.move_to(Liquid_trash.top(z=0))
            p1000.move_to(Liquid_trash.top(z=5))
            if TIP_SETTING == 'Single Tip Use':
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.return_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=1)

        protocol.comment('--> Removing Residual Wash')
        ActualRemoveSup = 20
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        if TIP_SETTING == 'Single Tip Use':
            # RACKSWAP 7-A (SINGLE)
            #============================================================================================
            protocol.move_labware(labware=tiprack_200_7,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p200_RACKS_PIPET.append(tiprack_200_10)
            protocol.move_labware(labware=tiprack_200_10,new_location='B2',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        for loop, X in enumerate(column_2_list):
            if TIP_SETTING == 'Single Tip Use':
                p1000.pick_up_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.pick_up_tip(tiprack_200_1R[X])
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+0.2))
            p1000.aspirate(100, rate=0.25)
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul tp '+str(WASTEVOL))
            if WASTEVOL <14400:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400 and WASTEVOL <28800:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=28800:
                Liquid_trash = Liquid_trash_well_3
            #================================ 
            p1000.dispense(100, Liquid_trash)
            p1000.move_to(Liquid_trash.top(z=5))
            protocol.delay(minutes=0.1)
            p1000.blow_out(Liquid_trash.top(z=-3))
            p1000.move_to(Liquid_trash.top(z=5))
            p1000.move_to(Liquid_trash.top(z=0))
            p1000.move_to(Liquid_trash.top(z=5))
            if TIP_SETTING == 'Single Tip Use':
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.return_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)

        #============================================================================================
        # GRIPPER MOVE CleanupPlate FROM MAG PLATE TO HEATER SHAKER
        if ONDECK_HEATERSHAKER == True:        
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate,new_location=heatershaker,use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=hs_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate,new_location='D1',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
        #============================================================================================

        protocol.comment('--> Adding EPM')
        EPMVol = 40 
        EPMMixTime = 3*60 if DRYRUN == False else 0.1*60
        EPMMixRPM = 2000
        EPMMixVol = 35
        EPMVolCount = 0
        EPMMix = 3 if TIP_MIX == True else 1
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_2_list):
            p50.pick_up_tip()
            p50.aspirate(EPMVol+3, reagent_plate_1.wells_by_name()[EPM_list[loop]].bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p50.dispense(3, reagent_plate_1.wells_by_name()[EPM_list[loop]].bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p50.move_to((CleanupPlate.wells_by_name()[X].center().move(types.Point(x=1.3*0.8,y=0,z=-4))))
            p50.dispense(EPMMixVol, rate=1)
            for Y in range(EPMMix):
                p50.move_to(CleanupPlate.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
                p50.aspirate(EPMMixVol, rate=1)
                p50.move_to((CleanupPlate.wells_by_name()[X].center().move(types.Point(x=0,y=1.3*0.8,z=-4))))
                p50.dispense(EPMMixVol, rate=1)
                p50.move_to(CleanupPlate.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
                p50.aspirate(EPMMixVol, rate=1)
                p50.move_to((CleanupPlate.wells_by_name()[X].center().move(types.Point(x=1.3*-0.8,y=0,z=-4))))
                p50.dispense(EPMMixVol, rate=1)
                p50.move_to(CleanupPlate.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
                p50.aspirate(EPMMixVol, rate=1)
                p50.move_to((CleanupPlate.wells_by_name()[X].center().move(types.Point(x=0,y=1.3*-0.8,z=-4))))
                p50.dispense(EPMMixVol, rate=1)
                p50.move_to(CleanupPlate.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
                p50.aspirate(EPMMixVol, rate=1)
                p50.dispense(EPMMixVol, rate=1)
            p50.blow_out(CleanupPlate.wells_by_name()[X].center())
            p50.move_to(CleanupPlate.wells_by_name()[X].bottom(z=Deepwell_Z_offset+0.3))
            p50.move_to(CleanupPlate.wells_by_name()[X].top(z=5))
            p50.move_to(CleanupPlate.wells_by_name()[X].top(z=0))
            p50.move_to(CleanupPlate.wells_by_name()[X].top(z=5))
            p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
        #===============================================
        if TIP_MIX == False:
            heatershaker.close_labware_latch()
            heatershaker.set_and_wait_for_shake_speed(rpm=EPMMixRPM)
            protocol.delay(EPMMixTime)
            heatershaker.deactivate_shaker()

        #============================================================================================
        # GRIPPER MOVE sample_plate_1 FROM MAG PLATE TO HEATER SHAKER
        if ONDECK_THERMO == True:        
            protocol.move_labware(labware=sample_plate_1,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=tc_pick_up_offset,drop_offset=mb_drop_offset)
        else:
            protocol.move_labware(labware=sample_plate_1,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
        #============================================================================================

        protocol.pause("ADDING PLATE")
        # ========== FIRST ROW ===========
        protocol.move_labware(labware=sample_plate_1,new_location=protocol_api.OFF_DECK,use_gripper=False)
        if ONDECK_THERMO == True:
            sample_plate_2 = thermocycler.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'Sample Plate 1')
        else:
            sample_plate_2 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','B1','Sample Plate 1')
        
        protocol.comment('--> Adding Sample to the Barcode Plate')
        BarcodeVol    = 10
        BarcodeMixRep = 3 if DRYRUN == False else 1
        BarcodeMixVol = 10
        TransferSup = 50
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #======== DISPENSE ===========
        if TIP_SETTING == 'Single Tip Use':
            # RACKSWAP 8-A (SINGLE)
            #============================================================================================
            protocol.move_labware(labware=tiprack_50_1,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p50_RACKS_PIPET.append(tiprack_50_3)
            protocol.move_labware(labware=tiprack_50_3,new_location='A2',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        if TIP_SETTING == 'Reusing Tips':
            # RACKSWAP 1-B (REUSING)
            #============================================================================================
            protocol.move_labware(labware=tiprack_50_1,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p50_RACKS_PIPET.append(tiprack_50_3)
            protocol.move_labware(labware=tiprack_50_3,new_location='A2',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        for loop, X in enumerate(column_2_list):
            p50.pick_up_tip()
            p50.aspirate(TransferSup, CleanupPlate[X].bottom(z=Deepwell_Z_offset+0.2), rate=0.25)
            p50.dispense(TransferSup, sample_plate_2[column_3_list[loop]].bottom(z=PCRPlate_Z_offset+1))
            p50.mix(BarcodeMixRep,BarcodeMixVol)
            p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
        #===============================================

        protocol.pause("ADDING PLATE")
        # ========== FIRST ROW ===========
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
        protocol.move_labware(labware=CleanupPlate,new_location=protocol_api.OFF_DECK,use_gripper=False)
        if ONDECK_HEATERSHAKER == True:
            heatershaker.close_labware_latch()

        #============================================================================================
        # GRIPPER MOVE CleanupPlate FROM HEATER SHAKER TO MAG PLATE
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            CleanupPlate_2 = heatershaker.load_labware('nest_96_wellplate_2ml_deep')
            heatershaker.close_labware_latch()
        else:
            CleanupPlate_2 = protocol.load_labware('nest_96_wellplate_2ml_deep','D1','CleanupPlate 2')
        #============================================================================================

    if STEP_PCRDECK == True:
        ############################################################################################################################################
        if ONDECK_THERMO == True:        
            if DRYRUN == False:
                protocol.comment("SETTING THERMO to Room Temp")
                thermocycler.set_block_temperature(4)
                thermocycler.set_lid_temperature(100) 

            thermocycler.close_lid()
            if DRYRUN == False:
                profile_PCR_1 = [
                    {'temperature': 68, 'hold_time_seconds': 180},
                    {'temperature': 98, 'hold_time_seconds': 180}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_1, repetitions=1, block_max_volume=50)
                profile_PCR_2 = [
                    {'temperature': 98, 'hold_time_seconds': 45},
                    {'temperature': 62, 'hold_time_seconds': 30},
                    {'temperature': 68, 'hold_time_seconds': 120}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_2, repetitions=PCRCYCLES, block_max_volume=50)
                profile_PCR_3 = [
                    {'temperature': 68, 'hold_time_minutes': 1}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_3, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
        else:
            protocol.comment('PAUSE THERMO')
        ############################################################################################################################################

    if STEP_CLEANUP == True:
        protocol.comment('==============================================')
        protocol.comment('--> Cleanup')
        protocol.comment('==============================================')

        protocol.comment('--> TRANSFERRING AND ADDING CleanupBead (0.8x)')
        H20Vol    = 40
        CleanupBeadVol = 45
        SampleVol = 45
        CleanupBeadMixRPM = 1800
        CleanupBeadMixTime = 5*60 if DRYRUN == False else 0.1*60
        CleanupBeadPremix = 3 if DRYRUN == False else 1
        CleanupBeadMix = 6 if TIP_MIX == True else 1
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        if TIP_SETTING == 'Single Tip Use':
            if HOTSWAP_PAUSE == True:
                protocol.pause('Add p200 on B4')
            tiprack_200_11        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'A4')
            tiprack_200_12        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'B4')
            tiprack_200_13        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'C4')
            tiprack_200_14        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'D4')
            # RACKSWAP 9-A (SINGLE)
            #============================================================================================
            protocol.move_labware(labware=tiprack_200_8,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p200_RACKS_PIPET.append(tiprack_200_11)
            protocol.move_labware(labware=tiprack_200_11,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        if TIP_SETTING == 'Reusing Tips':
            # RACKSWAP 2-B (REUSING)
            #============================================================================================
            protocol.move_labware(labware=tiprack_200_1,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_200_2R,new_location='B2',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        for loop, X in enumerate(column_3_list):
            if TIP_SETTING == 'Single Tip Use':
                p1000.pick_up_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.pick_up_tip(tiprack_200_2R[X])

            protocol.comment('--> Adding H20')
            p1000.aspirate(H20Vol+5, reagent_plate_1.wells_by_name()[H20_list[loop]].bottom(z=Deepwell_Z_offset), rate=1)
            p1000.dispense(5, reagent_plate_1.wells_by_name()[H20_list[loop]].bottom(z=Deepwell_Z_offset), rate=1)
            p1000.dispense(H20Vol, CleanupPlate_2[column_4_list[loop]].bottom(z=0.75))

            protocol.comment('--> Adding Cleanup Beads (0.8x)')
            p1000.move_to(CleanupBead.bottom(z=Deepwell_Z_offset+0.75))
            p1000.mix(CleanupBeadPremix,CleanupBeadVol)
            p1000.aspirate(CleanupBeadVol+3, CleanupBead.bottom(z=Deepwell_Z_offset+0.75), rate=0.25)
            p1000.dispense(3, CleanupBead.bottom(z=Deepwell_Z_offset+0.75), rate=0.5)
            p1000.default_speed = 100
            p1000.move_to(CleanupBead.top(z=-3))
            #=====Reservoir Tip Touch========
            p1000.default_speed = 100
            p1000.move_to(CleanupBead.top().move(types.Point(x=4,z=-3)))
            p1000.move_to(CleanupBead.top().move(types.Point(x=-4,z=-3)))
            p1000.default_speed = 400
            #================================ 
            p1000.dispense(CleanupBeadVol, CleanupPlate_2[column_4_list[loop]].bottom(z=Deepwell_Z_offset+0.75), rate=1)
            protocol.delay(seconds=0.2)
            p1000.blow_out(CleanupPlate_2[column_4_list[loop]].top(z=-2))

            protocol.comment('--> Adding SAMPLE')
            p1000.aspirate(SampleVol+3, sample_plate_2[column_3_list[loop]].bottom(z=PCRPlate_Z_offset+0.75), rate=0.5)
            p1000.dispense(SampleVol+3, CleanupPlate_2[column_4_list[loop]].bottom(z=Deepwell_Z_offset+0.75), rate=1)
            for Y in range(CleanupBeadMix):
                p1000.aspirate(SampleVol+3, CleanupPlate_2[column_4_list[loop]].bottom(z=Deepwell_Z_offset+0.75), rate=0.5)
                p1000.dispense(SampleVol+3, CleanupPlate_2[column_4_list[loop]].bottom(z=Deepwell_Z_offset+0.75), rate=1)
            p1000.move_to(CleanupPlate_2[column_4_list[loop]].top(z=-3))
            protocol.delay(seconds=0.2)
            p1000.blow_out(CleanupPlate_2[column_4_list[loop]].top(z=-3))
            if TIP_SETTING == 'Single Tip Use':
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.return_tip()
        #===============================================
        if ONDECK_HEATERSHAKER == True:
            heatershaker.set_and_wait_for_shake_speed(rpm=CleanupBeadMixRPM)
            protocol.delay(CleanupBeadMixTime)
            heatershaker.deactivate_shaker()

        if DRYRUN == False and ONDECK_THERMO == True:
            protocol.comment("SETTING THERMO to Room Temp")
            thermocycler.set_block_temperature(20)
            thermocycler.set_lid_temperature(37) 

        #============================================================================================
        # GRIPPER MOVE CleanupPlate_2 FROM HEATER SHAKER TO MAG PLATE
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_2,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=mb_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_2,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=4)

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        if TIP_SETTING == 'Single Tip Use':
            # RACKSWAP 11-A (SINGLE)
            #============================================================================================
            protocol.move_labware(labware=tiprack_200_9,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p200_RACKS_PIPET.append(tiprack_200_12)
            protocol.move_labware(labware=tiprack_200_12,new_location='C3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        for loop, X in enumerate(column_4_list):
            if TIP_SETTING == 'Single Tip Use':
                p1000.pick_up_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.pick_up_tip(tiprack_200_2R[X])
            p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+3.5))
            p1000.aspirate(RemoveSup-100, rate=0.25)
            protocol.delay(minutes=0.1)
            p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.75))
            p1000.aspirate(100, rate=0.25)
            p1000.default_speed = 100
            p1000.move_to(CleanupPlate_2[X].top(z=2))
            p1000.default_speed = 200
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul tp '+str(WASTEVOL))
            if WASTEVOL <14400*1:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400*1 and WASTEVOL <14400*2:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=14400*2 and WASTEVOL <14400*3:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=14400*3 and WASTEVOL <14400*4:
                Liquid_trash = Liquid_trash_well_4
            if WASTEVOL >=14400*4 and WASTEVOL <14400*5:
                Liquid_trash = Liquid_trash_well_5
            if WASTEVOL >=14400*5:
                Liquid_trash = Liquid_trash_well_6
            #================================ 
            p1000.dispense(200, Liquid_trash.top(z=0))
            protocol.delay(minutes=0.1)
            p1000.blow_out()
            p1000.default_speed = 400
            p1000.move_to(Liquid_trash.top(z=-5))
            p1000.move_to(Liquid_trash.top(z=0))
            if TIP_SETTING == 'Single Tip Use':
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.return_tip()
        #===============================================

        protocol.comment('--> ETOH Wash')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        if ETOH_1_AirMultiDis == True:
            p1000.pick_up_tip()
            for loop, X in enumerate(column_4_list):
                p1000.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_list[loop]].bottom(z=Deepwell_Z_offset+1))
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top(z=0))
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top(z=-5))
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top().move(types.Point(x=4,z=-3)))
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================ 
                p1000.move_to(CleanupPlate_2[X].top(z=2))
                p1000.dispense(ETOHMaxVol, rate=1)
                protocol.delay(minutes=0.1)
                p1000.blow_out()
                p1000.move_to(CleanupPlate_2[X].top(z=5))
                p1000.move_to(CleanupPlate_2[X].top(z=0))
                p1000.move_to(CleanupPlate_2[X].top(z=5))
            p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
        else:
            if TIP_SETTING == 'Single Tip Use':
                # RACKSWAP 10-A (SINGLE)
                #============================================================================================
                protocol.move_labware(labware=tiprack_200_10,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
                p200_RACKS_PIPET.append(tiprack_200_13)
                protocol.move_labware(labware=tiprack_200_13,new_location='B2',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
                #============================================================================================
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_list[loop]].bottom(z=Deepwell_Z_offset+1))
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top(z=0))
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top(z=-5))
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top().move(types.Point(x=4,z=-3)))
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================  
                p1000.move_to(CleanupPlate_2[X].top(z=-10))
                p1000.dispense(ETOHMaxVol, rate=1)
                protocol.delay(minutes=0.1)
                p1000.blow_out()
                p1000.move_to(CleanupPlate_2[X].top(z=5))
                p1000.move_to(CleanupPlate_2[X].top(z=0))
                p1000.move_to(CleanupPlate_2[X].top(z=5))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)
        
        protocol.comment('--> Remove ETOH Wash')
        RemoveSup = 160
        ActualRemoveSup = 150
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        if TIP_SETTING == 'Single Tip Use':
            # RACKSWAP 13-A (SINGLE)
            #============================================================================================
            protocol.move_labware(labware=tiprack_200_11,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p200_RACKS_PIPET.append(tiprack_200_14)
            protocol.move_labware(labware=tiprack_200_14,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        for loop, X in enumerate(column_4_list):
            if TIP_SETTING == 'Single Tip Use':
                p1000.pick_up_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.pick_up_tip(tiprack_200_2R[X])
            p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+3.5))
            p1000.aspirate(RemoveSup-100, rate=0.25)
            protocol.delay(minutes=0.1)
            p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.75))
            p1000.aspirate(100, rate=0.25)
            p1000.default_speed = 100
            p1000.move_to(CleanupPlate_2[X].top(z=2))
            p1000.default_speed = 200
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul tp '+str(WASTEVOL))
            if WASTEVOL <14400*1:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400*1 and WASTEVOL <14400*2:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=14400*2 and WASTEVOL <14400*3:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=14400*3 and WASTEVOL <14400*4:
                Liquid_trash = Liquid_trash_well_4
            if WASTEVOL >=14400*4 and WASTEVOL <14400*5:
                Liquid_trash = Liquid_trash_well_5
            if WASTEVOL >=14400*5:
                Liquid_trash = Liquid_trash_well_6
            #================================ 
            p1000.dispense(100, Liquid_trash.top(z=0))
            protocol.delay(minutes=0.1)
            p1000.blow_out()
            p1000.default_speed = 400
            p1000.move_to(Liquid_trash.top(z=-5))
            p1000.move_to(Liquid_trash.top(z=0))
            if TIP_SETTING == 'Single Tip Use':
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.return_tip()
        #===============================================

        protocol.comment('--> ETOH Wash')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        if ETOH_1_AirMultiDis == True:
            p1000.pick_up_tip()
            for loop, X in enumerate(column_4_list):
                p1000.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_list[loop]].bottom(z=Deepwell_Z_offset+1))
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top(z=0))
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top(z=-5))
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top().move(types.Point(x=4,z=-3)))
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================ 
                p1000.move_to(CleanupPlate_2[X].top(z=2))
                p1000.dispense(ETOHMaxVol, rate=1)
                protocol.delay(minutes=0.1)
                p1000.blow_out()
                p1000.move_to(CleanupPlate_2[X].top(z=5))
                p1000.move_to(CleanupPlate_2[X].top(z=0))
                p1000.move_to(CleanupPlate_2[X].top(z=5))
            p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
        else:
            if TIP_SETTING == 'Single Tip Use':
                if HOTSWAP_PAUSE == True:
                    protocol.pause('Add p200 on B4')
                tiprack_200_15        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'A4')
                tiprack_200_16        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'B4')
                tiprack_200_17        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'C4')
                tiprack_50_4          = protocol.load_labware('opentrons_flex_96_tiprack_50ul', 'D4')
                # RACKSWAP 14-A (SINGLE)
                #============================================================================================
                protocol.move_labware(labware=tiprack_200_12,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
                p200_RACKS_PIPET.append(tiprack_200_15)
                protocol.move_labware(labware=tiprack_200_15,new_location='C3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
                #============================================================================================
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_list[loop]].bottom(z=Deepwell_Z_offset+1))
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top(z=0))
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top(z=-5))
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top().move(types.Point(x=4,z=-3)))
                p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================  
                p1000.move_to(CleanupPlate_2[X].top(z=-10))
                p1000.dispense(ETOHMaxVol, rate=1)
                protocol.delay(minutes=0.1)
                p1000.blow_out()
                p1000.move_to(CleanupPlate_2[X].top(z=5))
                p1000.move_to(CleanupPlate_2[X].top(z=0))
                p1000.move_to(CleanupPlate_2[X].top(z=5))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)
        
        protocol.comment('--> Remove ETOH Wash')
        RemoveSup = 160
        ActualRemoveSup = 150
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        if TIP_SETTING == 'Single Tip Use':
            # RACKSWAP 15-A (SINGLE)
            #============================================================================================
            protocol.move_labware(labware=tiprack_200_13,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p200_RACKS_PIPET.append(tiprack_200_16)
            protocol.move_labware(labware=tiprack_200_16,new_location='B2',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        for loop, X in enumerate(column_4_list):
            if TIP_SETTING == 'Single Tip Use':
                p1000.pick_up_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.pick_up_tip(tiprack_200_2R[X])
            p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+3.5))
            p1000.aspirate(RemoveSup-100, rate=0.25)
            protocol.delay(minutes=0.1)
            p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.75))
            p1000.aspirate(100, rate=0.25)
            p1000.default_speed = 100
            p1000.move_to(CleanupPlate_2[X].top(z=2))
            p1000.default_speed = 200
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul tp '+str(WASTEVOL))
            if WASTEVOL <14400*1:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400*1 and WASTEVOL <14400*2:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=14400*2 and WASTEVOL <14400*3:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=14400*3 and WASTEVOL <14400*4:
                Liquid_trash = Liquid_trash_well_4
            if WASTEVOL >=14400*4 and WASTEVOL <14400*5:
                Liquid_trash = Liquid_trash_well_5
            if WASTEVOL >=14400*5:
                Liquid_trash = Liquid_trash_well_6
            #================================ 
            p1000.dispense(100, Liquid_trash.top(z=0))
            protocol.delay(minutes=0.1)
            p1000.blow_out()
            p1000.default_speed = 400
            p1000.move_to(Liquid_trash.top(z=-5))
            p1000.move_to(Liquid_trash.top(z=0))
            if TIP_SETTING == 'Single Tip Use':
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
            if TIP_SETTING == 'Reusing Tips':
                p1000.return_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=1)

        if TIP_SETTING == 'Single Tip Use':
            # RACKSWAP 16-A (SINGLE)
            #============================================================================================
            protocol.move_labware(labware=tiprack_200_14,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p200_RACKS_PIPET.append(tiprack_200_17)
            protocol.move_labware(labware=tiprack_200_17,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================

        if TIP_SETTING == 'Single Tip Use':
            # RACKSWAP 17-A (SINGLE)
            #============================================================================================
            protocol.move_labware(labware=tiprack_50_2,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p50_RACKS_PIPET.append(tiprack_50_4)
            protocol.move_labware(labware=tiprack_50_4,new_location='A3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================

        if TIP_SETTING == 'Reusing Tips':
            # RACKSWAP 3-B (REUSING)
            #============================================================================================
            protocol.move_labware(labware=tiprack_200_1R,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            protocol.move_labware(labware=tiprack_50_R,new_location='C3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================

        for batch in range(BATCHREP):
            protocol.comment('--> Removing Residual Wash')
            ActualRemoveSup = 20
            p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            for loop, X in enumerate(column_4_list[batch*(int(len(column_4_list)/BATCHREP)):(1+batch)*int(len(column_4_list)/BATCHREP)]):
                if TIP_SETTING == 'Single Tip Use':
                    p1000.pick_up_tip()
                if TIP_SETTING == 'Reusing Tips':
                    p1000.pick_up_tip(tiprack_200_2R[X])
                p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+1))
                p1000.aspirate(50, rate=0.25)
                #======L Waste Volume Check======
                WASTEVOL+=(ActualRemoveSup*8)
                protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul tp '+str(WASTEVOL))
                if WASTEVOL <14400:
                    Liquid_trash = Liquid_trash_well_1
                if WASTEVOL >=14400 and WASTEVOL <28800:
                    Liquid_trash = Liquid_trash_well_2
                if WASTEVOL >=28800:
                    Liquid_trash = Liquid_trash_well_3
                #================================ 
                p1000.dispense(50, Liquid_trash)
                p1000.move_to(Liquid_trash.top(z=5))
                protocol.delay(minutes=0.1)
                p1000.blow_out(Liquid_trash.top(z=-3))
                p1000.move_to(Liquid_trash.top(z=5))
                p1000.move_to(Liquid_trash.top(z=0))
                p1000.move_to(Liquid_trash.top(z=5))
                if TIP_SETTING == 'Single Tip Use':
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                if TIP_SETTING == 'Reusing Tips':
                    p1000.return_tip()
            #===============================================

            if DRYRUN == False:
                protocol.delay(minutes=0.5)

            protocol.move_labware(labware=sample_plate_2,new_location=protocol_api.OFF_DECK,use_gripper=False)
            #============================================================================================
            # GRIPPER MOVE CleanupPlate_2 FROM MAG PLATE TO HEATER SHAKER
            if ONDECK_HEATERSHAKER == True:        
                heatershaker.open_labware_latch()
                protocol.move_labware(labware=CleanupPlate_2,new_location=heatershaker,use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=hs_drop_offset)
                heatershaker.close_labware_latch()
            else:
                protocol.move_labware(labware=CleanupPlate_2,new_location='D1',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
            #============================================================================================
            
            protocol.comment('--> Adding RSB')
            RSBVol = 32
            RSBMix = 6 if TIP_MIX == True else 1
            RSBMixRPM = 2000
            RSBMixTime = 1*60 if DRYRUN == False else 0.1*60
            p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
            p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
            p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
            #===============================================
            for loop, X in enumerate(column_4_list[batch*(int(len(column_4_list)/BATCHREP)):(1+batch)*int(len(column_4_list)/BATCHREP)]):
                if TIP_SETTING == 'Single Tip Use':
                    p50.pick_up_tip()
                if TIP_SETTING == 'Reusing Tips':
                    p50.pick_up_tip(tiprack_50_R[X])
                p50.aspirate(RSBVol, reagent_plate_1.wells_by_name()[RSB_list[loop]].bottom(z=1))
                p50.move_to(CleanupPlate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
                p50.dispense(RSBVol, rate=1)
                for Y in range(RSBMix):
                    p50.aspirate(RSBVol, CleanupPlate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1), rate=0.5)
                    p50.dispense(RSBVol, CleanupPlate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1), rate=1)
                p50.blow_out(CleanupPlate_2.wells_by_name()[X].top(z=-3))
                if TIP_SETTING == 'Single Tip Use':
                    p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                if TIP_SETTING == 'Reusing Tips':
                    p50.return_tip()
            #===============================================
            if ONDECK_HEATERSHAKER == True:
                heatershaker.set_and_wait_for_shake_speed(rpm=RSBMixRPM)
                protocol.delay(RSBMixTime)
                heatershaker.deactivate_shaker()

            #============================================================================================
            # GRIPPER MOVE CleanupPlate_2 FROM HEATER SHAKER TO MAG PLATE
            if ONDECK_HEATERSHAKER == True:
                heatershaker.open_labware_latch()
                protocol.move_labware(labware=CleanupPlate_2,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=mb_drop_offset)
                heatershaker.close_labware_latch()
            else:
                protocol.move_labware(labware=CleanupPlate_2,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=3)
        
        protocol.pause("ADDING PLATE")
        # ========== FIRST ROW ===========
        if ONDECK_THERMO == True:
            sample_plate_3 = thermocycler.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'Sample Plate 3')
        else:
            sample_plate_3 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','B1', 'Sample Plate 3')
        if TIP_SETTING == 'Single Tip Use':
            if HOTSWAP_PAUSE == True:
                protocol.pause('Add p50 on B4')
            tiprack_50_5        = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'A4')

        protocol.comment('--> Transferring Supernatant')
        TransferSup = 30
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        if TIP_SETTING == 'Single Tip Use':
            # RACKSWAP 18-A (SINGLE)
            #============================================================================================
            protocol.move_labware(labware=tiprack_50_3,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            p50_RACKS_PIPET.append(tiprack_50_5)
            protocol.move_labware(labware=tiprack_50_5,new_location='A2',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        for loop, X in enumerate(column_4_list):
            if TIP_SETTING == 'Single Tip Use':
                p50.pick_up_tip()
            if TIP_SETTING == 'Reusing Tips':
                p50.pick_up_tip(tiprack_50_R[X])
            p50.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.5))
            p50.aspirate(TransferSup+1, rate=0.25)
            p50.dispense(TransferSup, sample_plate_3[column_5_list[loop]].bottom(z=PCRPlate_Z_offset+1))
            if TIP_SETTING == 'Single Tip Use':
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
            if TIP_SETTING == 'Reusing Tips':
                p50.return_tip()
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
    protocol.comment('--> Report')
    protocol.comment('==============================================')
    # This is a section that will print out the various lists to help keep track of modifying the protocol, set the REPORT step to False to ignore.
    if REPORT == True:
        protocol.comment("REUSE_50_TIPS "+str(REUSE_50_TIPS))
        protocol.comment("p50_INITIALTIPS "+str(p50_INITIALTIPS))
        protocol.comment("REUSE_200_TIPS_1 "+str(REUSE_200_TIPS_1))
        protocol.comment("REUSE_200_TIPS_2 "+str(REUSE_200_TIPS_2))
        protocol.comment("p200_INITIALTIPS "+str(p200_INITIALTIPS))
        protocol.comment("SWAPSPOT "+str(SWAPSPOT))
        protocol.comment("AVAILABLE_POS_ONDECK "+str(AVAILABLE_POS_ONDECK))
        protocol.comment("AVAILABLE_POS_OFFDECK "+str(AVAILABLE_POS_OFFDECK))
        protocol.comment("REUSE_50_TIPS_COUNT "+str(REUSE_50_TIPS_COUNT))
        protocol.comment("REUSE_200_TIPS_COUNT "+str(REUSE_200_TIPS_COUNT))
        protocol.comment("p50_RACKS_ONDECK "+str(p50_RACKS_ONDECK))
        protocol.comment("p50_RACKS_OFFDECK "+str(p50_RACKS_OFFDECK))
        protocol.comment("p50_RACKS_DROPPED "+str(p50_RACKS_DROPPED))
        protocol.comment("p50_TIPS "+str(p50_TIPS))
        protocol.comment("p50_RACKS_PIPET "+str(p50_RACKS_PIPET))
        protocol.comment("p200_RACKS_ONDECK "+str(p200_RACKS_ONDECK))
        protocol.comment("p200_RACKS_OFFDECK "+str(p200_RACKS_OFFDECK))
        protocol.comment("p200_RACKS_DROPPED "+str(p200_RACKS_DROPPED))
        protocol.comment("p200_TIPS "+str(p200_TIPS))
        protocol.comment("p200_RACKS_PIPET "+str(p200_RACKS_PIPET))
        protocol.comment("RACKS_TO_DUMP "+str(RACKS_TO_DUMP))

    # This is a section that is used to define liquids, and label wells, this is optional, and unconnected from the rest of the protocol, used only for the App and Website
    # This is at the end because it adds lines of code to the runtime that can be at the end rather than the beginning, since it has no effect on the protocol setps.
    if NOLABEL == False:
         # PROTOCOL SETUP - LABELING

        # ======== ESTIMATING LIQUIDS =======        
        Sample_Volume = 40
        CleanupBead_Volume = COLUMNS*(45)
        TAGSTOP_Volume = COLUMNS*(10)
        ETOH_Volume = COLUMNS*(300)
        TWB_Volume = COLUMNS*(900)
        RSB_Volume = COLUMNS*(32)
        TAGMIX_Volume = COLUMNS*(22)
        EPM_Volume = COLUMNS*(40)
        H20_Volume = COLUMNS*(40)

        TotalColumn = ['A','B','C','D','E','F','G','H']

        # ======== DEFINING LIQUIDS =======
        CleanupBead = protocol.define_liquid(name="EtOH", description="CleanupBead Beads", display_color="#704848")                                       #704848 = 'CleanupBead Brown'
        EtOH = protocol.define_liquid(name="EtOH", description="80% Ethanol", display_color="#9ACECB")                                          #9ACECB = 'Ethanol Blue'
        RSB = protocol.define_liquid(name="RSB", description="Resuspension Buffer", display_color="#00FFF2")                                    #00FFF2 = 'Base Light Blue'
        Liquid_trash_well = protocol.define_liquid(name="Liquid_trash_well", description="Liquid Trash", display_color="#9B9B9B")               #9B9B9B = 'Liquid Trash Grey'
        Sample = protocol.define_liquid(name="Sample", description="Sample", display_color="#52AAFF")                                           #52AAFF = 'Sample Blue'
        TAGSTOP = protocol.define_liquid(name="TAGSTOP", description="Tagmentation Stop", display_color="#FF0000")                              #FF0000 = 'Base Red'
        TWB = protocol.define_liquid(name="TWB", description="Tagmentation Wash Buffer", display_color="#FFA000")                               #FFA000 = 'Base Orange'
        TAGMIX = protocol.define_liquid(name="TAGMIX", description="Tagmentation Mix", display_color="#FFFB00")                                 #FFFB00 = 'Base Yellow'
        EPM = protocol.define_liquid(name="EPM", description="EPM", display_color="#0EFF00")                                                    #0EFF00 = 'Base Green'
        H20 = protocol.define_liquid(name="H20", description="H20", display_color="#0082FF")                                                    #0082FF = 'Base  Blue'
        Barcodes = protocol.define_liquid(name="Barcodes", description="Barcodes", display_color="#7DFFC4")                                     #7DFFC4 = 'Barcode Green'
        Final_Sample = protocol.define_liquid(name="Final_Sample", description="Final Sample", display_color="#82A9CF")                         #82A9CF = 'Placeholder Blue'
        Placeholder_Sample = protocol.define_liquid(name="Placeholder_Sample", description="Placeholder Sample", display_color="#82A9CF")       #82A9CF = 'Placeholder Blue'

        # ======== LOADING LIQUIDS =======
        if RES_TYPE_96x == '12x15ml':
            reservoir.wells_by_name()['A1'].load_liquid(liquid=CleanupBead, volume=CleanupBead_Volume)
            reservoir.wells_by_name()['A2'].load_liquid(liquid=TAGSTOP, volume=TAGSTOP_Volume)
            reservoir.wells_by_name()['A3'].load_liquid(liquid=TWB, volume=TWB_Volume)
            reservoir.wells_by_name()['A4'].load_liquid(liquid=TWB, volume=TWB_Volume)
            reservoir.wells_by_name()['A5'].load_liquid(liquid=EtOH, volume=ETOH_Volume)
            reservoir.wells_by_name()['A6'].load_liquid(liquid=EtOH, volume=ETOH_Volume)
            reservoir.wells_by_name()['A7'].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()['A8'].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()['A9'].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()['A10'].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()['A11'].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()['A12'].load_liquid(liquid=Liquid_trash_well, volume=0)
        if RES_TYPE_96x == '96x2ml':
            for loop, X in enumerate(TotalColumn):
                reservoir.wells_by_name()[X+'1'].load_liquid(liquid=CleanupBead, volume=CleanupBead_Volume)
                reservoir.wells_by_name()[X+'2'].load_liquid(liquid=TAGSTOP, volume=TAGSTOP_Volume)
                reservoir.wells_by_name()[X+'3'].load_liquid(liquid=TWB, volume=TWB_Volume)
                reservoir.wells_by_name()[X+'4'].load_liquid(liquid=TWB, volume=TWB_Volume)
                reservoir.wells_by_name()[X+'5'].load_liquid(liquid=EtOH, volume=ETOH_Volume)
                reservoir.wells_by_name()[X+'6'].load_liquid(liquid=EtOH, volume=ETOH_Volume)
                reservoir.wells_by_name()[X+'7'].load_liquid(liquid=Liquid_trash_well, volume=0)
                reservoir.wells_by_name()[X+'8'].load_liquid(liquid=Liquid_trash_well, volume=0)
                reservoir.wells_by_name()[X+'9'].load_liquid(liquid=Liquid_trash_well, volume=0)
                reservoir.wells_by_name()[X+'10'].load_liquid(liquid=Liquid_trash_well, volume=0)
                reservoir.wells_by_name()[X+'11'].load_liquid(liquid=Liquid_trash_well, volume=0)
                reservoir.wells_by_name()[X+'12'].load_liquid(liquid=Liquid_trash_well, volume=0)
        for loop, X in enumerate(TotalColumn):
            sample_plate_1.wells_by_name()[X+'1'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'2'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'3'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'4'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'6'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'7'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'8'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'9'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'10'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'11'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X+'12'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_2.wells_by_name()[X+'1'].load_liquid(liquid=Barcodes, volume=5)
            sample_plate_2.wells_by_name()[X+'2'].load_liquid(liquid=Barcodes, volume=5)
            sample_plate_2.wells_by_name()[X+'3'].load_liquid(liquid=Barcodes, volume=5)
            sample_plate_2.wells_by_name()[X+'4'].load_liquid(liquid=Barcodes, volume=5)
            sample_plate_2.wells_by_name()[X+'5'].load_liquid(liquid=Barcodes, volume=5)
            sample_plate_2.wells_by_name()[X+'6'].load_liquid(liquid=Barcodes, volume=5)
            sample_plate_2.wells_by_name()[X+'7'].load_liquid(liquid=Barcodes, volume=5)
            sample_plate_2.wells_by_name()[X+'8'].load_liquid(liquid=Barcodes, volume=5)
            sample_plate_2.wells_by_name()[X+'9'].load_liquid(liquid=Barcodes, volume=5)
            sample_plate_2.wells_by_name()[X+'10'].load_liquid(liquid=Barcodes, volume=5)
            sample_plate_2.wells_by_name()[X+'11'].load_liquid(liquid=Barcodes, volume=5)
            sample_plate_2.wells_by_name()[X+'12'].load_liquid(liquid=Barcodes, volume=5)
            reagent_plate_1.wells_by_name()[X+'1'].load_liquid(liquid=TAGMIX, volume=TAGMIX_Volume)
            reagent_plate_1.wells_by_name()[X+'2'].load_liquid(liquid=TAGMIX, volume=TAGMIX_Volume)
            reagent_plate_1.wells_by_name()[X+'3'].load_liquid(liquid=H20, volume=H20_Volume)
            reagent_plate_1.wells_by_name()[X+'4'].load_liquid(liquid=H20, volume=H20_Volume)
            reagent_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=H20, volume=H20_Volume)
            reagent_plate_1.wells_by_name()[X+'6'].load_liquid(liquid=RSB, volume=RSB_Volume)
            reagent_plate_1.wells_by_name()[X+'7'].load_liquid(liquid=RSB, volume=RSB_Volume)
            reagent_plate_1.wells_by_name()[X+'8'].load_liquid(liquid=RSB, volume=RSB_Volume)
            reagent_plate_1.wells_by_name()[X+'9'].load_liquid(liquid=EPM, volume=EPM_Volume)
            reagent_plate_1.wells_by_name()[X+'10'].load_liquid(liquid=EPM, volume=EPM_Volume)
            reagent_plate_1.wells_by_name()[X+'11'].load_liquid(liquid=EPM, volume=EPM_Volume)
            reagent_plate_1.wells_by_name()[X+'12'].load_liquid(liquid=EPM, volume=EPM_Volume)
            sample_plate_3.wells_by_name()[X+'1'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_3.wells_by_name()[X+'2'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_3.wells_by_name()[X+'3'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_3.wells_by_name()[X+'4'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_3.wells_by_name()[X+'5'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_3.wells_by_name()[X+'6'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_3.wells_by_name()[X+'7'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_3.wells_by_name()[X+'8'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_3.wells_by_name()[X+'9'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_3.wells_by_name()[X+'10'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_3.wells_by_name()[X+'11'].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_3.wells_by_name()[X+'12'].load_liquid(liquid=Sample, volume=Sample_Volume)