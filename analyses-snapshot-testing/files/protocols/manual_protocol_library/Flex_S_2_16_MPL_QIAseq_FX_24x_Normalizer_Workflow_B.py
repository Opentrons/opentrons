def get_values(*names):
    import json

    _all_values = json.loads(
        """{"DRYRUN":false,"USE_GRIPPER":true,"TIP_TRASH":true,"DEACTIVATE_TEMP":true,"COLUMNS":3,"FRAGTIME":15,"PCRCYCLES":6,"DEFAULT_OFFSETS":true,"protocol_filename":"QIAseq_FX_24x_Normalizer_Workflow_B"}"""
    )
    return [_all_values[n] for n in names]


from opentrons import protocol_api
from opentrons import types

metadata = {
    "protocolName": "QIAseq FX 24x + Normalizer Workflow B v5",
    "author": "Opentrons <protocols@opentrons.com>",
    "source": "Protocol Library",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16",
}

# SCRIPT SETTINGS
DRYRUN = False  # True = Skip incubation times, shorten mix, No Temperatures, for testing purposes
USE_GRIPPER = True  # True = Uses Gripper, False = Manual Move
TIP_TRASH = True  # True = Used tips go in Trash, False = Used tips go back into rack
DEACTIVATE_TEMP = True  # True = Deactivates Temp Block and Thermocycler, False = Leaves Temp Block and Thermocycler on (if leaving finished plates on deck)
DEFAULT_OFFSETS = True  # True = Uses Default Module Gripper Offsets, False = Use user-defined adjusted Offsets

# PROTOCOL SETTINGS
COLUMNS = 3  # 1-3 Columns
FRAGTIME = 15  # Minutes, Duration of the Fragmentation Step
PCRCYCLES = 6  # Amount of PCR Cycles
RES_TYPE = "12x15ml"  # '12x15ml' or '96x2ml'
DEFAULT_OFFSETS = False  # True = Uses Default Module Gripper Offsets, False = Use user-defined adjusted Offsets
ETOH_1_AirMultiDis = False
RSB_1_AirMultiDis = False
ETOH_2_AirMultiDis = False
RSB_2_AirMultiDis = False
ETOH_3_AirMultiDis = False
RSB_3_AirMultiDis = False
NWASH_AirMultiDis = False
REUSE_TIPS = False

# PROTOCOL BLOCKS
STEP_FXENZ = 1  # Set to 0 to skip block of commands
STEP_FXDECK = 1  # Set to 0 if using off deck thermocycler
STEP_LIG = 1  # Set to 0 to skip block of commands
STEP_LIGDECK = 1  # Set to 0 if using off deck thermocycler
STEP_CLEANUP_1 = 1  # Set to 0 to skip block of commands
STEP_CLEANUP_2 = 1  # Set to 0 to skip block of commands
STEP_PCR = 1  # Set to 0 to skip block of commands
STEP_PCRDECK = 1  # Set to 0 if using off deck thermocycler
STEP_CLEANUP_3 = 1  # Set to 0 to skip block of commands
STEP_NORMALIZE = 1  # Set to 0 to skip block of commands

# Notes
# The PCR Primer is diluted to from 1.5ul to 5ul with RSB, and the Samples are eluted in 20ul RSB instead of 23.5 after Cleanup 2.  This because the Flex can handle volumes above 1.5ul more reliably
# The Input Samples contain 100ng of DNA in 35ul H20
# 5ul of FX Buffer is mixed with the DNA Input Samples
#
############################################################################################################################################
############################################################################################################################################
############################################################################################################################################

p200_tips = 0
p50_tips = 0
p200_tipracks_count = 0
p50_tipracks_count = 0
WasteVol = 0
Resetcount = 0

ABR_TEST = False
if ABR_TEST == True:
    COLUMNS = 3  # Overrides to 3 columns
    DRYRUN = True  # Overrides to only DRYRUN
    TIP_TRASH = False  # Overrides to only REUSING TIPS
    RUN = 3  # Repetitions
else:
    RUN = 1


def run(protocol: protocol_api.ProtocolContext):

    global DRYRUN
    global USE_GRIPPER
    global TIP_TRASH
    global DEACTIVATE_TEMP
    global COLUMNS
    global FRAGTIME
    global PCRCYCLES
    global DEFAULT_OFFSETS

    global p200_tips
    global p50_tips
    global p200_tipracks_count
    global p50_tipracks_count
    global WasteVol
    global Resetcount

    if ABR_TEST == True:
        protocol.comment("THIS IS A ABR RUN WITH " + str(RUN) + " REPEATS")
    protocol.comment("THIS IS A DRY RUN") if DRYRUN == True else protocol.comment("THIS IS A REACTION RUN")
    protocol.comment("USED TIPS WILL GO IN TRASH") if TIP_TRASH == True else protocol.comment("USED TIPS WILL BE RE-RACKED")

    # DECK SETUP AND LABWARE
    # ========== FIRST ROW ============
    heatershaker = protocol.load_module("heaterShakerModuleV1", "D1")
    hs_adapter = heatershaker.load_adapter("opentrons_96_deep_well_adapter")
    BeadPlate = hs_adapter.load_labware("nest_96_wellplate_2ml_deep", "Bead Plate")
    mag_block = protocol.load_module("magneticBlockV1", "D2")
    tiprack_50_1 = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "D3")
    # ========== SECOND ROW ===========
    temp_block = protocol.load_module("temperature module gen2", "C1")
    temp_adapter = temp_block.load_adapter("opentrons_96_well_aluminum_block")
    reagent_plate_1 = temp_adapter.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "Reagent Plate")
    if RES_TYPE == "12x15ml":
        reservoir = protocol.load_labware("nest_12_reservoir_15ml", "C2", "Reservoir")
    if RES_TYPE == "96x2ml":
        reservoir = protocol.load_labware("nest_96_wellplate_2ml_deep", "C2", "Reservoir")
    tiprack_50_2 = protocol.load_labware("opentrons_flex_96_tiprack_50ul", "C3")
    # ========== THIRD ROW ============
    thermocycler = protocol.load_module("thermocycler module gen2")
    sample_plate_1 = thermocycler.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "Sample Plate")
    tiprack_200_1 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "B2")
    tiprack_200_2 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "B3")
    # ========== FOURTH ROW ===========
    tiprack_200_3 = protocol.load_labware("opentrons_flex_96_tiprack_200ul", "A2")
    protocol.load_trash_bin("A3")

    ############################################################################################################################################
    ############################################################################################################################################
    ############################################################################################################################################

    # PROTOCOL SETUP - LABELING

    # ======== ESTIMATING LIQUIDS =======
    Sample_Volume = 40
    AMPure_Volume = COLUMNS * (80 + 50 + 50) * 1.1
    ETOH_Volume = COLUMNS * ((150 * 2) * 3) * 1.1
    RSB_Volume = COLUMNS * (50 + 20 + 25) * 1.1
    FXENZ_Volume = COLUMNS * (10) * 1.1
    LIG_Volume = COLUMNS * (45) * 1.1
    Primer_Volume = COLUMNS * (5) * 1.1
    PCR_Volume = COLUMNS * (25) * 1.1
    NormBead_Volume = COLUMNS * (25) * 1.1
    NormElute_Volume = COLUMNS * (25) * 1.1
    NormWash_Volume = COLUMNS * (25) * 1.1

    SampleColumn = ["A", "B", "C", "D", "E", "F", "G", "H"]

    # ======== DEFINING LIQUIDS =======
    AMPure = protocol.define_liquid(name="EtOH", description="AMPure Beads", display_color="#704848")  # 704848 = 'AMPure Brown'
    EtOH = protocol.define_liquid(name="EtOH", description="80% Ethanol", display_color="#9ACECB")  # 9ACECB = 'Ethanol Blue'
    RSB = protocol.define_liquid(name="RSB", description="Resuspension Buffer", display_color="#00FFF2")  # 00FFF2 = 'Base Light Blue'
    Liquid_trash_well = protocol.define_liquid(
        name="Liquid_trash_well", description="Liquid Trash", display_color="#9B9B9B"
    )  # 9B9B9B = 'Liquid Trash Grey'
    Sample = protocol.define_liquid(name="Sample", description="Sample", display_color="#52AAFF")  # 52AAFF = 'Sample Blue'
    FXENZ = protocol.define_liquid(name="FXENZ", description="FX Enzyme", display_color="#FF0000")  # FF0000 = 'Base Red'
    LIG = protocol.define_liquid(name="LIG", description="Ligation Mix", display_color="#FFA000")  # FFA000 = 'Base Orange'
    Primer = protocol.define_liquid(name="Primer", description="Primer", display_color="#FFFB00")  # FFFB00 = 'Base Yellow'
    PCR = protocol.define_liquid(name="PCR", description="PCR Mix", display_color="#0EFF00")  # 0EFF00 = 'Base Green'
    Barcodes = protocol.define_liquid(name="Barcodes", description="Barcodes", display_color="#7DFFC4")  # 7DFFC4 = 'Barcode Green'
    NormBead = protocol.define_liquid(name="NormBead", description="NormBead", display_color="#0082FF")  # 0082FF = 'Base  Blue'
    NormElute = protocol.define_liquid(name="NormElute", description="NormElute", display_color="#0004FF")  # 0004FF = 'Base Indigo'
    NormWash = protocol.define_liquid(name="NormWash", description="NormWash", display_color="#8400FF")  # 8400FF = 'Base Purple'
    Final_Sample = protocol.define_liquid(
        name="Final_Sample", description="Final Sample", display_color="#82A9CF"
    )  # 82A9CF = 'Placeholder Blue'
    Excess_Sample = protocol.define_liquid(
        name="Excess_Sample", description="Excess Sample", display_color="#82A9CF"
    )  # 82A9CF = 'Placeholder Blue'
    Placeholder_Sample = protocol.define_liquid(
        name="Placeholder_Sample", description="Placeholder Sample", display_color="#82A9CF"
    )  # 82A9CF = 'Placeholder Blue'
    Placeholder_NormWash = protocol.define_liquid(
        name="Placeholder_NormWash", description="Excess Sample", display_color="#82A9CF"
    )  # 82A9CF = 'Placeholder Blue'

    # ======== LOADING LIQUIDS =======
    if RES_TYPE == "12x15ml":
        reservoir.wells_by_name()["A1"].load_liquid(liquid=AMPure, volume=AMPure_Volume)
        reservoir.wells_by_name()["A3"].load_liquid(liquid=EtOH, volume=ETOH_Volume)
        reservoir.wells_by_name()["A4"].load_liquid(liquid=EtOH, volume=ETOH_Volume)
        reservoir.wells_by_name()["A5"].load_liquid(liquid=EtOH, volume=ETOH_Volume)
        reservoir.wells_by_name()["A7"].load_liquid(liquid=RSB, volume=RSB_Volume)
        reservoir.wells_by_name()["A8"].load_liquid(liquid=NormWash, volume=NormWash_Volume)
        reservoir.wells_by_name()["A9"].load_liquid(liquid=Liquid_trash_well, volume=0)
        reservoir.wells_by_name()["A10"].load_liquid(liquid=Liquid_trash_well, volume=0)
        reservoir.wells_by_name()["A11"].load_liquid(liquid=Liquid_trash_well, volume=0)
        reservoir.wells_by_name()["A12"].load_liquid(liquid=Liquid_trash_well, volume=0)
    if RES_TYPE == "96x2ml":
        for loop, X in enumerate(SampleRow):
            reservoir.wells_by_name()[X + "1"].load_liquid(liquid=AMPure, volume=AMPure_Volume)
            reservoir.wells_by_name()[X + "3"].load_liquid(liquid=EtOH, volume=ETOH_Volume)
            reservoir.wells_by_name()[X + "4"].load_liquid(liquid=EtOH, volume=ETOH_Volume)
            reservoir.wells_by_name()[X + "5"].load_liquid(liquid=EtOH, volume=ETOH_Volume)
            reservoir.wells_by_name()[X + "7"].load_liquid(liquid=RSB, volume=RSB_Volume)
            reservoir.wells_by_name()[X + "8"].load_liquid(liquid=NormWash, volume=NormWash_Volume)
            reservoir.wells_by_name()[X + "9"].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()[X + "10"].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()[X + "11"].load_liquid(liquid=Liquid_trash_well, volume=0)
            reservoir.wells_by_name()[X + "12"].load_liquid(liquid=Liquid_trash_well, volume=0)
    if COLUMNS >= 1:
        for loop, X in enumerate(SampleColumn):
            sample_plate_1.wells_by_name()[X + "1"].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X + "4"].load_liquid(liquid=Placeholder_Sample, volume=0)
            sample_plate_1.wells_by_name()[X + "7"].load_liquid(liquid=Placeholder_NormWash, volume=0)
            sample_plate_1.wells_by_name()[X + "10"].load_liquid(liquid=Final_Sample, volume=0)
            reagent_plate_1.wells_by_name()[X + "7"].load_liquid(liquid=Barcodes, volume=5)
            reagent_plate_1.wells_by_name()[X + "10"].load_liquid(liquid=Excess_Sample, volume=0)
    if COLUMNS >= 2:
        for loop, X in enumerate(SampleColumn):
            sample_plate_1.wells_by_name()[X + "2"].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X + "5"].load_liquid(liquid=Placeholder_Sample, volume=0)
            sample_plate_1.wells_by_name()[X + "8"].load_liquid(liquid=Placeholder_NormWash, volume=0)
            sample_plate_1.wells_by_name()[X + "11"].load_liquid(liquid=Final_Sample, volume=0)
            reagent_plate_1.wells_by_name()[X + "8"].load_liquid(liquid=Barcodes, volume=5)
            reagent_plate_1.wells_by_name()[X + "11"].load_liquid(liquid=Excess_Sample, volume=0)
    if COLUMNS >= 3:
        for loop, X in enumerate(SampleColumn):
            sample_plate_1.wells_by_name()[X + "3"].load_liquid(liquid=Sample, volume=Sample_Volume)
            sample_plate_1.wells_by_name()[X + "6"].load_liquid(liquid=Placeholder_Sample, volume=0)
            sample_plate_1.wells_by_name()[X + "9"].load_liquid(liquid=Placeholder_NormWash, volume=0)
            sample_plate_1.wells_by_name()[X + "12"].load_liquid(liquid=Final_Sample, volume=0)
            reagent_plate_1.wells_by_name()[X + "9"].load_liquid(liquid=Barcodes, volume=5)
            reagent_plate_1.wells_by_name()[X + "12"].load_liquid(liquid=Excess_Sample, volume=0)
    for loop, X in enumerate(SampleColumn):
        reagent_plate_1.wells_by_name()[X + "1"].load_liquid(liquid=FXENZ, volume=FXENZ_Volume)
        reagent_plate_1.wells_by_name()[X + "2"].load_liquid(liquid=LIG, volume=LIG_Volume)
        reagent_plate_1.wells_by_name()[X + "3"].load_liquid(liquid=Primer, volume=Primer_Volume)
        reagent_plate_1.wells_by_name()[X + "4"].load_liquid(liquid=PCR, volume=PCR_Volume)
        reagent_plate_1.wells_by_name()[X + "5"].load_liquid(liquid=NormBead, volume=NormBead_Volume)
        reagent_plate_1.wells_by_name()[X + "6"].load_liquid(liquid=NormElute, volume=NormElute_Volume)

    ############################################################################################################################################
    ############################################################################################################################################
    ############################################################################################################################################

    # PROTOCOL SETUP - SCRIPT DEFINITIONS

    # =========== RESERVOIR ===========
    AMPure = reservoir["A1"]
    EtOH_1 = reservoir["A3"]
    EtOH_2 = reservoir["A4"]
    EtOH_3 = reservoir["A5"]
    RSB = reservoir["A7"]
    NormWash = reservoir["A8"]
    Liquid_trash_well_4 = reservoir["A9"]
    Liquid_trash_well_3 = reservoir["A10"]
    Liquid_trash_well_2 = reservoir["A11"]
    Liquid_trash_well_1 = reservoir["A12"]

    # ========= REAGENT PLATE ==========
    FXENZ = reagent_plate_1.wells_by_name()["A1"]
    LIG = reagent_plate_1.wells_by_name()["A2"]
    Primer = reagent_plate_1.wells_by_name()["A3"]
    PCR = reagent_plate_1.wells_by_name()["A4"]
    NormBead = reagent_plate_1.wells_by_name()["A5"]
    NormElute = reagent_plate_1.wells_by_name()["A6"]
    Barcodes_1 = reagent_plate_1.wells_by_name()["A7"]
    Barcodes_2 = reagent_plate_1.wells_by_name()["A8"]
    Barcodes_3 = reagent_plate_1.wells_by_name()["A9"]

    # PIPETTE
    p1000 = protocol.load_instrument("flex_8channel_1000", "left", tip_racks=[tiprack_200_1, tiprack_200_2, tiprack_200_3])
    p50 = protocol.load_instrument("flex_8channel_50", "right", tip_racks=[tiprack_50_1, tiprack_50_2])
    if REUSE_TIPS == True:
        ETOH_AirMultiDis_Tip = tiprack_200_1.wells_by_name()["A1"]
        ETOH_RemoveSup_Tip_1 = tiprack_200_1.wells_by_name()["A2"]
        ETOH_RemoveSup_Tip_2 = tiprack_200_1.wells_by_name()["A3"]
        ETOH_RemoveSup_Tip_3 = tiprack_200_1.wells_by_name()["A4"]
        ETOH_RemoveSup_Tip = [ETOH_RemoveSup_Tip_1, ETOH_RemoveSup_Tip_2, ETOH_RemoveSup_Tip_3]
        NWASH_AirMultiDis_Tip = tiprack_200_1.wells_by_name()["A5"]
        NWASH_Tip_1 = tiprack_200_1.wells_by_name()["A6"]
        NWASH_Tip_2 = tiprack_200_1.wells_by_name()["A7"]
        NWASH_Tip_3 = tiprack_200_1.wells_by_name()["A8"]
        NWASH_Tip = [NWASH_Tip_1, NWASH_Tip_2, NWASH_Tip_3]
        p1000.starting_tip = tiprack_200_1.wells_by_name()["A9"]
        p200_tips += 8
        RSB_AirMultiDis_Tip = tiprack_50_1.wells_by_name()["A1"]
        NELUTE_Tip_1 = tiprack_200_1.wells_by_name()["A2"]
        NELUTE_Tip_2 = tiprack_200_1.wells_by_name()["A3"]
        NELUTE_Tip_3 = tiprack_200_1.wells_by_name()["A4"]
        NELUTE_Tip = [NELUTE_Tip_1, NELUTE_Tip_2, NELUTE_Tip_3]
        p50.starting_tip = tiprack_50_1.wells_by_name()["A5"]
        p50_tips += 4
    p1000_flow_rate_aspirate_default = 200
    p1000_flow_rate_dispense_default = 200
    p1000_flow_rate_blow_out_default = 400
    p50_flow_rate_aspirate_default = 50
    p50_flow_rate_dispense_default = 50
    p50_flow_rate_blow_out_default = 100
    p200_tipracks = 3
    p50_tipracks = 2

    # SAMPLE TRACKING
    if COLUMNS == 1:
        column_1_list = ["A1"]  # Sample_plate_1 - Initial Samples
        column_2_list = ["A4"]  # Sample_plate_1 - PCR
        column_6_list = ["A7"]  # Sample_plate_1 - Normwash
        column_9_list = ["A10"]  # sample_plate_1 - Final Samples
        column_A_list = ["A1"]  # BeadPlate - Cleanup #1
        column_B_list = ["A4"]  # BeadPlate - Cleanup #2
        column_C_list = ["A7"]  # BeadPlate - Cleanup #3
        column_8_list = ["A10"]  # BeadPlate - Normwash
        column_7_list = ["A10"]  # Reagent Plate - Pre-Normed Samples
        barcodes = ["A7"]  # Reagent Plate
    if COLUMNS == 2:
        column_1_list = ["A1", "A2"]  # Sample_plate_1 - Initial Samples
        column_2_list = ["A4", "A5"]  # Sample_plate_1 - PCR
        column_6_list = ["A7", "A8"]  # Sample_plate_1 - Normwash
        column_9_list = ["A10", "A11"]  # sample_plate_1 - Final Samples
        column_A_list = ["A1", "A2"]  # BeadPlate - Cleanup #1
        column_B_list = ["A4", "A5"]  # BeadPlate - Cleanup #2
        column_C_list = ["A7", "A8"]  # BeadPlate - Cleanup #3
        column_8_list = ["A10", "A11"]  # BeadPlate - Normwash
        column_7_list = ["A10", "A11"]  # Reagent Plate - Pre-Normed Samples
        barcodes = ["A7", "A8"]  # Reagent Plate
    if COLUMNS == 3:
        column_1_list = ["A1", "A2", "A3"]  # Sample_plate_1 - Initial Samples
        column_2_list = ["A4", "A5", "A6"]  # Sample_plate_1 - PCR
        column_6_list = ["A7", "A8", "A9"]  # Sample_plate_1 - Normwash
        column_9_list = ["A10", "A11", "A12"]  # sample_plate_1 - Final Samples
        column_A_list = ["A1", "A2", "A3"]  # BeadPlate - Cleanup #1
        column_B_list = ["A4", "A5", "A6"]  # BeadPlate - Cleanup #2
        column_C_list = ["A7", "A8", "A9"]  # BeadPlate - Cleanup #3
        column_8_list = ["A10", "A11", "A12"]  # BeadPlate - Normwash
        column_7_list = ["A10", "A11", "A12"]  # Reagent Plate - Pre-Normed Samples
        barcodes = ["A7", "A8", "A9"]  # Reagent Plate

    def tipcheck(tiptype):
        global p200_tips
        global p50_tips
        global p200_tipracks_count
        global p50_tipracks_count
        global Resetcount
        if tiptype == 200:
            if p200_tips == p200_tipracks * 12:
                if ABR_TEST == True:
                    p1000.reset_tipracks()
                else:
                    protocol.pause("RESET p200 TIPS")
                    p1000.reset_tipracks()
                Resetcount += 1
                p200_tipracks_count += 1
                p200_tips = 0
        if tiptype == 50:
            if p50_tips == p50_tipracks * 12:
                if ABR_TEST == True:
                    p50.reset_tipracks()
                else:
                    protocol.pause("RESET p50 TIPS")
                    p50.reset_tipracks()
                Resetcount += 1
                p50_tipracks_count += 1
                p50_tips = 0

    def DispWasteVol(Vol):
        global WasteVol
        WasteVol += int(Vol)
        if WasteVol < 1500:
            Liquid_trash = Liquid_trash_well_1
        if WasteVol >= 1500 and WasteVol < 3000:
            Liquid_trash = Liquid_trash_well_2
        if WasteVol >= 3000:
            Liquid_trash = Liquid_trash_well_3

    # CUSTOM OFFSETS
    if DEFAULT_OFFSETS == False:
        # HEATERSHAKER OFFSETS
        hs_drop_offset = {"x": 0, "y": -2, "z": 0}
        hs_pick_up_offset = {"x": 0, "y": -2, "z": 0}
        # MAG BLOCK OFFSETS
        mb_drop_offset = {"x": 0, "y": 0.0, "z": 0.5}
        mb_pick_up_offset = {"x": 0, "y": -2, "z": 0}
        # THERMOCYCLER OFFSETS
        tc_drop_offset = {"x": 0, "y": 0, "z": 0}
        tc_pick_up_offset = {"x": 0, "y": 0, "z": 0}
    else:
        # HEATERSHAKER OFFSETS
        hs_drop_offset = {"x": 0, "y": 0, "z": 0}
        hs_pick_up_offset = {"x": 0, "y": 0, "z": 0}
        # MAG BLOCK OFFSETS
        mb_drop_offset = {"x": 0, "y": 0.0, "z": 0}
        mb_pick_up_offset = {"x": 0, "y": 0, "z": 0}
        # THERMOCYCLER OFFSETS
        tc_drop_offset = {"x": 0, "y": 0, "z": 0}
        tc_pick_up_offset = {"x": 0, "y": 0, "z": 0}

    ############################################################################################################################################
    ############################################################################################################################################
    ############################################################################################################################################
    # commands
    for loop in range(RUN):
        thermocycler.open_lid()
        heatershaker.open_labware_latch()
        if DRYRUN == False:
            protocol.comment("SETTING THERMO and TEMP BLOCK Temperature")
            thermocycler.set_block_temperature(4)
            thermocycler.set_lid_temperature(100)
            temp_block.set_temperature(4)
        protocol.pause("Ready")
        heatershaker.close_labware_latch()

        Liquid_trash = Liquid_trash_well_1

        if STEP_FXENZ == 1:
            protocol.comment("==============================================")
            protocol.comment("--> FX")
            protocol.comment("==============================================")

            protocol.comment("--> Adding FX")
            FXENZBuffVol = 10
            FXENZVMixRep = 3 if DRYRUN == False else 1
            FXENZVMixVol = 20
            FXENZBuffPremix = 2 if DRYRUN == False else 1
            # ===============================================
            for loop, X in enumerate(column_1_list):
                tipcheck(50)
                p50.pick_up_tip()
                p50.mix(FXENZBuffPremix, FXENZBuffVol + 1, FXENZ.bottom(z=0.25), rate=0.25)
                p50.aspirate(FXENZBuffVol + 1, FXENZ.bottom(z=0.25), rate=0.25)
                p50.dispense(1, FXENZ.bottom(z=0.25), rate=0.25)
                p50.dispense(FXENZBuffVol, sample_plate_1.wells_by_name()[X].bottom(z=0.25), rate=0.25)
                p50.mix(FXENZVMixRep, FXENZVMixVol, rate=0.5)
                p50.move_to(sample_plate_1[X].top(z=-3))
                protocol.delay(seconds=3)
                p50.blow_out(sample_plate_1[X].top(z=-3))
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
            # ===============================================

        if STEP_FXDECK == 1:
            ############################################################################################################################################
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_FXENZ = [{"temperature": 32, "hold_time_minutes": FRAGTIME}, {"temperature": 65, "hold_time_minutes": 30}]
                thermocycler.execute_profile(steps=profile_FXENZ, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(4)
            ############################################################################################################################################
            thermocycler.open_lid()

        if STEP_LIG == 1:
            protocol.comment("==============================================")
            protocol.comment("--> Adapter Ligation")
            protocol.comment("==============================================")

            protocol.comment("--> Adding Barcodes")
            BarcodeVol = 5
            BarcodeMixRep = 3 if DRYRUN == False else 1
            BarcodeMixVol = 10
            # ===============================================
            for loop, X in enumerate(column_1_list):
                tipcheck(50)
                p50.pick_up_tip()
                p50.aspirate(BarcodeVol + 1, reagent_plate_1.wells_by_name()[barcodes[loop]].bottom(z=0.25), rate=0.25)
                p50.dispense(1, reagent_plate_1.wells_by_name()[barcodes[loop]].bottom(z=0.25), rate=0.25)
                p50.dispense(BarcodeVol, sample_plate_1.wells_by_name()[X].bottom(z=0.25), rate=0.25)
                p50.mix(BarcodeMixRep, BarcodeMixVol)
                p50.move_to(sample_plate_1[X].top(z=-3))
                protocol.delay(seconds=3)
                p50.blow_out(sample_plate_1[X].top(z=-3))
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
            # ===============================================

            protocol.comment("--> Adding Lig")
            LIGVol = 45
            LIGMixRep = 10
            LIGMixVol = 80
            LIGMixPremix = 2 if DRYRUN == False else 1
            # ===============================================
            for loop, X in enumerate(column_1_list):
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.mix(LIGMixPremix, LIGVol + 2, LIG.bottom(z=0.25), rate=0.2)
                p1000.aspirate(LIGVol + 2, LIG.bottom(z=0.25), rate=0.2)
                p1000.dispense(2, LIG.bottom(z=0.25), rate=0.2)
                p1000.default_speed = 5
                p1000.move_to(LIG.top(z=5))
                protocol.delay(seconds=1)
                p1000.default_speed = 400
                p1000.dispense(LIGVol, sample_plate_1[X].bottom(z=0.25), rate=0.25)
                p1000.move_to(sample_plate_1[X].bottom(z=0.3))
                p1000.mix(LIGMixRep, LIGMixVol, rate=0.5)
                p1000.default_speed = 5
                p1000.move_to(sample_plate_1[X].top(z=-3))
                protocol.delay(seconds=3)
                p1000.blow_out(sample_plate_1[X].top(z=-3))
                p1000.default_speed = 400
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
            # ===============================================

        if STEP_LIGDECK == 1:
            ############################################################################################################################################
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_LIG = [{"temperature": 20, "hold_time_minutes": 15}]
                thermocycler.execute_profile(steps=profile_LIG, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(10)
            ############################################################################################################################################
            thermocycler.open_lid()

        if STEP_CLEANUP_1 == 1:
            protocol.comment("==============================================")
            protocol.comment("--> Cleanup 1")
            protocol.comment("==============================================")

            protocol.comment("--> ADDING AMPure (0.8x)")
            AMPureVol = 80
            SampleVol = 100
            AMPureMixRPM = 1600
            AMPureMixTime = 5 * 60 if DRYRUN == False else 0.1 * 60
            AMPurePremix = 3 if DRYRUN == False else 1
            TransferSup = 100
            # ===============================================
            for loop, X in enumerate(column_1_list):
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.mix(AMPurePremix, AMPureVol + 3, AMPure.bottom(z=1), rate=0.25)
                p1000.aspirate(AMPureVol + 3, AMPure.bottom(z=1), rate=0.25)
                p1000.dispense(3, AMPure.bottom(z=1), rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(AMPure.top(z=-3))
                # =====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(AMPure.top().move(types.Point(x=4, z=-3)))
                p1000.move_to(AMPure.top().move(types.Point(x=-4, z=-3)))
                p1000.default_speed = 400
                # ================================
                p1000.dispense(AMPureVol, BeadPlate[column_A_list[loop]].bottom(z=0.25), rate=0.25)
                protocol.comment("--> Transferring Samples")
                # ================================
                p1000.move_to(sample_plate_1[X].bottom(z=0.3))
                p1000.aspirate(TransferSup / 2, rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.move_to(sample_plate_1[X].bottom(z=0.1))
                p1000.aspirate(TransferSup / 2, rate=0.25)
                p1000.dispense(TransferSup, BeadPlate[column_A_list[loop]].bottom(z=1))
                # ================================
                p1000.default_speed = 5
                p1000.move_to(BeadPlate[column_A_list[loop]].bottom(z=3))
                for Mix in range(2):
                    p1000.aspirate(70, rate=0.5)
                    p1000.move_to(BeadPlate[column_A_list[loop]].bottom(z=0.25))
                    p1000.aspirate(70, rate=0.5)
                    p1000.dispense(70, rate=0.5)
                    p1000.move_to(BeadPlate[column_A_list[loop]].bottom(z=3))
                    p1000.dispense(70, rate=0.5)
                    Mix += 1
                p1000.move_to(BeadPlate[column_A_list[loop]].top(z=-3))
                protocol.delay(seconds=1)
                p1000.blow_out(BeadPlate[column_A_list[loop]].top(z=-3))
                p1000.touch_tip(speed=100)
                p1000.default_speed = 400
                p1000.move_to(BeadPlate[column_A_list[loop]].top(z=5))
                p1000.move_to(BeadPlate[column_A_list[loop]].top(z=0))
                p1000.move_to(BeadPlate[column_A_list[loop]].top(z=5))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
            # ===============================================
            heatershaker.set_and_wait_for_shake_speed(rpm=AMPureMixRPM)
            protocol.delay(AMPureMixTime)
            heatershaker.deactivate_shaker()

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate)  HEATER SHAKER --> MAG BLOCK
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=mag_block,
                use_gripper=USE_GRIPPER,
                pick_up_offset=hs_pick_up_offset,
                drop_offset=mb_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=4)

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 200
            # ===============================================
            for loop, X in enumerate(column_A_list):
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.move_to(BeadPlate[X].bottom(z=3))
                p1000.aspirate(RemoveSup - 100, rate=0.25)
                protocol.delay(seconds=3)
                p1000.move_to(BeadPlate[X].bottom(z=0.5))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(BeadPlate[X].top(z=-2))
                p1000.default_speed = 200
                p1000.touch_tip(speed=100)
                p1000.dispense(200, Liquid_trash.top(z=-3), rate=0.5)
                protocol.delay(seconds=1)
                p1000.blow_out()
                # =====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(Liquid_trash.top().move(types.Point(x=4, z=-3)))
                p1000.move_to(Liquid_trash.top().move(types.Point(x=-4, z=-3)))
                p1000.default_speed = 400
                # ================================
                p1000.move_to(Liquid_trash.top(z=-5))
                p1000.move_to(Liquid_trash.top(z=0))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
            # ===============================================

            for X in range(2):
                protocol.comment("--> ETOH Wash")
                ETOHMaxVol = 150
                # ===============================================
                if ETOH_1_AirMultiDis == True:
                    if REUSE_TIPS == True:
                        p1000.pick_up_tip(ETOH_AirMultiDis_Tip)
                    else:
                        tipcheck(200)
                        p1000.pick_up_tip()
                    for loop, X in enumerate(column_A_list):
                        p1000.aspirate(ETOHMaxVol, EtOH_1.bottom(z=1), rate=0.5)
                        p1000.move_to(EtOH_1.top(z=0))
                        p1000.move_to(EtOH_1.top(z=-5))
                        # =====Reservoir Tip Touch========
                        p1000.default_speed = 100
                        p1000.move_to(EtOH_1.top().move(types.Point(x=4, z=-3)))
                        p1000.move_to(EtOH_1.top().move(types.Point(x=-4, z=-3)))
                        p1000.default_speed = 400
                        # ================================
                        p1000.move_to(BeadPlate[X].top(z=2))
                        p1000.dispense(ETOHMaxVol, rate=0.75)
                        protocol.delay(seconds=2)
                        p1000.blow_out(BeadPlate[X].top(z=0))
                        p1000.move_to(BeadPlate[X].top(z=5))
                        p1000.move_to(BeadPlate[X].top(z=0))
                        p1000.move_to(BeadPlate[X].top(z=5))
                    if REUSE_TIPS == True:
                        p1000.return_tip()
                    else:
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
                else:
                    for loop, X in enumerate(column_A_list):
                        if REUSE_TIPS == True:
                            p1000.pick_up_tip(ETOH_AirMultiDis_Tip)
                        else:
                            tipcheck(200)
                            p1000.pick_up_tip()
                        p1000.aspirate(ETOHMaxVol, EtOH_1.bottom(z=1), rate=0.5)
                        p1000.move_to(EtOH_1.top(z=0))
                        p1000.move_to(EtOH_1.top(z=-5))
                        # =====Reservoir Tip Touch========
                        p1000.default_speed = 100
                        p1000.move_to(EtOH_1.top().move(types.Point(x=4, z=-3)))
                        p1000.move_to(EtOH_1.top().move(types.Point(x=-4, z=-3)))
                        p1000.default_speed = 400
                        # ================================
                        p1000.dispense(ETOHMaxVol, BeadPlate[X].top(z=-3), rate=0.5)
                        protocol.delay(seconds=2)
                        p1000.blow_out()
                        p1000.move_to(BeadPlate[X].top(z=5))
                        p1000.move_to(BeadPlate[X].top(z=0))
                        p1000.move_to(BeadPlate[X].top(z=5))
                        if REUSE_TIPS == True:
                            p1000.return_tip()
                        else:
                            p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                            p200_tips += 1
                    # ===============================================

                if DRYRUN == False:
                    protocol.delay(minutes=0.5)

                protocol.comment("--> Remove ETOH Wash")
                RemoveSup = 200
                # ===============================================
                for loop, X in enumerate(column_A_list):
                    if REUSE_TIPS == True:
                        p1000.pick_up_tip(ETOH_RemoveSup_Tip[loop])
                    else:
                        tipcheck(200)
                        p1000.pick_up_tip()
                    p1000.move_to(BeadPlate[X].bottom(z=2))
                    p1000.aspirate(RemoveSup - 100, rate=0.25)
                    protocol.delay(seconds=3)
                    p1000.move_to(BeadPlate[X].bottom(z=0.25))
                    p1000.aspirate(100, rate=0.25)
                    p1000.default_speed = 5
                    p1000.move_to(BeadPlate[X].top(z=-2))
                    p1000.default_speed = 200
                    p1000.touch_tip(speed=100)
                    p1000.dispense(200, Liquid_trash.top(z=-3))
                    protocol.delay(seconds=2)
                    p1000.blow_out()
                    # =====Reservoir Tip Touch========
                    p1000.default_speed = 100
                    p1000.move_to(Liquid_trash.top().move(types.Point(x=4, z=-3)))
                    p1000.move_to(Liquid_trash.top().move(types.Point(x=-4, z=-3)))
                    p1000.default_speed = 400
                    # ================================
                    p1000.move_to(Liquid_trash.top(z=-5))
                    p1000.move_to(Liquid_trash.top(z=0))
                    if REUSE_TIPS == True:
                        p1000.return_tip()
                    else:
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
                # ===============================================

            if DRYRUN == False:
                protocol.delay(minutes=1)

            protocol.comment("--> Removing Residual Wash")
            # ===============================================
            for loop, X in enumerate(column_A_list):
                if REUSE_TIPS == True:
                    p1000.pick_up_tip(ETOH_RemoveSup_Tip[loop])
                else:
                    tipcheck(200)
                    p1000.pick_up_tip()
                p1000.move_to(BeadPlate[X].bottom(0.1))
                p1000.aspirate(200, rate=0.25)
                if REUSE_TIPS == True:
                    p1000.return_tip()
                else:
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
            # ===============================================

            if DRYRUN == False:
                protocol.delay(minutes=0.5)

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) FROM MAG BLOCK --> HEATERSHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=hs_adapter,
                use_gripper=USE_GRIPPER,
                pick_up_offset=mb_pick_up_offset,
                drop_offset=hs_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> Adding RSB")
            RSBVol = 50
            RSBMixRPM = 2000
            RSBMixTime = 5 * 60 if DRYRUN == False else 0.1 * 60
            # ===============================================
            if RSB_1_AirMultiDis == True:
                if REUSE_TIPS == True:
                    p50.pick_up_tip(RSB_AirMultiDis_Tip)
                else:
                    tipcheck(50)
                    p50.pick_up_tip()
                for loop, X in enumerate(column_A_list):
                    p50.aspirate(RSBVol, RSB.bottom(z=1), rate=0.25)
                    p50.move_to(BeadPlate.wells_by_name()[X].top(z=3))
                    p50.dispense(RSBVol, rate=0.75)
                    p50.blow_out(BeadPlate.wells_by_name()[X].top(z=3))
                if REUSE_TIPS == True:
                    p50.return_tip()
                else:
                    p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                    p50_tips += 1
            else:
                for loop, X in enumerate(column_A_list):
                    if REUSE_TIPS == True:
                        p50.pick_up_tip(RSB_AirMultiDis_Tip)
                    else:
                        tipcheck(50)
                        p50.pick_up_tip()
                    p50.aspirate(RSBVol, RSB.bottom(z=1), rate=0.25)
                    p50.move_to(BeadPlate.wells_by_name()[X].bottom(z=1))
                    p50.dispense(RSBVol, BeadPlate.wells_by_name()[X].bottom(z=1), rate=0.5)
                    p50.blow_out(BeadPlate.wells_by_name()[X].top(z=-3))
                    if REUSE_TIPS == True:
                        p50.return_tip()
                    else:
                        p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                        p50_tips += 1
            # ===============================================
            heatershaker.set_and_wait_for_shake_speed(rpm=RSBMixRPM)
            protocol.delay(RSBMixTime)
            heatershaker.deactivate_shaker()

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) FROM HEATERSHAKER --> MAG BLOCK
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=mag_block,
                use_gripper=USE_GRIPPER,
                pick_up_offset=hs_pick_up_offset,
                drop_offset=mb_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=3)

            protocol.comment("--> Transferring Supernatant")
            TransferSup = 50
            # ===============================================
            for loop, X in enumerate(column_A_list):
                tipcheck(50)
                p50.pick_up_tip()
                p50.move_to(BeadPlate[X].bottom(z=0.5))
                p50.aspirate(TransferSup / 2, rate=0.25)
                protocol.delay(seconds=1)
                p50.move_to(BeadPlate[X].bottom(z=0.2))
                p50.aspirate(TransferSup / 2, rate=0.25)
                p50.dispense(TransferSup, BeadPlate[column_B_list[loop]].bottom(z=1), rate=0.5)
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
            # ===============================================

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) FROM MAG BLOCK --> HEATERSHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=hs_adapter,
                use_gripper=USE_GRIPPER,
                pick_up_offset=mb_pick_up_offset,
                drop_offset=hs_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

        if STEP_CLEANUP_2 == 1:
            protocol.comment("==============================================")
            protocol.comment("--> Cleanup 2")
            protocol.comment("==============================================")

            Liquid_trash = Liquid_trash_well_2

            protocol.delay(seconds=3)

            protocol.comment("--> ADDING AMPure (0.8x)")
            AMPureVol = 50
            SampleVol = 50
            AMPureMixRPM = 1600
            AMPureMixTime = 5 * 60 if DRYRUN == False else 0.1 * 60
            AMPurePremix = 3 if DRYRUN == False else 1
            # ===============================================
            for loop, X in enumerate(column_B_list):
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.mix(AMPurePremix, AMPureVol + 3, AMPure.bottom(z=1), rate=0.25)
                p1000.aspirate(AMPureVol + 3, AMPure.bottom(z=1), rate=0.25)
                p1000.dispense(3, AMPure.bottom(z=1), rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(AMPure.top(z=-3))
                # =====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(AMPure.top().move(types.Point(x=4, z=-3)))
                p1000.move_to(AMPure.top().move(types.Point(x=-4, z=-3)))
                p1000.default_speed = 400
                # ================================
                p1000.dispense(AMPureVol, BeadPlate[X].bottom(z=0.25), rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(BeadPlate[X].bottom(z=3))
                for Mix in range(2):
                    p1000.aspirate(70, rate=0.5)
                    p1000.move_to(BeadPlate[X].bottom(z=0.25))
                    p1000.aspirate(20, rate=0.5)
                    p1000.dispense(20, rate=0.5)
                    p1000.move_to(BeadPlate[X].bottom(z=3))
                    p1000.dispense(70, rate=0.5)
                    Mix += 1
                p1000.move_to(BeadPlate[X].top(z=-3))
                protocol.delay(seconds=1)
                p1000.blow_out(BeadPlate[X].top(z=-3))
                p1000.touch_tip(speed=100)
                p1000.default_speed = 400
                p1000.move_to(BeadPlate[X].top(z=5))
                p1000.move_to(BeadPlate[X].top(z=0))
                p1000.move_to(BeadPlate[X].top(z=5))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
            # ===============================================
            heatershaker.set_and_wait_for_shake_speed(rpm=AMPureMixRPM)
            protocol.delay(AMPureMixTime)
            heatershaker.deactivate_shaker()

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate)  HEATER SHAKER --> MAG BLOCK
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=mag_block,
                use_gripper=USE_GRIPPER,
                pick_up_offset=hs_pick_up_offset,
                drop_offset=mb_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=4)

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 200
            # ===============================================
            for loop, X in enumerate(column_B_list):
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.move_to(BeadPlate[X].bottom(z=3))
                p1000.aspirate(RemoveSup - 100, rate=0.25)
                protocol.delay(seconds=3)
                p1000.move_to(BeadPlate[X].bottom(z=0.5))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(BeadPlate[X].top(z=-2))
                p1000.default_speed = 200
                p1000.touch_tip(speed=100)
                p1000.dispense(200, Liquid_trash.top(z=-3), rate=0.5)
                protocol.delay(seconds=1)
                p1000.blow_out()
                # =====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(Liquid_trash.top().move(types.Point(x=4, z=-3)))
                p1000.move_to(Liquid_trash.top().move(types.Point(x=-4, z=-3)))
                p1000.default_speed = 400
                # ================================
                p1000.move_to(Liquid_trash.top(z=-5))
                p1000.move_to(Liquid_trash.top(z=0))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
            # ===============================================

            for X in range(2):
                protocol.comment("--> ETOH Wash")
                ETOHMaxVol = 150
                # ===============================================
                if ETOH_2_AirMultiDis == True:
                    if REUSE_TIPS == True:
                        p1000.pick_up_tip(ETOH_AirMultiDis_Tip)
                    else:
                        tipcheck(200)
                        p1000.pick_up_tip()
                    for loop, X in enumerate(column_B_list):
                        p1000.aspirate(ETOHMaxVol, EtOH_2.bottom(z=1), rate=0.5)
                        p1000.move_to(EtOH_2.top(z=0))
                        p1000.move_to(EtOH_2.top(z=-5))
                        # =====Reservoir Tip Touch========
                        p1000.default_speed = 100
                        p1000.move_to(EtOH_2.top().move(types.Point(x=4, z=-3)))
                        p1000.move_to(EtOH_2.top().move(types.Point(x=-4, z=-3)))
                        p1000.default_speed = 400
                        # ================================
                        p1000.move_to(BeadPlate[X].top(z=2))
                        p1000.dispense(ETOHMaxVol, rate=0.75)
                        protocol.delay(seconds=2)
                        p1000.blow_out(BeadPlate[X].top(z=0))
                        p1000.move_to(BeadPlate[X].top(z=5))
                        p1000.move_to(BeadPlate[X].top(z=0))
                        p1000.move_to(BeadPlate[X].top(z=5))
                    if REUSE_TIPS == True:
                        p1000.return_tip()
                    else:
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
                else:
                    for loop, X in enumerate(column_B_list):
                        if REUSE_TIPS == True:
                            p1000.pick_up_tip(ETOH_AirMultiDis_Tip)
                        else:
                            tipcheck(200)
                            p1000.pick_up_tip()
                        p1000.aspirate(ETOHMaxVol, EtOH_2.bottom(z=1), rate=0.5)
                        p1000.move_to(EtOH_2.top(z=0))
                        p1000.move_to(EtOH_2.top(z=-5))
                        # =====Reservoir Tip Touch========
                        p1000.default_speed = 100
                        p1000.move_to(EtOH_2.top().move(types.Point(x=4, z=-3)))
                        p1000.move_to(EtOH_2.top().move(types.Point(x=-4, z=-3)))
                        p1000.default_speed = 400
                        # ================================
                        p1000.dispense(ETOHMaxVol, BeadPlate[X].top(z=-3), rate=0.5)
                        protocol.delay(seconds=2)
                        p1000.blow_out()
                        p1000.move_to(BeadPlate[X].top(z=5))
                        p1000.move_to(BeadPlate[X].top(z=0))
                        p1000.move_to(BeadPlate[X].top(z=5))
                        if REUSE_TIPS == True:
                            p1000.return_tip()
                        else:
                            p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                            p200_tips += 1
                    # ===============================================

                if DRYRUN == False:
                    protocol.delay(minutes=0.5)

                protocol.comment("--> Remove ETOH Wash")
                RemoveSup = 200
                # ===============================================
                for loop, X in enumerate(column_B_list):
                    if REUSE_TIPS == True:
                        p1000.pick_up_tip(ETOH_RemoveSup_Tip[loop])
                    else:
                        tipcheck(200)
                        p1000.pick_up_tip()
                    p1000.move_to(BeadPlate[X].bottom(z=2))
                    p1000.aspirate(RemoveSup - 100, rate=0.25)
                    protocol.delay(seconds=3)
                    p1000.move_to(BeadPlate[X].bottom(z=0.25))
                    p1000.aspirate(100, rate=0.25)
                    p1000.default_speed = 5
                    p1000.move_to(BeadPlate[X].top(z=-2))
                    p1000.default_speed = 200
                    p1000.touch_tip(speed=100)
                    p1000.dispense(200, Liquid_trash.top(z=-3))
                    protocol.delay(seconds=2)
                    p1000.blow_out()
                    # =====Reservoir Tip Touch========
                    p1000.default_speed = 100
                    p1000.move_to(Liquid_trash.top().move(types.Point(x=4, z=-3)))
                    p1000.move_to(Liquid_trash.top().move(types.Point(x=-4, z=-3)))
                    p1000.default_speed = 400
                    # ================================
                    p1000.move_to(Liquid_trash.top(z=-5))
                    p1000.move_to(Liquid_trash.top(z=0))
                    if REUSE_TIPS == True:
                        p1000.return_tip()
                    else:
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
                # ===============================================

            if DRYRUN == False:
                protocol.delay(minutes=1)

            protocol.comment("--> Removing Residual Wash")
            # ===============================================
            for loop, X in enumerate(column_B_list):
                if REUSE_TIPS == True:
                    p1000.pick_up_tip(ETOH_RemoveSup_Tip[loop])
                else:
                    tipcheck(200)
                    p1000.pick_up_tip()
                p1000.move_to(BeadPlate[X].bottom(0.1))
                p1000.aspirate(200, rate=0.25)
                if REUSE_TIPS == True:
                    p1000.return_tip()
                else:
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
            # ===============================================

            if DRYRUN == False:
                protocol.delay(minutes=0.5)

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) FROM MAG BLOCK --> HEATERSHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=hs_adapter,
                use_gripper=USE_GRIPPER,
                pick_up_offset=mb_pick_up_offset,
                drop_offset=hs_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> Adding RSB")
            RSBVol = 22
            RSBMixRPM = 2000
            RSBMixTime = 5 * 60 if DRYRUN == False else 0.1 * 60
            # ===============================================
            if RSB_2_AirMultiDis == True:
                if REUSE_TIPS == True:
                    p50.pick_up_tip(RSB_AirMultiDis_Tip)
                else:
                    tipcheck(50)
                    p50.pick_up_tip()
                for loop, X in enumerate(column_B_list):
                    p50.aspirate(RSBVol, RSB.bottom(z=1), rate=0.25)
                    p50.move_to(BeadPlate.wells_by_name()[X].top(z=3))
                    p50.dispense(RSBVol, rate=0.75)
                    p50.blow_out(BeadPlate.wells_by_name()[X].top(z=3))
                if REUSE_TIPS == True:
                    p50.return_tip()
                else:
                    p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                    p50_tips += 1
            else:
                for loop, X in enumerate(column_B_list):
                    if REUSE_TIPS == True:
                        p50.pick_up_tip(RSB_AirMultiDis_Tip)
                    else:
                        tipcheck(50)
                        p50.pick_up_tip()
                    p50.aspirate(RSBVol, RSB.bottom(z=1), rate=0.25)
                    p50.move_to(BeadPlate.wells_by_name()[X].bottom(z=1))
                    p50.dispense(RSBVol, BeadPlate.wells_by_name()[X].bottom(z=1), rate=0.5)
                    p50.blow_out(BeadPlate.wells_by_name()[X].top(z=-3))
                    if REUSE_TIPS == True:
                        p50.return_tip()
                    else:
                        p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                        p50_tips += 1
            # ===============================================
            heatershaker.set_and_wait_for_shake_speed(rpm=RSBMixRPM)
            protocol.delay(RSBMixTime)
            heatershaker.deactivate_shaker()

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) FROM HEATERSHAKER --> MAG BLOCK
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=mag_block,
                use_gripper=USE_GRIPPER,
                pick_up_offset=hs_pick_up_offset,
                drop_offset=mb_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=3)

        if STEP_PCR == 1:
            protocol.comment("==============================================")
            protocol.comment("--> Amplification")
            protocol.comment("==============================================")

            protocol.comment("--> Adding Primer")
            PrimerVol = 5
            PrimerMixRep = 2
            PrimerMixVol = 10
            TransferSup = 20
            # ===============================================
            for loop, X in enumerate(column_B_list):
                tipcheck(50)
                p50.pick_up_tip()
                p50.aspirate(PrimerVol, Primer.bottom(z=0.5), rate=0.25)
                p50.dispense(PrimerVol, sample_plate_1.wells_by_name()[column_2_list[loop]].bottom(z=1), rate=0.25)

                protocol.comment("--> Transferring Supernatant")
                p50.move_to(BeadPlate[X].bottom(z=0.5))
                p50.aspirate(TransferSup / 2, rate=0.25)
                protocol.delay(seconds=1)
                p50.move_to(BeadPlate[X].bottom(z=0.2))
                p50.aspirate(TransferSup / 2, rate=0.25)
                p50.dispense(TransferSup, sample_plate_1[column_2_list[loop]].bottom(z=1), rate=0.5)

                p50.mix(PrimerMixRep, PrimerMixVol, rate=0.5)
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
            # ===============================================

            protocol.comment("--> Adding PCR")
            PCRVol = 25
            PCRMixRep = 10
            PCRMixVol = 45
            # ===============================================
            for loop, X in enumerate(column_2_list):
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.mix(2, PCRVol, PCR.bottom(z=0.5), rate=0.25)
                p1000.aspirate(PCRVol, PCR.bottom(z=0.5), rate=0.25)
                p1000.dispense(PCRVol, sample_plate_1[X].bottom(z=1), rate=0.25)
                p1000.mix(PCRMixRep, PCRMixVol, rate=0.5)
                p1000.move_to(sample_plate_1[X].top(z=-3))
                protocol.delay(seconds=3)
                p1000.blow_out(sample_plate_1[X].top(z=-3))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
            # ===============================================

        if STEP_PCRDECK == 1:
            ############################################################################################################################################
            thermocycler.close_lid()
            if DRYRUN == False:
                profile_PCR_1 = [{"temperature": 98, "hold_time_seconds": 45}]
                thermocycler.execute_profile(steps=profile_PCR_1, repetitions=1, block_max_volume=50)
                profile_PCR_2 = [
                    {"temperature": 98, "hold_time_seconds": 15},
                    {"temperature": 60, "hold_time_seconds": 30},
                    {"temperature": 72, "hold_time_seconds": 30},
                ]
                thermocycler.execute_profile(steps=profile_PCR_2, repetitions=PCRCYCLES, block_max_volume=50)
                profile_PCR_3 = [{"temperature": 72, "hold_time_minutes": 1}]
                thermocycler.execute_profile(steps=profile_PCR_3, repetitions=1, block_max_volume=50)
                thermocycler.set_block_temperature(4)
            thermocycler.open_lid()
            ############################################################################################################################################

        if STEP_CLEANUP_3 == 1:
            protocol.comment("==============================================")
            protocol.comment("--> Cleanup 3")
            protocol.comment("==============================================")

            Liquid_trash = Liquid_trash_well_3

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) FROM MAG BLOCK --> HEATERSHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=hs_adapter,
                use_gripper=USE_GRIPPER,
                pick_up_offset=mb_pick_up_offset,
                drop_offset=hs_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> ADDING AMPure (0.8x)")
            AMPureVol = 50
            SampleVol = 50
            AMPureMixRPM = 1600
            AMPureMixTime = 5 * 60 if DRYRUN == False else 0.1 * 60
            AMPurePremix = 3 if DRYRUN == False else 1
            TransferSup = 50
            # ===============================================
            for loop, X in enumerate(column_C_list):
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.mix(AMPurePremix, AMPureVol + 3, AMPure.bottom(z=1), rate=0.25)
                p1000.aspirate(AMPureVol + 3, AMPure.bottom(z=1), rate=0.25)
                p1000.dispense(3, AMPure.bottom(z=1), rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(AMPure.top(z=-3))
                # =====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(AMPure.top().move(types.Point(x=4, z=-3)))
                p1000.move_to(AMPure.top().move(types.Point(x=-4, z=-3)))
                p1000.default_speed = 400
                # ================================
                p1000.dispense(AMPureVol, BeadPlate[X].bottom(z=0.25), rate=0.25)
                # =====Transferring Samples=======
                protocol.comment("--> Transferring Samples")
                p1000.move_to(sample_plate_1[column_2_list[loop]].bottom(z=0.25))
                p1000.aspirate(TransferSup / 2, rate=0.25)
                protocol.delay(seconds=0.2)
                p1000.move_to(sample_plate_1[column_2_list[loop]].bottom(z=0.1))
                p1000.aspirate(TransferSup / 2, rate=0.25)
                p1000.dispense(TransferSup, BeadPlate[X].bottom(z=1))
                # ================================
                p1000.default_speed = 5
                p1000.move_to(BeadPlate[X].bottom(z=3))
                for Mix in range(2):
                    p1000.aspirate(70, rate=0.5)
                    p1000.move_to(BeadPlate[X].bottom(z=0.25))
                    p1000.aspirate(20, rate=0.5)
                    p1000.dispense(20, rate=0.5)
                    p1000.move_to(BeadPlate[X].bottom(z=3))
                    p1000.dispense(70, rate=0.5)
                    Mix += 1
                p1000.move_to(BeadPlate[X].top(z=-3))
                protocol.delay(seconds=1)
                p1000.blow_out(BeadPlate[X].top(z=-3))
                p1000.touch_tip(speed=100)
                p1000.default_speed = 400
                p1000.move_to(BeadPlate[X].top(z=5))
                p1000.move_to(BeadPlate[X].top(z=0))
                p1000.move_to(BeadPlate[X].top(z=5))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
            # ===============================================
            heatershaker.set_and_wait_for_shake_speed(rpm=AMPureMixRPM)
            protocol.delay(AMPureMixTime)
            heatershaker.deactivate_shaker()

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) HEATER SHAKER --> MAG BLOCK
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=mag_block,
                use_gripper=USE_GRIPPER,
                pick_up_offset=hs_pick_up_offset,
                drop_offset=mb_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=4)

            protocol.comment("--> Removing Supernatant")
            RemoveSup = 200
            # ===============================================
            for loop, X in enumerate(column_C_list):
                tipcheck(200)
                p1000.pick_up_tip()
                p1000.move_to(BeadPlate[X].bottom(z=3))
                p1000.aspirate(RemoveSup - 100, rate=0.25)
                protocol.delay(seconds=3)
                p1000.move_to(BeadPlate[X].bottom(z=0.5))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(BeadPlate[X].top(z=-2))
                p1000.default_speed = 200
                p1000.touch_tip(speed=100)
                p1000.dispense(200, Liquid_trash.top(z=-3), rate=0.5)
                protocol.delay(seconds=1)
                p1000.blow_out()
                # =====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(Liquid_trash.top().move(types.Point(x=4, z=-3)))
                p1000.move_to(Liquid_trash.top().move(types.Point(x=-4, z=-3)))
                p1000.default_speed = 400
                # ================================
                p1000.move_to(Liquid_trash.top(z=-5))
                p1000.move_to(Liquid_trash.top(z=0))
                p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                p200_tips += 1
            # ===============================================

            for X in range(2):
                protocol.comment("--> ETOH Wash")
                ETOHMaxVol = 150
                # ===============================================
                if ETOH_3_AirMultiDis == True:
                    if REUSE_TIPS == True:
                        p1000.pick_up_tip(ETOH_AirMultiDis_Tip)
                    else:
                        tipcheck(200)
                        p1000.pick_up_tip()
                    for loop, X in enumerate(column_C_list):
                        p1000.aspirate(ETOHMaxVol, EtOH_3.bottom(z=1), rate=0.5)
                        p1000.move_to(EtOH_3.top(z=0))
                        p1000.move_to(EtOH_3.top(z=-5))
                        # =====Reservoir Tip Touch========
                        p1000.default_speed = 100
                        p1000.move_to(EtOH_3.top().move(types.Point(x=4, z=-3)))
                        p1000.move_to(EtOH_3.top().move(types.Point(x=-4, z=-3)))
                        p1000.default_speed = 400
                        # ================================
                        p1000.move_to(BeadPlate[X].top(z=2))
                        p1000.dispense(ETOHMaxVol, rate=0.75)
                        protocol.delay(seconds=2)
                        p1000.blow_out(BeadPlate[X].top(z=0))
                        p1000.move_to(BeadPlate[X].top(z=5))
                        p1000.move_to(BeadPlate[X].top(z=0))
                        p1000.move_to(BeadPlate[X].top(z=5))
                    if REUSE_TIPS == True:
                        p1000.return_tip()
                    else:
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
                else:
                    for loop, X in enumerate(column_C_list):
                        if REUSE_TIPS == True:
                            p1000.pick_up_tip(ETOH_AirMultiDis_Tip)
                        else:
                            tipcheck(200)
                            p1000.pick_up_tip()
                        p1000.aspirate(ETOHMaxVol, EtOH_3.bottom(z=1), rate=0.5)
                        p1000.move_to(EtOH_3.top(z=0))
                        p1000.move_to(EtOH_3.top(z=-5))
                        # =====Reservoir Tip Touch========
                        p1000.default_speed = 100
                        p1000.move_to(EtOH_3.top().move(types.Point(x=4, z=-3)))
                        p1000.move_to(EtOH_3.top().move(types.Point(x=-4, z=-3)))
                        p1000.default_speed = 400
                        # ================================
                        p1000.dispense(ETOHMaxVol, BeadPlate[X].top(z=-3), rate=0.5)
                        protocol.delay(seconds=2)
                        p1000.blow_out()
                        p1000.move_to(BeadPlate[X].top(z=5))
                        p1000.move_to(BeadPlate[X].top(z=0))
                        p1000.move_to(BeadPlate[X].top(z=5))
                        if REUSE_TIPS == True:
                            p1000.return_tip()
                        else:
                            p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                            p200_tips += 1
                    # ===============================================

                if DRYRUN == False:
                    protocol.delay(minutes=0.5)

                protocol.comment("--> Remove ETOH Wash")
                RemoveSup = 200
                # ===============================================
                for loop, X in enumerate(column_C_list):
                    if REUSE_TIPS == True:
                        p1000.pick_up_tip(ETOH_RemoveSup_Tip[loop])
                    else:
                        tipcheck(200)
                        p1000.pick_up_tip()
                    p1000.move_to(BeadPlate[X].bottom(z=2))
                    p1000.aspirate(RemoveSup - 100, rate=0.25)
                    protocol.delay(seconds=3)
                    p1000.move_to(BeadPlate[X].bottom(z=0.25))
                    p1000.aspirate(100, rate=0.25)
                    p1000.default_speed = 5
                    p1000.move_to(BeadPlate[X].top(z=-2))
                    p1000.default_speed = 200
                    p1000.touch_tip(speed=100)
                    p1000.dispense(200, Liquid_trash.top(z=-3))
                    protocol.delay(seconds=2)
                    p1000.blow_out()
                    # =====Reservoir Tip Touch========
                    p1000.default_speed = 100
                    p1000.move_to(Liquid_trash.top().move(types.Point(x=4, z=-3)))
                    p1000.move_to(Liquid_trash.top().move(types.Point(x=-4, z=-3)))
                    p1000.default_speed = 400
                    # ================================
                    p1000.move_to(Liquid_trash.top(z=-5))
                    p1000.move_to(Liquid_trash.top(z=0))
                    if REUSE_TIPS == True:
                        p1000.return_tip()
                    else:
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
                # ===============================================

            if DRYRUN == False:
                protocol.delay(minutes=1)

            protocol.comment("--> Removing Residual Wash")
            # ===============================================
            for loop, X in enumerate(column_C_list):
                if REUSE_TIPS == True:
                    p1000.pick_up_tip(ETOH_RemoveSup_Tip[loop])
                else:
                    tipcheck(200)
                    p1000.pick_up_tip()
                p1000.move_to(BeadPlate[X].bottom(0.1))
                p1000.aspirate(50, rate=0.25)
                if REUSE_TIPS == True:
                    p1000.return_tip()
                else:
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
            # ===============================================

            if DRYRUN == False:
                protocol.delay(minutes=0.5)

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) FROM MAG BLOCK --> HEATERSHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=hs_adapter,
                use_gripper=USE_GRIPPER,
                pick_up_offset=mb_pick_up_offset,
                drop_offset=hs_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> Adding RSB")
            RSBVol = 32
            RSBMixRPM = 2000
            RSBMixTime = 5 * 60 if DRYRUN == False else 0.1 * 60
            # ===============================================
            if RSB_3_AirMultiDis == True:
                if REUSE_TIPS == True:
                    p50.pick_up_tip(RSB_AirMultiDis_Tip)
                else:
                    tipcheck(50)
                    p50.pick_up_tip()
                for loop, X in enumerate(column_C_list):
                    p50.aspirate(RSBVol, RSB.bottom(z=1), rate=0.25)
                    p50.move_to(BeadPlate.wells_by_name()[X].top(z=3))
                    p50.dispense(RSBVol, rate=0.75)
                    p50.blow_out(BeadPlate.wells_by_name()[X].top(z=3))
                if REUSE_TIPS == True:
                    p50.return_tip()
                else:
                    p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                    p50_tips += 1
            else:
                for loop, X in enumerate(column_C_list):
                    if REUSE_TIPS == True:
                        p50.pick_up_tip(RSB_AirMultiDis_Tip)
                    else:
                        tipcheck(50)
                        p50.pick_up_tip()
                    p50.aspirate(RSBVol, RSB.bottom(z=1), rate=0.25)
                    p50.move_to(BeadPlate.wells_by_name()[X].bottom(z=1))
                    p50.dispense(RSBVol, BeadPlate.wells_by_name()[X].bottom(z=1), rate=0.5)
                    p50.blow_out(BeadPlate.wells_by_name()[X].top(z=-3))
                    if REUSE_TIPS == True:
                        p50.return_tip()
                    else:
                        p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                        p50_tips += 1
            # ===============================================
            heatershaker.set_and_wait_for_shake_speed(rpm=RSBMixRPM)
            protocol.delay(RSBMixTime)
            heatershaker.deactivate_shaker()

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) FROM HEATERSHAKER --> MAG BLOCK
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=mag_block,
                use_gripper=USE_GRIPPER,
                pick_up_offset=hs_pick_up_offset,
                drop_offset=mb_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            if DRYRUN == False:
                thermocycler.set_block_temperature(55)

            if DRYRUN == False:
                protocol.delay(minutes=3)

        if STEP_NORMALIZE == 1:
            protocol.comment("==============================================")
            protocol.comment("--> Normalization")
            protocol.comment("==============================================")

            protocol.comment("--> Dispensing NormWash")
            NormWashVol = 200
            # ===============================================
            if NWASH_AirMultiDis == True:
                if REUSE_TIPS == True:
                    p1000.pick_up_tip(NWASH_AirMultiDis_Tip)
                else:
                    tipcheck(200)
                    p1000.pick_up_tip()
                for loop, X in enumerate(column_6_list):
                    p1000.aspirate(NormWashVol, NormWash.bottom(z=1), rate=0.5)
                    p1000.dispense(NormWashVol / 2, sample_plate_1[X].bottom(z=1), rate=0.5)
                    p1000.dispense(NormWashVol / 2, sample_plate_1[X].top(z=0), rate=0.5)
                if REUSE_TIPS == True:
                    p1000.return_tip()
                else:
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
            else:
                for loop, X in enumerate(column_6_list):
                    if REUSE_TIPS == True:
                        p1000.pick_up_tip(NWASH_AirMultiDis_Tip)
                    else:
                        tipcheck(200)
                        p1000.pick_up_tip()
                    p1000.aspirate(NormWashVol, NormWash.bottom(z=1), rate=0.5)
                    p1000.dispense(NormWashVol / 2, sample_plate_1[X].bottom(z=1), rate=0.5)
                    p1000.dispense(NormWashVol / 2, sample_plate_1[X].top(z=0), rate=0.5)
                    if REUSE_TIPS == True:
                        p1000.return_tip()
                    else:
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
            # ===============================================

            protocol.comment("--> Dispensing NormBeads")
            NormBeadVol = 5
            NormBeadPremix = 10 if DRYRUN == False else 1
            # ===============================================
            tipcheck(50)
            p50.pick_up_tip()
            p50.mix(NormBeadPremix, (5 * COLUMNS) + 3, NormBead.bottom(z=1), rate=0.5)
            p50.aspirate((5 * COLUMNS) + 3, NormBead.bottom(z=1), rate=0.5)
            for loop, X in enumerate(column_8_list):
                p50.dispense(NormBeadVol, BeadPlate[X].bottom(z=1), rate=0.5)
            p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
            p50_tips += 1
            # ===============================================

            protocol.comment("--> Transferring Supernatant")
            TransferSup = 30
            # ===============================================
            for loop, X in enumerate(column_C_list):
                tipcheck(50)
                p50.pick_up_tip()
                p50.move_to(sample_plate_1[X].bottom(z=0.25))
                # Transferring 1/2 to Normalization Sample Wells
                p50.aspirate(TransferSup / 2, rate=0.25)
                p50.dispense(TransferSup / 2, BeadPlate[column_8_list[loop]].bottom(z=1), rate=0.5)
                p50.move_to(sample_plate_1[X].bottom(z=0.2))
                # Transferring 1/2 to Excess Sample Wells
                p50.aspirate(TransferSup / 2, rate=0.25)
                p50.dispense(TransferSup / 2, reagent_plate_1[column_7_list[loop]].bottom(z=1), rate=0.5)
                p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                p50_tips += 1
            # ===============================================

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) FROM MAG BLOCK --> HEATERSHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=hs_adapter,
                use_gripper=USE_GRIPPER,
                pick_up_offset=mb_pick_up_offset,
                drop_offset=hs_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> Adding NormWash 1")
            NormWashVol = 180
            # ===============================================
            if NWASH_AirMultiDis == True:
                if REUSE_TIPS == True:
                    p1000.pick_up_tip(NWASH_AirMultiDis_Tip)
                else:
                    tipcheck(200)
                    p1000.pick_up_tip()
                for loop, X in enumerate(column_6_list):
                    p1000.move_to(sample_plate_1[X].bottom(z=5))
                    p1000.aspirate(NormWashVol / 2, rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.move_to(sample_plate_1[X].bottom(z=0.25))
                    p1000.aspirate(NormWashVol / 2, rate=0.25)
                    p1000.dispense(NormWashVol, BeadPlate[column_8_list[loop]].bottom(z=1))
                if REUSE_TIPS == True:
                    p1000.return_tip()
                else:
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
            else:
                for loop, X in enumerate(column_6_list):
                    if REUSE_TIPS == True:
                        p1000.pick_up_tip(NWASH_AirMultiDis_Tip)
                    else:
                        tipcheck(200)
                        p1000.pick_up_tip()
                    p1000.move_to(sample_plate_1[X].bottom(z=5))
                    p1000.aspirate(NormWashVol / 2, rate=0.25)
                    protocol.delay(seconds=0.2)
                    p1000.move_to(sample_plate_1[X].bottom(z=0.25))
                    p1000.aspirate(NormWashVol / 2, rate=0.25)
                    p1000.dispense(NormWashVol, BeadPlate[column_8_list[loop]].bottom(z=1))
                    if REUSE_TIPS == True:
                        p1000.return_tip()
                    else:
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
            # ===============================================

            protocol.comment("--> Dispensing NormWash")
            NormWashVol = 200
            # ===============================================
            if NWASH_AirMultiDis == True:
                if REUSE_TIPS == True:
                    p1000.pick_up_tip(NWASH_AirMultiDis_Tip)
                else:
                    tipcheck(200)
                    p1000.pick_up_tip()
                for loop, X in enumerate(column_6_list):
                    p1000.aspirate(NormWashVol, NormWash.bottom(z=1), rate=0.5)
                    p1000.dispense(NormWashVol / 2, BeadPlate[X].bottom(z=1), rate=0.5)
                    p1000.dispense(NormWashVol / 2, BeadPlate[X].top(z=0), rate=0.5)
                if REUSE_TIPS == True:
                    p1000.return_tip()
                else:
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
            else:
                for loop, X in enumerate(column_6_list):
                    if REUSE_TIPS == True:
                        p1000.pick_up_tip(NWASH_AirMultiDis_Tip)
                    else:
                        tipcheck(200)
                        p1000.pick_up_tip()
                    p1000.aspirate(NormWashVol, NormWash.bottom(z=1), rate=0.5)
                    p1000.dispense(NormWashVol / 2, BeadPlate[X].bottom(z=1), rate=0.5)
                    p1000.dispense(NormWashVol / 2, BeadPlate[X].top(z=0), rate=0.5)
                    if REUSE_TIPS == True:
                        p1000.return_tip()
                    else:
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
            # ===============================================

            if DRYRUN == False:
                protocol.delay(minutes=3)

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) HEATER SHAKER --> MAG BLOCK
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=mag_block,
                use_gripper=USE_GRIPPER,
                pick_up_offset=hs_pick_up_offset,
                drop_offset=mb_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> Remove Bead Wash")
            RemoveSup = 200
            # ===============================================
            for loop, X in enumerate(column_8_list):
                if REUSE_TIPS == True:
                    p1000.pick_up_tip(NWASH_Tip[loop])
                else:
                    tipcheck(200)
                    p1000.pick_up_tip()
                p1000.move_to(BeadPlate[X].bottom(z=3))
                p1000.aspirate(RemoveSup - 100, rate=0.25)
                protocol.delay(minutes=0.1)
                p1000.move_to(BeadPlate[X].bottom(z=0.25))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(BeadPlate[X].top(z=-2))
                p1000.default_speed = 200
                p1000.touch_tip(speed=100)
                p1000.dispense(200, Liquid_trash.top(z=-3), rate=0.75)
                protocol.delay(minutes=0.1)
                p1000.blow_out()
                # =====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(Liquid_trash.top().move(types.Point(x=4, z=-3)))
                p1000.move_to(Liquid_trash.top().move(types.Point(x=-4, z=-3)))
                p1000.default_speed = 400
                # ================================
                p1000.move_to(Liquid_trash.top(z=-5))
                p1000.move_to(Liquid_trash.top(z=0))
                if REUSE_TIPS == True:
                    p1000.return_tip()
                else:
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
            # ===============================================

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) FROM MAG BLOCK --> HEATERSHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=hs_adapter,
                use_gripper=USE_GRIPPER,
                pick_up_offset=mb_pick_up_offset,
                drop_offset=hs_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> Adding NormWash 2")
            NormWashVol = 200
            # ===============================================
            if NWASH_AirMultiDis == True:
                if REUSE_TIPS == True:
                    p1000.pick_up_tip(NWASH_AirMultiDis_Tip)
                else:
                    tipcheck(200)
                    p1000.pick_up_tip()
                for loop, X in enumerate(column_6_list):
                    p1000.aspirate(NormWashVol, NormWash.bottom(z=1), rate=0.5)
                    p1000.dispense(NormWashVol / 2, BeadPlate[X].bottom(z=1), rate=0.5)
                    p1000.dispense(NormWashVol / 2, BeadPlate[X].top(z=0), rate=0.5)
                if REUSE_TIPS == True:
                    p1000.return_tip()
                else:
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
            else:
                for loop, X in enumerate(column_6_list):
                    if REUSE_TIPS == True:
                        p1000.pick_up_tip(NWASH_AirMultiDis_Tip)
                    else:
                        tipcheck(200)
                        p1000.pick_up_tip()
                    p1000.aspirate(NormWashVol, NormWash.bottom(z=1), rate=0.5)
                    p1000.dispense(NormWashVol / 2, BeadPlate[X].bottom(z=1), rate=0.5)
                    p1000.dispense(NormWashVol / 2, BeadPlate[X].top(z=0), rate=0.5)
                    if REUSE_TIPS == True:
                        p1000.return_tip()
                    else:
                        p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                        p200_tips += 1
            # ===============================================

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) HEATER SHAKER --> MAG BLOCK
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=mag_block,
                use_gripper=USE_GRIPPER,
                pick_up_offset=hs_pick_up_offset,
                drop_offset=mb_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> Remove Bead Wash")
            RemoveSup = 200
            # ===============================================
            for loop, X in enumerate(column_8_list):
                if REUSE_TIPS == True:
                    p1000.pick_up_tip(NWASH_Tip[loop])
                else:
                    tipcheck(200)
                    p1000.pick_up_tip()
                p1000.move_to(BeadPlate[X].bottom(z=3))
                p1000.aspirate(RemoveSup - 100, rate=0.25)
                protocol.delay(minutes=0.1)
                p1000.move_to(BeadPlate[X].bottom(z=0.25))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(BeadPlate[X].top(z=-2))
                p1000.default_speed = 200
                p1000.touch_tip(speed=100)
                p1000.dispense(200, Liquid_trash.top(z=-3), rate=0.75)
                protocol.delay(minutes=0.1)
                p1000.blow_out()
                # =====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(Liquid_trash.top().move(types.Point(x=4, z=-3)))
                p1000.move_to(Liquid_trash.top().move(types.Point(x=-4, z=-3)))
                p1000.default_speed = 400
                # ================================
                p1000.move_to(Liquid_trash.top(z=-5))
                p1000.move_to(Liquid_trash.top(z=0))
                if REUSE_TIPS == True:
                    p1000.return_tip()
                else:
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
            # ===============================================

            protocol.comment("--> Remove Residual Bead Wash")
            RemoveSup = 200
            # ===============================================
            for loop, X in enumerate(column_8_list):
                if REUSE_TIPS == True:
                    p1000.pick_up_tip(NWASH_Tip[loop])
                else:
                    tipcheck(200)
                    p1000.pick_up_tip()
                p1000.move_to(BeadPlate[X].bottom(z=1))
                p1000.aspirate(RemoveSup - 100, rate=0.25)
                protocol.delay(minutes=0.1)
                p1000.move_to(BeadPlate[X].bottom(z=0.25))
                p1000.aspirate(100, rate=0.25)
                p1000.default_speed = 5
                p1000.move_to(BeadPlate[X].top(z=-2))
                p1000.default_speed = 200
                p1000.touch_tip(speed=100)
                p1000.dispense(200, Liquid_trash.top(z=-3), rate=0.75)
                protocol.delay(minutes=0.1)
                p1000.blow_out()
                # =====Reservoir Tip Touch========
                p1000.default_speed = 100
                p1000.move_to(Liquid_trash.top().move(types.Point(x=4, z=-3)))
                p1000.move_to(Liquid_trash.top().move(types.Point(x=-4, z=-3)))
                p1000.default_speed = 400
                # ================================
                p1000.move_to(Liquid_trash.top(z=-5))
                p1000.move_to(Liquid_trash.top(z=0))
                if REUSE_TIPS == True:
                    p1000.return_tip()
                else:
                    p1000.return_tip() if TIP_TRASH == False else p1000.drop_tip()
                    p200_tips += 1
            # ===============================================

            if DRYRUN == False:
                protocol.delay(minutes=0.5)

            # ============================================================================================
            # GRIPPER MOVE BeadPlate FROM MAG BLOCK TO HEATER SHAKER
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=hs_adapter,
                use_gripper=USE_GRIPPER,
                pick_up_offset=mb_pick_up_offset,
                drop_offset=hs_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            protocol.comment("--> Adding NormElute")
            NormEluteVol = 25
            NormEluteMixRPM = 2000
            NormEluteMixTime = 2 * 60 if DRYRUN == False else 0.1 * 60
            # ===============================================
            for loop, X in enumerate(column_8_list):
                if REUSE_TIPS == True:
                    p50.pick_up_tip(NELUTE_Tip[loop])
                else:
                    tipcheck(50)
                    p50.pick_up_tip()
                p50.aspirate(NormEluteVol, NormElute.bottom(z=1), rate=0.25)
                p50.move_to(BeadPlate.wells_by_name()[X].bottom(z=1))
                p50.dispense(NormEluteVol, rate=0.5)
                p50.blow_out(BeadPlate.wells_by_name()[X].top())
                if REUSE_TIPS == True:
                    p50.return_tip()
                else:
                    p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                    p50_tips += 1
            # ===============================================
            heatershaker.set_and_wait_for_shake_speed(rpm=NormEluteMixRPM)
            protocol.delay(NormEluteMixTime)
            heatershaker.deactivate_shaker()

            # ============================================================================================
            # GRIPPER MOVE (BeadPlate) FROM HEATERSHAKER --> MAG BLOCK
            heatershaker.open_labware_latch()
            protocol.move_labware(
                labware=BeadPlate,
                new_location=mag_block,
                use_gripper=USE_GRIPPER,
                pick_up_offset=hs_pick_up_offset,
                drop_offset=mb_drop_offset,
            )
            heatershaker.close_labware_latch()
            # ============================================================================================

            if DRYRUN == False:
                protocol.delay(minutes=3)

            protocol.comment("--> Transferring Supernatant")
            TransferSup = 22
            # ===============================================
            for loop, X in enumerate(column_8_list):
                if REUSE_TIPS == True:
                    p50.pick_up_tip(NELUTE_Tip[loop])
                else:
                    tipcheck(50)
                    p50.pick_up_tip()
                p50.move_to(BeadPlate[X].bottom(z=0.2))
                p50.aspirate(TransferSup, rate=0.25)
                p50.dispense(TransferSup, sample_plate_1[column_9_list[loop]].bottom(z=1))
                if REUSE_TIPS == True:
                    p50.return_tip()
                else:
                    p50.return_tip() if TIP_TRASH == False else p50.drop_tip()
                    p50_tips += 1
            # ===============================================

        if ABR_TEST == True:
            protocol.comment("==============================================")
            protocol.comment("--> Resetting Run")
            protocol.comment("==============================================")

        heatershaker.open_labware_latch()
        if DEACTIVATE_TEMP == True:
            thermocycler.deactivate_block()
            thermocycler.deactivate_lid()
            temp_block.deactivate()
        protocol.comment("Number of Resets: " + str(Resetcount))
        protocol.comment("Number of p200 Tips Used: " + str(p200_tips + (12 * p200_tipracks * p200_tipracks_count)))
        protocol.comment("Number of p50 Tips Used: " + str(p50_tips + (12 * p50_tipracks * p50_tipracks_count)))
