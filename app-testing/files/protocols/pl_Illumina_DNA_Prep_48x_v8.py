from opentrons import protocol_api
from opentrons import types
import math

metadata = {'protocolName': 'Illumina DNA Prep 48x v8','author': 'Opentrons <protocols@opentrons.com>','source': 'Protocol Library',}
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
        default=4,minimum=1,maximum=12,
        description="How many PCR Cycles to for amplification.")
    parameters.add_bool(
        display_name="Tip Mixing",
        variable_name="TIP_MIX",
        default=False,
        description="Whether or not to use Tip Mixing instead of a shaker")
    parameters.add_bool(
        display_name="On Deck Thermo Module",
        variable_name="ONDECK_THERMO",
        default=True,
        description="Whether or not to have an on deck Thermocycler")
    parameters.add_str(
        display_name="Tip Setting",
        variable_name="TIP_SETTING",
        default="Single Tip Use",
        description="Tip Settings",
        choices=[
        {"display_name": "Reusing Tips", "value": "Reusing Tips"},
        {"display_name": "Single Tip Use", "value": "Single Tip Use"},
        {"display_name": "None", "value": "None"}])

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
    COLUMNS             = protocol.params.COLUMNS
    PCRCYCLES           = protocol.params.PCRCYCLES
    TIP_MIX             = protocol.params.TIP_MIX
    ONDECK_THERMO       = protocol.params.ONDECK_THERMO
    TIP_SETTING         = protocol.params.TIP_SETTING

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
    AllSteps=[STEP_TAG,STEP_WASH,STEP_PCRDECK,STEP_CLEANUP]
    if COLUMNS == 5 or COLUMNS == 6 and all(AllSteps) == True:
        protocol.pause('MUST REUSE TIPS')
        TIP_SETTING = 'Reusing Tips'
    
    TIP_TRASH           = True      # Default True    | True = Used tips go in Trash, False = Used tips go back into rack
    DEACTIVATE_TEMP     = True      # Default True    | True = Temp and / or Thermocycler deactivate at end of run, False = remain on, such as leaving at 4 degrees 
    TRASH_POSITION      = 'CHUTE'   # Default 'CHUTE' | 'BIN' or 'CHUTE'
    ONDECK_HEATERSHAKER = True      # Default True    | True = On Deck Heater Shaker, False = No heatershaker and increased tip mixing reps.
    ONDECK_TEMP         = True      # Default True    | True = On Deck Temperature module, False = No Temperature Module
    USE_GRIPPER         = True      # Default True    | True = Uses the FLEX Gripper, False = No Gripper Movement, protocol pauses and requires manual intervention.
    HOTSWAP             = False     # Default False   | True = Allows replenishing tipracks on the off deck positions so the protocol can continue, False = Won't, protocol will most likely have out of tip error message.
    HOTSWAP_PAUSE       = False     # Default False   | True = Protocol pauses for replenishing the offdeck tip racks or to continue, False = Protocol won't cause, user must add tipracks at their discretion.
    SWAPOFFDECK         = False     # Default False   | True = Protocol will use an empty deck position as a temprorary place to swap new and used tip racks between on and off deck, instead of discarding in the chute, False = won't, and used tipracks will go into the chute.  Use True if there is deck space to spare and when doing troubleshooting so tips aren't being discarded with the tip racks.
    CUSTOM_OFFSETS      = False     # Default False   | True = use per instrument specific offsets, False = Don't use any offsets.  This is for per instrument, per module gripper alignment adjustments that need fine tuning without gripper recalibration.
    RES_TYPE_96x        = False     # Default False   | True = use a 96x2ml deepwell for the Reagent Reservoir to keep tips compartmentalized, False = 12x15ml Reservoir.
    WASH_AirMultiDis    = False     # Default False   | When adding WASH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
    ETOH_AirMultiDis    = False     # Default False   | When adding EtOH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
    REUSE_50_TIPS_RSB   = False     # Default False   | Reusing p50 tips
    REUSE_200_TIPS_WASH = False     # Default False   | Reusing p200 tips
    REUSE_200_TIPS_ETOH = False     # Default False   | Reusing p200 tips
    STP_200_TIPS        = False     # Default False   | Single Tip Pickup p200 tips
    STP_50_TIPS         = False     # Default False   | Single tip Pickup p50 tips
    NOLABEL             = True      # Default False   | True = Do no include Liquid Labeling, False = Liquid Labeling is included, adds additional lines to Protocol Step Preview at end of protocol.
    REPORT              = False     # Default False   | True = Include Extra Comments in the Protocol Step Preview for troubleshooting, False = Do Not Include

    # ============================== SETTINGS ===============================
    if DRYRUN == True: 
        TIP_TRASH           = False      # True = Used tips go in Trash, False = Used tips go back into rack
        DEACTIVATE_TEMP     = True      # Whether or not to deactivate the heating and cooling modules after a run
        REPORT              = True      # Whether or not to include Extra Comments for Debugging
    if TIP_SETTING == 'Reusing Tips':
        RES_TYPE_96x        = True      # Type of Reservoir, if reusing tips or omitting rows, set True to use a 96x2ml deepwell
        WASH_AirMultiDis    = True      # When adding WASH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
        ETOH_AirMultiDis    = True      # When adding EtOH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
        REUSE_50_TIPS_RSB   = True      # Reusing p50 tips
        REUSE_200_TIPS_WASH = True      # Reusing p200 tips
        REUSE_200_TIPS_ETOH = True      # Reusing p200 tips
    if TIP_SETTING == 'Single Tip Use':
        RES_TYPE_96x        = False     # Type of Reservoir, if reusing tips or omitting rows, set True to use a 96x2ml deepwell
        WASH_AirMultiDis    = False     # When adding WASH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
        ETOH_AirMultiDis    = False     # When adding EtOH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
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
    
    # =============================== PIPETTE ===============================
    p1000 = protocol.load_instrument('flex_8channel_1000', 'left')
    p50 = protocol.load_instrument("flex_8channel_50", "right")
    p1000_flow_rate_aspirate_default = 200
    p1000_flow_rate_dispense_default = 200
    p1000_flow_rate_blow_out_default = 400
    p50_flow_rate_aspirate_default = 50
    p50_flow_rate_dispense_default = 50
    p50_flow_rate_blow_out_default = 100

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
    
    def DefinePosition(tiptype,position,status):
        # A Function that is called for potential tip Rack Position.  Rather than defining tipracks at the beginning this function is called for each potential tip rack position, values are passed
        # to the function and the tip position is added to the appropriate list as, Single Tip Pickup (STP), Reusable Tips, of left as OPEN which can be filled with p50 or p200 as needed.
        global STP_50_TIPS
        global STP_200_TIPS
        global COLUMNS
        global REUSE_ANY_50_TIPS
        global REUSE_ANY_200_TIPS
        global p50_RACK_COUNT
        global p200_RACK_COUNT
        global tiprack_200_STP
        global tiprack_200_STR
        global tiprack_50_R
        global tiprack_200_R1
        global tiprack_200_R2
        if status == 'OPEN':
            if position[1:2]!='4':
                AVAILABLE_POS_ONDECK.append(position)
            if position[1:2]=='4':
                AVAILABLE_POS_OFFDECK.append(position)
        if status == 'STP_200' and STP_200_TIPS == True:
            tiprack_200_STP = protocol.load_labware('opentrons_flex_96_tiprack_200ul', position, f'tiprack_200_STP')
            for i in range(1, 13):
                STP_200_list_x4.append(tiprack_200_STP[f'E{i}'])
                STP_200_list_x4.append(tiprack_200_STP[f'A{i}'])
            rows = ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A']
            columns = ['1', '2', '3', '4', '5', '6','7','8','9','10','11','12']
            for col in (columns):
                for row in rows:
                    STP_200_list_x1.append(tiprack_200_STP[row + col])
        if status == 'STR_200' and STP_200_TIPS == True:
            tiprack_200_STR = protocol.load_labware('opentrons_flex_96_tiprack_200ul', position, f'tiprack_200_STR')
            for i in range(1, 13):
                STR_200_list.append(tiprack_200_STR[f'A{i}'])
                STR_200_list.append(tiprack_200_STR[f'E{i}'])
        if status == 'STP_50' and STP_50_TIPS == True:
            tiprack_50_STP = protocol.load_labware('opentrons_flex_96_tiprack_50ul', position, f'tiprack_50_STP')
            for i in range(1, 13):
                STP_50_list_x4.append(tiprack_50_STP[f'E{i}'])
                STP_50_list_x4.append(tiprack_50_STP[f'A{i}'])
            rows = ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A']
            columns = ['1', '2', '3', '4', '5', '6','7','8','9','10','11','12']
            for col in (columns):
                for row in rows:
                    STP_50_list_x1.append(tiprack_50_STP[row + col])
        if status == 'STR_50' and STP_50_TIPS == True:
            tiprack_50_STR = protocol.load_labware('opentrons_flex_96_tiprack_50ul', position, f'tiprack_50_STR')
            for i in range(1, 13):
                STR_50_list.append(tiprack_50_STR[f'A{i}'])
                STR_50_list.append(tiprack_50_STR[f'E{i}'])
        if status == 'REUSE_50_TIPS' and REUSE_ANY_50_TIPS == True:
            p50_RACK_COUNT +=1
            tiprack_50_R = protocol.load_labware('opentrons_flex_96_tiprack_50ul', position, f'tiprack_50_R')
            protocol.comment(f'Adding tiprack_50_R')
            for X in range(COLUMNS):
                REUSE_50_TIPS.append(tiprack_50_R.wells_by_name().get(f'A{X+1}', None))
            for X in range(COLUMNS,12):
                p50_INITIALTIPS.append(tiprack_50_R.wells_by_name().get(f'A{X+1}', None))
        if status == 'REUSE_50_TIPS' and REUSE_ANY_50_TIPS == False:
            if position[1:2]!='4':
                AVAILABLE_POS_ONDECK.append(position)
            if position[1:2]=='4':
                AVAILABLE_POS_OFFDECK.append(position)
        if status == 'REUSE_200_1TIPS' and REUSE_ANY_200_TIPS == True:
            p200_RACK_COUNT +=1
            tiprack_200_R1 = protocol.load_labware('opentrons_flex_96_tiprack_200ul', position, f'tiprack_200_R1')
            protocol.comment(f'Adding tiprack_200_R1')
            for X in range(COLUMNS):
                REUSE_200_TIPS_1.append(tiprack_200_R1.wells_by_name().get(f'A{X+1}', None))
            for X in range(COLUMNS,12):
                p200_INITIALTIPS.append(tiprack_200_R1.wells_by_name().get(f'A{X+1}', None))
        if status == 'REUSE_200_1TIPS' and REUSE_ANY_200_TIPS == False:
            if position[1:2]!='4':
                AVAILABLE_POS_ONDECK.append(position)
            if position[1:2]=='4':
                AVAILABLE_POS_OFFDECK.append(position)
        if status == 'REUSE_200_2TIPS' and REUSE_ANY_200_TIPS == True:
            p200_RACK_COUNT +=1
            tiprack_200_R2 = protocol.load_labware('opentrons_flex_96_tiprack_200ul', position, f'tiprack_200_R2')
            protocol.comment(f'Adding tiprack_200_R2')
            for X in range(COLUMNS*2):
                REUSE_200_TIPS_2.append(tiprack_200_R2.wells_by_name().get(f'A{X+1}', None))
            for X in range(COLUMNS*2,12):
                p200_INITIALTIPS.append(tiprack_200_R2.wells_by_name().get(f'A{X+1}', None))
        if status == 'REUSE_200_2TIPS' and REUSE_ANY_200_TIPS == False:
            if position[1:2]!='4':
                AVAILABLE_POS_ONDECK.append(position)
            if position[1:2]=='4':
                AVAILABLE_POS_OFFDECK.append(position)

    def TipCheck(tiptype,tipuse,rep,tipset):
        # A Function that is called replacing the Tip Pickup Step.  Values are passed to the function such as tip type, reuse, and which rep (loop number) it is on.
        # 1). Checks if there are 0 spaces available, if so, it clears the off deck positions allowing it to be refilled
        # 2). Then, if its not Single Tip Pickup (which has its own separate list), if there are no positions available, and not a Reusing step, it adds a rack to either the On or Off Deck
        # 3). If it is an Off Deck Position, it automatically starts the TipRackSwap Function, removing the next in line empry rack and swapping in the newly added Off Deck rack
        global p50_TIPS
        global p200_TIPS
        global p50_RACK_COUNT
        global p200_RACK_COUNT
        global RESETCOUNT
        global TIPDONEMODE
        if len(AVAILABLE_POS_ONDECK) == 0 and len(AVAILABLE_POS_OFFDECK) == 0:
            if HOTSWAP == True:
                for loop, X in enumerate(OFFDECK_LIST):
                    del protocol.deck[X]
                    if HOTSWAP_PAUSE == True:
                        protocol.pause('CLEARING OFFDECK POSITIONS')
                    else:
                        protocol.comment('CLEARING OFFDECK POSITIONS')
                    AVAILABLE_POS_OFFDECK.append(X)        
        if tiptype == 50 and tipuse != 'STP':
            if p50_TIPS == 0 and len(p50_INITIALTIPS) == 0:
                if tipuse == 'REUSE' and REUSE_ANY_50_TIPS == True:
                    p50.pick_up_tip(REUSE_50_TIPS[rep])
                else:
                    if len(p50_RACKS_ONDECK) == 0:
                        protocol.comment('FIRST RACK')
                    else:
                        protocol.comment('IS THERE AN EMPTY RACK?')
                        RACKS_TO_DUMP.append(p50_RACKS_ONDECK[0])
                        p50_RACKS_ONDECK.pop(0)
                    p50_RACK_COUNT +=1
                    p50_TIPS +=12                    
                    protocol.comment(f'Adding tiprack_50_{p50_RACK_COUNT}')
                    if len(AVAILABLE_POS_ONDECK) > 0:
                        addtiprack = protocol.load_labware('opentrons_flex_96_tiprack_50ul', AVAILABLE_POS_ONDECK[0], f'tiprack_50_{p50_RACK_COUNT}')
                        AVAILABLE_POS_ONDECK.pop(0)
                        p50_RACKS_ONDECK.append(addtiprack)
                        p50_RACKS_PIPET.append(addtiprack)
                        p50.tip_racks = p50_RACKS_PIPET
                    elif len(AVAILABLE_POS_ONDECK) == 0 and len(AVAILABLE_POS_OFFDECK) > 0:
                        addtiprack = protocol.load_labware('opentrons_flex_96_tiprack_50ul', AVAILABLE_POS_OFFDECK[0], f'tiprack_50_{p50_RACK_COUNT}')
                        AVAILABLE_POS_OFFDECK.pop(0)
                        p50_RACKS_OFFDECK.append(addtiprack)
                        p50_RACKS_PIPET.append(addtiprack)
                        p50.tip_racks = p50_RACKS_PIPET
                        TipRackSwap(50)
            if p50_TIPS == 0 and len(p50_INITIALTIPS) > 0:
                if tipuse == 'REUSE' and REUSE_ANY_50_TIPS == True:
                    p50.pick_up_tip(REUSE_50_TIPS[rep])
                else:
                    p50.pick_up_tip(p50_INITIALTIPS[0])
                    p50_INITIALTIPS.pop(0)
            if p50_TIPS > 0:
                if tipuse == 'REUSE' and REUSE_ANY_50_TIPS == True:
                    p50.pick_up_tip(REUSE_50_TIPS[rep])
                else:
                    if len(p50_INITIALTIPS) > 0:
                        p50.pick_up_tip(p50_INITIALTIPS[0])
                        p50_INITIALTIPS.pop(0)
                    else:
                        p50_TIPS-=1
                        p50.pick_up_tip()
        if tiptype == 200 and tipuse != 'STP':
            if p200_TIPS == 0 and len(p200_INITIALTIPS) == 0:
                if tipuse == 'REUSE' and tipset == 'WASH' and REUSE_200_TIPS_WASH == True:
                        p1000.pick_up_tip(REUSE_200_TIPS_1[rep])
                elif tipuse == 'REUSE' and tipset == 'ETOH' and REUSE_200_TIPS_ETOH == True:
                        p1000.pick_up_tip(REUSE_200_TIPS_2[rep])
                else:
                    if len(p200_RACKS_ONDECK) == 0:
                        protocol.comment('FIRST RACK')
                    else:
                        protocol.comment('IS THERE AN EMPTY RACK?')
                        RACKS_TO_DUMP.append(p200_RACKS_ONDECK[0])
                        p200_RACKS_ONDECK.pop(0)
                    p200_RACK_COUNT +=1
                    p200_TIPS +=12                    
                    protocol.comment(f'Adding tiprack_200_{p200_RACK_COUNT}')
                    if len(AVAILABLE_POS_ONDECK) > 0:
                        addtiprack = protocol.load_labware('opentrons_flex_96_tiprack_200ul', AVAILABLE_POS_ONDECK[0], f'tiprack_200_{p200_RACK_COUNT}')
                        AVAILABLE_POS_ONDECK.pop(0)
                        p200_RACKS_ONDECK.append(addtiprack)
                        p200_RACKS_PIPET.append(addtiprack)
                        p1000.tip_racks = p200_RACKS_PIPET
                    elif len(AVAILABLE_POS_ONDECK) == 0 and len(AVAILABLE_POS_OFFDECK) > 0:
                        addtiprack = protocol.load_labware('opentrons_flex_96_tiprack_200ul', AVAILABLE_POS_OFFDECK[0], f'tiprack_200_{p200_RACK_COUNT}')
                        AVAILABLE_POS_OFFDECK.pop(0)
                        p200_RACKS_OFFDECK.append(addtiprack)
                        p200_RACKS_PIPET.append(addtiprack)
                        p1000.tip_racks = p200_RACKS_PIPET
                        TipRackSwap(200)
            if p200_TIPS == 0 and len(p200_INITIALTIPS) > 0:
                if tipuse == 'REUSE' and REUSE_ANY_200_TIPS == True:
                    if tipset == 'WASH' and REUSE_200_TIPS_WASH == True:
                        p1000.pick_up_tip(REUSE_200_TIPS_1[rep])
                    elif tipset == 'ETOH' and REUSE_200_TIPS_ETOH == True:
                        p1000.pick_up_tip(REUSE_200_TIPS_2[rep])
                    else:
                        if len(p200_INITIALTIPS) > 0:
                            p1000.pick_up_tip(p200_INITIALTIPS[0])
                            p200_INITIALTIPS.pop(0)
                        else:
                            p200_TIPS-=1
                            p1000.pick_up_tip()
                else:
                    p1000.pick_up_tip(p200_INITIALTIPS[0])
                    p200_INITIALTIPS.pop(0)
            if p200_TIPS > 0:
                if tipuse == 'REUSE' and REUSE_ANY_200_TIPS == True:
                    if tipset == 'WASH' and REUSE_200_TIPS_WASH == True:
                        p1000.pick_up_tip(REUSE_200_TIPS_1[rep])
                    elif tipset == 'ETOH' and REUSE_200_TIPS_ETOH == True:
                        p1000.pick_up_tip(REUSE_200_TIPS_2[rep])
                    else:
                        if len(p200_INITIALTIPS) > 0:
                            p1000.pick_up_tip(p200_INITIALTIPS[0])
                            p200_INITIALTIPS.pop(0)
                        else:
                            p200_TIPS-=1
                            p1000.pick_up_tip()
                else:
                    if len(p200_INITIALTIPS) > 0:
                        p1000.pick_up_tip(p200_INITIALTIPS[0])
                        p200_INITIALTIPS.pop(0)
                    else:
                        p200_TIPS-=1
                        p1000.pick_up_tip()
        if tiptype == 50 and tipuse == 'STP':
            p50.pick_up_tip(stp_50_list[rep])
        if tiptype == 200 and tipuse == 'STP':
            p1000.pick_up_tip(stp_200_list[rep])

    def TipDone(tiptype,tipuse,rep,tipset):
        # A Function that is called replacing the Tip dropping Step.  Values are passed to the function such as tip type, reuse, and which rep (loop number) it is on.
        # 1). Checks if it is a Single Tip Pickup, Reusable tip, or if the run is a Dry run,
        global TIP_TRASH
        if tiptype == 50:
            if tipuse == 'STP':
                p50.drop_tip(str_50_list[rep]) if TIP_TRASH == False else p50.drop_tip()
            elif tipuse == 'REUSE':
                p50.return_tip()
            else:
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip() 
        if tiptype == 200: 
            if tipuse == 'STP':
                p1000.drop_tip(str_200_list[rep]) if TIP_TRASH == False else p1000.drop_tip()
            elif tipuse == 'REUSE':
                p1000.return_tip()
            else:
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()

    def TipRackSwap(tiptype):
        # A Function that is called from within the TipCheck function to Swap Tip Racks.
        # 1). Sets the values within the Function according to the appropriate tip rack list
        # 2). If the Global Value of SWAPOFFDECK = True, it will swap tipracks (rather than dump into the Chute) 
        # 3). First in line of the RACKS_TO_DUMP is the one removed, can either be p50 or p200, no reusable tips or single Tip Racks 
        if tiptype == 50:
            RACK_EMPTY     = RACKS_TO_DUMP[0]
            RACK_EMPTY_POS = RACKS_TO_DUMP[0].parent
            RACK_NEW       = p50_RACKS_OFFDECK[0]
            RACK_NEW_POS   = p50_RACKS_OFFDECK[0].parent
        if tiptype == 200:
            RACK_EMPTY     = RACKS_TO_DUMP[0]
            RACK_EMPTY_POS = RACKS_TO_DUMP[0].parent
            RACK_NEW       = p200_RACKS_OFFDECK[0]
            RACK_NEW_POS   = p200_RACKS_OFFDECK[0].parent
        if SWAPOFFDECK == True:
            SWAPSPOT.append(RACK_NEW_POS)
            SWAPSPOT.append(RACK_EMPTY_POS)
            protocol.comment("EMPTY POS "+str(SWAPSPOT[0]))
            protocol.comment("RACK LEAVING THIS OFF DECK POS "+str(SWAPSPOT[1]))
            protocol.comment("EMPTY RACK LEAVING THIS POS, MAKING IT THE NEW EMPTY POS "+str(SWAPSPOT[2]))
            protocol.move_labware(labware=RACK_NEW,new_location=SWAPSPOT[0],use_gripper=USE_GRIPPER)
            protocol.move_labware(labware=RACK_EMPTY,new_location=SWAPSPOT[1],use_gripper=USE_GRIPPER)
            SWAPSPOT.pop(0)
            SWAPSPOT.pop(0)
            if tiptype == 50:
                p50_RACKS_ONDECK.append(RACK_NEW)
                RACKS_TO_DUMP.pop(0)
                p50_RACKS_ONDECK.pop(0)
                p50_RACKS_OFFDECK.pop(0)
            if tiptype == 200:
                p200_RACKS_ONDECK.append(RACK_NEW)
                RACKS_TO_DUMP.pop(0)
                p200_RACKS_ONDECK.pop(0)
                p200_RACKS_OFFDECK.pop(0)
        else:
            SWAPS_POT = [RACK_EMPTY_POS]
            protocol.move_labware(labware=RACK_EMPTY,new_location=TRASH,use_gripper=USE_GRIPPER)
            protocol.move_labware(labware=RACK_NEW,new_location=SWAPS_POT[0],use_gripper=USE_GRIPPER)
            if tiptype == 50:
                p50_RACKS_ONDECK.append(RACK_NEW)
                p50_RACKS_DROPPED.append(RACK_EMPTY)
                RACKS_TO_DUMP.pop(0)
                p50_RACKS_ONDECK.pop(0)
                p50_RACKS_OFFDECK.pop(0)
            if tiptype == 200:
                p200_RACKS_ONDECK.append(RACK_NEW)
                p200_RACKS_DROPPED.append(RACK_EMPTY)
                RACKS_TO_DUMP.pop(0)
                p200_RACKS_ONDECK.pop(0)
                p200_RACKS_OFFDECK.pop(0)

    def PlateUnstack(Startposition,Stopposition):
        # A Function that creates a plate, grips it based on offsets mimicking the stacked plates height, and moves it to a new position,
        # This is a Standin Function until real functionality for plate unstacking is added.
        global PLATE_STACKED
        if PLATE_STACKED == 7:
            sample_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt',Startposition)
            protocol.move_labware(labware=sample_plate_1,new_location=Stopposition,use_gripper=USE_GRIPPER,pick_up_offset={'x':0,'y':0,'z':(PLATE_STACKED-1)*13},drop_offset=deck_drop_offset)
            PLATE_STACKED-=1
        elif PLATE_STACKED == 6:
            sample_plate_2 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt',Startposition)
            protocol.move_labware(labware=sample_plate_2,new_location=Stopposition,use_gripper=USE_GRIPPER,pick_up_offset={'x':0,'y':0,'z':(PLATE_STACKED-1)*13},drop_offset=deck_drop_offset)
            PLATE_STACKED-=1
        elif PLATE_STACKED == 5:
            sample_plate_3 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt',Startposition)
            protocol.move_labware(labware=sample_plate_3,new_location=Stopposition,use_gripper=USE_GRIPPER,pick_up_offset={'x':0,'y':0,'z':(PLATE_STACKED-1)*13},drop_offset=deck_drop_offset)
            PLATE_STACKED-=1
        elif PLATE_STACKED == 4:
            sample_plate_4 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt',Startposition)
            protocol.move_labware(labware=sample_plate_4,new_location=Stopposition,use_gripper=USE_GRIPPER,pick_up_offset={'x':0,'y':0,'z':(PLATE_STACKED-1)*13},drop_offset=deck_drop_offset)
            PLATE_STACKED-=1
        elif PLATE_STACKED == 3:
            sample_plate_5 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt',Startposition)
            protocol.move_labware(labware=sample_plate_5,new_location=Stopposition,use_gripper=USE_GRIPPER,pick_up_offset={'x':0,'y':0,'z':(PLATE_STACKED-1)*13},drop_offset=deck_drop_offset)
            PLATE_STACKED-=1
        elif PLATE_STACKED == 2:
            sample_plate_6 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt',Startposition)
            protocol.move_labware(labware=sample_plate_6,new_location=Stopposition,use_gripper=USE_GRIPPER,pick_up_offset={'x':0,'y':0,'z':(PLATE_STACKED-1)*13},drop_offset=deck_drop_offset)
            PLATE_STACKED-=1
        elif PLATE_STACKED == 1:
            sample_plate_7 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt',Startposition)
            protocol.move_labware(labware=sample_plate_7,new_location=Stopposition,use_gripper=USE_GRIPPER,pick_up_offset={'x':0,'y':0,'z':0},drop_offset=deck_drop_offset)

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
        DefinePosition(None,'A1','OPEN')
    DefinePosition(None,'A2','OPEN')
    # ========== SECOND ROW ==========
    if ONDECK_THERMO == True:
        pass
    else:
        pass
    DefinePosition(None,'B2','OPEN')
    DefinePosition(50,'B3','REUSE_50_TIPS')
    # ========== THIRD ROW ===========
    if ONDECK_TEMP == True:
        temp_block = protocol.load_module('temperature module gen2', 'C1')
        temp_adapter = temp_block.load_adapter('opentrons_96_well_aluminum_block')
        reagent_plate_1 = temp_adapter.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'Reagent Plate')
    else:
        reagent_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'C1', 'Reagent Plate')        
    reservoir = protocol.load_labware('nest_12_reservoir_15ml','C2', 'Reservoir')  if RES_TYPE_96x == False else protocol.load_labware('nest_96_wellplate_2ml_deep','C2')
    DefinePosition(200,'C3','REUSE_200_2TIPS')
    # ========== FOURTH ROW ==========
    if ONDECK_HEATERSHAKER == True:
        heatershaker = protocol.load_module('heaterShakerModuleV1','D1')
        sample_plate_1 = heatershaker.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt', 'Sample Plate 1')
    else:
        sample_plate_1 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','D1', 'Sample Plate 1')
    mag_block = protocol.load_module('magneticBlockV1', 'D2')
    CleanupPlate = mag_block.load_labware('nest_96_wellplate_2ml_deep')
    # ============ TRASH =============
    if TRASH_POSITION == 'BIN':
        TRASH = protocol.load_trash_bin('A3')
        DefinePosition(200,'D3','REUSE_200_1TIPS')
        if COLUMNS >=5:
            sample_plate_2 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','B4', 'Sample Plate 2')
        else:
            DefinePosition(None,'B4','OPEN')
        DefinePosition(None,'C4','OPEN')
        DefinePosition(None,'D4','OPEN')
        if COLUMNS >=5:
            OFFDECK_LIST = ['C4','D4']
        else:
            OFFDECK_LIST = ['B4','C4','D4']
    if TRASH_POSITION == 'CHUTE':
        TRASH = protocol.load_waste_chute()
        DefinePosition(200,'A3','REUSE_200_1TIPS')
        if COLUMNS >=5:
            sample_plate_2 = protocol.load_labware('opentrons_96_wellplate_200ul_pcr_full_skirt','A4', 'Sample Plate 2')
        else:
            DefinePosition(None,'A4','OPEN')
        DefinePosition(None,'B4','OPEN')
        DefinePosition(None,'C4','OPEN')
        DefinePosition(None,'D4','OPEN')
        if COLUMNS >=5:
            OFFDECK_LIST = ['B4','C4','D4']
        else:
            OFFDECK_LIST = ['A4','B4','C4','D4']

    # If SWAPOFFDECK = True (Meaning swapping empty On Deck Racks with New Off Deck Racks), removes the first listed tip position to keep it empty for temporary space.
    if SWAPOFFDECK == True:
        SWAPSPOT.append(AVAILABLE_POS_ONDECK[0])
        AVAILABLE_POS_ONDECK.pop(0)

    # Reverse the lists of Positions for accessibility (First Checked On Deck Slot is D4, Off Deck is D4)
    AVAILABLE_POS_ONDECK.reverse()
    AVAILABLE_POS_OFFDECK.reverse()
    OFFDECK_LIST.reverse()

    # ========================== REAGENT PLATE_1 ============================
    TAGMIX              = reagent_plate_1['A1']
    H20                 = reagent_plate_1['A2']
    #EPM                = reagent_plate_1['A3']
    #EPM                = reagent_plate_1['A4']
    TAGSTOP             = reagent_plate_1['A5']
    # 
    #Barcodes_1         = reagent_plate_1['A7']
    #Barcodes_2         = reagent_plate_1['A8']
    #Barcodes_3         = reagent_plate_1['A9']
    #Barcodes_4         = reagent_plate_1['A10']
    #Barcodes_5         = reagent_plate_1['A11']
    #Barcodes_6         = reagent_plate_1['A12']

    # ============================ RESERVOIR ================================
    CleanupBead         = reservoir['A1']
    RSB                 = reservoir['A2']
    #
    #EtOH               = reservoir['A4']
    #EtOH               = reservoir['A5']
    #
    #TWB                = reservoir['A7']
    #TWB                = reservoir['A8']
    #
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
    
    if COLUMNS == 1:
        column_1_list = ['A1'] # Sample Plate 1: input and TAG
        column_2_list = ['A1'] # Cleanup Plate: WASH
        EPM_list =['A3']
        TWB_list = ['A7']
        ETOH_list = ['A4']
        column_3_list = ['A5'] # Sample Plate 1: EPM
        column_4_list = ['A7'] # Cleanup Plate: ETOH
        column_5_list = ['A9'] # Sample Plate 1: Final
        barcodes = ['A7']
    if COLUMNS == 2:
        column_1_list = ['A1','A2'] # Sample Plate 1: input and TAG
        column_2_list = ['A1','A2'] # Cleanup Plate: WASH
        EPM_list =['A3','A3']
        TWB_list = ['A7','A7']
        ETOH_list = ['A4','A4']
        column_3_list = ['A5','A6'] # Sample Plate 1: EPM
        column_4_list = ['A7','A8'] # Cleanup Plate: ETOH
        column_5_list = ['A9','A10'] # Sample Plate 1: Final
        barcodes = ['A7','A8']
    if COLUMNS == 3:
        column_1_list = ['A1','A2','A3'] # Sample Plate 1: input and TAG
        column_2_list = ['A1','A2','A3'] # Cleanup Plate: WASH
        EPM_list =['A3','A3','A3']
        TWB_list = ['A7','A7','A7']
        ETOH_list = ['A4','A4','A4']
        column_3_list = ['A5','A6','A7'] # Sample Plate 1: EPM
        column_4_list = ['A7','A8','A9'] # Cleanup Plate: ETOH
        column_5_list = ['A9','A10','A11'] # Sample Plate 1: Final
        barcodes = ['A7','A8','A9']
    if COLUMNS == 4:
        column_1_list = ['A1','A2','A3','A4'] # Sample Plate 1: input and TAG
        column_2_list = ['A1','A2','A3','A4'] # Cleanup Plate: WASH
        EPM_list =['A3','A3','A3','A3']
        TWB_list = ['A7','A7','A7','A7']
        ETOH_list = ['A4','A4','A4','A4']
        column_3_list = ['A5','A6','A7','A8'] # Sample Plate 1: EPM
        column_4_list = ['A7','A8','A9','A10'] # Cleanup Plate: ETOH
        column_5_list = ['A9','A10','A11','A12'] # Sample Plate 1: Final
        barcodes = ['A7','A8','A9','A10']
    if COLUMNS == 5:
        column_1_list = ['A1','A2','A3','A4','A5'] # Sample Plate 1: input and TAG
        column_2_list = ['A1','A2','A3','A4','A5'] # Cleanup Plate: WASH
        EPM_list =['A3','A3','A3','A4','A4']
        TWB_list = ['A7','A7','A7','A8','A8']
        ETOH_list = ['A4','A4','A4','A5','A5']
        column_3_list = ['A7','A8','A9','A10','A11'] # Sample Plate 1: EPM
        column_4_list = ['A7','A8','A9','A10','A11'] # Cleanup Plate: ETOH
        column_5_list = ['A1','A2','A3','A4','A5'] # Sample Plate 2: Final
        barcodes = ['A7','A8','A9','A10','A11']
    if COLUMNS == 6:
        column_1_list = ['A1','A2','A3','A4','A5','A6'] # Sample Plate 1: input and TAG
        column_2_list = ['A1','A2','A3','A4','A5','A6'] # Cleanup Plate: WASH
        EPM_list =['A3','A3','A3','A4','A4','A4']
        TWB_list = ['A7','A7','A7','A8','A8','A8']
        ETOH_list = ['A4','A4','A4','A5','A5','A5']
        column_3_list = ['A7','A8','A9','A10','A11','A12'] # Sample Plate 1: EPM
        column_4_list = ['A7','A8','A9','A10','A11','A12'] # Cleanup Plate: ETOH
        column_5_list = ['A1','A2','A3','A4','A5','A6'] # Sample Plate 2: Final
        barcodes = ['A7','A8','A9','A10','A11','A12']

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
            TipCheck(200,None,loop,None)
            p1000.mix(TagPremix,TagVol+10, TAGMIX.bottom(z=PCRPlate_Z_offset+1))
            p1000.aspirate(TagVol+3, TAGMIX.bottom(z=PCRPlate_Z_offset+0.5), rate=0.25)
            p1000.dispense(3, TAGMIX.bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p1000.dispense(TagVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p1000.mix(TagMix,SampleVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+0.75))
            p1000.move_to(sample_plate_1[X].top(z=-3))
            protocol.delay(minutes=0.1)
            p1000.blow_out(sample_plate_1[X].top(z=-3))
            p1000.move_to(sample_plate_1[X].top(z=5))
            p1000.move_to(sample_plate_1[X].top(z=0))
            p1000.move_to(sample_plate_1[X].top(z=5))
            TipDone(200,None,loop,None)
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
            if DRYRUN == False:
                protocol.pause('Pausing to run Tagmentation on an off deck Thermocycler ~15min')
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
            TipCheck(50,None,loop,None)
            p50.aspirate(TAGSTOPVol+3, TAGSTOP.bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p50.dispense(3, TAGSTOP.bottom(z=PCRPlate_Z_offset+0.5), rate=0.25)
            p50.dispense(TAGSTOPVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p50.move_to(sample_plate_1[X].bottom(z=PCRPlate_Z_offset+0.75))
            p50.mix(TAGSTOPMixRep,TAGSTOPMixVol, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+0.75))
            p50.blow_out(sample_plate_1[X].top(z=-2))
            TipDone(50,None,loop,None)
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
            if DRYRUN == False:
                protocol.pause('Pausing to run Tagmentation Stop on an off deck Thermocycler ~15min')
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
            TipCheck(200,'REUSE',loop,'WASH')
            p1000.aspirate(TransferSup, sample_plate_1[X].bottom(z=PCRPlate_Z_offset+0.2), rate=0.25)
            p1000.dispense(TransferSup, CleanupPlate[column_2_list[loop]].bottom(z=Deepwell_Z_offset+1))
            TipDone(200,'REUSE',loop,'WASH')
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
            TipCheck(200,'REUSE',loop,'WASH')
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+3.5))
            p1000.aspirate(RemoveSup-100, rate=0.25)
            protocol.delay(minutes=0.1)
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+0.75))
            p1000.aspirate(100, rate=0.25)
            p1000.move_to(CleanupPlate[X].top(z=-2))
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
            p1000.dispense(200, Liquid_trash.top(z=0))
            protocol.delay(minutes=0.1)
            p1000.blow_out(Liquid_trash.top(z=-3))
            p1000.move_to(Liquid_trash.top(z=5))
            p1000.move_to(Liquid_trash.top(z=0))
            p1000.move_to(Liquid_trash.top(z=5))
            TipDone(200,'REUSE',loop,'WASH')
        #===============================================

        for X in range(3):
            #============================================================================================
            # GRIPPER MOVE CleanupPlate FROM MAG PLATE TO HEATER SHAKER
            if ONDECK_HEATERSHAKER == True:        
                heatershaker.open_labware_latch()
                protocol.move_labware(labware=CleanupPlate,new_location=heatershaker,use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=hs_drop_offset)
                heatershaker.close_labware_latch()
            else:
                protocol.move_labware(labware=CleanupPlate,new_location='D1',use_gripper=USE_GRIPPER,pick_up_offset=mb_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================

            protocol.comment('--> Wash ')
            TWBMaxVol = 100
            TWBTime = 3*60 if DRYRUN == False else 0.1*60
            TWBMix = 6 if TIP_MIX == True else 2
            p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            if WASH_AirMultiDis == True:
                TipCheck(200,None,loop,None)
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
                TipDone(200,None,loop,None)
            else:
                for loop, X in enumerate(column_2_list):
                    TipCheck(200,None,loop,None)
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
                    TipDone(200,None,loop,None)
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
            for loop, X in enumerate(column_2_list):
                TipCheck(200,'REUSE',loop,'WASH')
                p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+3.5))
                p1000.aspirate(TWBMaxVol, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+0.2))
                protocol.delay(minutes=0.1)
                p1000.aspirate(200-TWBMaxVol, rate=0.25)
                p1000.default_speed = 400
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
                p1000.dispense(200, Liquid_trash)
                p1000.move_to(Liquid_trash.top(z=5))
                protocol.delay(minutes=0.1)
                p1000.blow_out(Liquid_trash.top(z=-3))
                p1000.move_to(Liquid_trash.top(z=5))
                p1000.move_to(Liquid_trash.top(z=0))
                p1000.move_to(Liquid_trash.top(z=5))
                TipDone(200,'REUSE',loop,'WASH')
            #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=1)

        protocol.comment('--> Removing Residual Wash')
        ActualRemoveSup = 20
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_2_list):
            TipCheck(200,'REUSE',loop,'WASH')
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
            TipDone(200,'REUSE',loop,'WASH')
        #===============================================
        
        # Add A REUSABLE Tip Rack to the front of the list of Racks to Dump, Meaning that it's done being reused and can be cleared from the Deck.
        if REUSE_200_TIPS_WASH == True:
            RACKS_TO_DUMP.insert(0,tiprack_200_R1)

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
            TipCheck(50,None,loop,None)
            p50.aspirate(EPMVol+3, reagent_plate_1.wells_by_name()[EPM_list[loop]].bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p50.dispense(3, reagent_plate_1.wells_by_name()[EPM_list[loop]].bottom(z=PCRPlate_Z_offset+1), rate=0.25)
            p50.move_to((CleanupPlate.wells_by_name()[X].center().move(types.Point(x=1.3*0.8,y=0,z=-4))))
            p50.dispense(EPMMixVol, rate=1)
            if TIP_MIX == True:
                EPMMix = 10
            if TIP_MIX == False:
                EPMMix = 2
            for Mix in range(EPMMix):
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
            TipDone(50,None,loop,None)
        #===============================================
        if TIP_MIX == False:
            heatershaker.close_labware_latch()
            heatershaker.set_and_wait_for_shake_speed(rpm=EPMMixRPM)
            protocol.delay(EPMMixTime)
            heatershaker.deactivate_shaker()

        protocol.comment('--> Adding Barcodes')
        BarcodeVol    = 10
        BarcodeMixRep = 3 if DRYRUN == False else 1
        BarcodeMixVol = 10
        TransferSup = 50
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #======== DISPENSE ===========
        for loop, X in enumerate(column_2_list):
            TipCheck(50,None,loop,None)

            protocol.comment('--> Transfer samples')
            p50.aspirate(TransferSup, CleanupPlate[X].bottom(z=Deepwell_Z_offset+0.2), rate=0.25)
            p50.dispense(TransferSup, sample_plate_1[column_3_list[loop]].bottom(z=PCRPlate_Z_offset+1))
            
            protocol.comment('--> Adding Barcodes')
            p50.aspirate(BarcodeVol+1, reagent_plate_1.wells_by_name()[barcodes[loop]].bottom(z=PCRPlate_Z_offset+0.3), rate=0.25)
            p50.dispense(1, reagent_plate_1.wells_by_name()[barcodes[loop]].bottom(z=PCRPlate_Z_offset+0.3), rate=0.25)
            p50.dispense(BarcodeVol, sample_plate_1.wells_by_name()[column_3_list[loop]].bottom(z=PCRPlate_Z_offset+1))
            p50.mix(BarcodeMixRep,BarcodeMixVol)
            TipDone(50,None,loop,None)
        #===============================================

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
            if DRYRUN == False:
                protocol.pause('Pausing to run PCR on an off deck Thermocycler ~20min')
            else:
                protocol.comment('Pausing to run PCR on an off deck Thermocycler ~20min')
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
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_3_list):
            TipCheck(50,None,loop,None)

            protocol.comment('--> Adding H20')
            p50.aspirate(H20Vol+5, H20.bottom(z=Deepwell_Z_offset), rate=1)
            p50.dispense(5, H20.bottom(z=Deepwell_Z_offset), rate=1)
            p50.dispense(H20Vol, CleanupPlate[column_4_list[loop]].bottom(z=0.75))

            protocol.comment('--> Adding Cleanup Beads (0.8x)')
            p50.move_to(CleanupBead.bottom(z=Deepwell_Z_offset+0.75))
            p50.mix(CleanupBeadPremix,CleanupBeadVol)
            p50.aspirate(CleanupBeadVol+3, CleanupBead.bottom(z=Deepwell_Z_offset+0.75), rate=0.25)
            p50.dispense(3, CleanupBead.bottom(z=Deepwell_Z_offset+0.75), rate=0.5)
            p1000.default_speed = 5
            p1000.move_to(CleanupBead.top(z=-3))
            #=====Reservoir Tip Touch========
            p1000.default_speed = 100
            p1000.move_to(CleanupBead.top().move(types.Point(x=4,z=-3)))
            p1000.move_to(CleanupBead.top().move(types.Point(x=-4,z=-3)))
            p1000.default_speed = 400
            #================================ 
            p50.dispense(CleanupBeadVol, CleanupPlate[column_4_list[loop]].bottom(z=Deepwell_Z_offset+0.75), rate=1)
            protocol.delay(seconds=0.2)
            p50.blow_out(CleanupPlate[column_4_list[loop]].top(z=-2))

            protocol.comment('--> Adding SAMPLE')
            p50.aspirate(SampleVol+3, sample_plate_1[column_3_list[loop]].bottom(z=PCRPlate_Z_offset+0.75), rate=0.5)
            p50.dispense(SampleVol+3, CleanupPlate[column_4_list[loop]].bottom(z=Deepwell_Z_offset+0.75), rate=1)
            if TIP_MIX == True:
                CleanupBeadMix = 10
            if TIP_MIX == False:
                CleanupBeadMix = 2
            for Mix in range(CleanupBeadMix):
                p50.aspirate(30, rate=0.5)
                p50.move_to(CleanupPlate[column_4_list[loop]].bottom(z=Deepwell_Z_offset+0.25))
                p50.aspirate(20, rate=0.5)
                p50.dispense(20, rate=0.5)
                p50.move_to(CleanupPlate[column_4_list[loop]].bottom(z=Deepwell_Z_offset+3))
                p50.dispense(30, rate=0.5)
            p50.move_to(CleanupPlate[column_4_list[loop]].top(z=-3))
            protocol.delay(seconds=0.2)
            p50.blow_out(CleanupPlate[column_4_list[loop]].top(z=-3))
            TipDone(50,None,loop,None)
        #===============================================
        if TIP_MIX == False:
            heatershaker.set_and_wait_for_shake_speed(rpm=CleanupBeadMixRPM)
            protocol.delay(CleanupBeadMixTime)
            heatershaker.deactivate_shaker()

        if DRYRUN == False and ONDECK_THERMO == True:
            protocol.comment("SETTING THERMO to Room Temp")
            thermocycler.set_block_temperature(20)
            thermocycler.set_lid_temperature(37) 

        #============================================================================================
        # GRIPPER MOVE CleanupPlate FROM HEATER SHAKER TO MAG PLATE
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=mb_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
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
        for loop, X in enumerate(column_4_list):
            TipCheck(200,'REUSE',loop,'ETOH')
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+3.5))
            p1000.aspirate(RemoveSup-100, rate=0.25)
            protocol.delay(minutes=0.1)
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+0.75))
            p1000.aspirate(100, rate=0.25)
            p1000.default_speed = 5
            p1000.move_to(CleanupPlate[X].top(z=2))
            p1000.default_speed = 200
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
            p1000.dispense(200, Liquid_trash.top(z=0))
            protocol.delay(minutes=0.1)
            p1000.blow_out()
            p1000.default_speed = 400
            p1000.move_to(Liquid_trash.top(z=-5))
            p1000.move_to(Liquid_trash.top(z=0))
            TipDone(200,'REUSE',loop,'ETOH')
        #===============================================

        for X in range(2):
            protocol.comment('--> ETOH Wash')
            ETOHMaxVol = 150
            p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
            p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
            p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
            #===============================================
            if ETOH_AirMultiDis == True:
                TipCheck(200,None,loop,None)
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
                    p1000.move_to(CleanupPlate[X].top(z=2))
                    p1000.dispense(ETOHMaxVol, rate=1)
                    protocol.delay(minutes=0.1)
                    p1000.blow_out()
                    p1000.move_to(CleanupPlate[X].top(z=5))
                    p1000.move_to(CleanupPlate[X].top(z=0))
                    p1000.move_to(CleanupPlate[X].top(z=5))
                TipDone(200,None,loop,None)
            else:
                for loop, X in enumerate(column_2_list):
                    TipCheck(200,None,loop,None)
                    p1000.aspirate(ETOHMaxVol, reservoir.wells_by_name()[ETOH_list[loop]].bottom(z=Deepwell_Z_offset+1))
                    p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top(z=0))
                    p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top(z=-5))
                    #=====Reservoir Tip Touch========
                    p1000.default_speed = 100
                    p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top().move(types.Point(x=4,z=-3)))
                    p1000.move_to(reservoir.wells_by_name()[ETOH_list[loop]].top().move(types.Point(x=-4,z=-3)))
                    p1000.default_speed = 400
                    #================================  
                    p1000.move_to(CleanupPlate[X].top(z=-10))
                    p1000.dispense(ETOHMaxVol, rate=1)
                    protocol.delay(minutes=0.1)
                    p1000.blow_out()
                    p1000.move_to(CleanupPlate[X].top(z=5))
                    p1000.move_to(CleanupPlate[X].top(z=0))
                    p1000.move_to(CleanupPlate[X].top(z=5))
                    TipDone(200,None,loop,None)
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
            for loop, X in enumerate(column_4_list):
                TipCheck(200,'REUSE',loop,'ETOH')
                p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+3.5))
                p1000.aspirate(RemoveSup-100, rate=0.25)
                protocol.delay(minutes=0.1)
                p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+0.75))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(CleanupPlate[X].top(z=2))
                p1000.default_speed = 200
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
                p1000.dispense(100, Liquid_trash.top(z=0))
                protocol.delay(minutes=0.1)
                p1000.blow_out()
                p1000.default_speed = 400
                p1000.move_to(Liquid_trash.top(z=-5))
                p1000.move_to(Liquid_trash.top(z=0))
                TipDone(200,'REUSE',loop,'ETOH')
            #===============================================

        if DRYRUN == False:
            protocol.delay(minutes=1)
        
        protocol.comment('--> Removing Residual Wash')
        ActualRemoveSup = 20
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default*0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default*0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_4_list):
            TipCheck(200,'REUSE',loop,'ETOH')
            p1000.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+1))
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
            TipDone(200,'REUSE',loop,'ETOH')
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
        
        protocol.comment('--> Adding RSB')
        RSBVol = 32
        RSBMix = 6 if TIP_MIX == True else 1
        RSBMixRPM = 2000
        RSBMixTime = 1*60 if DRYRUN == False else 0.1*60
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_4_list):
            TipCheck(50,'REUSE',loop,None)
            p50.aspirate(RSBVol, RSB.bottom(z=1))
            p50.move_to(CleanupPlate.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1))
            p50.dispense(RSBVol, rate=1)
            if TIP_MIX == True:
                RSBMix = 10
            if TIP_MIX == False:
                RSBMix = 2
            for Mix in range(RSBMix):
                p50.aspirate(RSBVol, CleanupPlate.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1), rate=0.5)
                p50.dispense(RSBVol, CleanupPlate.wells_by_name()[X].bottom(z=Deepwell_Z_offset+1), rate=1)
            p50.blow_out(CleanupPlate.wells_by_name()[X].top(z=-3))
            TipDone(50,'REUSE',loop,None)
        #===============================================
        if TIP_MIX == False:
            heatershaker.set_and_wait_for_shake_speed(rpm=RSBMixRPM)
            protocol.delay(RSBMixTime)
            heatershaker.deactivate_shaker()
        
        #============================================================================================
        # GRIPPER MOVE CleanupPlate FROM HEATER SHAKER TO MAG PLATE
        if ONDECK_HEATERSHAKER == True:
            heatershaker.open_labware_latch()
            protocol.move_labware(labware=CleanupPlate,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=hs_pick_up_offset,drop_offset=mb_drop_offset)
            heatershaker.close_labware_latch()
        else:
            protocol.move_labware(labware=CleanupPlate,new_location=mag_block,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
        #============================================================================================

        if DRYRUN == False:
            protocol.delay(minutes=3)
    
        if COLUMNS >=5:
            #============================================================================================
            # GRIPPER MOVE sample_plate_2 FROM Off Deck TO HEATER SHAKER
            if ONDECK_HEATERSHAKER == True:        
                heatershaker.open_labware_latch()
                protocol.move_labware(labware=sample_plate_2,new_location=heatershaker,use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=hs_drop_offset)
                heatershaker.close_labware_latch()
            else:
                protocol.move_labware(labware=sample_plate_2,new_location='D1',use_gripper=USE_GRIPPER,pick_up_offset=deck_pick_up_offset,drop_offset=deck_drop_offset)
            #============================================================================================
        
        protocol.comment('--> Transferring Supernatant')
        TransferSup = 30
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default*0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default*0.5
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default*0.5
        #===============================================
        for loop, X in enumerate(column_4_list):
            TipCheck(50,'REUSE',loop,None)
            p50.move_to(CleanupPlate[X].bottom(z=Deepwell_Z_offset+0.5))
            p50.aspirate(TransferSup+1, rate=0.25)
            if COLUMNS >=5:
                p50.dispense(TransferSup, sample_plate_2[column_5_list[loop]].bottom(z=PCRPlate_Z_offset+1))
            else:
                p50.dispense(TransferSup, sample_plate_1[column_5_list[loop]].bottom(z=PCRPlate_Z_offset+1))
            TipDone(50,'REUSE',loop,None)
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
    if NOLABEL == True:
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
            reservoir.wells_by_name()['A2'].load_liquid(liquid=RSB, volume=RSB_Volume)
            if COLUMNS < 5:
                reservoir.wells_by_name()['A4'].load_liquid(liquid=EtOH, volume=ETOH_Volume)
                reservoir.wells_by_name()['A7'].load_liquid(liquid=TWB, volume=TWB_Volume)
            if COLUMNS == 5:
                reservoir.wells_by_name()['A4'].load_liquid(liquid=EtOH, volume=(ETOH_Volume*(3/5)))
                reservoir.wells_by_name()['A5'].load_liquid(liquid=EtOH, volume=(ETOH_Volume*(2/5)))
                reservoir.wells_by_name()['A7'].load_liquid(liquid=TWB, volume=(TWB_Volume*(3/5)))
                reservoir.wells_by_name()['A8'].load_liquid(liquid=TWB, volume=(TWB_Volume*(2/5)))
            if COLUMNS == 6:
                reservoir.wells_by_name()['A4'].load_liquid(liquid=EtOH, volume=(ETOH_Volume*(3/6)))
                reservoir.wells_by_name()['A5'].load_liquid(liquid=EtOH, volume=(ETOH_Volume*(3/6)))
                reservoir.wells_by_name()['A7'].load_liquid(liquid=TWB, volume=(TWB_Volume*(3/6)))
                reservoir.wells_by_name()['A8'].load_liquid(liquid=TWB, volume=(TWB_Volume*(3/6)))
            reservoir.wells_by_name()['A10'].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()['A11'].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()['A12'].load_liquid(liquid=Liquid_trash_well, volume=0)
        if RES_TYPE_96x == '96x2ml':
            for loop, X in enumerate(TotalColumn):
                reservoir.wells_by_name()[X+'1'].load_liquid(liquid=CleanupBead, volume=CleanupBead_Volume)
                reservoir.wells_by_name()[X+'2'].load_liquid(liquid=RSB, volume=RSB_Volume)
                if COLUMNS < 5:
                    reservoir.wells_by_name()[X+'4'].load_liquid(liquid=EtOH, volume=ETOH_Volume)
                    reservoir.wells_by_name()[X+'7'].load_liquid(liquid=TWB, volume=TWB_Volume)
                if COLUMNS == 5:
                    reservoir.wells_by_name()[X+'4'].load_liquid(liquid=EtOH, volume=(ETOH_Volume*(3/5)))
                    reservoir.wells_by_name()[X+'5'].load_liquid(liquid=EtOH, volume=(ETOH_Volume*(2/5)))
                    reservoir.wells_by_name()[X+'7'].load_liquid(liquid=TWB, volume=(TWB_Volume*(3/5)))
                    reservoir.wells_by_name()[X+'8'].load_liquid(liquid=TWB, volume=(TWB_Volume*(2/5)))
                if COLUMNS == 6:
                    reservoir.wells_by_name()[X+'4'].load_liquid(liquid=EtOH, volume=(ETOH_Volume*(3/6)))
                    reservoir.wells_by_name()[X+'5'].load_liquid(liquid=EtOH, volume=(ETOH_Volume*(3/6)))
                    reservoir.wells_by_name()[X+'7'].load_liquid(liquid=TWB, volume=(TWB_Volume*(3/6)))
                    reservoir.wells_by_name()[X+'8'].load_liquid(liquid=TWB, volume=(TWB_Volume*(3/6)))
                reservoir.wells_by_name()[X+'10'].load_liquid(liquid=Liquid_trash_well, volume=0)
                reservoir.wells_by_name()[X+'11'].load_liquid(liquid=Liquid_trash_well, volume=0)
                reservoir.wells_by_name()[X+'12'].load_liquid(liquid=Liquid_trash_well, volume=0)
        if COLUMNS >= 1:
            for loop, X in enumerate(TotalColumn):
                if COLUMNS < 5:
                    sample_plate_1.wells_by_name()[X+'1'].load_liquid(liquid=Sample, volume=Sample_Volume)
                    sample_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_1.wells_by_name()[X+'9'].load_liquid(liquid=Final_Sample, volume=0)
                    reagent_plate_1.wells_by_name()[X+'7'].load_liquid(liquid=Barcodes, volume=5)
                if COLUMNS >= 5:
                    sample_plate_1.wells_by_name()[X+'1'].load_liquid(liquid=Sample, volume=Sample_Volume)
                    sample_plate_1.wells_by_name()[X+'7'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_2.wells_by_name()[X+'1'].load_liquid(liquid=Final_Sample, volume=0)
                    reagent_plate_1.wells_by_name()[X+'7'].load_liquid(liquid=Barcodes, volume=5)
        if COLUMNS >= 2:
            for loop, X in enumerate(TotalColumn):
                if COLUMNS < 5:
                    sample_plate_1.wells_by_name()[X+'2'].load_liquid(liquid=Sample, volume=Sample_Volume)
                    sample_plate_1.wells_by_name()[X+'6'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_1.wells_by_name()[X+'10'].load_liquid(liquid=Final_Sample, volume=0)
                    reagent_plate_1.wells_by_name()[X+'8'].load_liquid(liquid=Barcodes, volume=5)
                if COLUMNS >= 5:
                    sample_plate_1.wells_by_name()[X+'2'].load_liquid(liquid=Sample, volume=Sample_Volume)
                    sample_plate_1.wells_by_name()[X+'8'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_2.wells_by_name()[X+'2'].load_liquid(liquid=Final_Sample, volume=0)
                    reagent_plate_1.wells_by_name()[X+'8'].load_liquid(liquid=Barcodes, volume=5)
        if COLUMNS >= 3:    
            for loop, X in enumerate(TotalColumn):
                if COLUMNS < 5:
                    sample_plate_1.wells_by_name()[X+'3'].load_liquid(liquid=Sample, volume=Sample_Volume)
                    sample_plate_1.wells_by_name()[X+'7'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_1.wells_by_name()[X+'11'].load_liquid(liquid=Final_Sample, volume=0)
                    reagent_plate_1.wells_by_name()[X+'9'].load_liquid(liquid=Barcodes, volume=5)
                if COLUMNS >= 5:
                    sample_plate_1.wells_by_name()[X+'3'].load_liquid(liquid=Sample, volume=Sample_Volume)
                    sample_plate_1.wells_by_name()[X+'9'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_2.wells_by_name()[X+'3'].load_liquid(liquid=Final_Sample, volume=0)
                    reagent_plate_1.wells_by_name()[X+'9'].load_liquid(liquid=Barcodes, volume=5)
        if COLUMNS >= 4:    
            for loop, X in enumerate(TotalColumn):
                if COLUMNS < 5:
                    sample_plate_1.wells_by_name()[X+'4'].load_liquid(liquid=Sample, volume=Sample_Volume)
                    sample_plate_1.wells_by_name()[X+'8'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_1.wells_by_name()[X+'12'].load_liquid(liquid=Final_Sample, volume=0)
                    reagent_plate_1.wells_by_name()[X+'10'].load_liquid(liquid=Barcodes, volume=5)
                if COLUMNS >= 5:
                    sample_plate_1.wells_by_name()[X+'4'].load_liquid(liquid=Sample, volume=Sample_Volume)
                    sample_plate_1.wells_by_name()[X+'10'].load_liquid(liquid=Placeholder_Sample, volume=0)
                    sample_plate_2.wells_by_name()[X+'4'].load_liquid(liquid=Final_Sample, volume=0)
                    reagent_plate_1.wells_by_name()[X+'10'].load_liquid(liquid=Barcodes, volume=5)
        if COLUMNS >= 5:    
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_1.wells_by_name()[X+'11'].load_liquid(liquid=Placeholder_Sample, volume=0)
                sample_plate_2.wells_by_name()[X+'5'].load_liquid(liquid=Final_Sample, volume=0)
                reagent_plate_1.wells_by_name()[X+'11'].load_liquid(liquid=Barcodes, volume=5)
        if COLUMNS >= 6:    
            for loop, X in enumerate(TotalColumn):
                sample_plate_1.wells_by_name()[X+'6'].load_liquid(liquid=Sample, volume=Sample_Volume)
                sample_plate_1.wells_by_name()[X+'12'].load_liquid(liquid=Placeholder_Sample, volume=0)
                sample_plate_2.wells_by_name()[X+'6'].load_liquid(liquid=Final_Sample, volume=0)
                reagent_plate_1.wells_by_name()[X+'12'].load_liquid(liquid=Barcodes, volume=5)
        for loop, X in enumerate(TotalColumn):
            reagent_plate_1.wells_by_name()[X+'1'].load_liquid(liquid=TAGMIX, volume=TAGMIX_Volume)
            reagent_plate_1.wells_by_name()[X+'2'].load_liquid(liquid=H20, volume=H20_Volume)
            if COLUMNS >= 5:
                reagent_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=EPM, volume=EPM_Volume)
            if COLUMNS == 5:
                reagent_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=EPM, volume=(EPM_Volume*(3/5)))
                reagent_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=EPM, volume=(EPM_Volume*(2/5)))
            if COLUMNS == 6:
                reagent_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=EPM, volume=(EPM_Volume*(3/6)))
                reagent_plate_1.wells_by_name()[X+'5'].load_liquid(liquid=EPM, volume=(EPM_Volume*(3/6)))
            reagent_plate_1.wells_by_name()[X+'2'].load_liquid(liquid=TAGSTOP, volume=TAGSTOP_Volume)
