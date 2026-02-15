from opentrons import protocol_api
from opentrons import types
import math

metadata = {'protocolName': 'QIAseq miRNA 48x v8','author': 'Opentrons <protocols@opentrons.com>','source': 'Protocol Library',}
requirements = {"robotType": "Flex","apiLevel": "2.18",}

def add_parameters(parameters):
    # ======================== RUNTIME PARAMETERS ========================
    parameters.add_bool(
        display_name="Dry Run",
        variable_name="DRYRUN",
        default=False,
        description="Whether to perform a dry run or not.")
    parameters.add_int(
        display_name="Sample Column count",
        variable_name="COLUMNS",
        default=3,minimum=1,maximum=6,
        description="How many sample columns to process.")
    parameters.add_int(
        display_name="PCR Cycles",
        variable_name="PCRCYCLES",
        default=16,minimum=1,maximum=25,
        description="How many PCR Cycles for amplification.")
    parameters.add_bool(
        display_name="Pause to Add Reagents",
        variable_name="REAGENT_PAUSE",
        default=False,
        description="Whether to pause to manually add reagents from cold storage.")
    parameters.add_str(
        display_name="Protocol Steps",
        variable_name="PROTOCOL_STEPS",
        default="All Steps",
        description="Protocol Steps",
        choices=[
        {"display_name": "All Steps",                   "value": "All Steps"},
        {"display_name": "Just cDNA",                   "value": "Just cDNA"},
        {"display_name": "Just Library Prep",           "value": "Just Library Prep"}
        ])

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
    # =================== LOADING THE RUNTIME PARAMETERS ====================

    DRYRUN              = protocol.params.DRYRUN
    COLUMNS             = protocol.params.COLUMNS
    PCRCYCLES           = protocol.params.PCRCYCLES
    REAGENT_PAUSE       = protocol.params.REAGENT_PAUSE
    PROTOCOL_STEPS      = protocol.params.PROTOCOL_STEPS

    # =================================================================================================
    # ====================================== ADVANCED PARAMETERS ======================================
    # =================================================================================================

    #-------PROTOCOL STEP-------
    if PROTOCOL_STEPS == "All Steps" or PROTOCOL_STEPS == "Just cDNA":
        STEP_3LIG             = True      # Set to 0 to skip block of commands
        STEP_3LIGDECK         = True      # Set to 0 if using off deck thermocycler
        STEP_5LIG             = True      # Set to 0 if using off deck thermocycler
        STEP_5LIGDECK         = True      # Set to 0 if using off deck thermocycler
        STEP_RTI              = True      # Set to 0 if using off deck thermocycler
        STEP_RTIDECK          = True      # Set to 0 if using off deck thermocycler
        STEP_RT               = True      # Set to 0 if using off deck thermocycler
        STEP_RTDECK           = True      # Set to 0 if using off deck thermocycler
        STEP_CLEANUP_1        = True      # Set to 0 if using off deck thermocycler
    else:
        STEP_3LIG             = False     # Set to 0 to skip block of commands
        STEP_3LIGDECK         = False     # Set to 0 if using off deck thermocycler
        STEP_5LIG             = False     # Set to 0 if using off deck thermocycler
        STEP_5LIGDECK         = False     # Set to 0 if using off deck thermocycler
        STEP_RTI              = False     # Set to 0 if using off deck thermocycler
        STEP_RTIDECK          = False     # Set to 0 if using off deck thermocycler
        STEP_RT               = False     # Set to 0 if using off deck thermocycler
        STEP_RTDECK           = False     # Set to 0 if using off deck thermocycler
        STEP_CLEANUP_1        = False     # Set to 0 if using off deck thermocycler
    #---------------------------
    if PROTOCOL_STEPS == "All Steps" or PROTOCOL_STEPS == "Just Library Prep":
        STEP_PCR              = True       # Set to 0 if using off deck thermocycler
        STEP_PCRDECK          = True       # Set to 0 if using off deck thermocycler
        STEP_CLEANUP_2        = True       # Set to 0 if using off deck thermocycler
    else:
        STEP_PCR              = False      # Set to 0 if using off deck thermocycler
        STEP_PCRDECK          = False      # Set to 0 if using off deck thermocycler
        STEP_CLEANUP_2        = False      # Set to 0 if using off deck thermocycler

    #---------------------------
    # This notifies the user that for 5-6 columns (from more than 32 samples up to 48 samples) it requires Tip reusing in order to remain walkaway.
    # This setting will override any Runtime parameter, and also pauses to notify the user.  So if the user enters 6 columns with Single Tip Use, it will pause and warn that it has to change to Reusing tips in order to remain walkaway.
    # Note that if omitting steps (i.e. skipping the last cleanup step) it is possible to do single use tips, but may vary on case by case basis.
    # Note that it is also possible to use advanced settings to include pauses that requires user intervention to replenish tipracks, making allowing a run of single Use Tips.
    TIP_SETTING         = "Single Tip Use"
    AllSteps=[STEP_3LIG,STEP_RTI,STEP_RT,STEP_CLEANUP_1,STEP_PCR,STEP_CLEANUP_2]
    if COLUMNS == 5 or COLUMNS == 6 and all(AllSteps) == True:
        TIP_SETTING = 'Reusing Tips'

    TIP_TRASH             = True      # Default True    | True = Used tips go in Trash, False = Used tips go back into rack
    DEACTIVATE_TEMP       = True      # Default True    | True = Temp and / or Thermocycler deactivate at end of run, False = remain on, such as leaving at 4 degrees 
    TRASH_POSITION        = 'CHUTE'   # Default 'CHUTE' | 'BIN' or 'CHUTE'
    TIP_MIX               = False
    ONDECK_THERMO         = True
    ONDECK_HEATERSHAKER   = True      # Default True    | True = On Deck Heater Shaker, False = No heatershaker and increased tip mixing reps.
    ONDECK_TEMP           = True      # Default True    | True = On Deck Temperature module, False = No Temperature Module
    USE_GRIPPER           = True      # Default True    | True = Uses the FLEX Gripper, False = No Gripper Movement, protocol pauses and requires manual intervention.
    TEMP_OFF_INACT        = False     # Default False   | True = Deactivates the Temp and Thermocycler (if used in protocol) when not in use to prevent condensation
    HOTSWAP               = False     # Default False   | True = Allows replenishing tipracks on the off deck positions so the protocol can continue, False = Won't, protocol will most likely have out of tip error message.
    HOTSWAP_PAUSE         = False     # Default False   | True = Protocol pauses for replenishing the offdeck tip racks or to continue, False = Protocol won't cause, user must add tipracks at their discretion.
    SWAPOFFDECK           = False     # Default False   | True = Protocol will use an empty deck position as a temprorary place to swap new and used tip racks between on and off deck, instead of discarding in the chute, False = won't, and used tipracks will go into the chute.  Use True if there is deck space to spare and when doing troubleshooting so tips aren't being discarded with the tip racks.
    CUSTOM_OFFSETS        = False     # Default False   | True = use per instrument specific offsets, False = Don't use any offsets.  This is for per instrument, per module gripper alignment adjustments that need fine tuning without gripper recalibration.
    ETOH_1_AirMultiDis    = False     # Default False   | When adding EtOH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
    ETOH_2_AirMultiDis    = False     # Default False   | When adding EtOH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
    REUSE_50_TIPS_RSB_1   = False     # Default False   | Reusing p50 tips
    REUSE_50_TIPS_RSB_2   = False     # Default False   | Reusing p50 tips
    REUSE_200_TIPS_ETOH   = False     # Default False   | Reusing p200 tips
    STP_200_TIPS          = False     # Default False   | Single Tip Pickup p200 tips
    STP_50_TIPS           = False     # Default False   | Single tip Pickup p50 tips
    NOLABEL               = False     # Default False   | True = Do no include Liquid Labeling, False = Liquid Labeling is included, adds additional lines to Protocol Step Preview at end of protocol.
    REPORT                = False     # Default False   | True = Include Extra Comments in the Protocol Step Preview for troubleshooting, False = Do Not Include
    
    # =========================== QUICK SETTINGS ============================
    if TRASH_POSITION == 'BIN': 
        SWAPOFFDECK           = True      # Setting to Swap empty Tipracks to empty positions instead of dumping them
    if TRASH_POSITION == 'CHUTE': 
        SWAPOFFDECK           = False     # Setting to Swap empty Tipracks to empty positions instead of dumping them
    if DRYRUN == True: 
        TIP_TRASH             = False     # True = Used tips go in Trash, False = Used tips go back into rack
        DEACTIVATE_TEMP       = True      # Whether or not to deactivate the heating and cooling modules after a run
        REPORT                = True      # Whether or not to include Extra Comments for Debugging

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
    if REUSE_50_TIPS_RSB_1 == True:
        REUSE_ANY_50_TIPS = True
        REUSE_50_TIPS_COUNT+= COLUMNS
    if REUSE_50_TIPS_RSB_2 == True:
        REUSE_ANY_50_TIPS = True
        REUSE_50_TIPS_COUNT+= COLUMNS
    REUSE_200_TIPS_COUNT = 0
    REUSE_ANY_200_TIPS = False
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

    if COLUMNS <=3:
        # ========== FIRST ROW ===========
        if ONDECK_THERMO == True:
            thermocycler = protocol.load_module('thermocycler module gen2')
            sample_plate_1 = thermocycler.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'Sample Plate 1')
        else:
            sample_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','B1', 'Sample Plate 1')    
        tiprack_50_2 = protocol.load_labware('opentrons_flex_96_tiprack_50ul','A2')
        tiprack_200_3 = protocol.load_labware('opentrons_flex_96_tiprack_200ul','A3')
        # ========== SECOND ROW ==========
        tiprack_50_1 = protocol.load_labware('opentrons_flex_96_tiprack_50ul','B2')
        tiprack_200_2 = protocol.load_labware('opentrons_flex_96_tiprack_200ul','B3')
        # ========== THIRD ROW ===========
        if ONDECK_TEMP == True:
            temp_block = protocol.load_module('temperature module gen2', 'C1')
            if REAGENT_PAUSE == True:
                reagent_plate_1 = temp_block.load_labware('opentrons_96_aluminumblock_generic_pcr_strip_200ul', 'Reagent Plate')
            else:
                temp_adapter = temp_block.load_adapter('opentrons_96_well_aluminum_block')
                reagent_plate_1 = temp_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'Reagent Plate')
        else:
            reagent_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','C1','Reagent Plate')
        reservoir = protocol.load_labware('nest_96_wellplate_2ml_deep','C2','Reservoir')
        tiprack_200_1 = protocol.load_labware('opentrons_flex_96_tiprack_200ul','C3')
        # ========== FOURTH ROW ==========
        if ONDECK_HEATERSHAKER == True:
            heatershaker = protocol.load_module('heaterShakerModuleV1','D1')
            CleanupPlate_1 = heatershaker.load_labware('nest_96_wellplate_2ml_deep','CleanupPlate_1')
        else:
            CleanupPlate_1 = protocol.load_labware('nest_96_wellplate_2ml_deep','D1','CleanupPlate_1')
        mag_block = protocol.load_module('magneticBlockV1', 'D2')
        TRASH = protocol.load_waste_chute()
        # ============ TRASH =============
        sample_plate_2 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','A4', 'Sample Plate 1')
        tiprack_50_3 = protocol.load_labware('opentrons_flex_96_tiprack_50ul','B4')
    if COLUMNS >3:
        # ========== FIRST ROW ===========
        if ONDECK_THERMO == True:
            thermocycler = protocol.load_module('thermocycler module gen2')
            sample_plate_1 = thermocycler.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'Sample Plate 1')
        else:
            sample_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','B1', 'Sample Plate 1')    
        tiprack_50_3 = protocol.load_labware('opentrons_flex_96_tiprack_50ul','A2')
        tiprack_200_3 = protocol.load_labware('opentrons_flex_96_tiprack_200ul','A3')
        # ========== SECOND ROW ==========
        tiprack_50_2 = protocol.load_labware('opentrons_flex_96_tiprack_50ul','B2')
        tiprack_200_2 = protocol.load_labware('opentrons_flex_96_tiprack_200ul','B3')
        # ========== THIRD ROW ===========
        if ONDECK_TEMP == True:
            temp_block = protocol.load_module('temperature module gen2', 'C1')
            if REAGENT_PAUSE == True:
                reagent_plate_1 = temp_block.load_labware('opentrons_96_aluminumblock_generic_pcr_strip_200ul', 'Reagent Plate')
            else:
                temp_adapter = temp_block.load_adapter('opentrons_96_well_aluminum_block')
                reagent_plate_1 = temp_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'Reagent Plate')
        else:
            reagent_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','C1','Reagent Plate')
        tiprack_50_1 = protocol.load_labware('opentrons_flex_96_tiprack_50ul','C2')
        tiprack_200_1 = protocol.load_labware('opentrons_flex_96_tiprack_200ul','C3')
        # ========== FOURTH ROW ==========
        if ONDECK_HEATERSHAKER == True:
            heatershaker = protocol.load_module('heaterShakerModuleV1','D1')
            reservoir = heatershaker.load_labware('nest_96_wellplate_2ml_deep','Reservoir')
        else:
            reservoir = protocol.load_labware('nest_96_wellplate_2ml_deep','D1','Reservoir')
        mag_block = protocol.load_module('magneticBlockV1', 'D2')
        CleanupPlate_1 = mag_block.load_labware('nest_96_wellplate_2ml_deep','CleanupPlate_1')
        TRASH = protocol.load_waste_chute()
        # ============ TRASH =============
        tiprack_50_4 = protocol.load_labware('opentrons_flex_96_tiprack_50ul','A4')
        tiprack_50_5 = protocol.load_labware('opentrons_flex_96_tiprack_50ul','B4')
        tiprack_200_4 = protocol.load_labware('opentrons_flex_96_tiprack_200ul','C4')
        tiprack_200_5 = protocol.load_labware('opentrons_flex_96_tiprack_200ul','D4')

    # =============================== PIPETTE ===============================
    if COLUMNS >3:
        p1000 = protocol.load_instrument("flex_8channel_1000", 'left', tip_racks=[tiprack_200_1,tiprack_200_2,tiprack_200_3,tiprack_200_4,tiprack_200_5])
        p50 = protocol.load_instrument('flex_8channel_50', 'right', tip_racks=[tiprack_50_1,tiprack_50_2,tiprack_50_3,tiprack_50_4,tiprack_50_5])
    if COLUMNS <=3:
        p1000 = protocol.load_instrument("flex_8channel_1000", 'left', tip_racks=[tiprack_200_1,tiprack_200_2,tiprack_200_3])
        p50 = protocol.load_instrument('flex_8channel_50', 'right', tip_racks=[tiprack_50_1,tiprack_50_2,tiprack_50_3])
    p1000_flow_rate_aspirate_default = 200
    p1000_flow_rate_dispense_default = 200
    p1000_flow_rate_blow_out_default = 400
    p50_flow_rate_aspirate_default = 50
    p50_flow_rate_dispense_default = 50
    p50_flow_rate_blow_out_default = 100

    # =========================== REAGENT PLATE =============================
    Adapt3lig           = reagent_plate_1.wells_by_name()['A1']
    Adapt5lig           = reagent_plate_1.wells_by_name()['A2']
    RTI                 = reagent_plate_1.wells_by_name()['A3']
    RT                  = reagent_plate_1.wells_by_name()['A4']
    PCR                 = reagent_plate_1.wells_by_name()['A5']
    RSB                 = reagent_plate_1.wells_by_name()['A6']
    #Barcode_1          = reagent_plate_1.wells_by_name()['A7']
    #Barcode_2          = reagent_plate_1.wells_by_name()['A8']
    #Barcode_3          = reagent_plate_1.wells_by_name()['A9']
    #Barcode_4          = reagent_plate_1.wells_by_name()['A10']
    #Barcode_5          = reagent_plate_1.wells_by_name()['A11']
    #Barcode_6          = reagent_plate_1.wells_by_name()['A12']

    # ============================ RESERVOIR ================================
    #BEAD               = reservoir['A1']
    #BEAD               = reservoir['A2']
    #BEAD               = reservoir['A3']
    #EtOH               = reservoir['A4']
    #EtOH               = reservoir['A5']
    #EtOH               = reservoir['A6']
    #                   = reservoir['A7']
    #                   = reservoir['A8']
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
    #   column_3_list = ['A4','A5','A6']             <-- Final 3 columns of Samples

    if COLUMNS == 1:
        column_1_list = ['A1']     # sample_plate_1 initial Wells
        column_2_list = ['A1']     # CleanupPlate_1 - Cleanup #1
        column_3_list = ['A7']     # sample_plate_1 PCR Wells
        column_4_list = ['A1']     # sample_plate_2 - Cleanup #2 1st Cut
        column_5_list = ['A7']     # CleanupPlate_1 - Cleanup #2 2nd Cut
        column_6_list = ['A7']     # sample_plate_2 Final Libraries
        BEAD_list = ['A1']         # order of Bead Wells
        ETOH_1_list = ['A4']       # order of ETOH Wells
        ETOH_2_list = ['A4']       # order of ETOH Wells
        barcodes = ['A7']          # order of Barcode Wells
    if COLUMNS == 2:
        column_1_list = ['A1','A2']     # sample_plate_1 initial Wells
        column_2_list = ['A1','A2']     # CleanupPlate_1 - Cleanup #1
        column_3_list = ['A7','A8']     # sample_plate_1 PCR Wells
        column_4_list = ['A1','A2']     # sample_plate_2 - Cleanup #2 1st Cut
        column_5_list = ['A7','A8']     # CleanupPlate_1 - Cleanup #2 2nd Cut
        column_6_list = ['A7','A8']     # sample_plate_2 Final Libraries
        BEAD_list = ['A1','A1']         # order of Bead Wells
        ETOH_1_list = ['A4','A4']       # order of ETOH Wells
        ETOH_2_list = ['A4','A4']       # order of ETOH Wells
        barcodes = ['A7','A8']          # order of Barcode Wells
    if COLUMNS == 3:
        column_1_list = ['A1','A2','A3']     # sample_plate_1 initial Wells
        column_2_list = ['A1','A2','A3']     # CleanupPlate_1 - Cleanup #1
        column_3_list = ['A7','A8','A9']     # sample_plate_1 PCR Wells
        column_4_list = ['A1','A2','A3']     # sample_plate_2 - Cleanup #2 1st Cut
        column_5_list = ['A7','A8','A9']     # CleanupPlate_1 - Cleanup #2 2nd Cut
        column_6_list = ['A7','A8','A9']     # sample_plate_2 Final Libraries
        BEAD_list = ['A1','A1','A1']         # order of Bead Wells
        ETOH_1_list = ['A4','A4','A4']       # order of ETOH Wells
        ETOH_2_list = ['A4','A4','A4']       # order of ETOH Wells
        barcodes = ['A7','A8','A9']          # order of Barcode Wells
    if COLUMNS == 4:
        column_1_list = ['A1','A2','A3','A4']     # sample_plate_1 initial Wells
        column_2_list = ['A1','A2','A3','A4']     # CleanupPlate_1 - Cleanup #1
        column_3_list = ['A7','A8','A9','A10']    # sample_plate_1 PCR Wells
        column_4_list = ['A1','A2','A3','A4']     # sample_plate_2 - Cleanup #2 1st Cut
        column_5_list = ['A7','A8','A9','A10']    # CleanupPlate_1 - Cleanup #2 2nd Cut
        column_6_list = ['A7','A8','A9','A10']    # sample_plate_2 Final Libraries
        BEAD_list = ['A1','A1','A2','A2']         # order of Bead Wells
        ETOH_1_list = ['A4','A4','A5','A5']       # order of ETOH Wells
        ETOH_2_list = ['A4','A4','A5','A5']       # order of ETOH Wells
        barcodes = ['A7','A8','A9','A10']         # order of Barcode Wells
    if COLUMNS == 5:
        column_1_list = ['A1','A2','A3','A4','A5']     # sample_plate_1 initial Wells
        column_2_list = ['A1','A2','A3','A4','A5']     # CleanupPlate_1 - Cleanup #1
        column_3_list = ['A7','A8','A9','A10','A11']   # sample_plate_1 PCR Wells
        column_4_list = ['A1','A2','A3','A4','A5']     # sample_plate_2 - Cleanup #2 1st Cut
        column_5_list = ['A7','A8','A9','A10','A11']   # CleanupPlate_1 - Cleanup #2 2nd Cut
        column_6_list = ['A7','A8','A9','A10','A11']   # sample_plate_2 Final Libraries
        BEAD_list = ['A1','A1','A2','A2','A3']         # order of Bead Wells
        ETOH_1_list = ['A4','A4','A5','A5','A6']       # order of ETOH Wells
        ETOH_2_list = ['A4','A4','A5','A5','A6']       # order of ETOH Wells
        barcodes = ['A7','A8','A9','A10','A11']        # order of Barcode Wells
    if COLUMNS == 6:
        column_1_list = ['A1','A2','A3','A4','A5','A6']     # sample_plate_1 initial Wells
        column_2_list = ['A1','A2','A3','A4','A5','A6']     # CleanupPlate_1 - Cleanup #1
        column_3_list = ['A7','A8','A9','A10','A11','A12']  # sample_plate_1 PCR Wells
        column_4_list = ['A1','A2','A3','A4','A5','A6']     # sample_plate_2 - Cleanup #2 1st Cut
        column_5_list = ['A7','A8','A9','A10','A11','A12']  # CleanupPlate_1 - Cleanup #2 2nd Cut
        column_6_list = ['A7','A8','A9','A10','A11','A12']  # sample_plate_2 Final Libraries
        BEAD_list = ['A1','A1','A2','A2','A3','A3']         # order of Bead Wells
        ETOH_1_list = ['A4','A4','A5','A5','A6','A6']       # order of ETOH Wells
        ETOH_2_list = ['A4','A4','A5','A5','A6','A6']       # order of ETOH Wells
        barcodes = ['A7','A8','A9','A10','A11','A12']       # order of Barcode Wells

    # ============================ CUSTOM OFFSETS ===========================
    # These are Custom Offsets which are a PER INSTRUMENT Setting, to account for slight adjustments of the gripper calibration or labware.
    if CUSTOM_OFFSETS == True:
        PCRPlate_Z_offset = 1
        Deepwell_Z_offset = 1
        # HEATERSHAKER OFFSETS
        hs_drop_offset={'x':0,'y':0,'z':0}
        hs_pick_up_offset={'x':0,'y':0,'z':0}
        # MAG BLOCK OFFSETS
        mb_drop_offset={'x':0,'y':0.,'z':0.5}
        mb_pick_up_offset={'x':0,'y':0,'z':0}
        # THERMOCYCLER OFFSETS
        tc_drop_offset={'x':0,'y':0,'z':0}
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
        protocol.comment("SETTING THERMO and TEMP BLOCK Temperature: ON")
        if ONDECK_THERMO == True: thermocycler.set_block_temperature(10)
        if ONDECK_THERMO == True: thermocycler.set_lid_temperature(100)    
        if ONDECK_TEMP == True: temp_block.set_temperature(4)
    protocol.pause("Ready")
    if ONDECK_HEATERSHAKER == True: heatershaker.close_labware_latch() 
    Liquid_trash = Liquid_trash_well_1
    loop = 0
    # =================================================================================================
    # ========================================= PROTOCOL START ========================================
    # =================================================================================================

    if STEP_3LIG == True:
        protocol.comment('==============================================')
        protocol.comment('--> Ligation')
        protocol.comment('==============================================')

        protocol.comment('--> Adding 3-Lig')
        Adapt3LigBuffVol = 15
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_1_list):
            p50.pick_up_tip()
            p50.aspirate(Adapt3LigBuffVol, Adapt3lig.bottom(z=PCRPlate_Z_offset+0.5), rate=0.1)
            protocol.delay(seconds=7)
            p50.default_speed = 5
            p50.move_to(Adapt3lig.top(z=0))
            p50.default_speed = 400
            protocol.delay(seconds=5)
            p50.touch_tip(speed=50)

            p50.dispense(Adapt3LigBuffVol, sample_plate_1.wells_by_name()[X].bottom(z=PCRPlate_Z_offset), rate=0.1)
            protocol.delay(seconds=7)

            p50.aspirate(10, sample_plate_1.wells_by_name()[X].bottom(z=PCRPlate_Z_offset), rate=0.1)
            protocol.delay(seconds=3)
            p50.dispense(10, sample_plate_1.wells_by_name()[X].bottom(z=PCRPlate_Z_offset), rate=0.2)
            protocol.delay(seconds=3)
            p50.aspirate(10, sample_plate_1.wells_by_name()[X].bottom(z=PCRPlate_Z_offset), rate=0.3)
            protocol.delay(seconds=3)
            p50.dispense(10, sample_plate_1.wells_by_name()[X].bottom(z=PCRPlate_Z_offset), rate=0.5)
            protocol.delay(seconds=3)

            p50.default_speed = 5
            p50.move_to(sample_plate_1[X].top(z=-3))
            protocol.delay(seconds=3)
            p50.default_speed = 400
            p50.blow_out(sample_plate_1[X].top(z=-3))
            p50.touch_tip(speed=50)

            p50.drop_tip() if DRYRUN == 'NO' else p50.return_tip()
        #===============================================

    if STEP_3LIGDECK == True:
        ############################################################################################################################################
        if ONDECK_THERMO == True:
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_3Lig = [
                    {'temperature': 28, 'hold_time_minutes': 60},
                    {'temperature': 65, 'hold_time_minutes': 20},
                    {'temperature': 4, 'hold_time_minutes': 5}
                    ]
                thermocycler.execute_profile(steps=profile_3Lig, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
        else:
            protocol.comment('PAUSE THERMO')
        ############################################################################################################################################

    if STEP_5LIG == True:
        protocol.comment('==============================================')
        protocol.comment('--> Ligation')
        protocol.comment('==============================================')

        if REAGENT_PAUSE == True:
            protocol.pause('Add 5-lig in Column 2 of Reagent Plate')

        protocol.comment('--> Adding 5-Lig')
        Adapt5LigBuffVol = 20
        Adapt5LigMixRep = 3 if DRYRUN == False else 1
        Adapt5LigMixVol = 20
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_1_list):
            p50.pick_up_tip()
            p50.aspirate(Adapt5LigBuffVol, Adapt5lig.bottom(z=PCRPlate_Z_offset+0.5), rate=0.1)
            protocol.delay(seconds=5)
            p50.aspirate(2, Adapt5lig.top(z=-3), rate=0.1)
            p50.dispense(2, sample_plate_1.wells_by_name()[X].bottom(z=PCRPlate_Z_offset+2), rate=0.1)
            p50.dispense(Adapt5LigBuffVol, sample_plate_1.wells_by_name()[X].bottom(z=PCRPlate_Z_offset+1), rate=0.1)
            protocol.delay(seconds=5)
            p50.mix(Adapt5LigMixRep,Adapt5LigMixVol, rate=0.5)
            p50.default_speed = 5
            p50.move_to(sample_plate_1[X].top(z=-5))
            protocol.delay(seconds=3)
            p50.default_speed = 400
            p50.blow_out(sample_plate_1[X].top(z=-5))
            p50.touch_tip(speed=50)
            p50.drop_tip() if DRYRUN == 'NO' else p50.return_tip()
        #===============================================

    if STEP_5LIGDECK == True:
        ############################################################################################################################################
        if ONDECK_THERMO == True:
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_3Lig = [
                    {'temperature': 28, 'hold_time_minutes': 30},
                    {'temperature': 65, 'hold_time_minutes': 20}
                    ]
                thermocycler.execute_profile(steps=profile_3Lig, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
        else:
            protocol.comment('PAUSE THERMO')
        ############################################################################################################################################

    if STEP_RTI == True:

        if COLUMNS == 6:
            #============================================================================================
            # GRIPPER MOVE (tiprack_50_1) DECK --> TRASH
            protocol.move_labware(labware=tiprack_50_1,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            heatershaker.open_labware_latch()
            # GRIPPER MOVE (reservoir) heatershaker --> DECK
            protocol.move_labware(labware=reservoir,new_location='C2',use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=deck_drop_offset)
            # GRIPPER MOVE (CleanupPlate_1) mag block --> heatershaker
            protocol.move_labware(labware=CleanupPlate_1,new_location=heatershaker,use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=hs_drop_offset)
            heatershaker.close_labware_latch()
            #============================================================================================

        protocol.comment('==============================================')
        protocol.comment('--> Reverse Transcriptase')
        protocol.comment('==============================================')

        if REAGENT_PAUSE == True:
            protocol.pause('Add RTI in Column 3 of Reagent Plate')

        protocol.comment('--> Adding RTI')
        RTIVol = 2
        RTIMixRep = 5 if DRYRUN == False else 1
        RTIMixVol = 20
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_1_list):
            p50.pick_up_tip()
            p50.aspirate(RTIVol, RTI.bottom(z=PCRPlate_Z_offset+0.5), rate=0.1)
            p50.dispense(RTIVol, sample_plate_1.wells_by_name()[X].bottom(z=PCRPlate_Z_offset+0.5), rate=0.25)
            p50.mix(RTIMixRep,RTIMixVol, rate=0.5)
            p50.move_to(sample_plate_1[X].top(z=-3))
            protocol.delay(seconds=3)
            p50.blow_out(sample_plate_1[X].top(z=-3))
            p50.move_to(sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
            p50.move_to(sample_plate_1[X].top(z=-3))
            p50.drop_tip() if DRYRUN == 'NO' else p50.return_tip()
        #===============================================

    if STEP_RTIDECK == True:
        ############################################################################################################################################
        if ONDECK_THERMO == True:
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_RTI = [
                    {'temperature': 75, 'hold_time_minutes': 2},
                    {'temperature': 70, 'hold_time_minutes': 2},
                    {'temperature': 65, 'hold_time_minutes': 2},
                    {'temperature': 60, 'hold_time_minutes': 2},
                    {'temperature': 55, 'hold_time_minutes': 2},
                    {'temperature': 37, 'hold_time_minutes': 2},
                    {'temperature': 25, 'hold_time_minutes': 2},
                    {'temperature': 4, 'hold_time_minutes': 5}
                    ]
                thermocycler.execute_profile(steps=profile_RTI, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
        else:
            protocol.comment('PAUSE THERMO')
        ############################################################################################################################################

    if STEP_RT == True:
        protocol.comment('==============================================')
        protocol.comment('--> Reverse Transcriptase')
        protocol.comment('==============================================')

        if REAGENT_PAUSE == True:
            protocol.pause('Add RT in Column 3 of Reagent Plate')

        protocol.comment('--> Adding RT')
        RTVol = 18
        RTMixRep = 5 if DRYRUN == False else 1
        RTMixVol = 20
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_1_list):
            p50.pick_up_tip()
            p50.aspirate(RTVol, RT.bottom(z=PCRPlate_Z_offset+0.5), rate=0.1)
            protocol.delay(seconds=5)
            p50.aspirate(2, RT.top(z=-3), rate=0.1)
            p50.dispense(2, sample_plate_1.wells_by_name()[X].bottom(z=PCRPlate_Z_offset+2), rate=0.5)
            p50.dispense(RTVol, sample_plate_1.wells_by_name()[X].bottom(z=PCRPlate_Z_offset+0.5), rate=0.5)
            p50.mix(RTMixRep,RTMixVol, rate=0.5)
            p50.default_speed = 5
            p50.move_to(sample_plate_1[X].top(z=-3))
            protocol.delay(seconds=3)
            p50.default_speed = 400
            p50.blow_out(sample_plate_1[X].top(z=-3))
            protocol.delay(seconds=3)
            p50.touch_tip(speed=50)
            p50.move_to(sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
            p50.move_to(sample_plate_1[X].top(z=-3))
            p50.drop_tip() if DRYRUN == 'NO' else p50.return_tip()
        #===============================================

    if STEP_RTDECK == True:
        ############################################################################################################################################
        if ONDECK_THERMO == True:
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_RT = [
                    {'temperature': 50, 'hold_time_minutes': 60},
                    {'temperature': 70, 'hold_time_minutes': 15},
                    {'temperature': 4, 'hold_time_minutes': 5}
                    ]
                thermocycler.execute_profile(steps=profile_RT, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
        else:
            protocol.comment('PAUSE THERMO')
        ############################################################################################################################################

    if STEP_CLEANUP_1 == True:
        protocol.comment('==============================================')
        protocol.comment('--> Cleanup 1')
        protocol.comment('==============================================')

        if TEMP_OFF_INACT == True:
            protocol.comment("SETTING THERMO and TEMP BLOCK Temperature: OFF")
            if ONDECK_THERMO == True: thermocycler.deactivate_block()
            if ONDECK_THERMO == True: thermocycler.deactivate_lid()
            if ONDECK_TEMP == True: temp_block.deactivate()

        if COLUMNS > 3:
            #============================================================================================
            # GRIPPER MOVE (tiprack_50_2) DECK --> TRASH
            protocol.move_labware(labware=tiprack_50_2,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            # GRIPPER MOVE (tiprack_50_4) OFF DECK --> DECK
            protocol.move_labware(labware=tiprack_50_4,new_location='B2',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        
        protocol.comment('--> ADDING AMPure (0.8x)')
        AMPureVol = 75
        SampleVol = 50
        AMPureMixRPM = 1600
        AMPureMixTime = 5*60 if DRYRUN == False else 0.1*60
        AMPurePremix = 3 if DRYRUN == False else 1
        TransferSup = 60
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_2_list):
            p1000.pick_up_tip()
            p1000.mix(AMPurePremix,AMPureVol+3, reservoir[BEAD_list[loop]].bottom(z=1), rate=0.25)
            p1000.aspirate(AMPureVol+3, reservoir[BEAD_list[loop]].bottom(z=1), rate=0.25)
            p1000.dispense(3, reservoir[BEAD_list[loop]].bottom(z=1), rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(reservoir[BEAD_list[loop]].top(z=-3))
            #=====Reservoir Tip Touch========
            p1000.default_speed = 100
            p1000.move_to(reservoir[BEAD_list[loop]].top().move(types.Point(x=4,z=-3)))
            p1000.move_to(reservoir[BEAD_list[loop]].top().move(types.Point(x=-4,z=-3)))
            p1000.default_speed = 400
            #================================                
            p1000.dispense(AMPureVol, CleanupPlate_1[X].bottom(z=0.25), rate=0.25)

            protocol.comment('--> Transferring Supernatant')
            p1000.move_to(sample_plate_1[column_1_list[loop]].bottom(z=PCRPlate_Z_offset+0.5))
            p1000.aspirate(TransferSup/2, rate=0.25)
            p1000.dispense(TransferSup/2, CleanupPlate_1[X].bottom(z=1), rate=0.5)
            p1000.move_to(CleanupPlate_1[column_1_list[loop]].bottom(z=PCRPlate_Z_offset+0.2))
            p1000.aspirate(TransferSup/2, rate=0.25)
            p1000.dispense(TransferSup/2, CleanupPlate_1[X].bottom(z=1), rate=0.5)

            p1000.move_to(CleanupPlate_1[X].bottom(z=3))
            if TIP_MIX == False:
                AmpureMixRep = 2
            if TIP_MIX == True:
                AmpureMixRep = 10
            for Mix in range(AmpureMixRep):
                p1000.aspirate(70, rate=0.5)
                p1000.move_to(CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+0.25))
                p1000.aspirate(20, rate=0.5)
                p1000.dispense(20, rate=0.5)
                p1000.move_to(CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+3))
                p1000.dispense(70, rate=0.5)
                Mix += 1
            p1000.move_to(CleanupPlate_1[X].top(z=-3))
            protocol.delay(seconds=1)
            p1000.blow_out(CleanupPlate_1[X].top(z=-3))
            p1000.touch_tip(speed=100)
            p1000.default_speed = 400
            p1000.move_to(CleanupPlate_1[X].top(z=5))
            p1000.move_to(CleanupPlate_1[X].top(z=0))
            p1000.move_to(CleanupPlate_1[X].top(z=5))
            p1000.drop_tip() if DRYRUN == 'NO' else p1000.return_tip()
        #===============================================
        if TIP_MIX == False:
            heatershaker.set_and_wait_for_shake_speed(rpm=AMPureMixRPM)
            protocol.delay(AMPureMixTime)
            heatershaker.deactivate_shaker()

        if DRYRUN == False:
            protocol.delay(minutes=4)

        #============================================================================================
        # GRIPPER MOVE (CleanupPlate_1) FROM HEATERSHAKER --> MAG BLOCK
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_1,new_location=mag_block, use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=mb_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_1,new_location=mag_block, use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
        #============================================================================================

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        ActualRemoveSup = 50
        #===============================================
        for loop, X in enumerate(column_2_list):
            p1000.pick_up_tip()
            p1000.move_to(CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+3))
            p1000.aspirate(RemoveSup-100, rate=0.25)
            protocol.delay(seconds=3)
            p1000.move_to(CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+0.5))
            p1000.aspirate(100, rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+5))
            p1000.default_speed = 200
            p1000.touch_tip(speed=100)
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul tp '+str(WASTEVOL))
            if WASTEVOL <14400:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400 and WASTEVOL <28800:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=28800 and WASTEVOL <43200:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=43200:
                Liquid_trash = Liquid_trash_well_4
            #================================ 
            p1000.dispense(RemoveSup, Liquid_trash.top(z=-3), rate=0.5)
            protocol.delay(seconds=1)
            p1000.blow_out()
            #=====Reservoir Tip Touch========
            p1000.default_speed = 100
            p1000.move_to(Liquid_trash.top().move(types.Point(x=4,z=-3)))
            p1000.move_to(Liquid_trash.top().move(types.Point(x=-4,z=-3)))
            p1000.default_speed = 400
            #================================  
            p1000.move_to(Liquid_trash.top(z=-5))
            p1000.move_to(Liquid_trash.top(z=0))
            p1000.drop_tip() if DRYRUN == 'NO' else p1000.return_tip()
        #===============================================

        for X in range(2):
            protocol.comment('--> ETOH Wash')
            ETOHMaxVol = 150
            p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
            p50.flow_rate.dispense = p50_flow_rate_dispense_default
            p50.flow_rate.blow_out = p50_flow_rate_blow_out_default
            #===============================================
            p1000.pick_up_tip()
            for loop, X in enumerate(column_2_list):
                p1000.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_1_list[loop]].bottom(z=Deepwell_Z_offset+1))
                p1000.move_to(reservoir.wells_by_name()[ETOH_1_list[loop]].top(z=0))
                p1000.move_to(reservoir.wells_by_name()[ETOH_1_list[loop]].top(z=-5))    
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(reservoir.wells_by_name()[ETOH_1_list[loop]].top().move(types.Point(x=4,z=-3)))
                p1000.move_to(reservoir.wells_by_name()[ETOH_1_list[loop]].top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================ 
                p1000.move_to(CleanupPlate_1[X].top(z=2))
                p1000.dispense(ETOHMaxVol, rate=0.75)
                protocol.delay(seconds=2)
                p1000.blow_out(CleanupPlate_1[X].top(z=0))
                p1000.move_to(CleanupPlate_1[X].top(z=5))
                p1000.move_to(CleanupPlate_1[X].top(z=0))
                p1000.move_to(CleanupPlate_1[X].top(z=5))
            p1000.drop_tip() if DRYRUN == 'NO' else p1000.return_tip()
            #===============================================

            if DRYRUN == False:
                protocol.delay(minutes=0.5)

            protocol.comment('--> Remove ETOH Wash')
            RemoveSup = 200
            ActualRemoveSup = 150
            p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
            p50.flow_rate.dispense = p50_flow_rate_dispense_default
            p50.flow_rate.blow_out = p50_flow_rate_blow_out_default
            #===============================================
            for loop, X in enumerate(column_2_list):
                p1000.pick_up_tip()
                p1000.move_to(CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+3))
                p1000.aspirate(RemoveSup-100, rate=0.25)
                protocol.delay(seconds=3)
                p1000.move_to(CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+0.75))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+5))
                p1000.default_speed = 200
                p1000.touch_tip(speed=100)
                #======L Waste Volume Check======
                WASTEVOL+=(ActualRemoveSup*8)
                protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul tp '+str(WASTEVOL))
                if WASTEVOL <14400:
                    Liquid_trash = Liquid_trash_well_1
                if WASTEVOL >=14400 and WASTEVOL <28800:
                    Liquid_trash = Liquid_trash_well_2
                if WASTEVOL >=28800 and WASTEVOL <43200:
                    Liquid_trash = Liquid_trash_well_3
                if WASTEVOL >=43200:
                    Liquid_trash = Liquid_trash_well_4
                #================================ 
                p1000.dispense(200, Liquid_trash.top(z=-3))
                protocol.delay(seconds=2)
                p1000.blow_out()
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(Liquid_trash.top().move(types.Point(x=4,z=-3)))
                p1000.move_to(Liquid_trash.top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================
                p1000.move_to(Liquid_trash.top(z=-5))
                p1000.move_to(Liquid_trash.top(z=0))
                p1000.drop_tip() if DRYRUN == 'NO' else p1000.return_tip()
            #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=3)

        #============================================================================================
        # GRIPPER MOVE (CleanupPlate_1) FROM MAG BLOCK --> HEATERSHAKER
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_1,new_location=heatershaker,use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=hs_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_1,new_location='D1',use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        if REAGENT_PAUSE == True:
            protocol.pause('Add RSB in Column 6 of Reagent Plate')

        protocol.comment('--> Adding RSB')
        RSBVol = 27
        RSBMixRPM = 2000
        RSBMixTime = 5*60 if DRYRUN == False else 0.1*60
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_2_list):
            p50.pick_up_tip()
            p50.aspirate(RSBVol, RSB.bottom(z=Deepwell_Z_offset+1), rate=0.25)
            p50.move_to(CleanupPlate_1.wells_by_name()[X].top(z=3))
            p50.dispense(RSBVol, rate=0.75)
            p50.blow_out(CleanupPlate_1.wells_by_name()[X].top(z=3))
            p50.drop_tip() if DRYRUN == 'NO' else p50.return_tip()
        #===============================================
        if TIP_MIX == False:
            heatershaker.set_and_wait_for_shake_speed(rpm=RSBMixRPM)
            protocol.delay(RSBMixTime)
            heatershaker.deactivate_shaker()
        
        #============================================================================================
        # GRIPPER MOVE (CleanupPlate_1) FROM HEATERSHAKER --> MAG BLOCK
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_1,new_location=mag_block, use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=mb_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_1,new_location=mag_block, use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=3)

        protocol.comment('--> Transferring Supernatant')
        TransferSup = 25
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_2_list):
            p50.pick_up_tip()
            p50.move_to(CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+0.1))
            p50.aspirate(TransferSup, rate=0.25)
            p50.dispense(TransferSup, sample_plate_1[column_3_list[loop]].bottom(z=1), rate=0.5)
            p50.drop_tip() if DRYRUN == 'NO' else p50.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE (CleanupPlate_1) FROM MAG BLOCK --> HEATERSHAKER
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_1,new_location=heatershaker,use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=hs_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_1,new_location='D1',use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        if TEMP_OFF_INACT == True:
            protocol.comment("SETTING THERMO and TEMP BLOCK Temperature: ON")
            if ONDECK_THERMO == True: thermocycler.set_block_temperature(10)
            if ONDECK_THERMO == True: thermocycler.set_lid_temperature(100)    
            if ONDECK_TEMP == True: temp_block.set_temperature(4)

    if STEP_PCR == True:
        protocol.comment('==============================================')
        protocol.comment('--> Amplification')
        protocol.comment('==============================================')

        if REAGENT_PAUSE == True:
            protocol.pause('Add PCR in Column 5 of Reagent Plate')

        if REAGENT_PAUSE == True:
            protocol.pause('Add Barcodes in Column 7 to 12 (depending on how many columns are being processed) of Reagent Plate')

        protocol.comment('--> Adding Barcode')
        BarcodeVol    = 5
        BarcodeMixRep = 3 if DRYRUN == False else 1
        BarcodeMixVol = 10
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_3_list):
            p50.pick_up_tip()
            p50.aspirate(BarcodeVol, reagent_plate_1.wells_by_name()[barcodes[loop]].bottom(z=PCRPlate_Z_offset), rate=0.25)
            p50.dispense(BarcodeVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1), rate=0.25)    
            p50.mix(BarcodeMixRep,BarcodeMixVol, rate=0.5)
            p50.move_to(sample_plate_1[X].top(z=-3))
            protocol.delay(seconds=3)
            p50.blow_out(sample_plate_1[X].top(z=-3))
            p50.drop_tip() if DRYRUN == 'NO' else p50.return_tip()
        #===============================================

        protocol.comment('--> Adding PCR')
        PCRVol = 20
        PCRMixRep = 10 if DRYRUN == False else 1
        PCRMixVol = 45
        PCRPremix = 2 if DRYRUN == False else 1
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_3_list):
            p50.pick_up_tip()
            p50.mix(PCRPremix, PCRVol, PCR.bottom(z=PCRPlate_Z_offset+0.5), rate=0.25)
            p50.aspirate(PCRVol, PCR.bottom(z=PCRPlate_Z_offset+0.5), rate=0.25)
            p50.dispense(PCRVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p50.mix(PCRMixRep, PCRMixVol, rate=0.5)
            p50.move_to(sample_plate_1[X].top(z=-3))
            protocol.delay(seconds=3)
            p50.blow_out(sample_plate_1[X].top(z=-3))
            p50.drop_tip() if DRYRUN == 'NO' else p50.return_tip()
        #===============================================

    if STEP_PCRDECK == True:
        ############################################################################################################################################
        if ONDECK_THERMO == True:    
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_PCR_1 = [
                    {'temperature': 95, 'hold_time_seconds': 15*60}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_1, repetitions=1, block_max_volume=50)
                profile_PCR_2 = [
                    {'temperature': 95, 'hold_time_seconds': 15},
                    {'temperature': 60, 'hold_time_seconds': 30},
                    {'temperature': 72, 'hold_time_seconds': 15}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_2, repetitions=PCRCYCLES, block_max_volume=50)
                profile_PCR_3 = [
                    {'temperature': 72, 'hold_time_minutes': 2}
                    ]
                thermocycler.execute_profile(steps=profile_PCR_3, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(10)
            thermocycler.open_lid()
        else:
            protocol.comment('Pausing to run ligation on an off deck Thermocycler ~15min')
        ############################################################################################################################################

    if STEP_CLEANUP_2 == True:
        protocol.comment('==============================================')
        protocol.comment('--> Cleanup 2')
        protocol.comment('==============================================')

        protocol.pause('Place sample_plate_2 in A4')

        if COLUMNS >3:
            sample_plate_2 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','A4','Sample Plate 2')
    
        #============================================================================================
        # GRIPPER MOVE (sample_plate_2) OFF DECK --> MAG BLOCK
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_2,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=sample_plate_2,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE (CleanupPlate_1) HEATER SHAKER --> 
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_1,new_location='A4',use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=deck_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_1,new_location='A4',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE (sample_plate_2) MAG BLOCK --> HEATERSHAKER
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_2,new_location=heatershaker,use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=hs_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=sample_plate_2,new_location='D1',use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        if TEMP_OFF_INACT == True:
            protocol.comment("SETTING THERMO and TEMP BLOCK Temperature: OFF")
            if ONDECK_THERMO == True: thermocycler.deactivate_block()
            if ONDECK_THERMO == True: thermocycler.deactivate_lid()
            if ONDECK_TEMP == True: temp_block.deactivate()

        protocol.comment('--> ADDING AMPure (0.8x)')
        AMPureVol = 75
        SampleVol = 50
        AMPureMixRPM = 1200
        AMPureMixTime = 5*60 if DRYRUN == False else 0.1*60
        AMPurePremix = 3 if DRYRUN == False else 1
        TransferSup = 50
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_4_list):
            p1000.pick_up_tip()
            p1000.mix(AMPurePremix,AMPureVol+3, reservoir[BEAD_list[loop]].bottom(z=1), rate=0.25)
            p1000.aspirate(AMPureVol+3, reservoir[BEAD_list[loop]].bottom(z=1), rate=0.25)
            p1000.dispense(3, reservoir[BEAD_list[loop]].bottom(z=1), rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(reservoir[BEAD_list[loop]].top(z=-3))
            #=====Reservoir Tip Touch========
            p1000.default_speed = 100
            p1000.move_to(reservoir[BEAD_list[loop]].top().move(types.Point(x=4,z=-3)))
            p1000.move_to(reservoir[BEAD_list[loop]].top().move(types.Point(x=-4,z=-3)))
            p1000.default_speed = 400
            #================================                
            p1000.dispense(AMPureVol, sample_plate_2[X].bottom(z=0.25), rate=0.25)

            protocol.comment('--> Transferring Supernatant')
            p1000.move_to(sample_plate_1[column_3_list[loop]].bottom(z=PCRPlate_Z_offset+0.5))
            p1000.aspirate(TransferSup/2, rate=0.25)
            p1000.dispense(TransferSup/2, sample_plate_2[X].bottom(z=1), rate=0.5)
            p1000.move_to(sample_plate_1[column_3_list[loop]].bottom(z=PCRPlate_Z_offset+0.2))
            p1000.aspirate(TransferSup/2, rate=0.25)
            p1000.dispense(TransferSup/2, sample_plate_2[X].bottom(z=1), rate=0.5)
            p1000.move_to(sample_plate_2[X].bottom(z=3))
            if TIP_MIX == False:
                AmpureMixRep = 2
            if TIP_MIX == True:
                AmpureMixRep = 10
            for Mix in range(AmpureMixRep):
                p1000.aspirate(70, rate=0.5)
                p1000.move_to(sample_plate_2[X].bottom(z=Deepwell_Z_offset+0.25))
                p1000.aspirate(20, rate=0.5)
                p1000.dispense(20, rate=0.5)
                p1000.move_to(sample_plate_2[X].bottom(z=Deepwell_Z_offset+3))
                p1000.dispense(70, rate=0.5)
                Mix += 1
            p1000.move_to(sample_plate_2[X].top(z=-3))
            protocol.delay(seconds=1)
            p1000.blow_out(sample_plate_2[X].top(z=-3))
            p1000.touch_tip(speed=100)
            p1000.default_speed = 400
            p1000.move_to(sample_plate_2[X].top(z=5))
            p1000.move_to(sample_plate_2[X].top(z=0))
            p1000.move_to(sample_plate_2[X].top(z=5))
            p1000.drop_tip() if DRYRUN == 'NO' else p1000.return_tip()
        #===============================================
        if TIP_MIX == False:
            heatershaker.set_and_wait_for_shake_speed(rpm=AMPureMixRPM)
            protocol.delay(AMPureMixTime)
            heatershaker.deactivate_shaker()

        #============================================================================================
        # GRIPPER MOVE (sample_plate_2) HEATER SHAKER --> MAG BLOCK
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_2,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=mb_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=sample_plate_2,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE (CleanupPlate_1) OFF DECK --> HEATER SHAKER
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_1,new_location=heatershaker,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=hs_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_1,new_location='D1',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE (sample_plate_1) Thermocycler --> TRASH
        protocol.move_labware(labware=sample_plate_1,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=tc_pick_up_offset)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=4)

        if COLUMNS == 6:
            #============================================================================================
            # GRIPPER MOVE (tiprack_50_2) DECK --> TRASH
            protocol.move_labware(labware=tiprack_50_3,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            # GRIPPER MOVE (tiprack_50_4) OFF DECK --> DECK
            protocol.move_labware(labware=tiprack_200_4,new_location='A2',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================

        protocol.comment('--> ADDING AMPure (0.8x)')
        AMPureVol = 130
        SampleVol = 50
        AMPureMixRPM = 1600
        AMPureMixTime = 5*60 if DRYRUN == False else 0.1*60
        AMPurePremix = 3 if DRYRUN == False else 1
        TransferSup = 50
        #===============================================
        for loop, X in enumerate(column_5_list):
            p1000.pick_up_tip()
            p1000.mix(AMPurePremix,AMPureVol+3, reservoir[BEAD_list[loop]].bottom(z=1), rate=0.25)
            p1000.aspirate(AMPureVol+3, reservoir[BEAD_list[loop]].bottom(z=1), rate=0.25)
            p1000.dispense(3, reservoir[BEAD_list[loop]].bottom(z=1), rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(reservoir[BEAD_list[loop]].top(z=-3))
            #=====Reservoir Tip Touch========
            p1000.default_speed = 100
            p1000.move_to(reservoir[BEAD_list[loop]].top().move(types.Point(x=4,z=-3)))
            p1000.move_to(reservoir[BEAD_list[loop]].top().move(types.Point(x=-4,z=-3)))
            p1000.default_speed = 400
            #================================                
            p1000.dispense(AMPureVol, CleanupPlate_1[X].bottom(z=0.25), rate=0.25)

            protocol.comment('--> Transferring Samples')
            #================================                
            p1000.move_to(sample_plate_2[column_4_list[loop]].bottom(z=0.3))
            p1000.aspirate(TransferSup/2, rate=0.25)
            protocol.delay(seconds=0.2)
            p1000.move_to(sample_plate_2[column_4_list[loop]].bottom(z=0.1))
            p1000.aspirate(TransferSup/2, rate=0.25)
            p1000.dispense(TransferSup, CleanupPlate_1[X].bottom(z=1))
            #================================    

            p1000.move_to(CleanupPlate_1[X].bottom(z=3))

            if TIP_MIX == False:
                AmpureMixRep = 2
            if TIP_MIX == True:
                AmpureMixRep = 10
            for Mix in range(AmpureMixRep):
                p1000.aspirate(70, rate=0.5)
                p1000.move_to(CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+0.25))
                p1000.aspirate(20, rate=0.5)
                p1000.dispense(20, rate=0.5)
                p1000.move_to(CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+3))
                p1000.dispense(70, rate=0.5)
                Mix += 1

            p1000.move_to(CleanupPlate_1[X].top(z=-3))
            protocol.delay(seconds=1)
            p1000.blow_out(CleanupPlate_1[X].top(z=-3))
            p1000.touch_tip(speed=100)
            p1000.default_speed = 400
            p1000.move_to(CleanupPlate_1[X].top(z=5))
            p1000.move_to(CleanupPlate_1[X].top(z=0))
            p1000.move_to(CleanupPlate_1[X].top(z=5))
            p1000.drop_tip() if DRYRUN == 'NO' else p1000.return_tip()
        #===============================================
        if TIP_MIX == False:
            heatershaker.set_and_wait_for_shake_speed(rpm=AMPureMixRPM)
            protocol.delay(AMPureMixTime)
            heatershaker.deactivate_shaker()
        
        #============================================================================================
        # GRIPPER MOVE (sample_plate_2) HEATER SHAKER --> MAG BLOCK
        if ONDECK_THERMO == True:
            protocol.move_labware(labware=sample_plate_2,new_location=thermocycler,use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=tc_drop_offset)
        else:
            protocol.move_labware(labware=sample_plate_2,new_location='B1',use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE (CleanupPlate_1) FROM HEATER SHAKER TO MAG BLOCK
        if ONDECK_HEATERSHAKER == True:        
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_1,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=mb_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_1,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
        #============================================================================================
        
        if DRYRUN == False:
            protocol.delay(minutes=4)

        protocol.comment('--> Removing Supernatant')
        RemoveSup = 200
        ActualRemoveSup = 150
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_5_list):
            p1000.pick_up_tip()
            p1000.move_to(CleanupPlate_1[X].bottom(z=3))
            p1000.aspirate(RemoveSup-100, rate=0.25)
            protocol.delay(seconds=3)
            p1000.move_to(CleanupPlate_1[X].bottom(z=0.5))
            p1000.aspirate(100, rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(CleanupPlate_1[X].top(z=-2))
            p1000.default_speed = 200
            p1000.touch_tip(speed=100)
            #======L Waste Volume Check======
            WASTEVOL+=(ActualRemoveSup*8)
            protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul tp '+str(WASTEVOL))
            if WASTEVOL <14400:
                Liquid_trash = Liquid_trash_well_1
            if WASTEVOL >=14400 and WASTEVOL <28800:
                Liquid_trash = Liquid_trash_well_2
            if WASTEVOL >=28800 and WASTEVOL <43200:
                Liquid_trash = Liquid_trash_well_3
            if WASTEVOL >=43200:
                Liquid_trash = Liquid_trash_well_4
            #================================ 
            p1000.dispense(200, Liquid_trash.top(z=-3), rate=0.5)
            protocol.delay(seconds=1)
            p1000.blow_out()
            #=====Reservoir Tip Touch========
            p1000.default_speed = 100
            p1000.move_to(Liquid_trash.top().move(types.Point(x=4,z=-3)))
            p1000.move_to(Liquid_trash.top().move(types.Point(x=-4,z=-3)))
            p1000.default_speed = 400
            #================================  
            p1000.move_to(Liquid_trash.top(z=-5))
            p1000.move_to(Liquid_trash.top(z=0))
            p1000.drop_tip() if DRYRUN == 'NO' else p1000.return_tip()
        #===============================================

        if COLUMNS == 6:
            #============================================================================================
            # GRIPPER MOVE (tiprack_200_1) DECK --> TRASH
            protocol.move_labware(labware=tiprack_200_1,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            # GRIPPER MOVE (tiprack_200_5) OFF DECK --> DECK
            protocol.move_labware(labware=tiprack_200_5,new_location='C3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            # GRIPPER MOVE (tiprack_200_2) DECK --> TRASH
            protocol.move_labware(labware=tiprack_200_2,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            # GRIPPER MOVE (tiprack_50_5) OFF DECK --> DECK
            protocol.move_labware(labware=tiprack_50_5,new_location='B3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================

        for X in range(2):
            protocol.comment('--> ETOH Wash')
            ETOHMaxVol = 150
            p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            p1000.pick_up_tip()
            for loop, X in enumerate(column_5_list):
                p1000.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_2_list[loop]].bottom(z=1), rate=0.5)
                p1000.move_to(reservoir.wells_by_name()[ETOH_2_list[loop]].top(z=0))
                p1000.move_to(reservoir.wells_by_name()[ETOH_2_list[loop]].top(z=-5))    
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(reservoir.wells_by_name()[ETOH_2_list[loop]].top().move(types.Point(x=4,z=-3)))
                p1000.move_to(reservoir.wells_by_name()[ETOH_2_list[loop]].top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================           
                p1000.move_to(CleanupPlate_1[X].top(z=2))
                p1000.dispense(ETOHMaxVol, rate=0.75)
                protocol.delay(seconds=2)
                p1000.blow_out(CleanupPlate_1[X].top(z=0))
                p1000.move_to(CleanupPlate_1[X].top(z=5))
                p1000.move_to(CleanupPlate_1[X].top(z=0))
                p1000.move_to(CleanupPlate_1[X].top(z=5))
            p1000.drop_tip() if DRYRUN == 'NO' else p1000.return_tip()    
            #===============================================

            if DRYRUN == False:
                protocol.delay(minutes=0.5)

            protocol.comment('--> Remove ETOH Wash')
            RemoveSup = 200
            p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            for loop, X in enumerate(column_5_list):
                p1000.pick_up_tip()
                p1000.move_to(CleanupPlate_1[X].bottom(z=3))
                p1000.aspirate(RemoveSup-100, rate=0.25)
                protocol.delay(seconds=3)
                p1000.move_to(CleanupPlate_1[X].bottom(z=0.75))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(CleanupPlate_1[X].top(z=-2))
                p1000.default_speed = 200
                p1000.touch_tip(speed=100)
                #======L Waste Volume Check======
                WASTEVOL+=(ActualRemoveSup*8)
                protocol.comment('Adding '+str((ActualRemoveSup*8))+'ul tp '+str(WASTEVOL))
                if WASTEVOL <14400:
                    Liquid_trash = Liquid_trash_well_1
                if WASTEVOL >=14400 and WASTEVOL <28800:
                    Liquid_trash = Liquid_trash_well_2
                if WASTEVOL >=28800 and WASTEVOL <43200:
                    Liquid_trash = Liquid_trash_well_3
                if WASTEVOL >=43200:
                    Liquid_trash = Liquid_trash_well_4
                #================================ 
                p1000.dispense(200, Liquid_trash.top(z=-3))
                protocol.delay(seconds=2)
                p1000.blow_out()
                #=====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(Liquid_trash.top().move(types.Point(x=4,z=-3)))
                p1000.move_to(Liquid_trash.top().move(types.Point(x=-4,z=-3)))
                p1000.default_speed = 400
                #================================
                p1000.move_to(Liquid_trash.top(z=-5))
                p1000.move_to(Liquid_trash.top(z=0))
                p1000.drop_tip() if DRYRUN == 'NO' else p1000.return_tip()    
            #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=3)

        #============================================================================================
        # GRIPPER MOVE (CleanupPlate_1) FROM MAG BLOCK --> HEATERSHAKER
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_1,new_location=heatershaker, use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=hs_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_1,new_location='D1', use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        if COLUMNS == 3:
            #============================================================================================
            # GRIPPER MOVE (tiprack_200_1) DECK --> TRASH
            protocol.move_labware(labware=tiprack_200_1,new_location=TRASH,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset)
            # GRIPPER MOVE (tiprack_50_3) OFF DECK --> DECK
            protocol.move_labware(labware=tiprack_50_3,new_location='C3',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================

        if REAGENT_PAUSE == True:
            protocol.pause('Add RSB in Column 6 of Reagent Plate')

        protocol.comment('--> Adding RSB')
        RSBVol = 17
        RSBMixRPM = 2000
        RSBMixTime = 5*60 if DRYRUN == False else 0.1*60
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_5_list):
            p50.pick_up_tip()
            p50.aspirate(RSBVol+2, RSB.bottom(z=1))
            p50.dispense(2, RSB.bottom(z=1))
            p50.move_to(CleanupPlate_1.wells_by_name()[X].bottom(z=1))
            p50.dispense(RSBVol,CleanupPlate_1.wells_by_name()[X].bottom(z=1), rate=0.5)
            p50.blow_out(CleanupPlate_1.wells_by_name()[X].top(z=-3))
            p50.drop_tip() if DRYRUN == 'NO' else p50.return_tip()    
        #===============================================
        if TIP_MIX == False:
            heatershaker.set_and_wait_for_shake_speed(rpm=RSBMixRPM)
            protocol.delay(RSBMixTime)
            heatershaker.deactivate_shaker()

        #============================================================================================
        # GRIPPER MOVE (CleanupPlate_1) FROM HEATERSHAKER --> MAG BLOCK
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_1,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=mb_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_1,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=mb_drop_offset)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=3)

        protocol.comment('--> Transferring Supernatant')
        TransferSup = 15
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_5_list):
            p50.pick_up_tip()
            p50.move_to(CleanupPlate_1[X].bottom(z=0.5))
            p50.aspirate(TransferSup/2)
            protocol.delay(seconds=1)
            p50.move_to(CleanupPlate_1[X].bottom(z=0.2))
            p50.aspirate(TransferSup/2)
            p50.dispense(TransferSup, sample_plate_2[column_6_list[loop]].bottom(z=1), rate=0.5)
            p50.drop_tip() if DRYRUN == 'NO' else p50.return_tip()    
        #===============================================
    
    # =================================================================================================
    # ========================================== PROTOCOL END =========================================
    # =================================================================================================
    if DEACTIVATE_TEMP == True:
        if ONDECK_THERMO == True:
            thermocycler.deactivate_block()
            thermocycler.deactivate_lid()
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
        Sample_Volume = 5
        QBeads_Volume = COLUMNS*(400)
        Adapt3lig_Volume = COLUMNS*(15)
        Adapt5lig_Volume = COLUMNS*(20)
        RTI_Volume = COLUMNS*(2)
        RT_Volume = COLUMNS*(18)
        PCR_Volume = COLUMNS*(20)
        RSB_Volume = COLUMNS*(30)
        ETOH_Volume = COLUMNS*(150*2)*3

        TotalColumn = ['A','B','C','D','E','F','G','H']
        UsedColumn = ['A','B','C','D','E','F','G','H']

        # ======== DEFINING LIQUIDS =======
        QBeads = protocol.define_liquid(name="QBeads", description="QBeads", display_color="#704848")                                           #704848 = 'CleanupBead Brown'
        ETOH = protocol.define_liquid(name="EtOH", description="80% Ethanol", display_color="#9ACECB")                                          #9ACECB = 'Ethanol Blue'
        RSB = protocol.define_liquid(name="RSB", description="Resuspension Buffer", display_color="#00FFF2")                                    #00FFF2 = 'Base Light Blue'
        Liquid_trash_well = protocol.define_liquid(name="Liquid_trash_well", description="Liquid Trash", display_color="#9B9B9B")               #9B9B9B = 'Liquid Trash Grey'
        Sample = protocol.define_liquid(name="Sample", description="Sample", display_color="#52AAFF")                                           #52AAFF = 'Sample Blue'
        Adapt3lig = protocol.define_liquid(name="Adapt3lig", description="Adapt3lig", display_color="#FF0000")                                  #FF0000 = 'Base Red'
        Adapt5lig = protocol.define_liquid(name="Adapt5lig", description="Adapt5lig", display_color="#0EFF00")                                  #0EFF00 = 'Base Green'
        RTI = protocol.define_liquid(name="RTI", description="RTI", display_color="#0082FF")                                                    #0082FF = 'Base  Blue'
        RT = protocol.define_liquid(name="RT", description="RT", display_color="#FFA000")                                                       #FFA000 = 'Base Orange'
        PCR = protocol.define_liquid(name="PCR", description="PCR", display_color="#0EFF00")                                                    #0EFF00 = 'Base Green'
        Barcodes = protocol.define_liquid(name="Barcodes", description="Barcodes", display_color="#7DFFC4")                                     #7DFFC4 = 'Barcode Green'
        Final_Sample = protocol.define_liquid(name="Final_Sample", description="Final Sample", display_color="#82A9CF")                         #82A9CF = 'Placeholder Blue'
        Placeholder_Sample = protocol.define_liquid(name="Placeholder_Sample", description="Placeholder Sample", display_color="#82A9CF")       #82A9CF = 'Placeholder Blue'

        # ======== LOADING LIQUIDS =======
        for loop, X in enumerate(UsedColumn):
            if COLUMNS == 1:
                reservoir.wells_by_name()[X+'1'].load_liquid(liquid=QBeads, volume=QBeads_Volume)
                reservoir.wells_by_name()[X+'4'].load_liquid(liquid=ETOH, volume=ETOH_Volume)
            if COLUMNS == 2:
                reservoir.wells_by_name()[X+'1'].load_liquid(liquid=QBeads, volume=QBeads_Volume)
                reservoir.wells_by_name()[X+'4'].load_liquid(liquid=ETOH, volume=ETOH_Volume)
            if COLUMNS == 3:
                reservoir.wells_by_name()[X+'1'].load_liquid(liquid=QBeads, volume=QBeads_Volume)
                reservoir.wells_by_name()[X+'4'].load_liquid(liquid=ETOH, volume=ETOH_Volume)
            if COLUMNS == 4:
                reservoir.wells_by_name()[X+'1'].load_liquid(liquid=QBeads, volume=QBeads_Volume*(2/4))
                reservoir.wells_by_name()[X+'2'].load_liquid(liquid=QBeads, volume=QBeads_Volume*(2/4))
                reservoir.wells_by_name()[X+'4'].load_liquid(liquid=ETOH, volume=ETOH_Volume*(2/4))
                reservoir.wells_by_name()[X+'4'].load_liquid(liquid=ETOH, volume=ETOH_Volume*(2/4))
            if COLUMNS == 5:
                reservoir.wells_by_name()[X+'1'].load_liquid(liquid=QBeads, volume=QBeads_Volume*(2/5))
                reservoir.wells_by_name()[X+'2'].load_liquid(liquid=QBeads, volume=QBeads_Volume*(2/5))
                reservoir.wells_by_name()[X+'3'].load_liquid(liquid=QBeads, volume=QBeads_Volume*(1/5))
                reservoir.wells_by_name()[X+'4'].load_liquid(liquid=ETOH, volume=ETOH_Volume*(2/5))
                reservoir.wells_by_name()[X+'5'].load_liquid(liquid=ETOH, volume=ETOH_Volume*(2/5))
                reservoir.wells_by_name()[X+'6'].load_liquid(liquid=ETOH, volume=ETOH_Volume*(1/5))
            if COLUMNS == 6:
                reservoir.wells_by_name()[X+'1'].load_liquid(liquid=QBeads, volume=QBeads_Volume*(2/6))
                reservoir.wells_by_name()[X+'2'].load_liquid(liquid=QBeads, volume=QBeads_Volume*(2/6))
                reservoir.wells_by_name()[X+'3'].load_liquid(liquid=QBeads, volume=QBeads_Volume*(2/6))
                reservoir.wells_by_name()[X+'4'].load_liquid(liquid=ETOH, volume=ETOH_Volume*(2/6))
                reservoir.wells_by_name()[X+'5'].load_liquid(liquid=ETOH, volume=ETOH_Volume*(2/6))
                reservoir.wells_by_name()[X+'6'].load_liquid(liquid=ETOH, volume=ETOH_Volume*(2/6))
            reservoir.wells_by_name()[X+'9'].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()[X+'10'].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()[X+'11'].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()[X+'12'].load_liquid(liquid=Liquid_trash_well, volume=0)
        if COLUMNS >= 1:
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'1'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_1.wells_by_name()[X+'7'].load_liquid(liquid=Placeholder_Sample, volume=0)
                reagent_plate_1.wells_by_name()[X+'7'].load_liquid(liquid=Barcodes, volume=5)
                if PROTOCOL_STEPS != "Just cDNA":
                    sample_plate_2.wells_by_name()[X+'1'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_2.wells_by_name()[X+'7'].load_liquid(liquid=Final_Sample, volume=0)
                CleanupPlate_1.wells_by_name()[X+'1'].load_liquid(liquid=Placeholder_Sample, volume=0)
                CleanupPlate_1.wells_by_name()[X+'7'].load_liquid(liquid=Placeholder_Sample, volume=0)
        if COLUMNS >= 2:
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'2'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_1.wells_by_name()[X+'8'].load_liquid(liquid=Placeholder_Sample, volume=0)
                reagent_plate_1.wells_by_name()[X+'8'].load_liquid(liquid=Barcodes, volume=5)
                if PROTOCOL_STEPS != "Just cDNA":
                    sample_plate_2.wells_by_name()[X+'2'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_2.wells_by_name()[X+'8'].load_liquid(liquid=Final_Sample, volume=0)
                CleanupPlate_1.wells_by_name()[X+'2'].load_liquid(liquid=Placeholder_Sample, volume=0)
                CleanupPlate_1.wells_by_name()[X+'8'].load_liquid(liquid=Placeholder_Sample, volume=0)
        if COLUMNS >= 3:
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'3'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_1.wells_by_name()[X+'9'].load_liquid(liquid=Placeholder_Sample, volume=0)
                reagent_plate_1.wells_by_name()[X+'9'].load_liquid(liquid=Barcodes, volume=5)
                if PROTOCOL_STEPS != "Just cDNA":
                    sample_plate_2.wells_by_name()[X+'3'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_2.wells_by_name()[X+'9'].load_liquid(liquid=Final_Sample, volume=0)
                CleanupPlate_1.wells_by_name()[X+'3'].load_liquid(liquid=Placeholder_Sample, volume=0)
                CleanupPlate_1.wells_by_name()[X+'9'].load_liquid(liquid=Placeholder_Sample, volume=0)
        if COLUMNS >= 4:
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'4'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_1.wells_by_name()[X+'10'].load_liquid(liquid=Placeholder_Sample, volume=0)
                reagent_plate_1.wells_by_name()[X+'10'].load_liquid(liquid=Barcodes, volume=5)
                if PROTOCOL_STEPS != "Just cDNA":
                    sample_plate_2.wells_by_name()[X+'4'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_2.wells_by_name()[X+'10'].load_liquid(liquid=Final_Sample, volume=0)
                CleanupPlate_1.wells_by_name()[X+'4'].load_liquid(liquid=Placeholder_Sample, volume=0)
                CleanupPlate_1.wells_by_name()[X+'10'].load_liquid(liquid=Placeholder_Sample, volume=0)
        if COLUMNS >= 5:
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_1.wells_by_name()[X+'11'].load_liquid(liquid=Placeholder_Sample, volume=0)
                reagent_plate_1.wells_by_name()[X+'11'].load_liquid(liquid=Barcodes, volume=5)
                if PROTOCOL_STEPS != "Just cDNA":
                    sample_plate_2.wells_by_name()[X+'5'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_2.wells_by_name()[X+'11'].load_liquid(liquid=Final_Sample, volume=0)
                CleanupPlate_1.wells_by_name()[X+'5'].load_liquid(liquid=Placeholder_Sample, volume=0)
                CleanupPlate_1.wells_by_name()[X+'11'].load_liquid(liquid=Placeholder_Sample, volume=0)
        if COLUMNS >= 6:
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'6'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_1.wells_by_name()[X+'12'].load_liquid(liquid=Placeholder_Sample, volume=0)
                reagent_plate_1.wells_by_name()[X+'12'].load_liquid(liquid=Barcodes, volume=5)
                if PROTOCOL_STEPS != "Just cDNA":
                    sample_plate_2.wells_by_name()[X+'6'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_2.wells_by_name()[X+'12'].load_liquid(liquid=Final_Sample, volume=0)
                CleanupPlate_1.wells_by_name()[X+'6'].load_liquid(liquid=Placeholder_Sample, volume=0)
                CleanupPlate_1.wells_by_name()[X+'12'].load_liquid(liquid=Placeholder_Sample, volume=0)
        for loop, X in enumerate(TotalColumn):
            reagent_plate_1.wells_by_name()[X+'1'].load_liquid(liquid=Adapt3lig, volume=Adapt3lig_Volume)
            reagent_plate_1.wells_by_name()[X+'2'].load_liquid(liquid=Adapt5lig, volume=Adapt5lig_Volume)
            reagent_plate_1.wells_by_name()[X+'3'].load_liquid(liquid=RTI, volume=RTI_Volume)
            reagent_plate_1.wells_by_name()[X+'4'].load_liquid(liquid=RT, volume=RT_Volume)
            reagent_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=PCR, volume=PCR_Volume)
            reagent_plate_1.wells_by_name()[X+'6'].load_liquid(liquid=RSB, volume=RSB_Volume)

