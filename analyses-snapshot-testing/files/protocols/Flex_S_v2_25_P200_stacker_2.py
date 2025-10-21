from opentrons import protocol_api
from opentrons import types
from opentrons.protocol_api import COLUMN, ROW, ALL
import math

from opentrons.protocol_api.core.engine import protocol

metadata = {'protocolName': 'Illumina RNA Prep 96x Dev v1.1-5/2/2025','author': 'Opentrons <protocols@opentrons.com>','source': 'Protocol Library',}
requirements = {"robotType": "Flex","apiLevel": "2.25",}

def add_parameters(parameters):
    # ======================== RUNTIME PARAMETERS ========================
    parameters.add_bool(
        display_name="Dry Run",
        variable_name="DRYRUN",
        default=True,
        description="Whether to perform a dry run or not.")
    parameters.add_int(
        display_name="PCR Cycles",
        variable_name="PCRCYCLES",
        default=5,minimum=1,maximum=12,
        description="How many PCR Cycles for amplification.")
    parameters.add_bool(
        display_name="Dev Mode",
        variable_name="DEVMODE",
        default=True,
        description="Dev Mode = Pauses for Trash")
    parameters.add_int(
        display_name="Quick Test Columns",
        variable_name="TESTCOLUMN",
        default=12,minimum=1,maximum=12,
        description="How many Sub-Columns to test")
    parameters.add_str(
        display_name="Protocol Steps",
        variable_name="PROTOCOL_STEPS",
        default="All Steps",
        description="Protocol Steps",
        choices=[
        {"display_name": "All Steps",                   "value": "All Steps"},
        {"display_name": "cDNA and Library Prep",       "value": "cDNA and Library Prep"},
        {"display_name": "Just cDNA",                   "value": "Just cDNA"},
        {"display_name": "Just Library Prep",           "value": "Just Library Prep"},
        {"display_name": "Pooling and Hybridization",   "value": "Pooling and Hybridization"},
        {"display_name": "Just Pooling",                "value": "Just Pooling"},
        {"display_name": "Just Hybridization",          "value": "Just Hybridization"},
        {"display_name": "Just Capture",                "value": "Just Capture"}
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

    DRYRUN              = protocol.params.DRYRUN
    PCRCYCLES           = protocol.params.PCRCYCLES
    DEVMODE             = protocol.params.DEVMODE
    TESTCOLUMN          = protocol.params.TESTCOLUMN
    PROTOCOL_STEPS      = "All Steps"

    # =================================================================================================
    # ====================================== ADVANCED PARAMETERS ======================================
    # =================================================================================================
    #-------PROTOCOL STEP-------
    if PROTOCOL_STEPS == "All Steps" or PROTOCOL_STEPS == "Just cDNA" or PROTOCOL_STEPS == "cDNA and Library Prep":
        STEP_RNA            = True      # Set to 0 to skip block of commands
        STEP_POSTRNA        = True      # Set to 0 to skip block of commands
    else:
        STEP_RNA            = False
        STEP_POSTRNA        = False
    #---------------------------
    if PROTOCOL_STEPS == "All Steps" or PROTOCOL_STEPS == "Just Library Prep" or PROTOCOL_STEPS == "cDNA and Library Prep":
        STEP_TAG            = True      # Set to 0 to skip block of commands
        STEP_WASH           = True      # Set to 0 to skip block of commands
        STEP_PCRDECK        = True      # Set to 0 to skip block of commands
        STEP_CLEANUP_1      = True      # Set to 0 to skip block of commands
    else:
        STEP_TAG            = False
        STEP_WASH           = False
        STEP_PCRDECK        = False
        STEP_CLEANUP_1      = False
    #---------------------------
    if PROTOCOL_STEPS == "All Steps" or PROTOCOL_STEPS == "Just Pooling" or PROTOCOL_STEPS == "Pooling and Hybridization" or PROTOCOL_STEPS == "Pooling, Hybridization and Capture":
        STEP_POOL           = True      # Set to 0 to skip block of commands
    else:
        STEP_POOL           = False
    #---------------------------
    if PROTOCOL_STEPS == "All Steps" or PROTOCOL_STEPS == "Just Hybridization" or PROTOCOL_STEPS == "Pooling and Hybridization" or PROTOCOL_STEPS == "Pooling, Hybridization and Capture":
        STEP_HYB            = True      # Set to 0 to skip block of commands
    else:
        STEP_HYB            = False
    #---------------------------
    if PROTOCOL_STEPS == "All Steps" or PROTOCOL_STEPS == "Just Capture" or PROTOCOL_STEPS == "Pooling, Hybridization and Capture":
        STEP_CAPTURE        = True      # Set to 0 to skip block of commands
        STEP_PCR            = True      # Set to 0 to skip block of commands
        STEP_CLEANUP_2      = True      # Set to 0 to skip block of commands
    else:
        STEP_CAPTURE        = False
        STEP_PCR            = False
        STEP_CLEANUP_2      = False
    #---------------------------

    # This notifies the user that for 5-6 columns (from more than 32 samples up to 48 samples) it requires Tip reusing in order to remain walkaway.
    # This setting will override any Runtime parameter, and also pauses to notify the user.  So if the user enters 6 columns with Single Tip Use, it will pause and warn that it has to change to Reusing tips in order to remain walkaway.
    # Note that if omitting steps (i.e. skipping the last cleanup step) it is possible to do single use tips, but may vary on case by case basis.
    # Note that it is also possible to use advanced settings to include pauses that requires user intervention to replenish tipracks, making allowing a run of single Use Tips.
    TIP_TRASH             = True      # Default True    | True = Used tips go in Trash, False = Used tips go back into rack
    DEACTIVATE_TEMP       = True      # Default True    | True = Temp and / or Thermocycler deactivate at end of run, False = remain on, such as leaving at 4 degrees 
    TRASH_POSITION        = 'CHUTE'   # Default 'CHUTE' | 'BIN' or 'CHUTE'
    TIP_MIX               = True      # Default False   | Use Tip Mixing instead of Heatershaker
    ONDECK_THERMO         = True      # Default True    | On Deck Thermocycler
    ONDECK_HEATERSHAKER   = True      # Default True    | True = On Deck Heater Shaker, False = No heatershaker and increased tip mixing reps.
    ONDECK_TEMP           = True      # Default True    | True = On Deck Temperature module, False = No Temperature Module
    USE_GRIPPER           = True      # Default True    | True = Uses the FLEX Gripper, False = No Gripper Movement, protocol pauses and requires manual intervention.
    HOTSWAP               = False     # Default False   | True = Allows replenishing tipracks on the off deck positions so the protocol can continue, False = Won't, protocol will most likely have out of tip error message.
    HOTSWAP_PAUSE         = False     # Default False   | True = Protocol pauses for replenishing the offdeck tip racks or to continue, False = Protocol won't cause, user must add tipracks at their discretion.
    SWAPOFFDECK           = False     # Default False   | True = Protocol will use an empty deck position as a temprorary place to swap new and used tip racks between on and off deck, instead of discarding in the chute, False = won't, and used tipracks will go into the chute.  Use True if there is deck space to spare and when doing troubleshooting so tips aren't being discarded with the tip racks.
    CUSTOM_OFFSETS        = False      # Default False   | True = use per instrument specific offsets, False = Don't use any offsets.  This is for per instrument, per module gripper alignment adjustments that need fine tuning without gripper recalibration.
    SWAPOFFDECK           = False     # Default False   | Setting to Swap empty Tipracks to empty positions instead of dumping them
    NOLABEL               = False     # Default False   | True = Do no include Liquid Labeling, False = Liquid Labeling is included, adds additional lines to Protocol Step Preview at end of protocol.
    REPORT                = False     # Default False   | True = Include Extra Comments in the Protocol Step Preview for troubleshooting, False = Do Not Include

    # ============================== SETTINGS ===============================
    if TRASH_POSITION == 'BIN': 
        SWAPOFFDECK           = True      # Setting to Swap empty Tipracks to empty positions instead of dumping them
    if TRASH_POSITION == 'CHUTE': 
        SWAPOFFDECK           = False     # Setting to Swap empty Tipracks to empty positions instead of dumping them
    if DRYRUN == True: 
        TIP_TRASH             = False     # True = Used tips go in Trash, False = Used tips go back into rack
        DEACTIVATE_TEMP       = True      # Whether or not to deactivate the heating and cooling modules after a run
        REPORT                = True      # Whether or not to include Extra Comments for Debugging
    
    # =============================== PIPETTE ===============================
    p1000 = protocol.load_instrument("flex_96channel_200", "left")
    p96x_200_flow_rate_aspirate_default = 716
    p96x_200_flow_rate_dispense_default = 716
    p96x_200_flow_rate_blow_out_default = 716
    p96x_50_flow_rate_aspirate_default  = 478
    p96x_50_flow_rate_dispense_default  = 478
    p96x_50_flow_rate_blow_out_default  = 478

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
    
    def nozzlecheck(nozzletype):
        if nozzletype == 'R8':
            p1000.configure_nozzle_layout(
                style=COLUMN,
                start="A12"
            )
        if nozzletype == 'R16':
            p1000.configure_nozzle_layout(
                style=COLUMN,
                start="A12"
            )
        if nozzletype == 'L8':
            p1000.configure_nozzle_layout(
                style=COLUMN,
                start="A1"
            )
        if nozzletype == 'ROW_TOP':
            p1000.configure_nozzle_layout(
                style=ROW,
                start="A1"
            )
        if nozzletype == 'ROW_BOTTOM':
            p1000.configure_nozzle_layout(
                style=ROW,
                start="H1"
            )
        if nozzletype == '96':
            p1000.configure_nozzle_layout(
                style=ALL
            )

    # ======================= SIMPLE SETUP ARRANGEMENT ======================
    
    SCP_Position = 'B2'

    # ======= STACKER COLUMN =========
    stacker_200_A4 = protocol.load_module("flexStackerModuleV1", "A4")
    stacker_200_A4.set_stored_labware("opentrons_flex_96_tiprack_200ul", count=6)
    tiprack_200_2 = stacker_200_A4.load_labware('opentrons_flex_96_tiprack_200ul')

    stacker_200_B4 = protocol.load_module("flexStackerModuleV1", "B4")
    stacker_200_B4.set_stored_labware("opentrons_flex_96_tiprack_200ul", count=6, lid="opentrons_flex_tiprack_lid")

    stacker_50_C4 = protocol.load_module("flexStackerModuleV1", "C4")
    stacker_50_C4.set_stored_labware("opentrons_flex_96_tiprack_50ul", count=6, lid="opentrons_flex_tiprack_lid")
    tiprack_50_SCP_3 = stacker_50_C4.load_labware('opentrons_flex_96_tiprack_50ul')

    stacker_50_D4 = protocol.load_module("flexStackerModuleV1", "D4")
    stacker_50_D4.set_stored_labware("nest_96_wellplate_2ml_deep", count=8)

    # ========== FIRST ROW ===========
    if ONDECK_THERMO == True:
        thermocycler = protocol.load_module('thermocycler module gen2')
        sample_plate_1 = thermocycler.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'Sample Plate 1')
    else:    
        sample_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','B1','Sample Plate 1')
    
    # NOTE: deck riser adapter is used to hold the lid stack
    deck_riser_adapter = protocol.load_adapter("opentrons_flex_deck_riser", "A2")
    lids = protocol.load_lid_stack("opentrons_tough_pcr_auto_sealing_lid", deck_riser_adapter, 4)

    tiprack_A3_adapter = protocol.load_adapter('opentrons_flex_96_tiprack_adapter', 'A3')
    tiprack_200_1 = tiprack_A3_adapter.load_labware('opentrons_flex_96_tiprack_200ul')
    # ========== SECOND ROW ==========
    tiprack_50_SCP_1 = protocol.load_labware('opentrons_flex_96_tiprack_50ul', SCP_Position)
    sample_plate_2 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','B3','Sample Plate 2')
    # ========== THIRD ROW ===========
    if ONDECK_TEMP == True:
        temp_block = protocol.load_module('temperature module gen2', 'C1')
        reagent_plate_1 = temp_block.load_labware('greiner_384_wellplate_240ul', 'Reagent Plate 1')
    else:
        reagent_plate_1 = protocol.load_labware('greiner_384_wellplate_240ul','C1','Reagent Plate 1')
    reagent_plate_2 = protocol.load_labware('greiner_384_wellplate_240ul','C2','Reagent Plate 2')
    tiprack_50_SCP_2 = protocol.load_labware('opentrons_flex_96_tiprack_200ul', 'C3')
    # ========== FOURTH ROW ==========
    if ONDECK_HEATERSHAKER == True:
        heatershaker = protocol.load_module('heaterShakerModuleV1','D1')
    mag_block = protocol.load_module('magneticBlockV1', 'D2')


    #LW_reservoir = protocol.load_labware('nest_96_wellplate_2ml_deep','C3','Reagent Plate 1')
    #ETOH_reservoir_1 = protocol.load_labware('nest_96_wellplate_2ml_deep','B2','Reagent Plate 1')
    

    TRASH = protocol.load_waste_chute()

    waste_chute_x = 392.0
    waste_chute_y = -27.0
    waste_chute_z = 114.50

    # ============ TRASH =============

    # ========================== REAGENT PLATE_1 ============================
    EPH3                = reagent_plate_1['A1'] # 12 Wells
    FSMM                = reagent_plate_1['A2'] # 12 Wells
    SSMM                = reagent_plate_1['B1'] # 12 Wells
    EPM                 = reagent_plate_1['C1'] # 12 Wells
    Barcodes            = reagent_plate_1['B2'] # 96 Wells

    #SMB_1               = reagent_plate_1['A14'] # 8 Wells
    #SMB_2               = reagent_plate_1['A15'] # 8 Wells
    #EEW_1               = reagent_plate_1['A16'] # 8 Wells
    #EEW_2               = reagent_plate_1['A17'] # 8 Wells
    #NHB2                = reagent_plate_1['A18'] # 8 Wells
    #Panel               = reagent_plate_1['A19'] # 8 Wells
    #ET2                 = reagent_plate_1['A20'] # 8 Wells
    #EHB2                = reagent_plate_1['A21'] # 8 Wells
    #Elute               = reagent_plate_1['A22'] # 8 Wells
    #PPC                 = reagent_plate_1['A23'] # 8 Wells

    # ========================== REAGENT PLATE_2 ============================
    CleanupBead         = reagent_plate_2['A1'] # 96 Wells
    RSB                 = reagent_plate_2['A2'] # 96 Wells
    TAGMIX              = reagent_plate_1['B1'] # 12 Wells
    TAGSTOP             = reagent_plate_1['D1'] # 12 Wells
    H20                 = reagent_plate_1['F1'] # 12 Wells


    # ======================= TIP AND SAMPLE TRACKING =======================
    # This is a list of each column to be used in the protocol, as well as any intermediate or final sample positions.
    # column_1_list = [f'A{i}' for i in range(1, COLUMNS + 1)]              <-- This is a Simple list of 'A1' through 'A12', meaning a full plate.
    # Example Protocols can look like this:

    column_list = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12']

    row_top_sample_list = ['A1','B1','C1','D1','E1','F1']
    row_top_pickup_list = ['H1','G1','F1','E1','D1','C1']
    row_bottom_sample_list = ['G1','H1']
    row_bottom_pickup_list = ['A1','B1']
    
    forward_list = ['A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12']
    reverse_list = ['A12','A11','A10','A9','A8','A7','A6','A5','A4','A3','A2','A1']

    # ============================ CUSTOM OFFSETS ===========================
    # These are Custom Offsets which are a PER INSTRUMENT Setting, to account for slight adjustments of the gripper calibration or labware.
    p200_in_Deep384_Z_offset = 25

    if CUSTOM_OFFSETS == True:
        PCRPlate_Z_offset = 1
        Deepwell_Z_offset = 1
        Deep384_Z_offset = 1
        # HEATERSHAKER OFFSETS
        # hs_drop_offset={'x':0,'y':0,'z':0}
        # hs_pick_up_offset={'x':0,'y':0,'z':0}
        # # MAG BLOCK OFFSETS
        # mb_drop_offset={'x':0,'y':0,'z':0}
        # mb_pick_up_offset={'x':0,'y':0,'z':0}
        # # THERMOCYCLER OFFSETS
        # tc_drop_offset={'x':0,'y':0,'z':0}
        # tc_pick_up_offset={'x':0,'y':0,'z':0}
        # # STACKER OFFSETS
        # stacker_drop_offset={'x':0,'y':0,'z':0}
        # stacker_pick_up_offset={'x':0,'y':0,'z':0}
        # # DECK OFFSETS
        # deck_drop_offset={'x':0,'y':0,'z':0}
        # deck_pick_up_offset={'x':0,'y':0,'z':0}
        # deck_PCR2_drop_offset={'x':0,'y':0,'z':13}
        # deck_PCR2_pick_up_offset={'x':0,'y':0,'z':13}
        # deck_PCR3_drop_offset={'x':0,'y':0,'z':26}
        # deck_PCR3_pick_up_offset={'x':0,'y':0,'z':26}
        # deck_PCR4_drop_offset={'x':0,'y':0,'z':39}
        # deck_PCR4_pick_up_offset={'x':0,'y':0,'z':39}
        #deck_PCR5_drop_offset={'x':0,'y':0,'z':52}
        #deck_PCR5_pick_up_offset={'x':0,'y':0,'z':52}
    else:
        PCRPlate_Z_offset = 1
        Deepwell_Z_offset = 1
        Deep384_Z_offset = 1
        # HEATERSHAKER OFFSETS
        # hs_drop_offset={'x':0,'y':0,'z':0}
        # hs_pick_up_offset={'x':0,'y':0,'z':0}
        # # MAG BLOCK OFFSETS
        # mb_drop_offset={'x':0,'y':0.,'z':0}
        # mb_pick_up_offset={'x':0,'y':0,'z':0}
        # # THERMOCYCLER OFFSETS
        # tc_drop_offset={'x':0.5,'y':0,'z':0}
        # tc_pick_up_offset={'x':0,'y':0,'z':0}
        # # STACKER OFFSETS
        # stacker_drop_offset={'x':0,'y':0,'z':0}
        # stacker_pick_up_offset={'x':0,'y':0,'z':0}
        # # DECK OFFSETS
        # deck_drop_offset={'x':0,'y':0,'z':0}
        # deck_pick_up_offset={'x':0,'y':0,'z':0}
        # deck_PCR2_drop_offset={'x':0,'y':0,'z':13}
        # deck_PCR2_pick_up_offset={'x':0,'y':0,'z':13}
        # deck_PCR3_drop_offset={'x':0,'y':0,'z':26}
        # deck_PCR3_pick_up_offset={'x':0,'y':0,'z':26}
        # deck_PCR4_drop_offset={'x':0,'y':0,'z':39}
        # deck_PCR4_pick_up_offset={'x':0,'y':0,'z':39}
        #deck_PCR5_drop_offset={'x':0,'y':0,'z':52}
        #deck_PCR5_pick_up_offset={'x':0,'y':0,'z':52}

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
    # =================================================================================================
    # ========================================= PROTOCOL START ========================================
    # =================================================================================================

    if STEP_RNA == True:
        protocol.comment('==============================================')
        protocol.comment('--> Aliquoting EPH3')
        protocol.comment('==============================================')

        #============================================================================================
        if DEVMODE == True:
            protocol.pause("EMPTY TIPRACK IN D3")
        #============================================================================================

        protocol.comment('--> Adding EPH3')
        EPH3Vol    = 8.5
        EPH3MixRep = 5 if DRYRUN == 'NO' else 1
        EPH3MixVol = 20
        p1000.flow_rate.aspirate = p96x_50_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_50_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_50_flow_rate_blow_out_default*0.5
        X = 'A1'
        #===============================================
        nozzlecheck('ROW_TOP')
        for loop, X in enumerate(row_top_sample_list):
            p1000.pick_up_tip(tiprack_50_SCP_1[row_top_pickup_list[loop]])
            p1000.aspirate(EPH3Vol, EPH3.bottom(z=Deep384_Z_offset+1))
            p1000.dispense(EPH3Vol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset))
            #p1000.move_to(sample_plate_1[X].bottom(z=1))
            #p1000.mix(EPH3MixRep,EPH3MixVol)
            #p1000.blow_out(sample_plate_1[X].top(z=-5))
            if DEVMODE == True:
                p1000.drop_tip() #location=TRASH.top(x=-3, y=32.8+(int(loop)*(-8.8)), z = -30))
            else:
                p1000.drop_tip()
        nozzlecheck('ROW_BOTTOM')
        for loop, X in enumerate(row_bottom_sample_list):
            p1000.pick_up_tip(tiprack_50_SCP_1[row_bottom_pickup_list[loop]])
            p1000.aspirate(EPH3Vol, EPH3.bottom(z=Deep384_Z_offset+1))
            p1000.dispense(EPH3Vol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset))
            #p1000.move_to(sample_plate_1[X].bottom(z=1))
            #p1000.mix(EPH3MixRep,EPH3MixVol)
            #p1000.blow_out(sample_plate_1[X].top(z=-5))
            if DEVMODE == True:
                p1000.drop_tip() #location=TRASH.top(x=-3, y=32.8+(8.8+(int(loop)*(-8.8))), z = -30))
            else:
                p1000.drop_tip()
        #===============================================
        
        #============================================================================================
        if DEVMODE == True:
            protocol.pause("PLATFORM IN D3")
        # GRIPPER MOVE tiprack_50_SCP_1: FROM SCP_Position --> TRASH
        protocol.move_labware(labware=tiprack_50_SCP_1,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_50_SCP_2: FROM C3 --> SCP_Position
        protocol.move_labware(labware=tiprack_50_SCP_2,new_location=SCP_Position,use_gripper=USE_GRIPPER)        
        #============================================================================================


        protocol.comment('==============================================')
        protocol.comment('--> Aliquoting FSMM')
        protocol.comment('==============================================')

        protocol.comment('--> Adding FSMM')
        FSMMVol    = 8
        FSMMMixRep = 5 if DRYRUN == 'NO' else 1
        FSMMMixVol = 20
        p1000.flow_rate.aspirate = p96x_50_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_50_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_50_flow_rate_blow_out_default*0.5
        X = 'A1'
        #===============================================
        nozzlecheck('ROW_TOP')
        for loop, X in enumerate(row_top_sample_list):
            p1000.pick_up_tip(tiprack_50_SCP_2[row_top_pickup_list[loop]])
            p1000.aspirate(FSMMVol, FSMM.bottom(z=Deep384_Z_offset))
            p1000.dispense(FSMMVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
            #p1000.move_to(sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
            #p1000.mix(FSMMMixRep,FSMMMixVol)
            #p1000.blow_out(sample_plate_1[X].top(z=-5))
            if DEVMODE == True:
                p1000.drop_tip() #location=TRASH.top(x=-3, y=32.8+(int(loop)*(-8.8)), z = -30))
            else:
                p1000.drop_tip()
        nozzlecheck('ROW_BOTTOM')
        for loop, X in enumerate(row_bottom_sample_list):
            p1000.pick_up_tip(tiprack_50_SCP_2[row_bottom_pickup_list[loop]])
            p1000.aspirate(FSMMVol, FSMM.bottom(z=Deep384_Z_offset))
            p1000.dispense(FSMMVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
            #p1000.move_to(sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
            #p1000.mix(FSMMMixRep,FSMMMixVol)
            #p1000.blow_out(sample_plate_1[X].top(z=-5))
            if DEVMODE == True:
                p1000.drop_tip() #location=TRASH.top(x=-3, y=32.8+(8.8+(int(loop)*(-8.8))), z = -30))
            else:
                p1000.drop_tip()
        #===============================================

        #============================================================================================
        if DEVMODE == True:
            protocol.pause("PLATFORM IN D3")
        # GRIPPER MOVE tiprack_50_SCP_2: FROM C3 --> TRASH
        protocol.move_labware(labware=tiprack_50_SCP_2,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_50_SCP_3: FROM stacker_50_C4 --> SCP_Position
        protocol.move_labware(labware=tiprack_50_SCP_3,new_location=SCP_Position,use_gripper=USE_GRIPPER)        
        #============================================================================================

        protocol.comment('==============================================')
        protocol.comment('--> Aliquoting SSMM')
        protocol.comment('==============================================')

        protocol.comment('--> Adding SSMM')
        SSMMVol    = 25
        SSMMMixRep = 5 if DRYRUN == 'NO' else 1
        SSMMMixVol = 50
        p1000.flow_rate.aspirate = p96x_50_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_50_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_50_flow_rate_blow_out_default*0.5
        X = 'A1'
        #===============================================
        nozzlecheck('ROW_TOP')
        for loop, X in enumerate(row_top_sample_list):
            p1000.pick_up_tip(tiprack_50_SCP_3[row_top_pickup_list[loop]])
            p1000.aspirate(SSMMVol, SSMM.bottom(z=Deep384_Z_offset+1))
            p1000.dispense(SSMMVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
            #p1000.move_to(sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
            #p1000.mix(SSMMMixRep,SSMMMixVol)
            #p1000.blow_out(sample_plate_1[X].top(z=-5))
            if DEVMODE == True:
                p1000.drop_tip() #location=TRASH.top(x=-3, y=32.8+(int(loop)*(-8.8)), z = -30))
            else:
                p1000.drop_tip()
        nozzlecheck('ROW_BOTTOM')
        for loop, X in enumerate(row_bottom_sample_list):
            p1000.pick_up_tip(tiprack_50_SCP_3[row_bottom_pickup_list[loop]])
            p1000.aspirate(SSMMVol, SSMM.bottom(z=Deep384_Z_offset+1))
            p1000.dispense(SSMMVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
            #p1000.move_to(sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1))
            #p1000.mix(SSMMMixRep,SSMMMixVol)
            #p1000.blow_out(sample_plate_1[X].top(z=-5))
            if DEVMODE == True:
                p1000.drop_tip() #location=TRASH.top(x=-3, y=32.8+(8.8+(int(loop)*(-8.8))), z = -30))
            else:
                p1000.drop_tip()
        #===============================================

    if STEP_POSTRNA == True:
        protocol.comment('==============================================')
        protocol.comment('--> Post RNA Cleanup')
        protocol.comment('==============================================')

        #============================================================================================
        if DEVMODE == True:
            protocol.pause("PLATFORM IN D3")
        # GRIPPER MOVE tiprack_50_SCP_3: FROM B3 --> TRASH
        protocol.move_labware(labware=tiprack_50_SCP_3,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")

        # STACKER DISPENSING DEEPWELL #1
        LW_reservoir = stacker_50_D4.retrieve()
        # GRIPPER MOVE Liquid_trash: FROM stacker_50_D4 --> C3
        protocol.move_labware(labware=LW_reservoir,new_location='C3',use_gripper=USE_GRIPPER)
        # STACKER DISPENSING DEEPWELL #2
        ETOH_reservoir_1 = stacker_50_D4.retrieve()
        # GRIPPER MOVE Liquid_trash: FROM stacker_50_D4 --> B2
        protocol.move_labware(labware=ETOH_reservoir_1,new_location='B2',use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> ADDING CleanupBead (0.8x)')
        CleanupBeadVol = 45
        SampleVol = 45
        CleanupBeadMixRPM = 1800
        CleanupBeadMixTime = 5*60 if DRYRUN == False else 0.1*60
        CleanupBeadPremix = 3 if DRYRUN == False else 1
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_1[X])
        #p1000.move_to(CleanupBead.bottom(z=Deep384_Z_offset+p200_in_Deep384_Z_offset))
        #p1000.mix(3,CleanupBeadVol)
        p1000.aspirate(CleanupBeadVol, CleanupBead.bottom(z=Deep384_Z_offset+p200_in_Deep384_Z_offset))
        p1000.dispense(CleanupBeadVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+0.75))
        #========PIPETTE MIXING==========
        #p1000.move_to(sample_plate_1[X].bottom(z=PCRPlate_Z_offset+0.75))
        #p1000.mix(10,CleanupBeadVol)
        #================================
        #protocol.delay(seconds=0.2)
        #p1000.blow_out(sample_plate_1[X].top(z=-2))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE sample_plate_1 FROM thermocycler --> mag_block
        protocol.move_labware(labware=sample_plate_1,new_location=mag_block,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> Removing Supernatant 1A')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_1[X])
        p1000.aspirate(RemoveSup-100, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+2))
        #protocol.delay(minutes=0.1)
        p1000.aspirate(100, sample_plate_1[X].bottom(z=PCRPlate_Z_offset))
        #p1000.default_speed = 5
        #p1000.move_to(sample_plate_1[X].top(z=2))
        #p1000.default_speed = 200
        p1000.dispense(RemoveSup, LW_reservoir[X].top(z=Deepwell_Z_offset))
        #protocol.delay(minutes=0.1)
        #p1000.blow_out()
        #p1000.default_speed = 400
        #p1000.move_to(LW_reservoir[X].top(z=-5))
        #p1000.move_to(LW_reservoir[X].top(z=0))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_1: FROM tiprack_A3_adapter --> stacker_50_D4
        protocol.move_labware(labware=tiprack_200_1,new_location=stacker_50_D4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_2: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_2,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> ETOH Wash 1A')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_2[X])
        p1000.aspirate(ETOHMaxVol, ETOH_reservoir_1[X].bottom(z=Deepwell_Z_offset+1))
        #p1000.move_to(ETOH_reservoir_1[X].top(z=0))
        #p1000.move_to(ETOH_reservoir_1[X].top(z=-5))
        #p1000.move_to(ETOH_reservoir_1[X].top(z=0))
        p1000.move_to(sample_plate_1[X].top(z=-2))
        p1000.dispense(ETOHMaxVol, rate=1)
        #protocol.delay(minutes=0.1)
        #p1000.blow_out()
        #p1000.move_to(sample_plate_1[X].top(z=5))
        #p1000.move_to(sample_plate_1[X].top(z=0))
        #p1000.move_to(sample_plate_1[X].top(z=5))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_2: FROM tiprack_A3_adapter --> stacker_200_A4
        protocol.move_labware(labware=tiprack_200_2,new_location=stacker_200_A4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_1: FROM stacker_50_D4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_1,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> Removing Supernatant 1B')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_1['A1'])
        p1000.aspirate(RemoveSup-100, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+2))
        #protocol.delay(minutes=0.1)
        p1000.aspirate(100, sample_plate_1[X].bottom(z=PCRPlate_Z_offset))
        #p1000.default_speed = 5
        #p1000.move_to(sample_plate_1[X].top(z=2))
        #p1000.default_speed = 200
        p1000.dispense(RemoveSup, LW_reservoir[X].top(z=Deepwell_Z_offset))
        #protocol.delay(minutes=0.1)
        #p1000.blow_out()
        #p1000.default_speed = 400
        #p1000.move_to(LW_reservoir[X].top(z=-5))
        #p1000.move_to(LW_reservoir[X].top(z=0))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_1: FROM tiprack_A3_adapter --> stacker_50_D4
        protocol.move_labware(labware=tiprack_200_1,new_location=stacker_50_D4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_2: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_2,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> ETOH Wash 1B')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_2['A1'])
        p1000.aspirate(ETOHMaxVol, ETOH_reservoir_1[X].bottom(z=Deepwell_Z_offset+1))
        #p1000.move_to(ETOH_reservoir_1[X].top(z=0))
        #p1000.move_to(ETOH_reservoir_1[X].top(z=-5))
        #p1000.move_to(ETOH_reservoir_1[X].top(z=0))
        p1000.move_to(sample_plate_1[X].top(z=-2))
        p1000.dispense(ETOHMaxVol, rate=1)
        #protocol.delay(minutes=0.1)
        #p1000.blow_out()
        #p1000.move_to(sample_plate_1[X].top(z=5))
        #p1000.move_to(sample_plate_1[X].top(z=0))
        #p1000.move_to(sample_plate_1[X].top(z=5))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_2: FROM tiprack_A3_adapter --> stacker_200_A4
        protocol.move_labware(labware=tiprack_200_2,new_location=stacker_200_A4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_1: FROM stacker_50_D4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_1,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> Removing Supernatant 1C')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_1[X])
        p1000.aspirate(RemoveSup-100, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+2))
        #protocol.delay(minutes=0.1)
        p1000.aspirate(100, sample_plate_1[X].bottom(z=PCRPlate_Z_offset))
        #p1000.default_speed = 5
        #p1000.move_to(sample_plate_1[X].top(z=2))
        #p1000.default_speed = 200
        p1000.dispense(RemoveSup, LW_reservoir[X].top(z=Deepwell_Z_offset))
        #protocol.delay(minutes=0.1)
        #p1000.blow_out()
        #p1000.default_speed = 400
        #p1000.move_to(LW_reservoir[X].top(z=-5))
        #p1000.move_to(LW_reservoir[X].top(z=0))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_1: FROM tiprack_A3_adapter --> stacker_50_D4
        protocol.move_labware(labware=tiprack_200_1,new_location=stacker_50_D4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_2: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_2,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> ETOH Wash 1C')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_2[X])
        p1000.aspirate(ETOHMaxVol, ETOH_reservoir_1[X].bottom(z=Deepwell_Z_offset+1))
        #p1000.move_to(ETOH_reservoir_1[X].top(z=0))
        #p1000.move_to(ETOH_reservoir_1[X].top(z=-5))
        #p1000.move_to(ETOH_reservoir_1[X].top(z=0))
        p1000.move_to(sample_plate_1[X].top(z=-2))
        p1000.dispense(ETOHMaxVol, rate=1)
        #protocol.delay(minutes=0.1)
        #p1000.blow_out()
        #p1000.move_to(sample_plate_1[X].top(z=5))
        #p1000.move_to(sample_plate_1[X].top(z=0))
        #p1000.move_to(sample_plate_1[X].top(z=5))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_2: FROM tiprack_A3_adapter --> TRASH
        protocol.move_labware(labware=tiprack_200_2,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_200_1: FROM stacker_50_D4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_1,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('--> Removing Supernatant 1D')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_1[X])
        p1000.aspirate(RemoveSup-100, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+2))
        #protocol.delay(minutes=0.1)
        p1000.aspirate(100, sample_plate_1[X].bottom(z=PCRPlate_Z_offset))
        #p1000.default_speed = 5
        #p1000.move_to(sample_plate_1[X].top(z=2))
        #p1000.default_speed = 200
        p1000.dispense(RemoveSup, LW_reservoir[X].top(z=Deepwell_Z_offset))
        #protocol.delay(minutes=0.1)
        #p1000.blow_out()
        #p1000.default_speed = 400
        #p1000.move_to(LW_reservoir['A1'].top(z=-5))
        #p1000.move_to(LW_reservoir['A1'].top(z=0))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_1: FROM tiprack_A3_adapter --> TRASH
        protocol.move_labware(labware=tiprack_200_1,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # STACKER DISPENSING TIPRACK #1
        tiprack_50_4 = stacker_50_C4.retrieve()
        protocol.move_lid(tiprack_50_4, TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_50_4: FROM stacker_50_B4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_50_4,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE sample_plate_1 FROM mag_block --> heatershaker
        heatershaker.open_labware_latch()
        protocol.move_labware(labware=sample_plate_1,new_location=heatershaker,use_gripper=USE_GRIPPER)
        heatershaker.close_labware_latch()
        # GRIPPER MOVE sample_plate_2 FROM B2_PCR_STACk_4 --> thermocycler
        protocol.move_labware(labware=sample_plate_2,new_location=thermocycler,use_gripper=USE_GRIPPER)
        #============================================================================================
        
        #============================================================================================
        protocol.comment('--> Adding RSB')
        RSBVol = 32
        RSBMix = 10 if DRYRUN == False else 1
        p1000.flow_rate.aspirate = p96x_50_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_50_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_50_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_50_4[X])
        p1000.aspirate(RSBVol, RSB.bottom(z=Deep384_Z_offset))
        p1000.dispense(RSBVol, sample_plate_1[X].bottom(z=5+PCRPlate_Z_offset))
        ##========PIPETTE MIXING==========
        #p1000.move_to(sample_plate_1[X].bottom(z=PCRPlate_Z_offset+0.75))
        #p1000.mix(10,CleanupBeadVol)
        #================================
        p1000.return_tip()
        #===============================================

        #============================================================================================
        protocol.comment('--> Transferring')
        RSBVol = 32
        RSBMix = 10 if DRYRUN == False else 1
        p1000.flow_rate.aspirate = p96x_50_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_50_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_50_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_50_4[X])
        p1000.aspirate(RSBVol, sample_plate_1[X].bottom(z=5+PCRPlate_Z_offset))
        p1000.dispense(RSBVol, sample_plate_2[X].bottom(z=5+PCRPlate_Z_offset))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_50_4: FROM tiprack_A3_adapter --> TRASH
        protocol.move_labware(labware=tiprack_50_4,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE sample_plate_1: FROM heatershaker --> TRASH
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_1,new_location=TRASH,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE ETOH_reservoir_1: FROM B2 --> TRASH
        protocol.move_labware(labware=ETOH_reservoir_1,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        #============================================================================================

    if STEP_TAG == True:
        protocol.comment('\n==============================================')
        protocol.comment('--> Tagment')
        protocol.comment('==============================================\n')

        ############################################################################################################################################
        # STACKER DISPENSING TIPRACK #2
        tiprack_50_SCP_5 = stacker_50_C4.retrieve()
        protocol.move_lid(tiprack_50_SCP_5, TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_50_SCP_5: FROM stacker_50_C4 --> SCP_Position
        protocol.move_labware(labware=tiprack_50_SCP_5,new_location=SCP_Position,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> ADDING TAGMIX\n\n')
        TagVol = 20
        SampleVol = 40
        TagPremix = 3 if DRYRUN == False else 1
        TagMix = 12 if DRYRUN == False else 1
        p1000.flow_rate.aspirate = p96x_50_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_50_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_50_flow_rate_blow_out_default*0.5
        X = 'A1'
        #===============================================
        nozzlecheck('ROW_TOP')
        for loop, X in enumerate(row_top_sample_list):
            p1000.pick_up_tip(tiprack_50_SCP_5[row_top_pickup_list[loop]])
            p1000.move_to(TAGMIX.bottom(z=PCRPlate_Z_offset+1))
            p1000.aspirate(TagVol, rate=0.25)
            p1000.dispense(TagVol, sample_plate_2[X].bottom(z=PCRPlate_Z_offset+2), rate=0.5)
            #p1000.mix(TagMix, SampleVol,sample_plate_2[X].bottom(z=PCRPlate_Z_offset+2),rate=0.75)
            #p1000.move_to(sample_plate_2[X].top(z=-3))
            #protocol.delay(seconds=2.5)
            #p1000.blow_out(sample_plate_2[X].top(z=-3))
            #p1000.move_to(sample_plate_2[X].top(z=5))
            #p1000.move_to(sample_plate_2[X].top(z=0))
            #p1000.move_to(sample_plate_2[X].top(z=5))
            if DEVMODE == True:
                p1000.drop_tip() #location=TRASH.top(x=-3, y=32.8+(int(loop)*(-8.8)), z = -30))
            else:
                p1000.drop_tip()
        nozzlecheck('ROW_BOTTOM')
        for loop, X in enumerate(row_bottom_sample_list):
            p1000.pick_up_tip(tiprack_50_SCP_5[row_bottom_pickup_list[loop]])
            p1000.move_to(TAGMIX.bottom(z=PCRPlate_Z_offset+1))
            p1000.aspirate(TagVol, rate=0.25)
            p1000.dispense(TagVol, sample_plate_2[X].bottom(z=PCRPlate_Z_offset+2), rate=0.5)
            #p1000.mix(TagMix, SampleVol,sample_plate_2[X].bottom(z=PCRPlate_Z_offset+2),rate=0.75)
            #p1000.move_to(sample_plate_2[X].top(z=-3))
            #protocol.delay(seconds=2.5)
            #p1000.blow_out(sample_plate_2[X].top(z=-3))
            #p1000.move_to(sample_plate_2[X].top(z=5))
            #p1000.move_to(sample_plate_2[X].top(z=0))
            #p1000.move_to(sample_plate_2[X].top(z=5))
            if DEVMODE == True:
                p1000.drop_tip() #location=TRASH.top(x=-3, y=32.8+(8.8+(int(loop)*(-8.8))), z = -30))
            else:
                p1000.drop_tip()
        #===============================================

        ############################################################################################################################################
        protocol.comment('MOVING: Plate Lid #1 = Plate Lid Stack --> sample_plate_1')
        protocol.move_lid(source_location=lids, new_location=sample_plate_2, use_gripper=True)
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
            if DRYRUN == False:
                protocol.pause('Pausing to run Tagmentation on an off deck Thermocycler ~15min')
            else:
                protocol.comment('Pausing to run Tagmentation on an off deck Thermocycler ~15min')

        protocol.comment('MOVING: Plate Lid #1 = sample_plate_1 --> lids[1]')
        protocol.move_lid(source_location=sample_plate_2, new_location=TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        ############################################################################################################################################

        #============================================================================================
        # GRIPPER MOVE tiprack_50_SCP_5: FROM tiprack_A3_adapter --> TRASH
        protocol.move_labware(labware=tiprack_50_SCP_5,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # STACKER DISPENSING TIPRACK #3
        tiprack_50_SCP_6 = stacker_50_C4.retrieve()
        protocol.move_lid(tiprack_50_SCP_6, TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_50_SCP_6: FROM stacker_50_C4 --> SCP_Position
        protocol.move_labware(labware=tiprack_50_SCP_6,new_location=SCP_Position,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> Adding TAGSTOP\n\n')
        TAGSTOPVol    = 10
        TAGSTOPMixRep = 10 if DRYRUN == False else 1
        TAGSTOPMixVol = 30
        p1000.flow_rate.aspirate = p96x_50_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_50_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_50_flow_rate_blow_out_default*0.5
        X = 'A1'
        #===============================================
        nozzlecheck('ROW_TOP')
        for loop, X in enumerate(row_top_sample_list):
            p1000.pick_up_tip(tiprack_50_SCP_6[row_top_pickup_list[loop]])
            #p1000.aspirate(TAGSTOPVol, TAGSTOP.bottom(z=PCRPlate_Z_offset+0.5), rate=0.25)
            #p1000.move_to(sample_plate_2[X].bottom(z=PCRPlate_Z_offset+1))
            #p1000.dispense(TAGSTOPVol, rate=0.25)
            #p1000.mix(TAGSTOPMixRep, TAGSTOPMixVol,sample_plate_2[X].bottom(z=PCRPlate_Z_offset+1),rate=0.5)
            #p1000.blow_out(sample_plate_2[X].top(z=-2))
            if DEVMODE == True:
                p1000.drop_tip() #location=TRASH.top(x=-3, y=32.8+(int(loop)*(-8.8)), z = -30))
            else:
                p1000.drop_tip()
        nozzlecheck('ROW_BOTTOM')
        for loop, X in enumerate(row_bottom_sample_list):
            p1000.pick_up_tip(tiprack_50_SCP_6[row_bottom_pickup_list[loop]])
            #p1000.aspirate(TAGSTOPVol, TAGSTOP.bottom(z=PCRPlate_Z_offset+0.5), rate=0.25)
            #p1000.move_to(sample_plate_2[X].bottom(z=PCRPlate_Z_offset+1))
            #p1000.dispense(TAGSTOPVol, rate=0.25)
            #p1000.mix(TAGSTOPMixRep, TAGSTOPMixVol,sample_plate_2[X].bottom(z=PCRPlate_Z_offset+1),rate=0.5)
            #p1000.blow_out(sample_plate_2[X].top(z=-2))
            if DEVMODE == True:
                p1000.drop_tip() #location=TRASH.top(x=-3, y=32.8+(8.8+(int(loop)*(-8.8))), z = -30))
            else:
                p1000.drop_tip()
        #===============================================

        ############################################################################################################################################
        protocol.comment('MOVING: Plate Lid #2 = Plate Lid Stack --> sample_plate_2')
        protocol.move_lid(source_location=lids, new_location=sample_plate_2, use_gripper=True)

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
            if DRYRUN == False:
                protocol.pause('Pausing to run Tagmentation Stop on an off deck Thermocycler ~15min')
            else:
                protocol.comment('Pausing to run Tagmentation Stop on an off deck Thermocycler ~15min')

        protocol.comment('MOVING: Plate Lid #2 = sample_plate_2 --> lids[1]')
        protocol.move_lid(source_location=sample_plate_2, new_location=TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        ############################################################################################################################################

        if DRYRUN == False and ONDECK_THERMO == True:
            protocol.comment("SETTING THERMO to Room Temp")
            thermocycler.deactivate_block()
            thermocycler.deactivate_lid()

    if STEP_WASH == True:
        protocol.comment('\n==============================================')
        protocol.comment('--> Wash')
        protocol.comment('==============================================\n')

        #============================================================================================
        # GRIPPER MOVE tiprack_50_SCP_6: FROM tiprack_A3_adapter --> TRASH
        protocol.move_labware(labware=tiprack_50_SCP_6,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # STACKER DISPENSING TIPRACK #1
        tiprack_200_3 = stacker_200_A4.retrieve()
        # protocol.move_lid(tiprack_200_3, TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_200_3: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_3,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        # STACKER DISPENSING TIPRACK #2
        tiprack_200_4 = stacker_200_A4.retrieve()
        # protocol.move_lid(tiprack_200_4, TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE sample_plate_1 FROM thermocycler --> mag_block
        if ONDECK_THERMO == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_2,new_location=mag_block,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        if ONDECK_THERMO == False:
            protocol.move_labware(labware=sample_plate_2,new_location=mag_block,use_gripper=USE_GRIPPER)
        #============================================================================================

        if DRYRUN == False and ONDECK_THERMO == True:
            protocol.comment("SETTING THERMO to Room Temp")
            thermocycler.deactivate_block()
            thermocycler.deactivate_lid()

        if DRYRUN == False:
            protocol.delay(minutes=4)

        #============================================================================================
        # STACKER DISPENSING DEEPWELL #3
        TWB_reservoir = stacker_50_D4.retrieve()
        # GRIPPER MOVE TWB_reservoir FROM stacker_50_D4 --> SCP_Position
        protocol.move_labware(labware=TWB_reservoir,new_location=SCP_Position,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> Removing Supernatant\n\n')
        RemoveSup = 70
        ActualRemoveSup = 60
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_3[X])
        p1000.move_to(sample_plate_2[X].bottom(z=Deepwell_Z_offset+0.1))
        p1000.aspirate(30, rate=0.25)
        protocol.delay(seconds=2.5)
        p1000.aspirate(20, rate=0.25)
        p1000.move_to(sample_plate_2[X].top(z=-2))
        p1000.dispense(50, LW_reservoir[X].top(z=0))
        p1000.aspirate(30, rate=0.25)
        protocol.delay(seconds=2.5)
        p1000.aspirate(20, rate=0.25)
        p1000.move_to(sample_plate_2[X].top(z=-2))
        p1000.dispense(50, LW_reservoir[X].top(z=0))
        p1000.move_to(LW_reservoir[X].top(z=-3))
        protocol.delay(seconds=2.5)
        p1000.blow_out(LW_reservoir[X].top(z=-3))
        #=====Reservoir Tip Touch========
        p1000.default_speed = 100
        p1000.move_to(LW_reservoir[X].top())
        p1000.move_to(LW_reservoir[X].top().move(types.Point(x=2,z=-3)))
        p1000.move_to(LW_reservoir[X].top().move(types.Point(x=-2,z=-3)))
        p1000.default_speed = 400
        #================================
        p1000.move_to(LW_reservoir[X].top(z=5))
        p1000.move_to(LW_reservoir[X].top(z=0))
        p1000.move_to(LW_reservoir[X].top(z=5))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_3: FROM tiprack_A3_adapter --> stacker_50_D4
        protocol.move_labware(labware=tiprack_200_3,new_location=stacker_50_D4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_4: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_4,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE sample_plate_2 FROM MAG PLATE TO HEATER SHAKER
        if ONDECK_HEATERSHAKER == True:        
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_2,new_location=heatershaker,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=sample_plate_2,new_location='D1',use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> Wash \n\n')
        TWBMaxVol = 100
        TWBTime = 3*60 if DRYRUN == False else 0.1*60
        if DRYRUN == False and TIP_MIX == False:
            TWBMix = 4
        if DRYRUN == False and TIP_MIX == True:
            TWBMix = 30
        if DRYRUN == True:
            TWBMix = 1
        TWBMixVol = 90
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_4[X])
        p1000.aspirate(TWBMaxVol+3, TWB_reservoir.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1), rate=0.25)
        p1000.dispense(3, TWB_reservoir.wells_by_name()[X].bottom(z=1), rate=0.25)
        #=====Reservoir Tip Touch========
        p1000.default_speed = 100
        p1000.move_to(TWB_reservoir.wells_by_name()[X].top())
        p1000.move_to(TWB_reservoir.wells_by_name()[X].top().move(types.Point(x=2,z=-3)))
        p1000.move_to(TWB_reservoir.wells_by_name()[X].top().move(types.Point(x=-2,z=-3)))
        p1000.default_speed = 400
        #================================ 
        p1000.move_to(sample_plate_2[X].bottom(z=Deepwell_Z_offset+1))
        p1000.dispense(TWBMaxVol, rate=1)
        p1000.mix(TWBMix,TWBMixVol,rate=0.5)
        p1000.move_to(sample_plate_2[X].top(z=1))
        protocol.delay(seconds=2.5)
        p1000.blow_out(sample_plate_2[X].top(z=-5))
        p1000.aspirate(20)
        p1000.return_tip()
        heatershaker.set_and_wait_for_shake_speed(2000)
        protocol.delay(minutes=1 if not DRYRUN else 0.1,msg='Allow 1 minute for TWB to mix')
        heatershaker.deactivate_shaker()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_4: FROM tiprack_A3_adapter --> stacker_200_A4
        protocol.move_labware(labware=tiprack_200_4,new_location=stacker_200_A4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_3: FROM stacker_50_D4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_3,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE sample_plate_2 FROM heatershaker --> mag_block
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_2,new_location=mag_block,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=sample_plate_2,new_location=mag_block,use_gripper=USE_GRIPPER)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=3)

        protocol.comment('\n--> Remove Wash\n\n')
        TWBMaxVol = 150
        ActualRemoveSup = 100
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_3[X])
        p1000.move_to(sample_plate_2[X].bottom(z=Deepwell_Z_offset))
        p1000.aspirate(TWBMaxVol-50, rate=0.25)
        protocol.delay(seconds=2.5)
        p1000.aspirate(50, rate=0.25)
        p1000.move_to(sample_plate_2[X].top(z=-2))
        p1000.default_speed = 400
        p1000.dispense(150, LW_reservoir[X].top(z=0))
        p1000.move_to(LW_reservoir[X].top(z=-3))
        protocol.delay(seconds=2.5)
        p1000.blow_out(LW_reservoir[X].top(z=-3))
        p1000.move_to(LW_reservoir[X].top(z=5))
        p1000.move_to(LW_reservoir[X].top(z=0))
        p1000.move_to(LW_reservoir[X].top(z=5))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_3: FROM tiprack_A3_adapter --> stacker_50_D4
        protocol.move_labware(labware=tiprack_200_3,new_location=stacker_50_D4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_4: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_4,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE sample_plate_2 FROM MAG PLATE TO HEATER SHAKER
        if ONDECK_HEATERSHAKER == True:        
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_2,new_location=heatershaker,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=sample_plate_2,new_location='D1',use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> Wash \n\n')
        TWBMaxVol = 100
        TWBTime = 3*60 if DRYRUN == False else 0.1*60
        if DRYRUN == False and TIP_MIX == False:
            TWBMix = 4
        if DRYRUN == False and TIP_MIX == True:
            TWBMix = 30
        if DRYRUN == True:
            TWBMix = 1
        TWBMixVol = 90
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_4['A1'])
        p1000.aspirate(TWBMaxVol+3, TWB_reservoir.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1), rate=0.25)
        p1000.dispense(3, TWB_reservoir.wells_by_name()[X].bottom(z=1), rate=0.25)
        #=====Reservoir Tip Touch========
        p1000.default_speed = 100
        p1000.move_to(TWB_reservoir.wells_by_name()[X].top())
        p1000.move_to(TWB_reservoir.wells_by_name()[X].top().move(types.Point(x=2,z=-3)))
        p1000.move_to(TWB_reservoir.wells_by_name()[X].top().move(types.Point(x=-2,z=-3)))
        p1000.default_speed = 400
        #================================ 
        p1000.move_to(sample_plate_2[X].bottom(z=Deepwell_Z_offset+1))
        p1000.dispense(TWBMaxVol, rate=1)
        p1000.mix(TWBMix,TWBMixVol,rate=0.5)
        p1000.move_to(sample_plate_2[X].top(z=1))
        protocol.delay(seconds=2.5)
        p1000.blow_out(sample_plate_2[X].top(z=-5))
        p1000.aspirate(20)
        p1000.return_tip()
        heatershaker.set_and_wait_for_shake_speed(2000)
        protocol.delay(minutes=1 if not DRYRUN else 0.1,msg='Allow 1 minute for TWB to mix')
        heatershaker.deactivate_shaker()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_4: FROM tiprack_A3_adapter --> stacker_200_A4
        protocol.move_labware(labware=tiprack_200_4,new_location=stacker_200_A4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_3: FROM stacker_50_D4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_3,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE sample_plate_2 FROM heatershaker --> mag_block
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_2,new_location=mag_block,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=sample_plate_2,new_location=mag_block,use_gripper=USE_GRIPPER)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=3)

        protocol.comment('\n--> Remove Wash\n\n')
        TWBMaxVol = 150
        ActualRemoveSup = 100
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_3['A1'])
        p1000.move_to(sample_plate_2[X].bottom(z=Deepwell_Z_offset))
        p1000.aspirate(TWBMaxVol-50, rate=0.25)
        protocol.delay(seconds=2.5)
        p1000.aspirate(50, rate=0.25)
        p1000.move_to(sample_plate_2[X].top(z=-2))
        p1000.default_speed = 400
        p1000.dispense(150, LW_reservoir[X].top(z=0))
        p1000.move_to(LW_reservoir[X].top(z=-3))
        protocol.delay(seconds=2.5)
        p1000.blow_out(LW_reservoir[X].top(z=-3))
        p1000.move_to(LW_reservoir[X].top(z=5))
        p1000.move_to(LW_reservoir[X].top(z=0))
        p1000.move_to(LW_reservoir[X].top(z=5))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_3: FROM tiprack_A3_adapter --> stacker_50_D4
        protocol.move_labware(labware=tiprack_200_3,new_location=stacker_50_D4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_4: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_4,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE sample_plate_2 FROM MAG PLATE TO heatershaker
        if ONDECK_HEATERSHAKER == True:        
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_2,new_location=heatershaker,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=sample_plate_2,new_location='D1',use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> Wash \n\n')
        TWBMaxVol = 100
        TWBTime = 3*60 if DRYRUN == False else 0.1*60
        if DRYRUN == False and TIP_MIX == False:
            TWBMix = 4
        if DRYRUN == False and TIP_MIX == True:
            TWBMix = 30
        if DRYRUN == True:
            TWBMix = 1
        TWBMixVol = 90
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_4['A1'])
        p1000.aspirate(TWBMaxVol+3, TWB_reservoir.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1), rate=0.25)
        p1000.dispense(3, TWB_reservoir.wells_by_name()[X].bottom(z=1), rate=0.25)
        #=====Reservoir Tip Touch========
        p1000.default_speed = 100
        p1000.move_to(TWB_reservoir.wells_by_name()[X].top())
        p1000.move_to(TWB_reservoir.wells_by_name()[X].top().move(types.Point(x=2,z=-3)))
        p1000.move_to(TWB_reservoir.wells_by_name()[X].top().move(types.Point(x=-2,z=-3)))
        p1000.default_speed = 400
        #================================ 
        p1000.move_to(sample_plate_2[X].bottom(z=Deepwell_Z_offset+1))
        p1000.dispense(TWBMaxVol, rate=1)
        p1000.mix(TWBMix,TWBMixVol,rate=0.5)
        p1000.move_to(sample_plate_2[X].top(z=1))
        protocol.delay(seconds=2.5)
        p1000.blow_out(sample_plate_2[X].top(z=-5))
        p1000.aspirate(20)
        p1000.return_tip()
        heatershaker.set_and_wait_for_shake_speed(2000)
        protocol.delay(minutes=1 if not DRYRUN else 0.1,msg='Allow 1 minute for TWB to mix')
        heatershaker.deactivate_shaker()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_4: FROM tiprack_A3_adapter --> TRASH
        protocol.move_labware(labware=tiprack_200_4,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_200_3: FROM stacker_50_D4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_3,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE sample_plate_2 FROM heatershaker --> mag_block
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_2,new_location=mag_block,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=sample_plate_2,new_location=mag_block,use_gripper=USE_GRIPPER)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=3)

        protocol.comment('\n--> Remove Wash\n\n')
        TWBMaxVol = 150
        ActualRemoveSup = 100
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_3['A1'])
        p1000.move_to(sample_plate_2[X].bottom(z=Deepwell_Z_offset))
        p1000.aspirate(TWBMaxVol-50, rate=0.25)
        protocol.delay(seconds=2.5)
        p1000.aspirate(50, rate=0.25)
        p1000.move_to(sample_plate_2[X].top(z=-2))
        p1000.default_speed = 400
        p1000.dispense(150, LW_reservoir[X].top(z=0))
        p1000.move_to(LW_reservoir[X].top(z=-3))
        protocol.delay(seconds=2.5)
        p1000.blow_out(LW_reservoir[X].top(z=-3))
        p1000.move_to(LW_reservoir[X].top(z=5))
        p1000.move_to(LW_reservoir[X].top(z=0))
        p1000.move_to(LW_reservoir[X].top(z=5))
        #p1000.return_tip()
        #===============================================

        protocol.comment('\n--> Removing Residual Wash\n\n')
        RemoveSup = 30
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        X = 'A1'
        #===============================================
        #p1000.pick_up_tip(tiprack_50_5['A1'])
        p1000.move_to(sample_plate_2[X].bottom(z=Deepwell_Z_offset))
        p1000.aspirate(RemoveSup, rate=0.25)
        p1000.return_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)

        #============================================================================================
        # GRIPPER MOVE sample_plate_2 FROM mag_block --> thermocycler
        if ONDECK_THERMO == True:
            protocol.move_labware(labware=sample_plate_2,new_location=thermocycler,use_gripper=USE_GRIPPER)
        else:
            protocol.move_labware(labware=sample_plate_2,new_location='B1',use_gripper=USE_GRIPPER)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_3: FROM tiprack_A3_adapter --> TRASH
        protocol.move_labware(labware=tiprack_200_3,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # STACKER DISPENSING TIPRACK #4
        tiprack_50_SCP_7 = stacker_50_C4.retrieve()
        protocol.move_lid(tiprack_50_SCP_7, TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE TWB_reservoir: FROM SCP_Position --> TRASH
        protocol.move_labware(labware=TWB_reservoir,new_location=TRASH,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_50_SCP_7: FROM stacker_50_C4 --> SCP_Position
        protocol.move_labware(labware=tiprack_50_SCP_7,new_location=SCP_Position,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> Adding EPM\n\n')
        EPMVol = 40 
        EPMMixTime = 1*60 if DRYRUN == False else 0.1*60
        EPMMixRPM = 2000
        EPMMixVol = 35
        p1000.flow_rate.aspirate = p96x_50_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_50_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_50_flow_rate_blow_out_default*0.5
        X = 'A1'
        #===============================================
        nozzlecheck('ROW_TOP')
        for loop, X in enumerate(row_top_sample_list):
            p1000.pick_up_tip(tiprack_50_SCP_7[row_top_pickup_list[loop]])
            p1000.aspirate(EPMVol, EPM.bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=0,y=0,z=-4))))
            p1000.dispense(EPMVol, rate=1)
            p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
            p1000.aspirate(EPMMixVol, rate=1)
            #for Mix in range(4):
            #    p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=0,y=1.3*0.8,z=-4))))
            #    p1000.dispense(EPMMixVol-5, rate=1)
            #    p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
            #    p1000.aspirate(EPMMixVol-5, rate=1)
            #    p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=1.3*-0.8,y=0,z=-4))))
            #    p1000.dispense(EPMMixVol-5, rate=1)
            #    p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
            #    p1000.aspirate(EPMMixVol-5, rate=1)
            #    p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=0,y=1.3*-0.8,z=-4))))
            #    p1000.dispense(EPMMixVol-5, rate=1)
            #    p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
            #    p1000.aspirate(EPMMixVol-5, rate=1)
            #    p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=1.3*0.8,y=0,z=-4))))
            #    p1000.dispense(EPMMixVol-5, rate=1)
            #    p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
            #    p1000.aspirate(EPMMixVol-5, rate=1)
            p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
            p1000.dispense(EPMMixVol, rate=1)
            p1000.blow_out(sample_plate_2.wells_by_name()[X].center())
            p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+0.3))
            p1000.move_to(sample_plate_2.wells_by_name()[X].top(z=5))
            p1000.move_to(sample_plate_2.wells_by_name()[X].top(z=0))
            p1000.move_to(sample_plate_2.wells_by_name()[X].top(z=5))
            if DEVMODE == True:
                p1000.drop_tip() #location=TRASH.top(x=-3, y=32.8+(8.8+(int(loop)*(-8.8))), z = -30))
            else:
                p1000.drop_tip()
        nozzlecheck('ROW_BOTTOM')
        for loop, X in enumerate(row_bottom_sample_list):
            p1000.pick_up_tip(tiprack_50_SCP_7[row_bottom_pickup_list[loop]])
            p1000.aspirate(EPMVol, EPM.bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=0,y=0,z=-4))))
            p1000.dispense(EPMVol, rate=1)
            p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
            p1000.aspirate(EPMMixVol, rate=1)
            #for Mix in range(4):
            #    p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=0,y=1.3*0.8,z=-4))))
            #    p1000.dispense(EPMMixVol-5, rate=1)
            #    p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
            #    p1000.aspirate(EPMMixVol-5, rate=1)
            #    p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=1.3*-0.8,y=0,z=-4))))
            #    p1000.dispense(EPMMixVol-5, rate=1)
            #    p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
            #    p1000.aspirate(EPMMixVol-5, rate=1)
            #    p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=0,y=1.3*-0.8,z=-4))))
            #    p1000.dispense(EPMMixVol-5, rate=1)
            #    p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
            #    p1000.aspirate(EPMMixVol-5, rate=1)
            #    p1000.move_to((sample_plate_2.wells_by_name()[X].center().move(types.Point(x=1.3*0.8,y=0,z=-4))))
            #    p1000.dispense(EPMMixVol-5, rate=1)
            #    p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
            #    p1000.aspirate(EPMMixVol-5, rate=1)
            p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
            p1000.dispense(EPMMixVol, rate=1)
            p1000.blow_out(sample_plate_2.wells_by_name()[X].center())
            p1000.move_to(sample_plate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+0.3))
            p1000.move_to(sample_plate_2.wells_by_name()[X].top(z=5))
            p1000.move_to(sample_plate_2.wells_by_name()[X].top(z=0))
            p1000.move_to(sample_plate_2.wells_by_name()[X].top(z=5))
            if DEVMODE == True:
                p1000.drop_tip() #location=TRASH.top(x=-3, y=32.8+(8.8+(int(loop)*(-8.8))), z = -30))
            else:
                p1000.drop_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE sample_plate_2 FROM MAG PLATE TO heatershaker
        if ONDECK_HEATERSHAKER == True:        
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_2,new_location=heatershaker,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=sample_plate_2,new_location='D1',use_gripper=USE_GRIPPER)
        #============================================================================================

        #===============================================
        heatershaker.close_labware_latch()
        heatershaker.set_and_wait_for_shake_speed(rpm=EPMMixRPM)
        protocol.delay(EPMMixTime)
        heatershaker.deactivate_shaker()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE sample_plate_2 FROM MAG PLATE TO thermocycler
        if ONDECK_HEATERSHAKER == True:        
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=sample_plate_2,new_location=thermocycler,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=sample_plate_2,new_location='B1',use_gripper=USE_GRIPPER)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE tiprack_50_SCP_7: FROM SCP_Position --> TRASH
        protocol.move_labware(labware=tiprack_50_SCP_7,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # STACKER DISPENSING TIPRACK #5
        tiprack_50_8 = stacker_50_C4.retrieve()
        protocol.move_lid(tiprack_50_8, TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_50_8: FROM stacker_50_C4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_50_8,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> Adding Barcodes\n\n')
        BarcodeVol    = 10
        BarcodeMixRep = 5 if DRYRUN == False else 1
        BarcodeMixVol = 30
        TransferVol = 40
        p1000.flow_rate.aspirate = p96x_50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p96x_50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p96x_50_flow_rate_blow_out_default
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_50_8['A1'])
        p1000.aspirate(BarcodeVol+1, Barcodes.bottom(z=PCRPlate_Z_offset+0.3), rate=0.25)
        p1000.dispense(1, Barcodes.bottom(z=PCRPlate_Z_offset+0.3), rate=0.25)
        p1000.dispense(BarcodeVol, sample_plate_2.wells_by_name()[X].bottom(z=PCRPlate_Z_offset+1))
        p1000.mix(BarcodeMixRep,BarcodeMixVol)
        p1000.return_tip()
        #===============================================

    if STEP_PCRDECK == True:
        ############################################################################################################################################
        protocol.comment('MOVING: Plate Lid #3 = Plate Lid Stack --> sample_plate_2')
        protocol.move_lid(source_location=lids, new_location=sample_plate_2, use_gripper=True)
        
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
            if DRYRUN == False:
                protocol.pause('Pausing to run PCR on an off deck Thermocycler ~20min')
            else:
                protocol.comment('Pausing to run PCR on an off deck Thermocycler ~20min')

        protocol.comment('MOVING: Plate Lid #3 = sample_plate_2 --> lids[1]')
        protocol.move_lid(source_location=sample_plate_2, new_location=TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")        
        ############################################################################################################################################

    if STEP_CLEANUP_1 == True:
        protocol.comment('\n==============================================')
        protocol.comment('--> Cleanup')
        protocol.comment('==============================================\n')

        if DRYRUN == False:
            protocol.delay(minutes=5)

        #============================================================================================
        # GRIPPER MOVE tiprack_50_8: FROM tiprack_A3_adapter --> TRASH
        protocol.move_labware(labware=tiprack_50_8,new_location=TRASH,use_gripper=USE_GRIPPER)
        # NEW LAYER TYPE
        # Uncomment the following line so analysis would not fail
        stacker_50_D4.empty('Ensure Stacker is empty')
        stacker_50_D4.set_stored_labware("nest_96_wellplate_2ml_deep", count=3)
        # STACKER DISPENSING TIPRACK #6
        ETOH_reservoir_2 = stacker_50_D4.retrieve()
        # GRIPPER MOVE ETOH_reservoir_2: FROM stacker_200_A4 --> SCP_Position
        protocol.move_labware(labware=ETOH_reservoir_2,new_location=SCP_Position,use_gripper=USE_GRIPPER)
        # STACKER DISPENSING TIPRACK #7
        CleanupPlate_1 = stacker_50_D4.retrieve()
        # GRIPPER MOVE CleanupPlate_1: FROM stacker_200_A4 --> heatershaker
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_1,new_location=heatershaker,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_1,new_location='D1',use_gripper=USE_GRIPPER)
        # STACKER DISPENSING TIPRACK #8
        CleanupPlate_2 = stacker_50_D4.retrieve()
        # STACKER DISPENSING TIPRACK #3
        tiprack_200_5 = stacker_200_A4.retrieve()
        # protocol.move_lid(tiprack_200_5, TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_200_5: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_5,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> Adding H20\n\n')
        H20Vol    = 40
        SampleVol = 45+3
        CleanupBeadVol = 45
        CleanupBeadMixRPM = 1600
        CleanupBeadMixTime = 3*60 if DRYRUN == False else 0.1*60
        CleanupBeadPremix = 3 if DRYRUN == False else 1
        CleanupBeadMix = 6 if TIP_MIX == True else 1
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_5['A1'])
        p1000.aspirate(H20Vol, H20.bottom(z=Deepwell_Z_offset), rate=1)
        p1000.dispense(H20Vol, CleanupPlate_1[X].bottom(z=0.75))
        protocol.comment('\n--> TRANSFERRING\n\n')
        p1000.aspirate(SampleVol, sample_plate_2[X].bottom(z=PCRPlate_Z_offset+0.2), rate=0.5)
        p1000.dispense(SampleVol, CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+0.75), rate=1)
        p1000.aspirate(SampleVol, sample_plate_2[X].bottom(z=PCRPlate_Z_offset+0.2), rate=0.5)
        p1000.dispense(SampleVol, CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+0.75), rate=1)
        protocol.comment('\n--> Adding Cleanup Beads 1\n\n')
        # (45ul CleanupBeads_1 + 15ul CleanupBeads_2)/(45ul Sample + 40ul H20) = 0.7x overall, Right Cut (Large Molecules)
        p1000.move_to(CleanupBead.bottom(z=Deepwell_Z_offset+0.75))
        p1000.mix(CleanupBeadPremix,CleanupBeadVol)
        p1000.aspirate(CleanupBeadVol-5, CleanupBead.bottom(z=Deepwell_Z_offset+0.75), rate=0.25)
        p1000.default_speed = 100
        p1000.move_to(CleanupBead.top(z=-3))
        #=====Reservoir Tip Touch========
        p1000.default_speed = 100
        p1000.move_to(CleanupBead.top())
        p1000.move_to(CleanupBead.top().move(types.Point(x=2.5,z=-3)))
        p1000.move_to(CleanupBead.top().move(types.Point(x=-2.5,z=-3)))
        p1000.default_speed = 400
        #================================ 
        p1000.dispense(CleanupBeadVol-5, CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+0.75), rate=1)
        if TIP_MIX == True:
            CleanupBeadMix = 10
        if TIP_MIX == False:
            CleanupBeadMix = 4
        for Mix in range(CleanupBeadMix):
            p1000.aspirate(20, rate=0.5)
            p1000.move_to(CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+0.25))
            p1000.aspirate(20, rate=0.5)
            p1000.dispense(20, rate=0.5)
            p1000.move_to(CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+3))
            p1000.dispense(20, rate=0.5)
        p1000.move_to(CleanupPlate_1[X].top(z=-3))
        protocol.delay(seconds=0.2)
        p1000.blow_out(CleanupPlate_1[X].top(z=-10))
        protocol.delay(seconds=0.2)
        p1000.return_tip()
        heatershaker.set_and_wait_for_shake_speed(rpm=CleanupBeadMixRPM)
        protocol.delay(CleanupBeadMixTime)
        heatershaker.deactivate_shaker()
        #===============================================
        
        if DRYRUN == False and ONDECK_THERMO == True:
            if ONDECK_THERMO == True: thermocycler.deactivate_block()
            if ONDECK_THERMO == True: thermocycler.deactivate_lid()
            if ONDECK_TEMP == True: temp_block.deactivate()

        #============================================================================================
        # GRIPPER MOVE CleanupPlate_1 FROM heatershaker TO MAG PLATE
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_1,new_location=mag_block,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_1,new_location=mag_block,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE CleanupPlate_2 FROM stacker_200_A4 TO heatershaker
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_2,new_location=heatershaker,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_2,new_location='D1',use_gripper=USE_GRIPPER)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=4)

        #============================================================================================
        # GRIPPER MOVE tiprack_200_5: FROM tiprack_A3_adapter --> TRASH
        protocol.move_labware(labware=tiprack_200_5,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # STACKER DISPENSING TIPRACK #4
        tiprack_200_6 = stacker_200_A4.retrieve()
        # protocol.move_lid(tiprack_200_6, TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_200_6: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_6,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> TRANSFERRING\n\n')
        SampleVol = 125+2
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_6['A1'])
        protocol.comment('\n--> Transferring SAMPLE\n\n')
        p1000.aspirate(SampleVol/2, CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+0.75))
        protocol.delay(seconds=0.2)
        p1000.aspirate(SampleVol/2, CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+0.2))
        p1000.dispense(SampleVol, CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.75))
        p1000.aspirate(SampleVol/2, CleanupPlate_1[X].bottom(z=Deepwell_Z_offset+0.2))
        p1000.dispense(SampleVol/2, CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.75))
        p1000.move_to(CleanupPlate_2[X].top(z=-3))
        protocol.delay(seconds=0.2)
        p1000.blow_out(CleanupPlate_2[X].top(z=-10))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE CleanupPlate_1 FROM MAG PLATE --> TRASH
        protocol.move_labware(labware=CleanupPlate_1,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        #============================================================================================
        
        #============================================================================================
        # GRIPPER MOVE tiprack_200_6: FROM tiprack_A3_adapter --> stacker_200_A4
        protocol.move_labware(labware=tiprack_200_6,new_location=stacker_200_A4,use_gripper=USE_GRIPPER)
        # STACKER DISPENSING TIPRACK #6
        tiprack_50_9 = stacker_50_C4.retrieve()
        protocol.move_lid(tiprack_50_9, TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_50_9: FROM stacker_50_C4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_50_9,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> ADDING CleanupBead 2\n\n')
        CleanupBeadVol = 15
        CleanupBeadMixRPM = 1600
        CleanupBeadMixTime = 3*60 if DRYRUN == False else 0.1*60
        CleanupBeadPremix = 5 if DRYRUN == False else 1
        CleanupBeadMix = 6 if TIP_MIX == True else 1
        p1000.flow_rate.aspirate = p96x_50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p96x_50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p96x_50_flow_rate_blow_out_default
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_50_9['A1'])
        #protocol.comment('\n--> Adding Cleanup Beads 2\n\n')
        ## (45ul CleanupBeads_1 + 15ul CleanupBeads_2)/(45ul Sample + 40ul H20) = 0.7x overall, Left Cut (Small Molecules)
        #p1000.move_to(CleanupBead.bottom(z=Deepwell_Z_offset+0.75))
        #p1000.mix(CleanupBeadPremix,CleanupBeadVol)
        #p1000.aspirate(CleanupBeadVol+2, CleanupBead.bottom(z=Deepwell_Z_offset+0.75), rate=0.25)
        #p1000.dispense(4, CleanupBead.bottom(z=Deepwell_Z_offset+0.75), rate=0.5)
        #p1000.default_speed = 100
        #p1000.move_to(CleanupBead.top(z=-3))
        ##=====Reservoir Tip Touch========
        #p1000.default_speed = 100
        #p1000.move_to(CleanupBead.top())
        #p1000.move_to(CleanupBead.top().move(types.Point(x=2.5,z=-3)))
        #p1000.move_to(CleanupBead.top().move(types.Point(x=-2.5,z=-3)))
        #p1000.default_speed = 400
        ##================================ 
        #p1000.dispense(CleanupBeadVol-2, CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.75), rate=1)
        #if TIP_MIX == True:
        #    CleanupBeadMix = 10
        #if TIP_MIX == False:
        #    CleanupBeadMix = 4
        #for Mix in range(CleanupBeadMix):
        #    p1000.aspirate(20, rate=0.75)
        #    p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.25))
        #    p1000.aspirate(20, rate=0.75)
        #    p1000.dispense(20, rate=0.75)
        #    p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+3))
        #    p1000.dispense(20, rate=0.75)
        #protocol.delay(seconds=0.2)
        p1000.return_tip()
        #heatershaker.set_and_wait_for_shake_speed(rpm=CleanupBeadMixRPM)
        #protocol.delay(CleanupBeadMixTime)
        #heatershaker.deactivate_shaker()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE CleanupPlate_2 FROM heatershaker TO mag_block
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_2,new_location=mag_block,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_2,new_location=mag_block,use_gripper=USE_GRIPPER)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE tiprack_50_9: FROM tiprack_A3_adapter --> TRASH
        protocol.move_labware(labware=tiprack_50_9,new_location=TRASH,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_6: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_6,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=5)

        protocol.comment('\n--> Removing Supernatant 1\n\n')
        RemoveSup = 200
        ActualRemoveSup = 200
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_6['A1'])
        #p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+2))
        #p1000.aspirate(RemoveSup-100, rate=0.25)
        #p1000.default_speed = 100
        #protocol.delay(seconds=2.5)
        #p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.2))
        #p1000.aspirate(100, rate=0.25)
        #p1000.move_to(CleanupPlate_2[X].top(z=-2))
        #p1000.default_speed = 400
        #p1000.dispense(200, Liquid_trash['A1'].top(z=0))
        #p1000.move_to(Liquid_trash['A1'].top(z=-3))
        #protocol.delay(seconds=2.5)
        #p1000.blow_out(Liquid_trash['A1'].top(z=-3))
        #p1000.move_to(Liquid_trash['A1'].top(z=5))
        #p1000.move_to(Liquid_trash['A1'].top(z=0))
        #p1000.move_to(Liquid_trash['A1'].top(z=5))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_6: FROM tiprack_A3_adapter --> stacker_50_D4
        protocol.move_labware(labware=tiprack_200_6,new_location=stacker_50_D4,use_gripper=USE_GRIPPER)
        # STACKER DISPENSING TIPRACK #5
        tiprack_200_7 = stacker_200_A4.retrieve()
        # protocol.move_lid(tiprack_200_7, TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_200_7: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_7,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> ETOH Wash 1\n\n')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_7['A1'])
        #p1000.aspirate(ETOHMaxVol, ETOH_reservoir_1.wells_by_name()['A1'].bottom(z=Deepwell_Z_offset+1))
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top(z=0))
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top(z=-5))
        #=====Reservoir Tip Touch========
        #p1000.default_speed = 100
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top())
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top().move(types.Point(x=2.5,z=-3)))
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top().move(types.Point(x=-2.5,z=-3)))
        #p1000.default_speed = 400
        ##================================  
        #p1000.move_to(CleanupPlate_2[X].top(z=-10))
        #p1000.dispense(ETOHMaxVol, rate=1)
        #protocol.delay(seconds=2.5)
        #p1000.blow_out()
        #p1000.move_to(CleanupPlate_2[X].top(z=5))
        #p1000.move_to(CleanupPlate_2[X].top(z=0))
        #p1000.move_to(CleanupPlate_2[X].top(z=5))
        p1000.return_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)
        
        #============================================================================================
        # GRIPPER MOVE tiprack_200_7: FROM tiprack_A3_adapter --> stacker_200_A4
        protocol.move_labware(labware=tiprack_200_7,new_location=stacker_200_A4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_6: FROM stacker_50_D4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_6,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> Remove ETOH Wash 2\n\n')
        RemoveSup = 160
        ActualRemoveSup = 150
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_6['A1'])
        #p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+2))
        #p1000.aspirate(RemoveSup-100, rate=0.25)
        #p1000.default_speed = 100
        #protocol.delay(seconds=2.5)
        #p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.2))
        #p1000.aspirate(100, rate=0.25)
        #p1000.move_to(CleanupPlate_2[X].top(z=-2))
        #p1000.default_speed = 400
        #p1000.dispense(RemoveSup, Liquid_trash['A1'].top(z=0))
        #p1000.move_to(Liquid_trash['A1'].top(z=-3))
        #protocol.delay(seconds=2.5)
        #p1000.blow_out(Liquid_trash['A1'].top(z=-3))
        #p1000.move_to(Liquid_trash['A1'].top(z=5))
        #p1000.move_to(Liquid_trash['A1'].top(z=0))
        #p1000.move_to(Liquid_trash['A1'].top(z=5))
        p1000.return_tip()
        #===============================================

        #============================================================================================
        # GRIPPER MOVE tiprack_200_6: FROM tiprack_A3_adapter --> stacker_50_D4
        protocol.move_labware(labware=tiprack_200_6,new_location=stacker_50_D4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_7: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_7,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> ETOH Wash 2\n\n')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_7['A1'])
        #p1000.aspirate(ETOHMaxVol, ETOH_reservoir_1.wells_by_name()['A1'].bottom(z=Deepwell_Z_offset+1))
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top(z=0))
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top(z=-5))
        ##=====Reservoir Tip Touch========
        #p1000.default_speed = 100
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top())
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top().move(types.Point(x=2.5,z=-3)))
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top().move(types.Point(x=-2.5,z=-3)))
        #p1000.default_speed = 400
        ##================================  
        #p1000.move_to(CleanupPlate_2[X].top(z=-10))
        #p1000.dispense(ETOHMaxVol, rate=1)
        #protocol.delay(seconds=2.5)
        #p1000.blow_out()
        #p1000.move_to(CleanupPlate_2[X].top(z=5))
        #p1000.move_to(CleanupPlate_2[X].top(z=0))
        #p1000.move_to(CleanupPlate_2[X].top(z=5))
        p1000.return_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)

        #============================================================================================
        # GRIPPER MOVE tiprack_200_7: FROM tiprack_A3_adapter --> stacker_200_A4
        protocol.move_labware(labware=tiprack_200_7,new_location=stacker_200_A4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_6: FROM stacker_50_D4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_6,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================
        
        protocol.comment('\n--> Remove ETOH Wash 3\n\n')
        RemoveSup = 160
        ActualRemoveSup = 150
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_6['A1'])
        #p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+2))
        #p1000.aspirate(RemoveSup-100, rate=0.25)
        #p1000.default_speed = 100
        #protocol.delay(seconds=2.5)
        #p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.2))
        #p1000.aspirate(100, rate=0.25)
        #p1000.move_to(CleanupPlate_2[X].top(z=-2))
        #p1000.default_speed = 400
        #p1000.dispense(RemoveSup, Liquid_trash['A1'].top(z=0))
        #p1000.move_to(Liquid_trash['A1'].top(z=-3))
        #protocol.delay(seconds=2.5)
        #p1000.blow_out(Liquid_trash['A1'].top(z=-3))
        #p1000.move_to(Liquid_trash['A1'].top(z=5))
        #p1000.move_to(Liquid_trash['A1'].top(z=0))
        #p1000.move_to(Liquid_trash['A1'].top(z=5))
        p1000.return_tip()
        #===============================================


        #============================================================================================
        # GRIPPER MOVE tiprack_200_6: FROM tiprack_A3_adapter --> stacker_50_D4
        protocol.move_labware(labware=tiprack_200_6,new_location=stacker_50_D4,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_7: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_7,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> ETOH Wash 3\n\n')
        ETOHMaxVol = 150
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_7['A1'])
        #p1000.aspirate(ETOHMaxVol, ETOH_reservoir_1.wells_by_name()['A1'].bottom(z=Deepwell_Z_offset+1))
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top(z=0))
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top(z=-5))
        ##=====Reservoir Tip Touch========
        #p1000.default_speed = 100
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top())
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top().move(types.Point(x=2.5,z=-3)))
        #p1000.move_to(ETOH_reservoir_1.wells_by_name()['A1'].top().move(types.Point(x=-2.5,z=-3)))
        #p1000.default_speed = 400
        ##================================  
        #p1000.move_to(CleanupPlate_2[X].top(z=-10))
        #p1000.dispense(ETOHMaxVol, rate=1)
        #protocol.delay(seconds=2.5)
        #p1000.blow_out()
        #p1000.move_to(CleanupPlate_2[X].top(z=5))
        #p1000.move_to(CleanupPlate_2[X].top(z=0))
        #p1000.move_to(CleanupPlate_2[X].top(z=5))
        p1000.return_tip()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=0.5)

        #============================================================================================
        # GRIPPER MOVE tiprack_200_7: FROM tiprack_A3_adapter --> TRASH
        protocol.move_labware(labware=tiprack_200_7,new_location=TRASH,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE tiprack_200_6: FROM stacker_50_D4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_6,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================
        
        protocol.comment('\n--> Remove ETOH Wash 4\n\n')
        RemoveSup = 160
        ActualRemoveSup = 150
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_6['A1'])
        #p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+2))
        #p1000.aspirate(RemoveSup-100, rate=0.25)
        #p1000.default_speed = 100
        #protocol.delay(seconds=2.5)
        #p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.2))
        #p1000.aspirate(100, rate=0.25)
        #p1000.move_to(CleanupPlate_2[X].top(z=-2))
        #p1000.default_speed = 400
        #p1000.dispense(RemoveSup, Liquid_trash['A1'].top(z=0))
        #p1000.move_to(Liquid_trash['A1'].top(z=-3))
        #protocol.delay(seconds=2.5)
        #p1000.blow_out(Liquid_trash['A1'].top(z=-3))
        #p1000.move_to(Liquid_trash['A1'].top(z=5))
        #p1000.move_to(Liquid_trash['A1'].top(z=0))
        #p1000.move_to(Liquid_trash['A1'].top(z=5))
        #p1000.return_tip()
        #===============================================


        if DRYRUN == False:
            protocol.delay(minutes=1)

        protocol.comment('\n--> Removing Residual Wash\n\n')
        RemoveSup = 20
        ActualRemoveSup = 5
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        #nozzlecheck('96')
        X = 'A1'
        #===============================================
        #p1000.pick_up_tip(tiprack_50_12['A1'])
        #p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.35))
        #p1000.aspirate(RemoveSup, rate=0.25)
        p1000.return_tip()
        #===============================================
        
        if DRYRUN == False:
            protocol.delay(minutes=2)

        #============================================================================================
        # GRIPPER MOVE CleanupPlate FROM MAG PLATE TO heatershaker
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_2,new_location=heatershaker,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_2,new_location='D1',use_gripper=USE_GRIPPER)
        #============================================================================================
        
        #============================================================================================
        # GRIPPER MOVE tiprack_200_6: FROM tiprack_A3_adapter --> TRASH
        protocol.move_labware(labware=tiprack_200_6,new_location=TRASH,use_gripper=USE_GRIPPER)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # STACKER DISPENSING TIPRACK #6
        tiprack_200_8 = stacker_200_A4.retrieve()
        # protocol.move_lid(tiprack_200_8, TRASH, use_gripper=True)
        if DEVMODE == True:
            protocol.pause("REMOVE TRASH")
        # GRIPPER MOVE tiprack_200_8: FROM stacker_200_A4 --> tiprack_A3_adapter
        protocol.move_labware(labware=tiprack_200_8,new_location=tiprack_A3_adapter,use_gripper=USE_GRIPPER)
        #============================================================================================

        protocol.comment('\n--> Adding RSB\n\n')
        RSBVol = 32
        RSBMix = 6 if TIP_MIX == True else 1
        RSBMixRPM = 2000
        RSBMixTime = 2*60 if DRYRUN == False else 0.1*60
        p1000.flow_rate.aspirate = p96x_200_flow_rate_aspirate_default*0.25
        p1000.flow_rate.dispense = p96x_200_flow_rate_dispense_default*0.25
        p1000.flow_rate.blow_out = p96x_200_flow_rate_blow_out_default*0.5
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_8[X])
        p1000.aspirate(RSBVol, RSB.bottom(z=1))
        p1000.move_to(CleanupPlate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
        p1000.dispense(RSBVol, rate=1)
        if TIP_MIX == True:
            RSBMix = 10
        if TIP_MIX == False:
            RSBMix = 2
        for Mix in range(RSBMix):
            p1000.aspirate(RSBVol, CleanupPlate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1), rate=0.5)
            p1000.dispense(RSBVol, CleanupPlate_2.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1), rate=1)
        p1000.blow_out(CleanupPlate_2.wells_by_name()[X].top(z=-3))
        p1000.return_tip()
        heatershaker.set_and_wait_for_shake_speed(rpm=RSBMixRPM)
        protocol.delay(RSBMixTime)
        heatershaker.deactivate_shaker()
        #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=2)

        #============================================================================================
        # GRIPPER MOVE CleanupPlate_2 FROM heatershaker TO MAG PLATE
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate_2,new_location=mag_block,use_gripper=USE_GRIPPER)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate_2,new_location=mag_block,use_gripper=USE_GRIPPER)
        #============================================================================================

        #============================================================================================
        # GRIPPER MOVE sample_plate_2 FROM thermocycler --> TRASH
        if ONDECK_THERMO == True:
            protocol.move_labware(labware=sample_plate_2,new_location=TRASH,use_gripper=USE_GRIPPER)
        else:
            protocol.move_labware(labware=sample_plate_2,new_location=TRASH,use_gripper=USE_GRIPPER)
        # GRIPPER MOVE sample_plate_3 FROM B2_PCR_STACk_4 --> thermocycler
        sample_plate_3 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','B3','Sample Plate 3')
        if ONDECK_THERMO == True:
            protocol.move_labware(labware=sample_plate_3,new_location=thermocycler,use_gripper=USE_GRIPPER)
        else:
            protocol.move_labware(labware=sample_plate_3,new_location='B1',use_gripper=USE_GRIPPER)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=2)

        protocol.comment('\n--> Transferring Supernatant\n\n')
        TransferSup = 30
        p1000.flow_rate.aspirate = p96x_50_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p96x_50_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p96x_50_flow_rate_blow_out_default
        nozzlecheck('96')
        X = 'A1'
        #===============================================
        p1000.pick_up_tip(tiprack_200_8['A1'])
        p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.5))
        p1000.aspirate(TransferSup+1)
        p1000.dispense(TransferSup, sample_plate_3[X].bottom(z=PCRPlate_Z_offset+1))
        p1000.move_to(CleanupPlate_2[X].bottom(z=Deepwell_Z_offset+0.5))
        p1000.aspirate(10)
        p1000.dispense(10, sample_plate_3[X].bottom(z=PCRPlate_Z_offset+5))
        p1000.blow_out(sample_plate_3.wells_by_name()[X].top(z=-3))
        p1000.return_tip()
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
    protocol.comment("Done!!!")
