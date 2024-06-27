from opentrons import protocol_api
from opentrons import types
import math

metadata = {
    "protocolName": "KAPA Library Quant 48x v8",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}
requirements = {
    "robotType": "Flex",
    "apiLevel": "2.19",
}


def add_parameters(parameters):
    # ======================== RUNTIME PARAMETERS ========================
    parameters.add_bool(display_name="Dry Run", variable_name="DRYRUN", default=False, description="Whether to perform a dry run or not.")
    parameters.add_int(
        display_name="Sample Column count",
        variable_name="COLUMNS",
        default=3,
        minimum=1,
        maximum=6,
        description="How many sample columns to process.",
    )
    parameters.add_str(
        display_name="qPCR Plate Format",
        variable_name="FORMAT",
        default="384",
        description="qPCR Plate Format",
        choices=[{"display_name": "384", "value": "384"}, {"display_name": "96", "value": "96"}],
    )
    parameters.add_bool(
        display_name="Tip Mixing",
        variable_name="TIP_MIX",
        default=False,
        description="Whether or not to use Tip Mixing instead of a shaker",
    )
    parameters.add_bool(
        display_name="Thermocycler Module Present",
        variable_name="ONDECK_THERMO",
        default=True,
        description="Is the Thermocycler Module present (but not used)",
    )
    parameters.add_str(
        display_name="Trash Position",
        variable_name="TRASH_POSITION",
        default="CHUTE",
        description="Trash Position",
        choices=[{"display_name": "Trash Chute in D3", "value": "CHUTE"}, {"display_name": "Trash Bin in A3", "value": "BIN"}],
    )


def run(protocol: protocol_api.ProtocolContext):
    # ======================== DOWNLOADED PARAMETERS ========================
    global USE_GRIPPER  # T/F Whether or not Using the Gripper
    global STP_50_TIPS  # T/F Whether or not there are p50 Single Tip Pickups
    global STP_200_TIPS  # T/F Whether or not there are p200 Single Tip Pickups
    global REUSE_ANY_50_TIPS  # T/F Whether or not Reusing any p50
    global REUSE_ANY_200_TIPS  # T/F Whether or not Reusing any p200
    global TIP_TRASH  # T/F whether or not the Tips are Returned
    global COLUMNS  # Number of Columns of Samples
    global PLATE_STACKED  # Number of Plates Stacked in Stacked Position
    global p50_TIPS  # Number of p50 tips currently available
    global p200_TIPS  # Number of p200 tips currently available
    global p50_RACK_COUNT  # Number of current total p50 racks
    global p200_RACK_COUNT  # Number of current total p200 racks
    global tiprack_200_STP  # Tiprack for p200 Single Tip Pickup
    global tiprack_200_STR  # Tiprack for p200 Single Tip Return
    global tiprack_50_STP  # Tiprack for p50 Single Tip Pickup
    global tiprack_50_STR  # Tiprack for p50 Single Tip Return
    global tiprack_50_R  # Tiprack for p50 Reuse
    global tiprack_200_R1  # Tiprack for p200 Reuse #1
    global tiprack_200_R2  # Tiprack for p200 Reuse #2
    global WASTEVOL  # Number - Total volume of Discarded Liquid Waste
    global ETOHVOL  # Number - Total volume of Available EtOH
    # =================== LOADING THE RUNTIME PARAMETERS ====================

    DRYRUN = protocol.params.DRYRUN
    COLUMNS = protocol.params.COLUMNS
    FORMAT = protocol.params.FORMAT
    TIP_MIX = protocol.params.TIP_MIX
    ONDECK_THERMO = protocol.params.ONDECK_THERMO
    TRASH_POSITION = protocol.params.TRASH_POSITION

    # =================================================================================================
    # ====================================== ADVANCED PARAMETERS ======================================
    # =================================================================================================
    # -------PROTOCOL STEP-------
    STEP_DILUTE = True  # Set to 0 to skip block of commands
    STEP_MIX = True  # Set to 0 to skip block of commands
    STEP_DISPENSE = True  # Set to 0 to skip block of commands
    # ---------------------------
    # This notifies the user that for 5-6 columns (from more than 32 samples up to 48 samples) it requires Tip reusing in order to remain walkaway.
    # This setting will override any Runtime parameter, and also pauses to notify the user.  So if the user enters 6 columns with Single Tip Use, it will pause and warn that it has to change to Reusing tips in order to remain walkaway.
    # Note that if omitting steps (i.e. skipping the last cleanup step) it is possible to do single use tips, but may vary on case by case basis.
    # Note that it is also possible to use advanced settings to include pauses that requires user intervention to replenish tipracks, making allowing a run of single Use Tips.
    AllSteps = [STEP_DILUTE, STEP_MIX, STEP_DISPENSE]
    # if COLUMNS == 5 or COLUMNS == 6 and all(AllSteps) == True:
    #    protocol.pause('MUST REUSE TIPS')
    #    TIP_SETTING = 'Reusing Tips'

    INICOLUMN1 = "1"  # Indicate the initial input columns, for example, Previous NGS library Prep output samples are in wells A10-A12
    INICOLUMN2 = "2"  # Ignore input columns greater than intended number of columns, for example if doing 3 sample columns (plus 1 for Standards), ignore INICOLUMNS4 and up
    INICOLUMN3 = "3"
    INICOLUMN4 = "4"
    INICOLUMN5 = "5"
    INICOLUMN6 = "6"
    DRYRUN = True  # Whether or not to do a Dry Run, which is without heating or cooling an shortened incubation times.
    TIP_TRASH = False  # True = Used tips go in Trash, False = Used tips go back into rack
    DEACTIVATE_TEMP = True  # Whether or not to deactivate the heating and cooling modules after a run
    TRASH_POSITION = "BIN"  # 'BIN' or 'CHUTE'
    ONDECK_THERMO = True  # On Deck Thermocycler
    ONDECK_HEATERSHAKER = True  # On Deck Heater Shaker
    ONDECK_TEMP = True  # On Deck Thermocycler
    RES_TYPE_96x = False  # Type of Reservoir, if reusing tips or omitting rows, set True to use a 96x2ml deepwell
    ETOH_1_AirMultiDis = False  # When adding WASH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
    ETOH_2_AirMultiDis = False  # When adding EtOH to multiple columns, dispense above the wells and reuse tips (Tip Saving)
    RSB_1_AirMultiDis = False  # When adding RSB to multiple columns, dispense above the wells and reuse tips (Tip Saving)
    CUSTOM_OFFSETS = True  # Manually enter offset position settings
    USE_GRIPPER = True  # Using the Gripper
    SWAPOFFDECK = False  # Setting to Swap empty Tipracks to empty positions instead of dumping them
    REUSE_50_TIPS_RSB = False  # Reusing p50 tips
    REUSE_200_TIPS_ETOH_1 = False  # Reusing p200 tips
    REUSE_200_TIPS_ETOH_2 = False  # Reusing p200 tips
    STP_200_TIPS = False  # Single Tip Pickup p200 tips
    STP_50_TIPS = False  # Single tip Pickup p50 tips
    REPORT = True  # Whether or not to include Extra Comments for Debugging
    LABEL = True  # Whether or not to include Liquid Labeling

    # =========================== QUICK SETTINGS ============================
    if TRASH_POSITION == "BIN":
        SWAPOFFDECK = True  # Setting to Swap empty Tipracks to empty positions instead of dumping them
    if TRASH_POSITION == "CHUTE":
        SWAPOFFDECK = False  # Setting to Swap empty Tipracks to empty positions instead of dumping them
    if TIP_MIX == True:
        ONDECK_HEATERSHAKER = True  # On Deck Heater Shaker
    if TIP_MIX == False:
        ONDECK_HEATERSHAKER = False  # On Deck Heater Shaker
    if DRYRUN == True:
        TIP_TRASH = False  # True = Used tips go in Trash, False = Used tips go back into rack
        DEACTIVATE_TEMP = True  # Whether or not to deactivate the heating and cooling modules after a run
        REPORT = True  # Whether or not to include Extra Comments for Debugging

    # ======================== BACKGROUND PARAMETERS ========================
    p50_TIPS = 0  # Number of p50 tips currently available
    p200_TIPS = 0  # Number of p50 tips currently available
    RESETCOUNT = 0  # Number of times the protocol was paused to reset tips
    p50_RACK_COUNT = 0  # Number of current total p50 racks
    p200_RACK_COUNT = 0  # Number of current total p200 racks
    WASTEVOL = 0  # Number - Total volume of Discarded Liquid Waste
    ETOHVOL = 0  # Number - Total volume of Available EtOH
    PLATE_STACKED = 0  # Number of Plates Stacked in Stacked Position
    REUSE_50_TIPS_COUNT = 0
    REUSE_ANY_50_TIPS = False
    if REUSE_50_TIPS_RSB == True:
        REUSE_ANY_50_TIPS = True
        REUSE_50_TIPS_COUNT += COLUMNS
    REUSE_200_TIPS_COUNT = 0
    REUSE_ANY_200_TIPS = False
    if REUSE_200_TIPS_ETOH_1 == True:
        REUSE_ANY_200_TIPS = True
        REUSE_200_TIPS_COUNT += COLUMNS
    if REUSE_200_TIPS_ETOH_2 == True:
        REUSE_ANY_200_TIPS = True
        REUSE_200_TIPS_COUNT += COLUMNS

    # =============================== PIPETTE ===============================
    p1000 = protocol.load_instrument("flex_8channel_1000", "left")
    p50 = protocol.load_instrument("flex_8channel_50", "right")
    p1000_flow_rate_aspirate_default = 200
    p1000_flow_rate_dispense_default = 200
    p1000_flow_rate_blow_out_default = 400
    p50_flow_rate_aspirate_default = 50
    p50_flow_rate_dispense_default = 50
    p50_flow_rate_blow_out_default = 100

    # ================================ LISTS ================================
    p50_RACKS_PIPET = []  # Pipette List
    p200_RACKS_PIPET = []  # Pipette List
    AVAILABLE_POS_ONDECK = []  # List of Available Positions ON DECK
    AVAILABLE_POS_OFFDECK = []  # List of Available Positions OFF DECK
    RACKS_TO_DUMP = []  # List of Emptied Racks ON DECK
    p50_RACKS_ONDECK = []  # List of P50 Racks ON DECK
    p50_RACKS_OFFDECK = []  # List of P50 Racks OFF DECK
    p50_RACKS_DROPPED = []  # List of P50 Racks DROPPED
    p200_RACKS_ONDECK = []  # List of P200 Racks ON DECK
    p200_RACKS_OFFDECK = []  # List of P200 Racks OFF DECK
    p200_RACKS_DROPPED = []  # List of P200 Racks DROPPED
    SWAPSPOT = []  # List of Next Available Position for SWAP
    REUSE_50_TIPS = []  # List of Next Available Position for SWAP
    p50_INITIALTIPS = []  # List of Next Available Position for SWAP
    REUSE_200_TIPS_1 = []  # List of Next Available Position for SWAP
    REUSE_200_TIPS_2 = []  # List of Next Available Position for SWAP
    p200_INITIALTIPS = []  # List of Next Available Position for SWAP

    def DefinePosition(tiptype, position, status):
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
        if status == "OPEN":
            if position[1:2] != "4":
                AVAILABLE_POS_ONDECK.append(position)
            if position[1:2] == "4":
                AVAILABLE_POS_OFFDECK.append(position)
        if status == "STP_200" and STP_200_TIPS == True:
            tiprack_200_STP = protocol.load_labware("opentrons_flex_96_tiprack_200ul", position, f"tiprack_200_STP")
            for i in range(1, 13):
                STP_200_list_x4.append(tiprack_200_STP[f"E{i}"])
                STP_200_list_x4.append(tiprack_200_STP[f"A{i}"])
            rows = ["H", "G", "F", "E", "D", "C", "B", "A"]
            columns = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
            for col in columns:
                for row in rows:
                    STP_200_list_x1.append(tiprack_200_STP[row + col])
        if status == "STR_200" and STP_200_TIPS == True:
            tiprack_200_STR = protocol.load_labware("opentrons_flex_96_tiprack_200ul", position, f"tiprack_200_STR")
            for i in range(1, 13):
                STR_200_list.append(tiprack_200_STR[f"A{i}"])
                STR_200_list.append(tiprack_200_STR[f"E{i}"])
        if status == "STP_50" and STP_50_TIPS == True:
            tiprack_50_STP = protocol.load_labware("opentrons_flex_96_tiprack_50ul", position, f"tiprack_50_STP")
            for i in range(1, 13):
                STP_50_list_x4.append(tiprack_50_STP[f"E{i}"])
                STP_50_list_x4.append(tiprack_50_STP[f"A{i}"])
            rows = ["H", "G", "F", "E", "D", "C", "B", "A"]
            columns = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
            for col in columns:
                for row in rows:
                    STP_50_list_x1.append(tiprack_50_STP[row + col])
        if status == "STR_50" and STP_50_TIPS == True:
            tiprack_50_STR = protocol.load_labware("opentrons_flex_96_tiprack_50ul", position, f"tiprack_50_STR")
            for i in range(1, 13):
                STR_50_list.append(tiprack_50_STR[f"A{i}"])
                STR_50_list.append(tiprack_50_STR[f"E{i}"])
        if status == "REUSE_50_TIPS" and REUSE_ANY_50_TIPS == True:
            p50_RACK_COUNT += 1
            tiprack_50_R = protocol.load_labware("opentrons_flex_96_tiprack_50ul", position, f"tiprack_50_R")
            protocol.comment(f"Adding tiprack_50_R")
            for X in range(COLUMNS):
                REUSE_50_TIPS.append(tiprack_50_R.wells_by_name().get(f"A{X+1}", None))
            for X in range(COLUMNS, 12):
                p50_INITIALTIPS.append(tiprack_50_R.wells_by_name().get(f"A{X+1}", None))
        if status == "REUSE_50_TIPS" and REUSE_ANY_50_TIPS == False:
            if position[1:2] != "4":
                AVAILABLE_POS_ONDECK.append(position)
            if position[1:2] == "4":
                AVAILABLE_POS_OFFDECK.append(position)
        if status == "REUSE_200_1TIPS" and REUSE_ANY_200_TIPS == True:
            p200_RACK_COUNT += 1
            tiprack_200_R1 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", position, f"tiprack_200_R1")
            protocol.comment(f"Adding tiprack_200_R1")
            for X in range(COLUMNS):
                REUSE_200_TIPS_1.append(tiprack_200_R1.wells_by_name().get(f"A{X+1}", None))
            for X in range(COLUMNS, 12):
                p200_INITIALTIPS.append(tiprack_200_R1.wells_by_name().get(f"A{X+1}", None))
        if status == "REUSE_200_1TIPS" and REUSE_ANY_200_TIPS == False:
            if position[1:2] != "4":
                AVAILABLE_POS_ONDECK.append(position)
            if position[1:2] == "4":
                AVAILABLE_POS_OFFDECK.append(position)
        if status == "REUSE_200_2TIPS" and REUSE_ANY_200_TIPS == True:
            p200_RACK_COUNT += 1
            tiprack_200_R2 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", position, f"tiprack_200_R2")
            protocol.comment(f"Adding tiprack_200_R2")
            for X in range(COLUMNS * 2):
                REUSE_200_TIPS_2.append(tiprack_200_R2.wells_by_name().get(f"A{X+1}", None))
            for X in range(COLUMNS * 2, 12):
                p200_INITIALTIPS.append(tiprack_200_R2.wells_by_name().get(f"A{X+1}", None))
        if status == "REUSE_200_2TIPS" and REUSE_ANY_200_TIPS == False:
            if position[1:2] != "4":
                AVAILABLE_POS_ONDECK.append(position)
            if position[1:2] == "4":
                AVAILABLE_POS_OFFDECK.append(position)

    def TipCheck(tiptype, tipuse, rep, tipset):
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
        SOFTPAUSE = False
        if len(AVAILABLE_POS_ONDECK) == 0 and len(AVAILABLE_POS_OFFDECK) == 0:
            for loop, X in enumerate(OFFDECK_LIST):
                del protocol.deck[X]
                if SOFTPAUSE == False:
                    protocol.pause("CLEARING OFFDECK POSITIONS")
                protocol.comment("CLEARING OFFDECK POSITIONS")
                AVAILABLE_POS_OFFDECK.append(X)
        if tiptype == 50 and tipuse != "STP":
            if p50_TIPS == 0 and len(p50_INITIALTIPS) == 0:
                if tipuse == "REUSE" and REUSE_ANY_50_TIPS == True:
                    p50.pick_up_tip(REUSE_50_TIPS[rep])
                else:
                    if len(p50_RACKS_ONDECK) == 0:
                        protocol.comment("FIRST RACK")
                    else:
                        protocol.comment("IS THERE AN EMPTY RACK?")
                        RACKS_TO_DUMP.append(p50_RACKS_ONDECK[0])
                        p50_RACKS_ONDECK.pop(0)
                    p50_RACK_COUNT += 1
                    p50_TIPS += 12
                    protocol.comment(f"Adding tiprack_50_{p50_RACK_COUNT}")
                    if len(AVAILABLE_POS_ONDECK) > 0:
                        addtiprack = protocol.load_labware(
                            "opentrons_flex_96_tiprack_50ul", AVAILABLE_POS_ONDECK[0], f"tiprack_50_{p50_RACK_COUNT}"
                        )
                        AVAILABLE_POS_ONDECK.pop(0)
                        p50_RACKS_ONDECK.append(addtiprack)
                        p50_RACKS_PIPET.append(addtiprack)
                        p50.tip_racks = p50_RACKS_PIPET
                    elif len(AVAILABLE_POS_ONDECK) == 0 and len(AVAILABLE_POS_OFFDECK) > 0:
                        addtiprack = protocol.load_labware(
                            "opentrons_flex_96_tiprack_50ul", AVAILABLE_POS_OFFDECK[0], f"tiprack_50_{p50_RACK_COUNT}"
                        )
                        AVAILABLE_POS_OFFDECK.pop(0)
                        p50_RACKS_OFFDECK.append(addtiprack)
                        p50_RACKS_PIPET.append(addtiprack)
                        p50.tip_racks = p50_RACKS_PIPET
                        TipRackSwap(50)
            if p50_TIPS == 0 and len(p50_INITIALTIPS) > 0:
                if tipuse == "REUSE" and REUSE_ANY_50_TIPS == True:
                    p50.pick_up_tip(REUSE_50_TIPS[rep])
                else:
                    p50.pick_up_tip(p50_INITIALTIPS[0])
                    p50_INITIALTIPS.pop(0)
            if p50_TIPS > 0:
                if tipuse == "REUSE" and REUSE_ANY_50_TIPS == True:
                    p50.pick_up_tip(REUSE_50_TIPS[rep])
                else:
                    if len(p50_INITIALTIPS) > 0:
                        p50.pick_up_tip(p50_INITIALTIPS[0])
                        p50_INITIALTIPS.pop(0)
                    else:
                        p50_TIPS -= 1
                        p50.pick_up_tip()
        if tiptype == 200 and tipuse != "STP":
            if p200_TIPS == 0 and len(p200_INITIALTIPS) == 0:
                if tipuse == "REUSE" and tipset == "WASH" and REUSE_200_TIPS_WASH == True:
                    p1000.pick_up_tip(REUSE_200_TIPS_1[rep])
                elif tipuse == "REUSE" and tipset == "ETOH" and REUSE_200_TIPS_ETOH == True:
                    p1000.pick_up_tip(REUSE_200_TIPS_2[rep])
                else:
                    if len(p200_RACKS_ONDECK) == 0:
                        protocol.comment("FIRST RACK")
                    else:
                        protocol.comment("IS THERE AN EMPTY RACK?")
                        RACKS_TO_DUMP.append(p200_RACKS_ONDECK[0])
                        p200_RACKS_ONDECK.pop(0)
                    p200_RACK_COUNT += 1
                    p200_TIPS += 12
                    protocol.comment(f"Adding tiprack_200_{p200_RACK_COUNT}")
                    if len(AVAILABLE_POS_ONDECK) > 0:
                        addtiprack = protocol.load_labware(
                            "opentrons_flex_96_tiprack_200ul", AVAILABLE_POS_ONDECK[0], f"tiprack_200_{p200_RACK_COUNT}"
                        )
                        AVAILABLE_POS_ONDECK.pop(0)
                        p200_RACKS_ONDECK.append(addtiprack)
                        p200_RACKS_PIPET.append(addtiprack)
                        p1000.tip_racks = p200_RACKS_PIPET
                    elif len(AVAILABLE_POS_ONDECK) == 0 and len(AVAILABLE_POS_OFFDECK) > 0:
                        addtiprack = protocol.load_labware(
                            "opentrons_flex_96_tiprack_200ul", AVAILABLE_POS_OFFDECK[0], f"tiprack_200_{p200_RACK_COUNT}"
                        )
                        AVAILABLE_POS_OFFDECK.pop(0)
                        p200_RACKS_OFFDECK.append(addtiprack)
                        p200_RACKS_PIPET.append(addtiprack)
                        p1000.tip_racks = p200_RACKS_PIPET
                        TipRackSwap(200)
            if p200_TIPS == 0 and len(p200_INITIALTIPS) > 0:
                if tipuse == "REUSE" and REUSE_ANY_200_TIPS == True:
                    if tipset == "WASH" and REUSE_200_TIPS_WASH == True:
                        p1000.pick_up_tip(REUSE_200_TIPS_1[rep])
                    elif tipset == "ETOH" and REUSE_200_TIPS_ETOH == True:
                        p1000.pick_up_tip(REUSE_200_TIPS_2[rep])
                    else:
                        if len(p200_INITIALTIPS) > 0:
                            p1000.pick_up_tip(p200_INITIALTIPS[0])
                            p200_INITIALTIPS.pop(0)
                        else:
                            p200_TIPS -= 1
                            p1000.pick_up_tip()
                else:
                    p1000.pick_up_tip(p200_INITIALTIPS[0])
                    p200_INITIALTIPS.pop(0)
            if p200_TIPS > 0:
                if tipuse == "REUSE" and REUSE_ANY_200_TIPS == True:
                    if tipset == "WASH" and REUSE_200_TIPS_WASH == True:
                        p1000.pick_up_tip(REUSE_200_TIPS_1[rep])
                    elif tipset == "ETOH" and REUSE_200_TIPS_ETOH == True:
                        p1000.pick_up_tip(REUSE_200_TIPS_2[rep])
                    else:
                        if len(p200_INITIALTIPS) > 0:
                            p1000.pick_up_tip(p200_INITIALTIPS[0])
                            p200_INITIALTIPS.pop(0)
                        else:
                            p200_TIPS -= 1
                            p1000.pick_up_tip()
                else:
                    if len(p200_INITIALTIPS) > 0:
                        p1000.pick_up_tip(p200_INITIALTIPS[0])
                        p200_INITIALTIPS.pop(0)
                    else:
                        p200_TIPS -= 1
                        p1000.pick_up_tip()
        if tiptype == 50 and tipuse == "STP":
            p50.pick_up_tip(stp_50_list[rep])
        if tiptype == 200 and tipuse == "STP":
            p1000.pick_up_tip(stp_200_list[rep])

    def TipDone(tiptype, tipuse, rep, tipset):
        # A Function that is called replacing the Tip dropping Step.  Values are passed to the function such as tip type, reuse, and which rep (loop number) it is on.
        # 1). Checks if it is a Single Tip Pickup, Reusable tip, or if the run is a Dry run,
        global TIP_TRASH
        if tiptype == 50:
            if tipuse == "STP":
                p50.drop_tip(str_50_list[rep]) if TIP_TRASH == False else p50.drop_tip()
            elif tipuse == "REUSE":
                p50.return_tip()
            else:
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
        if tiptype == 200:
            if tipuse == "STP":
                p1000.drop_tip(str_200_list[rep]) if TIP_TRASH == False else p1000.drop_tip()
            elif tipuse == "REUSE":
                p1000.return_tip()
            else:
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()

    def TipRackSwap(tiptype):
        # A Function that is called from within the TipCheck function to Swap Tip Racks.
        # 1). Sets the values within the Function according to the appropriate tip rack list
        # 2). If the Global Value of SWAPOFFDECK = True, it will swap tipracks (rather than dump into the Chute)
        # 3). First in line of the RACKS_TO_DUMP is the one removed, can either be p50 or p200, no reusable tips or single Tip Racks
        if tiptype == 50:
            RACK_EMPTY = RACKS_TO_DUMP[0]
            RACK_EMPTY_POS = RACKS_TO_DUMP[0].parent
            RACK_NEW = p50_RACKS_OFFDECK[0]
            RACK_NEW_POS = p50_RACKS_OFFDECK[0].parent
        if tiptype == 200:
            RACK_EMPTY = RACKS_TO_DUMP[0]
            RACK_EMPTY_POS = RACKS_TO_DUMP[0].parent
            RACK_NEW = p200_RACKS_OFFDECK[0]
            RACK_NEW_POS = p200_RACKS_OFFDECK[0].parent
        if SWAPOFFDECK == True:
            SWAPSPOT.append(RACK_NEW_POS)
            SWAPSPOT.append(RACK_EMPTY_POS)
            protocol.comment("EMPTY POS " + str(SWAPSPOT[0]))
            protocol.comment("RACK LEAVING THIS OFF DECK POS " + str(SWAPSPOT[1]))
            protocol.comment("EMPTY RACK LEAVING THIS POS, MAKING IT THE NEW EMPTY POS " + str(SWAPSPOT[2]))
            protocol.move_labware(labware=RACK_NEW, new_location=SWAPSPOT[0], use_gripper=USE_GRIPPER)
            protocol.move_labware(labware=RACK_EMPTY, new_location=SWAPSPOT[1], use_gripper=USE_GRIPPER)
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
            protocol.move_labware(labware=RACK_EMPTY, new_location=TRASH, use_gripper=USE_GRIPPER)
            protocol.move_labware(labware=RACK_NEW, new_location=SWAPS_POT[0], use_gripper=USE_GRIPPER)
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

    def PlateUnstack(Startposition, Stopposition):
        # A Function that creates a plate, grips it based on offsets mimicking the stacked plates height, and moves it to a new position,
        # This is a Standin Function until real functionality for plate unstacking is added.
        global PLATE_STACKED
        if PLATE_STACKED == 7:
            sample_plate_1 = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", Startposition)
            protocol.move_labware(
                labware=sample_plate_1,
                new_location=Stopposition,
                use_gripper=USE_GRIPPER,
                pick_up_offset={"x": 0, "y": 0, "z": (PLATE_STACKED - 1) * 13},
                drop_offset=deck_drop_offset,
            )
            PLATE_STACKED -= 1
        elif PLATE_STACKED == 6:
            sample_plate_2 = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", Startposition)
            protocol.move_labware(
                labware=sample_plate_2,
                new_location=Stopposition,
                use_gripper=USE_GRIPPER,
                pick_up_offset={"x": 0, "y": 0, "z": (PLATE_STACKED - 1) * 13},
                drop_offset=deck_drop_offset,
            )
            PLATE_STACKED -= 1
        elif PLATE_STACKED == 5:
            sample_plate_3 = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", Startposition)
            protocol.move_labware(
                labware=sample_plate_3,
                new_location=Stopposition,
                use_gripper=USE_GRIPPER,
                pick_up_offset={"x": 0, "y": 0, "z": (PLATE_STACKED - 1) * 13},
                drop_offset=deck_drop_offset,
            )
            PLATE_STACKED -= 1
        elif PLATE_STACKED == 4:
            sample_plate_4 = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", Startposition)
            protocol.move_labware(
                labware=sample_plate_4,
                new_location=Stopposition,
                use_gripper=USE_GRIPPER,
                pick_up_offset={"x": 0, "y": 0, "z": (PLATE_STACKED - 1) * 13},
                drop_offset=deck_drop_offset,
            )
            PLATE_STACKED -= 1
        elif PLATE_STACKED == 3:
            sample_plate_5 = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", Startposition)
            protocol.move_labware(
                labware=sample_plate_5,
                new_location=Stopposition,
                use_gripper=USE_GRIPPER,
                pick_up_offset={"x": 0, "y": 0, "z": (PLATE_STACKED - 1) * 13},
                drop_offset=deck_drop_offset,
            )
            PLATE_STACKED -= 1
        elif PLATE_STACKED == 2:
            sample_plate_6 = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", Startposition)
            protocol.move_labware(
                labware=sample_plate_6,
                new_location=Stopposition,
                use_gripper=USE_GRIPPER,
                pick_up_offset={"x": 0, "y": 0, "z": (PLATE_STACKED - 1) * 13},
                drop_offset=deck_drop_offset,
            )
            PLATE_STACKED -= 1
        elif PLATE_STACKED == 1:
            sample_plate_7 = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", Startposition)
            protocol.move_labware(
                labware=sample_plate_7,
                new_location=Stopposition,
                use_gripper=USE_GRIPPER,
                pick_up_offset={"x": 0, "y": 0, "z": 0},
                drop_offset=deck_drop_offset,
            )

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
        thermocycler = protocol.load_module("thermocycler module gen2")
        reagent_thermo = thermocycler.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt")
    else:
        DefinePosition(None, "A1", "OPEN")
    DefinePosition(None, "A2", "OPEN")
    # ========== SECOND ROW ==========
    if ONDECK_THERMO == True:
        pass
    else:
        reagent_thermo = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "A1")
    if FORMAT == "96":
        qpcrplate = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "B2")
    if FORMAT == "384":
        qpcrplate = protocol.load_labware("appliedbiosystemsmicroamp_384_wellplate_40ul", "B2")
    DefinePosition(None, "B3", "OPEN")
    # ========== THIRD ROW ===========
    if ONDECK_TEMP == True:
        temp_block = protocol.load_module("temperature module gen2", "C1")
        temp_adapter = temp_block.load_adapter("opentrons_96_well_aluminum_block")
        mix_plate = temp_adapter.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt")
    else:
        mix_plate = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "C1")
    reservoir = (
        protocol.load_labware("nest_12_reservoir_15ml", "C2", "Reservoir")
        if RES_TYPE_96x == False
        else protocol.load_labware("nest_96_wellplate_2ml_deep", "C2")
    )
    DefinePosition(None, "C3", "OPEN")
    # ========== FOURTH ROW ==========
    if ONDECK_HEATERSHAKER == True:
        heatershaker = protocol.load_module("heaterShakerModuleV1", "D1")
        dilution_plate = heatershaker.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt")
    else:
        dilution_plate = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "D1")
    source_plate = protocol.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "D2")
    # ============ TRASH =============
    if TRASH_POSITION == "BIN":
        TRASH = protocol.load_trash_bin("A3")
        DefinePosition(None, "D3", "OPEN")
        DefinePosition(None, "B4", "OPEN")
        DefinePosition(None, "B4", "OPEN")
        DefinePosition(None, "C4", "OPEN")
        DefinePosition(None, "D4", "OPEN")
        OFFDECK_LIST = ["B4", "C4", "D4"]
    if TRASH_POSITION == "CHUTE":
        TRASH = protocol.load_waste_chute()
        DefinePosition(None, "A3", "OPEN")
        DefinePosition(None, "A4", "OPEN")
        DefinePosition(None, "B4", "OPEN")
        DefinePosition(None, "C4", "OPEN")
        DefinePosition(None, "D4", "OPEN")
        OFFDECK_LIST = ["A4", "B4", "C4", "D4"]

    # If SWAPOFFDECK = True (Meaning swapping empty On Deck Racks with New Off Deck Racks), removes the first listed tip position to keep it empty for temporary space.
    if SWAPOFFDECK == True:
        SWAPSPOT.append(AVAILABLE_POS_ONDECK[0])
        AVAILABLE_POS_ONDECK.pop(0)

    # Reverse the lists of Positions for accessibility (First Checked On Deck Slot is D4, Off Deck is D4)
    AVAILABLE_POS_ONDECK.reverse()
    AVAILABLE_POS_OFFDECK.reverse()
    OFFDECK_LIST.reverse()

    # =========================== REAGENT PLATE =============================
    STD = reagent_thermo["A1"]
    qPCR = reagent_thermo["A3"]

    # ============================ RESERVOIR ================================
    DIL = reservoir["A1"]

    # ======================= TIP AND SAMPLE TRACKING =======================
    # This is a list of each column to be used in the protocol, as well as any intermediate or final sample positions.
    # column_1_list = [f'A{i}' for i in range(1, COLUMNS + 1)]              <-- This is a Simple list of 'A1' through 'A12', meaning a full plate.
    # Example Protocols can look like this:
    # if COLUMNS == 3:
    #   column_1_list = ['A1','A2','A3']             <-- Initial 3 columns of Samples
    #   column_2_list = ['A4','A5','A6']             <-- Final 3 columns of Samples
    column_1_list = ["A" + INICOLUMN1, "A" + INICOLUMN2, "A" + INICOLUMN3, "A" + INICOLUMN4, "A" + INICOLUMN5, "A" + INICOLUMN6]
    column_DIL1_list = ["A1", "A2", "A3", "A4", "A5", "A6"]  # Dilution 1/20 wells
    column_DIL2_list = ["A7", "A8", "A9", "A10", "A11", "A12"]  # Dilution 1/50 wells
    column_3_list = ["A2", "A3", "A4", "A5", "A6", "A7"]  # qPCR to Mix plate
    column_4_list = ["A2", "A3", "A4", "A5", "A6", "A7"]  # Diluted Samples to Mix (Dilution Plate to Mix Plate) (Skipping A1 for Standards)
    column_5_list = [
        ["A1", "A2", "B1", "B2"],
        ["A3", "A4", "B3", "B4"],
        ["A5", "A6", "B5", "B6"],
        ["A7", "A8", "B7", "B8"],
        ["A9", "A10", "B9", "B10"],
        ["A11", "A12", "B11", "B12"],
        ["A13", "A14", "B13", "B14"],
    ]

    # ============================ CUSTOM OFFSETS ===========================
    # These are Custom Offsets which are a PER INSTRUMENT Setting, to account for slight adjustments of the gripper calibration or labware.
    if CUSTOM_OFFSETS == True:
        PCRPlate_Z_offset = 0
        Deepwell_Z_offset = 1
        # HEATERSHAKER OFFSETS
        hs_drop_offset = {"x": 0, "y": -2, "z": 0}
        hs_pick_up_offset = {"x": 0, "y": -2, "z": 0}
        # MAG BLOCK OFFSETS
        mb_drop_offset = {"x": 0, "y": 0.0, "z": 0.5}
        mb_pick_up_offset = {"x": 0, "y": -2, "z": 0}
        # THERMOCYCLER OFFSETS
        tc_drop_offset = {"x": 0, "y": 0, "z": 0}
        tc_pick_up_offset = {"x": 0, "y": 0, "z": 0}
        # DECK OFFSETS
        deck_drop_offset = {"x": 0, "y": 0, "z": 0}
        deck_pick_up_offset = {"x": 0, "y": 0, "z": 0}
    else:
        PCRPlate_Z_offset = 0
        Deepwell_Z_offset = 0
        # HEATERSHAKER OFFSETS
        hs_drop_offset = {"x": 0, "y": 0, "z": 0}
        hs_pick_up_offset = {"x": 0, "y": 0, "z": 0}
        # MAG BLOCK OFFSETS
        mb_drop_offset = {"x": 0, "y": 0.0, "z": 0}
        mb_pick_up_offset = {"x": 0, "y": 0, "z": 0}
        # THERMOCYCLER OFFSETS
        tc_drop_offset = {"x": 0, "y": 0, "z": 0}
        tc_pick_up_offset = {"x": 0, "y": 0, "z": 0}
        # DECK OFFSETS
        deck_drop_offset = {"x": 0, "y": 0, "z": 0}
        deck_pick_up_offset = {"x": 0, "y": 0, "z": 0}

    # =================================================================================================
    # ========================================= PROTOCOL START ========================================
    # =================================================================================================
    if ONDECK_THERMO == True:
        thermocycler.open_lid()
    if ONDECK_HEATERSHAKER == True:
        heatershaker.open_labware_latch()
    if DRYRUN == False:
        protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
        if ONDECK_THERMO == True:
            thermocycler.set_block_temperature(4)
        if ONDECK_TEMP == True:
            temp_block.set_temperature(4)
    protocol.pause("Ready")
    if ONDECK_HEATERSHAKER == True:
        heatershaker.close_labware_latch()
    # =================================================================================================
    # ========================================= PROTOCOL START ========================================
    # =================================================================================================

    if STEP_DILUTE == True:
        protocol.comment("==============================================")
        protocol.comment("--> Diluting Sample")
        protocol.comment("==============================================")

        protocol.comment("--> Adding Diluent")
        p1000.flow_rate.aspirate = p1000_flow_rate_aspirate_default * 0.5
        p1000.flow_rate.dispense = p1000_flow_rate_dispense_default * 0.5
        p1000.flow_rate.blow_out = p1000_flow_rate_blow_out_default
        # ===============================================
        TipCheck(200, None, 1, None)
        for loop, X in enumerate(column_1_list):
            p1000.aspirate(200, DIL.bottom(z=2))
            p1000.dispense(98, dilution_plate[column_DIL1_list[loop]].bottom(z=0.3))
            p1000.dispense(95, dilution_plate[column_DIL2_list[loop]].bottom(z=0.3))
            p1000.move_to(DIL.top())
            p1000.blow_out()
            if loop == COLUMNS - 1:
                break
        TipDone(200, None, 1, None)
        # ===============================================

        protocol.comment("--> Adding Sample to Diluent 1")
        SampleVol = 2
        DilMixRPM = 1200
        DilMixTime = 2 * 60 if DRYRUN == False else 0.1 * 60
        # p50.configure_for_volume(2)
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.25
        p50.flow_rate.dispense = p50_flow_rate_dispense_default * 0.25
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default
        # ===============================================
        for loop, X in enumerate(column_1_list):
            TipCheck(50, None, loop, None)
            p50.aspirate(SampleVol + 3, source_plate.wells_by_name()[X].bottom(z=1))
            p50.dispense(3, source_plate.wells_by_name()[X].bottom(z=1))
            p50.aspirate(SampleVol + 3, source_plate.wells_by_name()[X].bottom(z=1))
            p50.dispense(3, source_plate.wells_by_name()[X].bottom(z=1))
            p50.dispense(SampleVol + 1, dilution_plate.wells_by_name()[column_DIL1_list[loop]].bottom(z=1))
            if TIP_MIX == True:
                p50.mix(2, 10, dilution_plate.wells_by_name()[column_DIL1_list[loop]].bottom(z=1))
            else:
                p50.mix(10, 45, dilution_plate.wells_by_name()[column_DIL1_list[loop]].bottom(z=1))
            p50.blow_out(dilution_plate.wells_by_name()[column_DIL1_list[loop]].top(z=-2))
            TipDone(50, None, loop, None)
            if loop == COLUMNS - 1:
                break
        # ===============================================
        if ONDECK_HEATERSHAKER == True:
            heatershaker.set_and_wait_for_shake_speed(rpm=DilMixRPM)
            protocol.delay(DilMixTime)
            heatershaker.deactivate_shaker()

        protocol.comment("--> Adding Sample to Diluent 2")
        SampleVol = 5
        DilMixRPM = 1200
        DilMixTime = 2 * 60 if DRYRUN == False else 0.1 * 60
        # p50.configure_for_volume(5)
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.25
        p50.flow_rate.dispense = p50_flow_rate_dispense_default * 0.25
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default
        # ===============================================
        for loop, X in enumerate(column_1_list):
            TipCheck(50, None, loop, None)
            p50.aspirate(SampleVol + 3, dilution_plate.wells_by_name()[column_DIL1_list[loop]].bottom(z=1))
            p50.dispense(3, dilution_plate.wells_by_name()[column_DIL1_list[loop]].bottom(z=1))
            p50.aspirate(SampleVol + 3, dilution_plate.wells_by_name()[column_DIL1_list[loop]].bottom(z=1))
            p50.dispense(3, dilution_plate.wells_by_name()[column_DIL1_list[loop]].bottom(z=1))
            p50.dispense(SampleVol + 1, dilution_plate.wells_by_name()[column_DIL2_list[loop]].bottom(z=1))
            if TIP_MIX == True:
                p50.mix(2, 10, dilution_plate.wells_by_name()[column_DIL2_list[loop]].bottom(z=1))
            else:
                p50.mix(10, 45, dilution_plate.wells_by_name()[column_DIL2_list[loop]].bottom(z=1))
            p50.blow_out(dilution_plate.wells_by_name()[column_DIL2_list[loop]].top(z=-2))
            TipDone(50, None, loop, None)
            if loop == COLUMNS - 1:
                break
        # ===============================================
        if ONDECK_HEATERSHAKER == True:
            heatershaker.set_and_wait_for_shake_speed(rpm=DilMixRPM)
            protocol.delay(DilMixTime)
            heatershaker.deactivate_shaker()

    if STEP_MIX == True:
        protocol.comment("==============================================")
        protocol.comment("--> Adding qPCR Mix")
        protocol.comment("==============================================")
        qPCRVol = 27
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.25
        p50.flow_rate.dispense = p50_flow_rate_dispense_default * 0.25
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default
        # ===============================================
        TipCheck(50, None, loop, None)
        p50.aspirate(qPCRVol, qPCR.bottom(z=1))
        p50.dispense(qPCRVol, mix_plate.wells_by_name()["A1"].bottom(z=0.3))
        p50.default_speed = 50
        p50.move_to(mix_plate.wells_by_name()[X].top(z=-1))
        protocol.delay(seconds=2)
        p50.blow_out(mix_plate.wells_by_name()[X].top(z=-1))
        for loop, X in enumerate(column_3_list):
            p50.aspirate(qPCRVol, qPCR.bottom(z=1))
            p50.dispense(qPCRVol, mix_plate.wells_by_name()[X].bottom(z=0.3))
            p50.default_speed = 50
            p50.move_to(mix_plate.wells_by_name()[X].top(z=-1))
            protocol.delay(seconds=2)
            p50.blow_out(mix_plate.wells_by_name()[X].top(z=-1))
            p50.default_speed = 400
            if loop == COLUMNS - 1:
                break
        TipDone(50, None, loop, None)
        # ===============================================

        protocol.comment("==============================================")
        protocol.comment("--> Adding Standards to Mix")
        protocol.comment("==============================================")
        SampleVol = 18
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.25
        p50.flow_rate.dispense = p50_flow_rate_dispense_default * 0.25
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default
        # ===============================================
        TipCheck(50, None, loop, None)
        p50.aspirate(SampleVol, STD.bottom(z=0.3))
        p50.dispense(SampleVol, mix_plate["A1"].bottom(z=0.3))
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
        p50.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
        p50.mix(5, 30, mix_plate["A1"].bottom(z=1))
        p50.default_speed = 50
        p50.move_to(mix_plate["A1"].top(z=-1))
        protocol.delay(seconds=2)
        p50.blow_out(mix_plate["A1"].top(z=-1))
        p50.default_speed = 400
        TipDone(50, None, loop, None)
        # ===============================================

        protocol.comment("==============================================")
        protocol.comment("--> Adding Diluted Sample to Mix")
        protocol.comment("==============================================")
        SampleVol = 18
        p50.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.25
        p50.flow_rate.dispense = p50_flow_rate_dispense_default * 0.25
        p50.flow_rate.blow_out = p50_flow_rate_blow_out_default
        # ===============================================
        for X in range(COLUMNS):
            TipCheck(50, None, loop, None)
            p50.aspirate(SampleVol, dilution_plate.wells_by_name()[column_DIL2_list[X]].bottom(z=1))
            p50.dispense(SampleVol, mix_plate.wells_by_name()[column_4_list[X]].bottom(z=0.5))
            p50.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.5
            p50.flow_rate.dispense = p50_flow_rate_dispense_default * 0.5
            p50.mix(5, 30, mix_plate.wells_by_name()[column_4_list[X]].bottom(z=1))
            p50.default_speed = 50
            p50.move_to(mix_plate.wells_by_name()[column_4_list[X]].top(z=-1))
            protocol.delay(seconds=2)
            p50.blow_out(mix_plate.wells_by_name()[column_4_list[X]].top(z=-1))
            p50.default_speed = 400
            TipDone(50, None, loop, None)
            if loop == (COLUMNS) - 1:
                break
        # ===============================================

    if STEP_DISPENSE == True:
        if FORMAT == "96":
            protocol.comment("==============================================")
            protocol.comment("--> Dispensing 96 well")
            protocol.comment("==============================================")
            MixqPCRVol = 40
            p50.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.25
            p50.flow_rate.dispense = p50_flow_rate_dispense_default * 0.25
            p50.flow_rate.blow_out = p50_flow_rate_blow_out_default
            # ===============================================
            for loop, X in enumerate(column_3_list):
                TipCheck(50, None, loop, None)
                p50.mix(5, MixqPCRVol - 5, mix_plate[X].bottom(z=1))
                p50.aspirate(MixqPCRVol + 2, mix_plate[X].bottom(z=0.3))
                protocol.delay(seconds=0.2)
                # ===============================================
                p50.move_to(qpcrplate[X].center())
                p50.default_speed = 100
                p50.dispense(MixqPCRVol, qpcrplate[X].bottom(z=1))
                protocol.delay(seconds=0.2)
                p50.move_to(qpcrplate[X].top(z=-1))
                p50.default_speed = 400
                # ===============================================
                TipDone(50, None, loop, None)
                if loop == (COLUMNS + 1) - 1:
                    break
            # ===============================================

        if FORMAT == "384":
            protocol.comment("==============================================")
            protocol.comment("--> Dispensing 384 well")
            protocol.comment("==============================================")
            MixqPCRVol = 40
            Multidispense = [10.1, 10.2, 9.8, 9.9]  # Slight Volume Changes to account for Multidispense Variation
            p50.flow_rate.aspirate = p50_flow_rate_aspirate_default * 0.25
            p50.flow_rate.dispense = p50_flow_rate_dispense_default * 0.25
            p50.flow_rate.blow_out = p50_flow_rate_blow_out_default
            # ===============================================
            for loop, X in enumerate(column_3_list):
                TipCheck(50, None, loop, None)
                p50.mix(5, MixqPCRVol - 5, mix_plate[X].bottom(z=1))
                p50.aspirate(MixqPCRVol + 5, mix_plate[X].bottom(z=0.3))
                p50.dispense(2, mix_plate[X].bottom(z=0.3))
                protocol.delay(seconds=0.2)
                # ===============================================
                for loop2, X in enumerate(column_5_list[loop]):
                    p50.move_to(qpcrplate[X].top(z=1.0))
                    protocol.delay(seconds=0.2)
                    p50.default_speed = 10
                    p50.move_to(qpcrplate[X].center())
                    p50.default_speed = 2.5
                    p50.dispense(Multidispense[loop2], qpcrplate[X].bottom(z=1))
                    protocol.delay(seconds=0.2)
                    p50.default_speed = 100
                # ===============================================
                p50.default_speed = 400
                TipDone(50, None, loop, None)
                if loop == (COLUMNS + 1) - 1:
                    break
            # ===============================================

    # =================================================================================================
    # ========================================== PROTOCOL END =========================================
    # =================================================================================================
    if DEACTIVATE_TEMP == True:
        if ONDECK_THERMO == True:
            thermocycler.deactivate_block()
        if ONDECK_TEMP == True:
            temp_block.deactivate()
    if ONDECK_HEATERSHAKER == True:
        heatershaker.open_labware_latch()
    # =================================================================================================
    # ========================================== PROTOCOL END =========================================
    # =================================================================================================

    protocol.comment("==============================================")
    protocol.comment("--> Report")
    protocol.comment("==============================================")
    # This is a section that will print out the various lists to help keep track of modifying the protocol, set the REPORT step to False to ignore.
    if REPORT == True:
        protocol.comment("REUSE_50_TIPS " + str(REUSE_50_TIPS))
        protocol.comment("p50_INITIALTIPS " + str(p50_INITIALTIPS))
        protocol.comment("REUSE_200_TIPS_1 " + str(REUSE_200_TIPS_1))
        protocol.comment("REUSE_200_TIPS_2 " + str(REUSE_200_TIPS_2))
        protocol.comment("p200_INITIALTIPS " + str(p200_INITIALTIPS))
        protocol.comment("SWAPSPOT " + str(SWAPSPOT))
        protocol.comment("AVAILABLE_POS_ONDECK " + str(AVAILABLE_POS_ONDECK))
        protocol.comment("AVAILABLE_POS_OFFDECK " + str(AVAILABLE_POS_OFFDECK))
        protocol.comment("REUSE_50_TIPS_COUNT " + str(REUSE_50_TIPS_COUNT))
        protocol.comment("REUSE_200_TIPS_COUNT " + str(REUSE_200_TIPS_COUNT))
        protocol.comment("p50_RACKS_ONDECK " + str(p50_RACKS_ONDECK))
        protocol.comment("p50_RACKS_OFFDECK " + str(p50_RACKS_OFFDECK))
        protocol.comment("p50_RACKS_DROPPED " + str(p50_RACKS_DROPPED))
        protocol.comment("p50_TIPS " + str(p50_TIPS))
        protocol.comment("p50_RACKS_PIPET " + str(p50_RACKS_PIPET))
        protocol.comment("p200_RACKS_ONDECK " + str(p200_RACKS_ONDECK))
        protocol.comment("p200_RACKS_OFFDECK " + str(p200_RACKS_OFFDECK))
        protocol.comment("p200_RACKS_DROPPED " + str(p200_RACKS_DROPPED))
        protocol.comment("p200_TIPS " + str(p200_TIPS))
        protocol.comment("p200_RACKS_PIPET " + str(p200_RACKS_PIPET))
        protocol.comment("RACKS_TO_DUMP " + str(RACKS_TO_DUMP))

    # This is a section that is used to define liquids, and label wells, this is optional, and unconnected from the rest of the protocol, used only for the App and Website
    # This is at the end because it adds lines of code to the runtime that can be at the end rather than the beginning, since it has no effect on the protocol setps.
    if LABEL == True:
        # PROTOCOL SETUP - LABELING

        # ======== ESTIMATING LIQUIDS =======
        Sample_Volume = 50
        STD_Volume = 50
        qPCR_Volume = 200
        DIL_Volume = 15000

        TotalColumn = ["A", "B", "C", "D", "E", "F", "G", "H"]
        UsedColumn = ["A", "B", "C", "D", "E", "F", "G", "H"]
        TotalColumn2 = ["I", "J", "K", "L", "M", "N", "O", "P"]

        # ======== DEFINING LIQUIDS =======
        DIL = protocol.define_liquid(name="DIL", description="Dilution Buffer", display_color="#00FFF2")  # 00FFF2 = 'Base Light Blue'
        Liquid_trash_well = protocol.define_liquid(
            name="Liquid_trash_well", description="Liquid Trash", display_color="#9B9B9B"
        )  # 9B9B9B = 'Liquid Trash Grey'
        Sample = protocol.define_liquid(name="Sample", description="Sample", display_color="#52AAFF")  # 52AAFF = 'Sample Blue'
        Final_Sample = protocol.define_liquid(
            name="Final_Sample", description="Final Sample", display_color="#82A9CF"
        )  # 82A9CF = 'Placeholder Blue'
        qPCR = protocol.define_liquid(name="qPCR", description="qPCR Mix", display_color="#FF0000")  # FF0000 = 'Base Red'
        STD = protocol.define_liquid(name="STD", description="qPCR Standards", display_color="#FFA000")  # FFA000 = 'Base Orange'
        Final_Sample = protocol.define_liquid(
            name="Final_Sample", description="Final Sample", display_color="#82A9CF"
        )  # 82A9CF = 'Placeholder Blue'
        Placeholder_Sample = protocol.define_liquid(
            name="Placeholder_Sample", description="Placeholder Sample", display_color="#82A9CF"
        )  # 82A9CF = 'Placeholder Blue'
        # ======== LOADING LIQUIDS =======
        if RES_TYPE_96x == False:
            reservoir.wells_by_name()["A1"].load_liquid(liquid=DIL, volume=DIL_Volume * 8)
            reservoir.wells_by_name()["A12"].load_liquid(liquid=Liquid_trash_well, volume=0)
        if RES_TYPE_96x == True:
            for loop, X in enumerate(UsedColumn):
                reservoir.wells_by_name()[X + "1"].load_liquid(liquid=DIL, volume=DIL_Volume)
                reservoir.wells_by_name()[X + "12"].load_liquid(liquid=Liquid_trash_well, volume=0)
        if COLUMNS >= 1:
            for loop, X in enumerate(TotalColumn):
                reagent_thermo.wells_by_name()[X + "1"].load_liquid(liquid=STD, volume=STD_Volume)
                reagent_thermo.wells_by_name()[X + "3"].load_liquid(liquid=qPCR, volume=qPCR_Volume)
                mix_plate.wells_by_name()[X + "1"].load_liquid(liquid=Placeholder_Sample, volume=0)
                mix_plate.wells_by_name()[X + "2"].load_liquid(liquid=Placeholder_Sample, volume=0)
                dilution_plate.wells_by_name()[X + "1"].load_liquid(liquid=Placeholder_Sample, volume=0)
                dilution_plate.wells_by_name()[X + "7"].load_liquid(liquid=Placeholder_Sample, volume=0)
                if FORMAT == "96":
                    qpcrplate.wells_by_name()[X + "1"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[X + "2"].load_liquid(liquid=Final_Sample, volume=10)
                if FORMAT == "384":
                    qpcrplate.wells_by_name()[X + "1"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "1"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[X + "2"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[X + "3"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[X + "4"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "2"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "3"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "4"].load_liquid(liquid=Final_Sample, volume=10)
                source_plate.wells_by_name()[X + INICOLUMN1].load_liquid(liquid=Sample, volume=Sample_Volume)
        if COLUMNS >= 2:
            for loop, X in enumerate(TotalColumn):
                mix_plate.wells_by_name()[X + "2"].load_liquid(liquid=Placeholder_Sample, volume=0)
                dilution_plate.wells_by_name()[X + "2"].load_liquid(liquid=Placeholder_Sample, volume=0)
                dilution_plate.wells_by_name()[X + "8"].load_liquid(liquid=Placeholder_Sample, volume=0)
                if FORMAT == "96":
                    qpcrplate.wells_by_name()[X + "3"].load_liquid(liquid=Final_Sample, volume=10)
                if FORMAT == "384":
                    qpcrplate.wells_by_name()[X + "5"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[X + "6"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "5"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "6"].load_liquid(liquid=Final_Sample, volume=10)
                source_plate.wells_by_name()[X + INICOLUMN2].load_liquid(liquid=Sample, volume=Sample_Volume)
        if COLUMNS >= 3:
            for loop, X in enumerate(TotalColumn):
                mix_plate.wells_by_name()[X + "3"].load_liquid(liquid=Placeholder_Sample, volume=0)
                dilution_plate.wells_by_name()[X + "3"].load_liquid(liquid=Placeholder_Sample, volume=0)
                dilution_plate.wells_by_name()[X + "9"].load_liquid(liquid=Placeholder_Sample, volume=0)
                if FORMAT == "96":
                    qpcrplate.wells_by_name()[X + "4"].load_liquid(liquid=Final_Sample, volume=10)
                if FORMAT == "384":
                    qpcrplate.wells_by_name()[X + "7"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[X + "8"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "7"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "8"].load_liquid(liquid=Final_Sample, volume=10)
                source_plate.wells_by_name()[X + INICOLUMN3].load_liquid(liquid=Sample, volume=Sample_Volume)
        if COLUMNS >= 4:
            for loop, X in enumerate(TotalColumn):
                mix_plate.wells_by_name()[X + "4"].load_liquid(liquid=Placeholder_Sample, volume=0)
                dilution_plate.wells_by_name()[X + "4"].load_liquid(liquid=Placeholder_Sample, volume=0)
                dilution_plate.wells_by_name()[X + "10"].load_liquid(liquid=Placeholder_Sample, volume=0)
                if FORMAT == "96":
                    qpcrplate.wells_by_name()[X + "5"].load_liquid(liquid=Final_Sample, volume=10)
                if FORMAT == "384":
                    qpcrplate.wells_by_name()[X + "9"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[X + "10"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "9"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "10"].load_liquid(liquid=Final_Sample, volume=10)
                source_plate.wells_by_name()[X + INICOLUMN4].load_liquid(liquid=Sample, volume=Sample_Volume)
        if COLUMNS >= 5:
            for loop, X in enumerate(TotalColumn):
                mix_plate.wells_by_name()[X + "5"].load_liquid(liquid=Placeholder_Sample, volume=0)
                dilution_plate.wells_by_name()[X + "5"].load_liquid(liquid=Placeholder_Sample, volume=0)
                dilution_plate.wells_by_name()[X + "11"].load_liquid(liquid=Placeholder_Sample, volume=0)
                if FORMAT == "96":
                    qpcrplate.wells_by_name()[X + "6"].load_liquid(liquid=Final_Sample, volume=10)
                if FORMAT == "384":
                    qpcrplate.wells_by_name()[X + "11"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[X + "12"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "11"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "12"].load_liquid(liquid=Final_Sample, volume=10)
                source_plate.wells_by_name()[X + INICOLUMN5].load_liquid(liquid=Sample, volume=Sample_Volume)
        if COLUMNS >= 6:
            for loop, X in enumerate(TotalColumn):
                mix_plate.wells_by_name()[X + "6"].load_liquid(liquid=Placeholder_Sample, volume=0)
                dilution_plate.wells_by_name()[X + "6"].load_liquid(liquid=Placeholder_Sample, volume=0)
                dilution_plate.wells_by_name()[X + "12"].load_liquid(liquid=Placeholder_Sample, volume=0)
                if FORMAT == "96":
                    qpcrplate.wells_by_name()[X + "7"].load_liquid(liquid=Final_Sample, volume=10)
                if FORMAT == "384":
                    qpcrplate.wells_by_name()[X + "13"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[X + "14"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "13"].load_liquid(liquid=Final_Sample, volume=10)
                    qpcrplate.wells_by_name()[TotalColumn2[loop] + "14"].load_liquid(liquid=Final_Sample, volume=10)
                source_plate.wells_by_name()[X + INICOLUMN6].load_liquid(liquid=Sample, volume=Sample_Volume)
