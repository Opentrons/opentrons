from opentrons import protocol_api
from opentrons import types
import math
import numpy as np

metadata = {"protocolName": "KAPA HyperPlus Library Preparation", "author": "Your Name <your.email@example.com>"}

requirements = {"robotType": "Flex", "apiLevel": "2.18"}

tt_50 = 0
tt_200 = 0
p50_rack_count = 0
p200_rack_count = 0
tip50 = 50
tip200 = 200
p50_racks_ondeck = []
p200_racks_ondeck = []
p50_racks_offdeck = []
p200_racks_offdeck = []


def add_parameters(parameters):

    parameters.add_bool(
        variable_name="dry_run", display_name="Dry Run", description="Skip incubation delays and shorten mix steps.", default=False
    )

    parameters.add_bool(variable_name="trash_tips", display_name="Trash tip", description="tip thrases after every use", default=True)

    parameters.add_bool(
        variable_name="heater_shaker",
        display_name="Heater Shaker",
        description="Note: only use if heatershaker is not on deck",
        default=False,
    )

    parameters.add_int(
        variable_name="num_samples",
        display_name="number of samples",
        description="How many samples to be perform for library prep",
        default=8,
        minimum=8,
        maximum=48,
    )

    parameters.add_int(
        variable_name="PCRCYCLES",
        display_name="number of PCR Cycles",
        description="How many pcr cycles to be perform for library prep",
        default=2,
        minimum=2,
        maximum=16,
    )

    parameters.add_int(
        variable_name="Fragmentation_time",
        display_name="time on thermocycler",
        description="Fragmentation time in thermocycler",
        default=10,
        minimum=10,
        maximum=30,
    )


def run(ctx):
    # Flexible Parameters for Customers to Change from Protocol Library Page

    USE_GRIPPER = True
    trash_tips = ctx.params.trash_tips
    heater_shaker = ctx.params.heater_shaker  # Is there a heater-shaker present?
    dry_run = ctx.params.dry_run
    REUSE_ETOH_TIPS = False
    REUSE_RSB_TIPS = False  # Reuse tips for RSB buffer (adding RSB, mixing, and transferring)
    REUSE_REMOVE_TIPS = False  # Reuse tips for supernatant removal
    num_samples = ctx.params.num_samples
    PCRCYCLES = ctx.params.PCRCYCLES
    Fragmentation_time = 10
    ligation_tc_time = 15
    Fragmentation_Mix_time = 60
    End_Repair_Mix_time = 60
    Ligation_Mix_time = 60
    amplification_Mix_time = 60
    ################################################################################
    #                   Beginning Protocol- Setting Variables                      #
    ################################################################################
    if dry_run:
        trash_tips = False

    num_cols = math.ceil(num_samples / 8)

    # Pre-set parameters
    sample_vol = 35
    frag_vol = 15
    end_repair_vol = 10
    adapter_vol = 5
    ligation_vol = 45
    amplification_vol = 30
    bead_vol_1 = 88
    bead_vol_2 = 50
    bead_vol = bead_vol_1 + bead_vol_2
    bead_inc = 2
    rsb_vol_1 = 25
    rsb_vol_2 = 20
    rsb_vol = rsb_vol_1 + rsb_vol_2
    elution_vol = 20
    elution_vol_2 = 17
    etoh_vol = 400

    # Importing Labware, Modules and Instruments
    magblock = ctx.load_module("magneticBlockV1", "D2")
    temp_mod = ctx.load_module("temperature module gen2", "C1")
    temp_adapter = temp_mod.load_adapter("opentrons_96_well_aluminum_block")
    temp_plate = temp_adapter.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "Temp Module Reservoir Plate")

    if not dry_run:
        temp_mod.set_temperature(4)
    tc_mod = ctx.load_module("thermocycler module gen2")
    # Just in case
    tc_mod.open_lid()

    FLP_plate = magblock.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "FLP Plate")
    samples_flp = FLP_plate.rows()[0][:num_cols]

    if heater_shaker:
        h_s = ctx.load_module("heaterShakerModuleV1", "D1")
        h_s_adapter = h_s.load_adapter("opentrons_96_pcr_adapter")
        sample_plate = h_s_adapter.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "Sample Plate")
        # Just in Case
        h_s.close_labware_latch()

    else:
        sample_plate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "D1", "Sample Pate")

    sample_plate_2 = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "B2", "Sample Pate")
    samples_2 = sample_plate_2.rows()[0][:num_cols]
    liq_samples = sample_plate.rows()[:num_cols]
    samples = sample_plate.rows()[0][:num_cols]
    reservoir = ctx.load_labware("nest_96_wellplate_2ml_deep", "C2")

    trash = ctx.load_waste_chute()

    # Import Global Variables

    global tip50
    global tip200
    global p50_rack_count
    global p200_rack_count
    global tt_50
    global tt_200

    p200 = ctx.load_instrument("flex_8channel_1000", "left")
    p50 = ctx.load_instrument("flex_8channel_50", "right")

    p50_racks = []
    p200_racks = []

    Available_on_deck_slots = ["A2", "A3", "B3", "C3"]
    Available_off_deck_slots = ["A4", "B4", "C4"]
    p50_racks_to_dump = []
    p200_racks_to_dump = []

    if REUSE_RSB_TIPS:
        Available_on_deck_slots.remove("A3")
        tip50_reuse = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "A3")
        RSB_tip = []
        p50_rack_count += 1
        tt_50 += 12
        p50.tip_racks.append(tip50_reuse)
        ctx.comment(f"Adding 50 ul tip rack #{p50_rack_count}")
        for x in range(num_cols):
            RSB_tip.append(tip50_reuse.wells()[8 * x])
            tt_50 -= 1
        p50.starting_tip = tip50_reuse.wells()[(len(RSB_tip)) * 8]

    if REUSE_REMOVE_TIPS:
        Available_on_deck_slots.remove("A2")
        tip200_reuse = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "A2")
        RemoveSup_tip = []
        p200_rack_count += 1
        tt_200 += 12
        p200.tip_racks.append(tip200_reuse)
        ctx.comment(f"Adding 200 ul tip rack #{p200_rack_count}")
        for x in range(num_cols):
            RemoveSup_tip.append(tip200_reuse.wells()[8 * x])
            tt_200 -= 1
        p200.starting_tip = tip200_reuse.wells()[(len(RemoveSup_tip)) * 8]

    ################################################################################
    #                   Load Reagent Locations in Reservoirs                       #
    ################################################################################
    """
    colors = ['#008000','#008000','#A52A2A','#00FFFF','#0000FF','#800080',\
    '#ADD8E6','#FF0000','#FFFF00','#FF00FF','#00008B','#7FFFD4',\
    '#FFC0CB','#FFA500','#00FF00','#C0C0C0']
    """
    ##############Sample Plate##############
    sample_liq = ctx.define_liquid(name="Samples", description="DNA sample of known quantity", display_color="#C0C0C0")
    for well in sample_plate.wells()[: 8 * num_cols]:
        well.load_liquid(liquid=sample_liq, volume=sample_vol)

    Final_liq = ctx.define_liquid(name="Final Library", description="Final Library", display_color="#FFA500")
    for well in sample_plate_2.wells()[: 8 * num_cols]:
        well.load_liquid(liquid=Final_liq, volume=elution_vol_2)

    # Cold Res

    adapters = temp_plate.rows()[0][:num_cols]  # used for filling liquids
    adapters_ = adapters[0]  # used for pipetting into/ out of
    adapter_liq = ctx.define_liquid(name="Adapters", description="Adapters to ligate onto DNA insert.", display_color="#A52A2A")
    for well in temp_plate.wells()[: 8 * num_cols]:
        well.load_liquid(liquid=adapter_liq, volume=adapter_vol * 2)

    end_repair = temp_plate.columns()[num_cols]  # used for filling liquids
    er_res = end_repair[0]
    er_liq = ctx.define_liquid(name="End Repair", description="End Repair mix", display_color="#FF00FF")
    for well in end_repair:
        well.load_liquid(liquid=er_liq, volume=(end_repair_vol * num_cols) + (0.1 * end_repair_vol))

    frag = temp_plate.columns()[num_cols + 1]
    frag_res = frag[0]
    frag_liq = ctx.define_liquid(name="Fragmentation", description="Fragmentation mix", display_color="#00FFFF")
    for well in frag:
        well.load_liquid(liquid=frag_liq, volume=(frag_vol * num_cols) + (0.1 * frag_vol))

    ligation = temp_plate.columns()[num_cols + 2]
    ligation_res = ligation[0]
    ligation_liq = ctx.define_liquid(name="Ligation", description="Ligation Mix", display_color="#008000")
    for well in ligation:
        well.load_liquid(liquid=ligation_liq, volume=(ligation_vol * num_cols) + (0.1 * ligation_vol))

    lib_amplification = temp_plate.columns()[num_cols + 3]
    amplification_res = lib_amplification[0]
    amp_liq = ctx.define_liquid(name="Amplification", description="Amplification Mix", display_color="#0000FF")
    for well in lib_amplification:
        well.load_liquid(liquid=amp_liq, volume=(amplification_vol * num_cols) + (0.1 * amplification_vol))

    # Room Temp Res (deepwell)
    bead = reservoir.columns()[0]
    bead_res = bead[0]
    bead_liq = ctx.define_liquid(name="Ampure Beads", description="Ampure Beads", display_color="#800080")
    for well in bead:
        well.load_liquid(liquid=bead_liq, volume=(bead_vol * num_cols) + (0.1 * bead_vol * num_cols))

    rsb = reservoir.columns()[3]
    rsb_res = rsb[0]
    rsb_liq = ctx.define_liquid(name="RSB", description="Resuspension buffer", display_color="#FFFF00")
    for well in rsb:
        well.load_liquid(liquid=rsb_liq, volume=(rsb_vol * num_cols) + (0.1 * rsb_vol * num_cols))

    etoh1 = reservoir.columns()[4]
    etoh1_res = etoh1[0]
    etoh_liq = ctx.define_liquid(name="Ethanol 80%", description="Fresh 80% Ethanol", display_color="#FF00FF")
    for well in etoh1:
        well.load_liquid(liquid=etoh_liq, volume=(etoh_vol * num_cols) + (0.1 * etoh_vol * num_cols))

    etoh2 = reservoir.columns()[5]
    etoh2_res = etoh2[0]
    for well in etoh2:
        well.load_liquid(liquid=etoh_liq, volume=(etoh_vol * num_cols) + (0.1 * etoh_vol * num_cols))

    waste1 = reservoir.columns()[6]
    waste1_res = waste1[0]

    waste2 = reservoir.columns()[7]
    waste2_res = waste2[0]

    ################################################################################
    #                   Starting to Create Function Definitions                    #
    ################################################################################
    def tiptrack(rack, reuse_col, reuse=False):
        global tt_50
        global tt_200
        global p50_racks_ondeck
        global p200_racks_ondeck
        global p50_racks_offdeck
        global p200_racks_offdeck
        global p50_rack_count
        global p200_rack_count

        if rack == tip50:
            if tt_50 == 0 and not reuse:  # If this is the first column of tip box and these aren't reused tips
                ctx.comment("Troubleshoot")
                if len(Available_on_deck_slots) > 0:
                    """
                    If there are open deck slots --> need to add a new tip box before pickup
                    """
                    p50_rack_count += 1
                    tt_50 += 12
                    addtiprack = ctx.load_labware(
                        "opentrons_flex_96_tiprack_50ul", Available_on_deck_slots[0], f"50 ul Tip Rack #{p50_rack_count}"
                    )
                    ctx.comment(f"Adding 50 ul tip rack #{p50_rack_count} to slot {Available_on_deck_slots[0]}")
                    Available_on_deck_slots.pop(0)
                    p50_racks_ondeck.append(addtiprack)
                    p50_racks_to_dump.append(addtiprack)
                    p50.tip_racks.append(addtiprack)
                elif len(Available_on_deck_slots) == 0 and len(Available_off_deck_slots) > 0:
                    p50_rack_count += 1
                    tt_50 += 12
                    addtiprack = ctx.load_labware(
                        "opentrons_flex_96_tiprack_50ul", Available_off_deck_slots[0], f"50 ul Tip Rack #{p50_rack_count}"
                    )
                    Available_off_deck_slots.pop(
                        0
                    )  # Load rack into staging area slot to be moved on deck- want this slot removed so we know when we need manual addition
                    ctx.comment(f"Adding 50 ul tip rack #{p50_rack_count}")
                    p50_racks_offdeck.append(addtiprack)  # used in TipSwap then deleted once it is moved
                    p50.tip_racks.append(addtiprack)  # lets pipette know it can use this rack now
                    TipSwap(50)  # Throw first tip box out and replace with a box from staging area
                elif (
                    len(Available_on_deck_slots) == 0 and len(Available_off_deck_slots) == 0
                ):  # If there are no tip racks on deck or in staging area to use
                    ctx.pause("Please place a new 50ul Tip Rack in slot A4")
                    p50_rack_count += 1
                    tt_50 += 12
                    addtiprack = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "A4", f"50 ul Tip Rack #{p50_rack_count}")
                    ctx.comment(f"Adding 50 ul tip rack #{p50_rack_count}")
                    p50_racks_offdeck.append(addtiprack)  # used in TipSwap, then deleted once it is moved
                    p50.tip_racks.append(addtiprack)  # lets pipette know it can use this rack now
                    TipSwap(50)  # Throw first tip box out and replace with a box from staging area
            # Call where tips will actually be picked up
            if reuse and REUSE_RSB_TIPS:
                p50.pick_up_tip(tip50_reuse.wells()[8 * reuse_col])
            else:
                tt_50 -= 1
                ctx.comment("Column " + str(12 - tt_50))
                ctx.comment("Available On Deck Slots:" + str(len(Available_on_deck_slots)))
                ctx.comment("Available Off Deck Slots:" + str(len(Available_off_deck_slots)))
                p50.pick_up_tip()

        if rack == tip200:
            if tt_200 == 0 and not reuse:  # If this is the first column of tip box and these aren't reused tips
                if len(Available_on_deck_slots) > 0:
                    """
                    If there are open deck slots --> need to add a new tip box before pickup
                    """
                    p200_rack_count += 1
                    tt_200 += 12
                    addtiprack = ctx.load_labware(
                        "opentrons_flex_96_tiprack_200ul", Available_on_deck_slots[0], f"200 ul Tip Rack #{p200_rack_count}"
                    )
                    ctx.comment(f"Adding 200 ul tip rack #{p200_rack_count} to slot {Available_on_deck_slots[0]}")
                    Available_on_deck_slots.pop(0)
                    p200_racks_ondeck.append(addtiprack)
                    p200_racks_to_dump.append(addtiprack)
                    p200.tip_racks.append(addtiprack)
                elif len(Available_on_deck_slots) == 0 and len(Available_off_deck_slots) > 0:
                    p200_rack_count += 1
                    tt_200 += 12
                    addtiprack = ctx.load_labware(
                        "opentrons_flex_96_tiprack_200ul", Available_off_deck_slots[0], f"200 ul Tip Rack #{p200_rack_count}"
                    )
                    Available_off_deck_slots.pop(
                        0
                    )  # Load rack into staging area slot to be moved on deck- want this slot removed so we know when we need manual addition
                    ctx.comment(f"Adding 200 ul tip rack #{p200_rack_count}")
                    p200_racks_offdeck.append(addtiprack)  # used in TipSwap then deleted once it is moved
                    p200.tip_racks.append(addtiprack)  # lets pipette know it can use this rack now
                    TipSwap(200)  # Throw first tip box out and replace with a box from staging area
                elif (
                    len(Available_on_deck_slots) == 0 and len(Available_off_deck_slots) == 0
                ):  # If there are no tip racks on deck or in staging area to use
                    ctx.pause("Please place a new 200ul Tip Rack in slot B4")
                    p200_rack_count += 1
                    tt_200 += 12
                    addtiprack = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "B4", f"200 ul Tip Rack #{p200_rack_count}")
                    ctx.comment(f"Adding 200 ul tip rack #{p200_rack_count}")
                    p200_racks_offdeck.append(addtiprack)  # used in TipSwap, then deleted once it is moved
                    p200.tip_racks.append(addtiprack)  # lets pipette know it can use this rack now
                    TipSwap(200)  # Throw first tip box out and replace with a box from staging area
            # Call where tips will actually be picked up
            if reuse and REUSE_REMOVE_TIPS:
                p200.pick_up_tip(tip200_reuse.wells()[8 * reuse_col])
            else:
                tt_200 -= 1
                ctx.comment("Column " + str(12 - tt_200))
                ctx.comment("Available On Deck Slots:" + str(len(Available_on_deck_slots)))
                ctx.comment("Available Off Deck Slots:" + str(len(Available_off_deck_slots)))
                p200.pick_up_tip()

    def TipSwap(tipvol):

        if tipvol == 50:
            rack_to_dispose = p50_racks_to_dump[0]
            rack_to_add = p50_racks_offdeck[0]
            deck_slot = p50_racks_to_dump[0].parent
            old_deck_slot = p50_racks_offdeck[0].parent

            p50_racks_ondeck.append(rack_to_add)
            p50_racks_to_dump.pop(0)
            p50_racks_to_dump.append(rack_to_add)
            p50_racks_ondeck.pop(0)
            p50_racks_offdeck.pop(0)

        if tipvol == 200:
            rack_to_dispose = p200_racks_to_dump[0]
            rack_to_add = p200_racks_offdeck[0]
            deck_slot = p200_racks_to_dump[0].parent
            old_deck_slot = p200_racks_offdeck[0].parent

            p200_racks_ondeck.append(rack_to_add)
            p200_racks_to_dump.pop(0)
            p200_racks_to_dump.append(rack_to_add)
            p200_racks_ondeck.pop(0)
            p200_racks_offdeck.pop(0)

        ctx.move_labware(labware=rack_to_dispose, new_location=trash, use_gripper=USE_GRIPPER)
        ctx.move_labware(labware=rack_to_add, new_location=deck_slot, use_gripper=USE_GRIPPER)
        ctx.comment(f"Threw out: {rack_to_dispose} and placed {rack_to_add} to {deck_slot}")

    ######################################################################################################
    def run_tag_profile():
        # heater shaker mixing speed and time
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=1400)
            ctx.delay(Fragmentation_Mix_time)
            h_s.deactivate_shaker()

        # Presetting Thermocycler Temps
        ctx.comment("****Starting Fragmentation Profile (37C for 10 minutes with 100C lid)****")
        tc_mod.set_lid_temperature(100)
        tc_mod.set_block_temperature(37)

        # Move Plate to TC
        ctx.comment("****Moving Plate to Pre-Warmed TC Module Block****")
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, tc_mod, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        tc_mod.close_lid()

        tc_mod.set_block_temperature(temperature=37, hold_time_minutes=Fragmentation_time, block_max_volume=50)

        tc_mod.open_lid()

        # #Move Plate to H-S
        ctx.comment("****Moving Plate off of TC****")
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, h_s_adapter if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

    ###################################################################################
    def run_er_profile():
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=1400)
            ctx.delay(End_Repair_Mix_time)
            h_s.deactivate_shaker()
        # Presetting Thermocycler Temps
        ctx.comment("****Starting End Repair Profile (65C for 30 minutes with 100C lid)****")
        tc_mod.set_lid_temperature(100)
        tc_mod.set_block_temperature(65)

        # Move Plate to TC
        ctx.comment("****Moving Plate to Pre-Warmed TC Module Block****")
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, tc_mod, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        tc_mod.close_lid()

        tc_mod.set_block_temperature(temperature=65, hold_time_minutes=30, block_max_volume=50)

        tc_mod.deactivate_block()

        tc_mod.open_lid()

        # #Move Plate to H-S
        ctx.comment("****Moving Plate off of TC****")
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, h_s_adapter if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

    #####################################################################################
    def run_ligation_profile():
        # Ligration heatersheaker mixing speed and time
        ctx.comment("****Mixing Ligation using heatershaker")
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=1400)
            ctx.delay(Ligation_Mix_time)
            h_s.deactivate_shaker()
        # Presetting Thermocycler Temps
        ctx.comment("****Starting Ligation Profile (20C for 15 minutes with 100C lid)****")
        tc_mod.set_lid_temperature(100)
        tc_mod.set_block_temperature(20)

        # Move Plate to TC
        ctx.comment("****Moving Plate to Pre-Warmed TC Module Block****")
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, tc_mod, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        tc_mod.close_lid()

        tc_mod.set_block_temperature(temperature=20, hold_time_minutes=ligation_tc_time, block_max_volume=50)

        tc_mod.deactivate_block()

        tc_mod.open_lid()

        # #Move Plate to H-S
        ctx.comment("****Moving Plate off of TC****")
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, h_s_adapter if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

    #################################################################################
    def run_amplification_profile():
        # Ligration heatersheaker mixing speed and time
        ctx.comment("****Mixing amplification using heatershaker")
        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(rpm=1400)
            ctx.delay(amplification_Mix_time)
            h_s.deactivate_shaker()
        # Presetting Thermocycler Temps
        ctx.comment("****Starting Amplification Profile (37C for 5 minutes, then 50C for 5 minutes with 100C lid)****")
        tc_mod.set_lid_temperature(100)
        tc_mod.set_block_temperature(98)

        # Move Plate to TC
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Moving Sample Plate onto TC****")
        ctx.move_labware(sample_plate_2, tc_mod, use_gripper=USE_GRIPPER)

        ############################################################################################################################################
        if dry_run == False:
            tc_mod.set_lid_temperature(105)
        tc_mod.close_lid()
        if dry_run == False:
            profile_PCR_1 = [{"temperature": 98, "hold_time_seconds": 45}]
            tc_mod.execute_profile(steps=profile_PCR_1, repetitions=1, block_max_volume=50)
            profile_PCR_2 = [
                {"temperature": 98, "hold_time_seconds": 15},
                {"temperature": 60, "hold_time_seconds": 30},
                {"temperature": 72, "hold_time_seconds": 30},
            ]
            tc_mod.execute_profile(steps=profile_PCR_2, repetitions=PCRCYCLES, block_max_volume=50)
            profile_PCR_3 = [{"temperature": 72, "hold_time_minutes": 1}]
            tc_mod.execute_profile(steps=profile_PCR_3, repetitions=1, block_max_volume=50)
            tc_mod.set_block_temperature(4)
        ############################################################################################################################################
        tc_mod.open_lid()
        # Move Sample Plate to H-S
        ctx.comment("****Moving Sample Plate back to H-S****")
        ctx.move_labware(sample_plate_2, h_s_adapter if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        # get FLP plate out of the way
        ctx.comment("****Moving FLP Plate back to TC****")
        ctx.move_labware(FLP_plate, tc_mod, use_gripper=USE_GRIPPER)

    #############################################################################################
    def mix_beads(pip, res, vol, reps, col):
        # Multiplier tells
        mix_vol = (num_cols - col) * vol
        if pip == p50:
            if mix_vol > 50:
                mix_vol = 50
        if pip == p200:
            if mix_vol > 200:
                mix_vol = 200

        if res == bead_res:
            width = res.width
        else:
            width = res.diameter
        move = (width / 2) - 1

        loc_center_a = res.bottom().move(types.Point(x=0, y=0, z=0.5))
        loc_center_d = res.bottom().move(types.Point(x=0, y=0, z=0.5))
        loc1 = res.bottom().move(types.Point(x=move, y=0, z=5))
        loc2 = res.bottom().move(types.Point(x=0, y=move, z=5))
        loc3 = res.bottom().move(types.Point(x=-move, y=0, z=5))
        loc4 = res.bottom().move(types.Point(x=0, y=-move, z=5))
        loc5 = res.bottom().move(types.Point(x=move / 2, y=move / 2, z=5))
        loc6 = res.bottom().move(types.Point(x=-move / 2, y=move / 2, z=5))
        loc7 = res.bottom().move(types.Point(x=-move / 2, y=-move / 2, z=5))
        loc8 = res.bottom().move(types.Point(x=move / 2, y=-move / 2, z=5))

        loc = [loc_center_d, loc1, loc5, loc2, loc6, loc3, loc7, loc4, loc8]

        pip.aspirate(mix_vol, res.bottom().move(types.Point(x=0, y=0, z=10)))  # Blow bubbles to start
        pip.dispense(mix_vol, loc_center_d)
        for x in range(reps):
            pip.aspirate(mix_vol, loc_center_a)
            pip.dispense(mix_vol, loc[x])
        pip.flow_rate.aspirate = 10
        pip.flow_rate.dispense = 10
        pip.aspirate(mix_vol, loc_center_a)
        pip.dispense(mix_vol, loc_center_d)
        pip.flow_rate.aspirate = 150
        pip.flow_rate.dispense = 150

    def remove_supernatant(well, vol, waste_, column):
        ctx.comment("-------Removing " + str(vol) + "ul of Supernatant-------")
        p200.flow_rate.aspirate = 15
        num_trans = math.ceil(vol / 190)
        vol_per_trans = vol / num_trans
        for x in range(num_trans):
            tiptrack(tip200, column, reuse=True if REUSE_REMOVE_TIPS else False)
            p200.aspirate(vol_per_trans / 2, well.bottom(0.2))
            ctx.delay(seconds=1)
            p200.aspirate(vol_per_trans / 2, well.bottom(0.2))
            p200.air_gap(10)
            p200.dispense(p200.current_volume, waste_)
            p200.air_gap(10)
            if REUSE_REMOVE_TIPS:
                p200.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")
            else:
                if trash_tips:
                    p200.drop_tip()
                    ctx.comment("****Dropping Tip in Waste shoot****")
                else:
                    p200.return_tip()
                    ctx.comment("****Dropping Tip Back in Tip Box****")
        p200.flow_rate.aspirate = 150

    ################################################################################
    #                       First Definition- Fragmentation                         #
    ################################################################################

    def Fragmentation():
        ctx.comment("-------Starting Fragmentation-------")

        for i in range(num_cols):

            ctx.comment("**** Mixing and Transfering beads to column " + str(i + 1) + " ****")

            tiptrack(tip50, None, reuse=False)
            # mix_beads(p50,frag_res,frag_vol,7 if i == 0 else 2,i) #5 reps for first mix in reservoir
            p50.flow_rate.dispense = 15
            p50.aspirate(frag_vol, frag_res)
            p50.dispense(p50.current_volume, samples[i])
            p50.flow_rate.dispense = 150
            for x in range(10 if not dry_run else 1):
                if x == 9:
                    p50.flow_rate.aspirate = 15
                    p50.flow_rate.dispense = 15
                p50.aspirate(frag_vol, samples[i].bottom(1))
                p50.dispense(p50.current_volume, samples[i].bottom(5))
            p50.flow_rate.aspirate = 150
            p50.flow_rate.dispense = 150
            if trash_tips:
                p50.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        run_tag_profile()  # Heats TC --> moves plate to TC --> TAG Profile --> removes plate from TC

    ################################################################################
    #                                  End-Repair                                  #
    ################################################################################

    def end_repair():
        ctx.comment("-------Starting end_repair-------")

        for i in range(num_cols):

            ctx.comment("**** Mixing and Transfering beads to column " + str(i + 1) + " ****")

            tiptrack(tip50, None, reuse=False)
            # mix_beads(p50,er_res,end_repair_vol,7 if i == 0 else 2,i) #5 reps for first mix in reservoir
            p50.flow_rate.dispense = 15
            p50.aspirate(end_repair_vol, er_res)
            p50.dispense(p50.current_volume, samples[i])
            p50.flow_rate.dispense = 150
            for x in range(10 if not dry_run else 1):
                if x == 9:
                    p50.flow_rate.aspirate = 15
                    p50.flow_rate.dispense = 15
                p50.aspirate(end_repair_vol, samples[i].bottom(1))
                p50.dispense(p50.current_volume, samples[i].bottom(5))
            p50.flow_rate.aspirate = 150
            p50.flow_rate.dispense = 150
            if trash_tips:
                p50.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        run_er_profile()  # Heats TC --> moves plate to TC --> TAG Profile --> removes plate from TC

    ################################################################################
    #                               Index Ligation                                 #
    ################################################################################

    def index_ligation():
        ctx.comment("-------Ligating Indexes-------")
        ctx.comment("-------Adding and Mixing ELM-------")
        for i in samples:
            tiptrack(tip50, None, reuse=False)
            p50.aspirate(ligation_vol, ligation_res)
            p50.dispense(p50.current_volume, i)
            for x in range(10 if not dry_run else 1):
                if x == 9:
                    p50.flow_rate.aspirate = 75
                    p50.flow_rate.dispense = 75
                p50.aspirate(ligation_vol - 10, i)
                p50.dispense(p50.current_volume, i.bottom(8))
            p50.flow_rate.aspirate = 150
            p50.flow_rate.dispense = 150
            if trash_tips:
                p50.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        # Add and mix adapters
        ctx.comment("-------Adding and Mixing Adapters-------")
        for i, x in zip(samples, adapters):
            tiptrack(tip50, None, reuse=False)
            p50.aspirate(adapter_vol, x)
            p50.dispense(p50.current_volume, i)
            for y in range(10 if not dry_run else 1):
                if y == 9:
                    p50.flow_rate.aspirate = 75
                    p50.flow_rate.dispense = 75
                p50.aspirate(40, i)
                p50.dispense(40, i.bottom(8))
            if trash_tips:
                p50.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        p50.flow_rate.aspirate = 150
        p50.flow_rate.dispense = 150

        run_ligation_profile()
        """
        Moves FLP plate off TC --> Heats TC --> moves sample plate to TC --> ELM Profile --> removes sample plate from TC --> places FLP plate back on TC
        """

    ################################################################################
    #                           ligation Cleanup                                   #
    ################################################################################
    def lib_cleanup():
        ctx.comment("-------Starting Cleanup-------")
        ctx.comment("-------Adding and Mixing Cleanup Beads-------")

        # Move FLP plate off magnetic module if it's there
        if FLP_plate.parent == magblock:
            ctx.comment("****Moving FLP Plate off Magnetic Module****")
            ctx.move_labware(FLP_plate, tc_mod, use_gripper=USE_GRIPPER)

        for x, i in enumerate(samples):
            tiptrack(tip200, None, reuse=False)
            mix_beads(p200, bead_res, bead_vol_1, 7 if x == 0 else 2, x)
            p200.aspirate(bead_vol_1, bead_res)
            p200.dispense(bead_vol_1, i)
            mix_beads(p200, i, bead_vol_1, 7 if not dry_run else 1, num_cols - 1)
            for x in range(10 if not dry_run else 1):
                if x == 9:
                    p200.flow_rate.aspirate = 75
                    p200.flow_rate.dispense = 75
                p200.aspirate(bead_vol_1, i)
                p200.dispense(bead_vol_1, i.bottom(8))
            p200.flow_rate.aspirate = 150
            p200.flow_rate.dispense = 150
            if trash_tips:
                p200.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p200.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        ctx.delay(minutes=bead_inc, msg="Please wait " + str(bead_inc) + " minutes while samples incubate at RT.")

        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Moving Labware to Magnet for Pelleting****")
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        ctx.delay(minutes=4.5, msg="Time for Pelleting")

        for col, i in enumerate(samples):
            remove_supernatant(i, 130, waste1_res, col)
        samp_list = samples

        ################################################################################
        #                       Wash 2 x with 80% Ethanol                              #
        ################################################################################
        p200.flow_rate.aspirate = 75
        p200.flow_rate.dispense = 75
        for y in range(2 if not dry_run else 1):
            ctx.comment(f"-------Wash # {y+1} with Ethanol-------")
            if y == 0:  # First wash
                this_res = etoh1_res
                this_waste_res = waste1_res
            else:  # Second Wash
                this_res = etoh2_res
                this_waste_res = waste2_res
            if REUSE_ETOH_TIPS:
                tiptrack(tip200, None, reuse=False)
            for i in samp_list:
                if not REUSE_ETOH_TIPS:
                    tiptrack(tip200, None, reuse=False)
                p200.aspirate(150, this_res)
                p200.air_gap(10)
                p200.dispense(p200.current_volume, i.top())
                ctx.delay(seconds=1)
                p200.air_gap(10)
                if not REUSE_ETOH_TIPS:
                    p200.drop_tip() if trash_tips else p200.return_tip()

            ctx.delay(seconds=10)
            # Remove the ethanol wash
            for x, i in enumerate(samp_list):
                if REUSE_ETOH_TIPS:
                    if x != 0:
                        tiptrack(tip200, None, reuse=False)
                if not REUSE_ETOH_TIPS:
                    tiptrack(tip200, None, reuse=False)
                p200.aspirate(155, i)
                p200.air_gap(10)
                p200.dispense(p200.current_volume, this_waste_res)
                ctx.delay(seconds=1)
                p200.air_gap(10)
                if trash_tips:
                    p200.drop_tip()
                    ctx.comment("****Dropping Tip in Waste shoot****")
                else:
                    p200.return_tip()
                    ctx.comment("****Dropping Tip Back in Tip Box****")

        p200.flow_rate.aspirate = 150
        p200.flow_rate.dispense = 150

        ################################################################################
        #               Washes Complete, Move on to Drying Steps                       #
        ################################################################################

        ctx.delay(minutes=2, msg="Allow 3 minutes for residual ethanol to dry")

        # Return Plate to H-S from Magnet
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Moving sample plate off of Magnet****")
        ctx.move_labware(sample_plate, h_s_adapter if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        ################################################################################
        #                           Adding RSB and Mixing                              #
        ################################################################################

        for col, i in enumerate(samp_list):
            ctx.comment(f"****Adding RSB to Columns: {col+1}****")
            tiptrack(tip50, col, reuse=True if REUSE_RSB_TIPS else False)
            p50.aspirate(rsb_vol_1, rsb_res)
            p50.air_gap(5)
            p50.dispense(p50.current_volume, i)
            for x in range(10 if not dry_run else 1):
                if x == 9:
                    p50.flow_rate.aspirate = 15
                    p50.flow_rate.dispense = 15
                p50.aspirate(15, i.bottom(1))
                p50.dispense(15, i.bottom(4))
            p50.flow_rate.aspirate = 100
            p50.flow_rate.dispense = 100
            p50.air_gap(5)
            if REUSE_RSB_TIPS:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")
            else:
                if trash_tips:
                    p50.drop_tip()
                    ctx.comment("****Dropping Tip in Waste shoot****")
                else:
                    p50.return_tip()
                    ctx.comment("****Dropping Tip Back in Tip Box****")

        ctx.delay(minutes=3, msg="Allow 3 minutes for incubation and liquid aggregation.")

        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Move Samples to Magnet for Pelleting****")
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        ctx.delay(minutes=2, msg="Please allow 2 minutes for beads to pellet.")

        p200.flow_rate.aspirate = 10
        for i, (s, e) in enumerate(zip(samp_list, samples_2)):
            tiptrack(tip50, i, reuse=True if REUSE_RSB_TIPS else False)
            p50.aspirate(elution_vol, s)
            p50.air_gap(5)
            p50.dispense(p50.current_volume, e.bottom(1), push_out=3)
            p50.air_gap(5)
            if trash_tips:
                p50.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        # move new sample plate to D1 or heatersheaker
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Moving sample plate off of Magnet****")
        ctx.move_labware(sample_plate_2, h_s_adapter if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        # Keep Sample PLate 1 to B2
        ctx.comment("****Moving Sample_plate_1 Plate off magnet to B2****")
        ctx.move_labware(sample_plate, "B2", use_gripper=USE_GRIPPER)

        ctx.comment("****Moving FLP Plate off TC****")
        ctx.move_labware(FLP_plate, magblock, use_gripper=USE_GRIPPER)

    ################################################################################
    #                              Amplification                                   #
    ################################################################################

    def lib_amplification():
        ctx.comment("-------Starting lib_amplification-------")

        for i in range(num_cols):

            ctx.comment("**** Mixing and Transfering beads to column " + str(i + 1) + " ****")

            tiptrack(tip50, None, reuse=False)
            mix_beads(p50, amplification_res, amplification_vol, 7 if i == 0 else 2, i)  # 5 reps for first mix in reservoir
            p50.flow_rate.dispense = 15
            p50.aspirate(amplification_vol, amplification_res)
            p50.dispense(p50.current_volume, samples_2[i])
            p50.flow_rate.dispense = 150
            for x in range(10 if not dry_run else 1):
                if x == 9:
                    p50.flow_rate.aspirate = 15
                    p50.flow_rate.dispense = 15
                p50.aspirate(amplification_vol, samples_2[i].bottom(1))
                p50.dispense(p50.current_volume, samples_2[i].bottom(5))
            p50.flow_rate.aspirate = 150
            p50.flow_rate.dispense = 150
            if trash_tips:
                p50.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        run_amplification_profile()  # moves plate to TC --> TAG Profile --> removes plate from TC

    ################################################################################
    #                               Final Cleanup                                  #
    ################################################################################

    def lib_cleanup_2():
        ctx.comment("-------Starting Cleanup-------")
        ctx.comment("-------Adding and Mixing Cleanup Beads-------")
        for x, i in enumerate(samples_2):
            tiptrack(tip200, None, reuse=False)
            mix_beads(p200, bead_res, bead_vol_2, 7 if x == 0 else 2, x)
            p200.aspirate(bead_vol_2, bead_res)
            p200.dispense(bead_vol_2, i)
            mix_beads(p200, i, bead_vol_2, 7 if not dry_run else 1, num_cols - 1)
            for x in range(10 if not dry_run else 1):
                if x == 9:
                    p200.flow_rate.aspirate = 75
                    p200.flow_rate.dispense = 75
                p200.aspirate(bead_vol_2, i)
                p200.dispense(bead_vol_2, i.bottom(8))
            p200.flow_rate.aspirate = 150
            p200.flow_rate.dispense = 150
            if trash_tips:
                p200.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p200.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        ctx.delay(minutes=bead_inc, msg="Please wait " + str(bead_inc) + " minutes while samples incubate at RT.")

        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Moving Labware to Magnet for Pelleting****")
        ctx.move_labware(sample_plate_2, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        ctx.delay(minutes=4.5, msg="Time for Pelleting")

        for col, i in enumerate(samples_2):
            remove_supernatant(i, 130, waste1_res, col)
        samp_list_2 = samples_2
        ################################################################################
        #                       Wash 2 x with 80% Ethanol                              #
        ################################################################################
        p200.flow_rate.aspirate = 75
        p200.flow_rate.dispense = 75
        for y in range(2 if not dry_run else 1):
            ctx.comment(f"-------Wash # {y+1} with Ethanol-------")
            if y == 0:  # First wash
                this_res = etoh1_res
                this_waste_res = waste1_res
            else:  # Second Wash
                this_res = etoh2_res
                this_waste_res = waste2_res
            if REUSE_ETOH_TIPS:
                tiptrack(tip200, None, reuse=False)
            for i in samp_list_2:
                if not REUSE_ETOH_TIPS:
                    tiptrack(tip200, None, reuse=False)
                p200.aspirate(150, this_res)
                p200.air_gap(10)
                p200.dispense(p200.current_volume, i.top())
                ctx.delay(seconds=1)
                p200.air_gap(10)
                if not REUSE_ETOH_TIPS:
                    p200.drop_tip() if trash_tips else p200.return_tip()

            ctx.delay(seconds=10)
            # Remove the ethanol wash
            for x, i in enumerate(samp_list_2):
                if REUSE_ETOH_TIPS:
                    if x != 0:
                        tiptrack(tip200, None, reuse=False)
                if not REUSE_ETOH_TIPS:
                    tiptrack(tip200, None, reuse=False)
                p200.aspirate(155, i)
                p200.air_gap(10)
                p200.dispense(p200.current_volume, this_waste_res)
                ctx.delay(seconds=1)
                p200.air_gap(10)
                if trash_tips:
                    p200.drop_tip()
                    ctx.comment("****Dropping Tip in Waste shoot****")
                else:
                    p200.return_tip()
                    ctx.comment("****Dropping Tip Back in Tip Box****")

        p200.flow_rate.aspirate = 150
        p200.flow_rate.dispense = 150

        ################################################################################
        #               Washes Complete, Move on to Drying Steps                       #
        ################################################################################

        ctx.delay(minutes=3, msg="Allow 3 minutes for residual ethanol to dry")

        # Return Plate to H-S from Magnet
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Moving sample plate off of Magnet****")
        ctx.move_labware(sample_plate_2, h_s_adapter if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        ################################################################################
        #                           Adding RSB and Mixing                              #
        ################################################################################

        for col, i in enumerate(samp_list_2):
            ctx.comment(f"****Adding RSB to Columns: {col+1}****")
            tiptrack(tip50, col, reuse=True if REUSE_RSB_TIPS else False)
            p50.aspirate(rsb_vol_2, rsb_res)
            p50.air_gap(5)
            p50.dispense(p50.current_volume, i)
            for x in range(10 if not dry_run else 1):
                if x == 9:
                    p50.flow_rate.aspirate = 15
                    p50.flow_rate.dispense = 15
                p50.aspirate(15, i.bottom(1))
                p50.dispense(15, i.bottom(4))
            p50.flow_rate.aspirate = 100
            p50.flow_rate.dispense = 100
            p50.air_gap(5)
            if REUSE_RSB_TIPS:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")
            else:
                if trash_tips:
                    p50.drop_tip()
                    ctx.comment("****Dropping Tip in Waste shoot****")
                else:
                    p50.return_tip()
                    ctx.comment("****Dropping Tip Back in Tip Box****")

        ctx.delay(minutes=3, msg="Allow 3 minutes for incubation and liquid aggregation.")

        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Move Samples to Magnet for Pelleting****")
        ctx.move_labware(sample_plate_2, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        ctx.delay(minutes=2, msg="Please allow 2 minutes for beads to pellet.")

        p200.flow_rate.aspirate = 10
        for i, (s, e) in enumerate(zip(samp_list_2, samples_flp)):
            tiptrack(tip50, i, reuse=True if REUSE_RSB_TIPS else False)
            p50.aspirate(elution_vol_2, s)
            p50.air_gap(5)
            p50.dispense(p50.current_volume, e.bottom(1), push_out=3)
            p50.air_gap(5)
            if trash_tips:
                p50.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        # Set Block Temp for Final Plate
        tc_mod.set_block_temperature(4)

    Fragmentation()
    end_repair()
    index_ligation()
    lib_cleanup()
    lib_amplification()
    lib_cleanup_2()
