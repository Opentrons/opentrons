from opentrons import protocol_api
from opentrons import types
import math
import numpy as np

metadata = {"protocolName": "Illumina PCR-Free DNA Prep", "author": "Zach Galluzzo <zachary.galluzzo@opentrons.com>"}
requirements = {"robotType": "Flex", "apiLevel": "2.19"}
tt_50 = 0
tt_200 = 0
p50_rack_count = 0
p200_rack_count = 0
tip50 = 50
tip200 = 200
reps = 1
threshold = 1
p50_racks_ondeck = []
p200_racks_ondeck = []
p50_racks_offdeck = []
p200_racks_offdeck = []
RemoveEtoh_tip = []
RemoveSup_tip = []
RSB_tip = []


def add_parameters(p):
    p.add_int(
        display_name="Number of Samples",
        variable_name="num_samples",
        default=8,
        minimum=1,
        maximum=48,
        description="How many samples will be processed (multiples of 8 work most efficiently- 48 sample max)?",
    )

    p.add_bool(
        display_name="gDNA",
        variable_name="gDNA",
        default=True,
        description="Will the inputted DNA be gDNA? (If not, the protocol will follow the blood/ saliva input section.)",
    )

    p.add_bool(
        display_name="Standard Input",
        variable_name="standard_input",
        default=True,
        description="Should this follow the standard input protocol (>100 ng DNA input)?",
    )

    p.add_bool(
        display_name="Use Gripper",
        variable_name="USE_GRIPPER",
        default=True,
        description="Is there a gripper present to move labware around the deck?",
    )
    p.add_bool(
        display_name="Trash tips",
        variable_name="trash_tips",
        default=True,
        description="True will throw tips in waste chute, false will return them to tip rack.",
    )
    p.add_bool(
        display_name="Heater-Shaker",
        variable_name="heater_shaker",
        default=True,
        description="Is there a heater-shaker on deck for this protocol?",
    )
    p.add_bool(
        display_name="On-deck Thermocycler",
        variable_name="ondeck_thermo",
        default=True,
        description="Is there an on-deck thermocycler for this protocol? (must be Gen2)",
    )
    p.add_bool(
        display_name="Dry Run",
        variable_name="dry_run",
        default=False,
        description="True will shorten incubation times and mix reps, false will run according to manual.",
    )
    p.add_bool(
        display_name="Reuse Ethanol Tips?",
        variable_name="REUSE_ETOH_TIPS",
        default=False,
        description="If true, tips for ethanol washes will be reused for both washes.",
    )
    p.add_bool(
        display_name="Reuse RSB/ elution tips?",
        variable_name="REUSE_RSB_TIPS",
        default=False,
        description="If true, tips for RSB transfers and mixes will be reused.",
    )
    p.add_bool(
        display_name="Reuse supernatant tips?",
        variable_name="REUSE_REMOVE_TIPS",
        default=False,
        description="If true, all supernatant clearances for any single sample will be done by 1 tip.",
    )
    p.add_str(
        display_name="P1000 Mount",
        variable_name="mount1000",
        default="left",
        description="Which mount is the p1000 pipette on?",
        choices=[{"display_name": "right", "value": "right"}, {"display_name": "left", "value": "left"}],
    )


def run(ctx):
    # Flexible Parameters for Customers to Change from Protocol Library Page

    gDNA = ctx.params.gDNA  # False for Blood/ Saliva input
    standard_input = ctx.params.standard_input
    USE_GRIPPER = ctx.params.USE_GRIPPER
    trash_tips = ctx.params.trash_tips
    heater_shaker = ctx.params.heater_shaker  # Is there a heater-shaker present?
    ondeck_thermo = ctx.params.ondeck_thermo  # Is there an on-deck thermocycler?
    dry_run = ctx.params.dry_run
    REUSE_ETOH_TIPS = ctx.params.REUSE_ETOH_TIPS
    REUSE_RSB_TIPS = ctx.params.REUSE_RSB_TIPS  # Reuse tips for RSB buffer (adding RSB, mixing, and transferring)
    REUSE_REMOVE_TIPS = ctx.params.REUSE_REMOVE_TIPS  # Reuse tips for supernatant removal
    num_samples = ctx.params.num_samples
    mount1000 = ctx.params.mount1000

    # gDNA				= True 		# False for Blood/ Saliva input
    # standard_input 		= True
    # USE_GRIPPER 		= True
    # trash_tips			= True
    # heater_shaker 		= True 		# Is there a heater-shaker present?
    # ondeck_thermo		= True 		# Is there an on-deck thermocycler?
    # dry_run				= False
    # REUSE_ETOH_TIPS		= False
    # REUSE_RSB_TIPS		= False 	# Reuse tips for RSB buffer (adding RSB, mixing, and transferring)
    # REUSE_REMOVE_TIPS	= False 	# Reuse tips for supernatant removal
    # num_samples 		= 8
    # mount1000 			="left"

    ################################################################################
    # 		Changing Parameters for troubleshooting (FAS/ Science team)			   #
    ################################################################################

    tagment = True
    tag_cleanup = True
    ligate_indexes = True
    final_cleanup = True

    report = True  # Prints helpful comments to assist in debugging

    """
    These are presented in the order that they are called in the protocol, with tagement being the first
    and final cleanup being the last step. In order to ensure a successful run, none of the steps should be skipped.
    This means that the list above should never have a True --> False --> True. Once one of these steps is False,
    everything below (after) it should be false as well, otherwise there is a very low chance of a successful library prep.

    Depending where in the protocol you stop, setting up the next protocol may be slightly different
    (FLP plate, sample plate and tips may differ) so make sure to setup the second version according to the app
    (this means potentially rerunning LPC).

    Also, none of the four steps listed above are good stopping points, except completing the final cleanup.
    This means this section is only used for troubleshooting, or restarting a protocol after a failure. Samples
    should not be stored and come back to the next day in between any of the four steps above.
    """

    ################################################################################
    # 					Beginning Protocol- Setting Variables					   #
    ################################################################################
    if mount1000 == "left":
        mount50 = "right"
    else:
        mount50 = "left"

    if dry_run:
        trash_tips = False

    num_cols = math.ceil(num_samples / 8)

    global reps
    global threshold

    # Pre-set parameters

    if standard_input:
        if gDNA:
            sample_vol = 25
        else:
            sample_vol = 30
        cleanup_inc = 2

        bead_mix_vol = 35
        ipb1_vol = 36
        ipb2_vol = 42
        ipb_vol = ipb1_vol + ipb2_vol
        ipb_inc = 2
        rsb_vol = 22
        elution_vol = 20
        tb1_vol = 10
        if gDNA:
            blt_v = 15
            blt_vol = blt_v + tb1_vol  # 25: blt + tb1
        else:
            blt_v = 10
            blt_vol = blt_v + tb1_vol  # 20: blt + tb1 for blood/ saliva

    else:
        cleanup_inc = 5
        sample_vol = 30
        tb1_vol = 10
        blt_v = 10
        blt_vol = blt_v + tb1_vol
        bead_mix_vol = 40
        ipb_vol = 81
        ipb1_vol = ipb_vol
        ipb_inc = 5
        rsb_vol = 16
        elution_vol = 14

    # Same for every condition of this protocol
    st2_vol = 10
    twb1_vol = 150
    twb2_vol = 75
    twb_vol = twb1_vol + twb2_vol
    elm_vol = 45
    adapter_vol = 5
    hp3_vol = 45
    etoh_vol = 180
    if heater_shaker:
        reps = 4
        threshold = 3
    else:
        reps = 8
        threshold = 7
    if dry_run:
        reps = 1

    ################################################################################
    # 						Loading Labware and Instruments						   #
    ################################################################################

    # Importing Labware, Modules and Instruments
    magblock = ctx.load_module("magneticBlockV1", "D2")
    temp_mod = ctx.load_module("temperature module gen2", "C1")
    temp_adapter = temp_mod.load_adapter("opentrons_96_well_aluminum_block")
    temp_plate = temp_adapter.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "Temp Module Reservoir Plate")
    if not dry_run:
        temp_mod.set_temperature(4)
    if ondeck_thermo:
        tc_mod = ctx.load_module("thermocycler module gen2")
        # Just in case
        tc_mod.open_lid()

    FLP_plate = magblock.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "FLP Plate")
    samples_flp = FLP_plate.rows()[0][:num_cols]

    if heater_shaker:
        h_s = ctx.load_module("heaterShakerModuleV1", "D1")
        # h_s_adapter 	= h_s.load_adapter('opentrons_96_pcr_adapter')
        sample_plate = h_s.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "Sample Plate")
        # Just in Case
        h_s.close_labware_latch()

    else:
        sample_plate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "D1", "Sample Pate")

    if standard_input:
        samples_lp2 = sample_plate.rows()[0][num_cols : 2 * num_cols]

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
    global RemoveEtoh_tip
    global RemoveSup_tip
    global RSB_tip

    p200 = ctx.load_instrument("flex_8channel_1000", mount1000)
    p50 = ctx.load_instrument("flex_8channel_50", mount50)

    p50_racks = []
    p200_racks = []

    Available_on_deck_slots = ["A2", "A3", "B2", "B3", "C3"]
    if not ondeck_thermo:
        Available_on_deck_slots.append("B1")
    Available_off_deck_slots = ["A4", "B4", "C4", "D4"]
    p50_racks_to_dump = []
    p200_racks_to_dump = []

    if REUSE_RSB_TIPS:
        Available_on_deck_slots.remove("A3")
        tip50_reuse = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "A3")
        # RSB_tip 		= []
        p50_rack_count += 1
        tt_50 += 12
        p50.tip_racks.append(tip50_reuse)
        if report:
            ctx.comment(f"Adding 50 ul tip rack #{p50_rack_count}")
        for x in range(num_cols):
            RSB_tip.append(tip50_reuse.wells()[8 * x])
            tt_50 -= 1
        p50.starting_tip = tip50_reuse.wells()[(len(RSB_tip)) * 8]

    if REUSE_REMOVE_TIPS:
        Available_on_deck_slots.remove("A2")
        tip200_reuse = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "A2", "200 ul Tip Rack #1")
        # RemoveSup_tip 	= []
        p200_rack_count += 1
        tt_200 += 12
        p200.tip_racks.append(tip200_reuse)
        if report:
            ctx.comment(f"Adding 200 ul tip rack #{p200_rack_count} to slot A2")
        for x in range(num_cols):
            RemoveSup_tip.append(tip200_reuse.wells()[8 * x])
            tt_200 -= 1
        p200_rack_count += 1
        addtiprack = ctx.load_labware("opentrons_flex_96_tiprack_200ul", Available_on_deck_slots[0], f"200 ul Tip Rack #{p200_rack_count}")
        if report:
            ctx.comment(f"Adding 200 ul tip rack #{p200_rack_count} to slot {Available_on_deck_slots[0]}")
        tt_200 += 12
        p200.tip_racks.append(addtiprack)
        Available_on_deck_slots.pop(0)
        p200_racks_ondeck.append(addtiprack)
        p200_racks_to_dump.append(addtiprack)
        if not REUSE_ETOH_TIPS:
            p200.starting_tip = tip200_reuse.wells()[num_cols * 8]
        if REUSE_ETOH_TIPS:
            for x in range(num_cols):
                RemoveEtoh_tip.append(tip200_reuse.wells()[(8 * num_cols) + (8 * x)])
                tt_200 -= 1
            if num_cols == 6:
                p200.starting_tip = addtiprack.wells()[0]
            else:
                p200.starting_tip = tip200_reuse.wells()[8 * (2 * num_cols)]
    if REUSE_ETOH_TIPS and not REUSE_REMOVE_TIPS:
        Available_on_deck_slots.remove("A2")
        tip200_reuse = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "A2", "200 ul Tip Rack #1")
        # RemoveEtoh_tip 	= []
        p200_rack_count += 1
        tt_200 += 12
        p200.tip_racks.append(tip200_reuse)
        if report:
            ctx.comment(f"Adding 200 ul tip rack #{p200_rack_count}")
        for x in range(num_cols):
            RemoveEtoh_tip.append(tip200_reuse.wells()[8 * x])
            tt_200 -= 1
        p200.starting_tip = tip200_reuse.wells()[num_cols * 8]

    ################################################################################
    # 					Load Reagent Locations in Reservoirs					   #
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

    ################Cold Res################
    adapters = temp_plate.rows()[0][:num_cols]  # used for filling liquids
    adapters_ = adapters[0]  # used for pipetting into/ out of
    adapter_liq = ctx.define_liquid(name="Adapters", description="Adapters to ligate onto DNA insert.", display_color="#A52A2A")
    for well in temp_plate.wells()[: 8 * num_cols]:
        well.load_liquid(liquid=adapter_liq, volume=adapter_vol * 2)

    elm1 = temp_plate.columns()[num_cols]
    elm1_res = elm1[0]
    elm_liq = ctx.define_liquid(name="ELM", description="Extension ligation mix", display_color="#00FFFF")
    if num_cols >= 4:
        elm2 = temp_plate.columns()[num_cols + 1]
        elm2_res = elm2[0]
        # elm 		= elm1 + elm2
        for well in elm1:
            well.load_liquid(liquid=elm_liq, volume=(elm_vol * 3) * 0.1)
        for well in elm2:
            well.load_liquid(liquid=elm_liq, volume=(elm_vol * (3 - (6 - num_cols))) * 0.1)
    else:
        elm = elm1
        for well in elm1:
            well.load_liquid(liquid=elm_liq, volume=(elm_vol * num_cols) * 0.1)

    blt = temp_plate.columns()[num_cols + 2]  # this is beads (blt) and tb1 mixed in the reservoir
    blt_res = blt[0]
    blt_liq = ctx.define_liquid(name="BLT", description="Bead linked transposomes", display_color="#008000")
    tb1_liq = ctx.define_liquid(name="TB1", description="Tagmentation buffer 1", display_color="#008000")
    for well in blt:
        well.load_liquid(liquid=blt_liq, volume=(blt_v * num_cols) * 0.1)
        well.load_liquid(liquid=tb1_liq, volume=(tb1_vol * num_cols) * 0.1)

    st2 = temp_plate.columns()[num_cols + 3]
    st2_res = st2[0]
    st2_liq = ctx.define_liquid(name="ST2", description="Stop tagmentation buffer", display_color="#0000FF")
    for well in st2:
        well.load_liquid(liquid=st2_liq, volume=(st2_vol * num_cols) * 0.1)

    ################Room Temp Res (deepwell)################
    twb = reservoir.columns()[0]
    twb_res = twb[0]
    twb_liq = ctx.define_liquid(name="TWB", description="Tagmentation wash buffer", display_color="#800080")
    for well in twb:
        well.load_liquid(liquid=twb_liq, volume=(twb_vol * num_cols) * 0.1)

    hp3 = reservoir.columns()[1]
    hp3_res = hp3[0]
    hp3_liq = ctx.define_liquid(name="HP3", description="2N Sodium Hydroxide", display_color="#ADD8E6")
    for well in hp3:
        well.load_liquid(liquid=hp3_liq, volume=(hp3_vol * num_cols) * 0.1)

    ipb = reservoir.columns()[2]
    ipb_res = ipb[0]
    ipb_liq = ctx.define_liquid(name="IPB", description="Illumina Purification Beads", display_color="#FF0000")
    for well in ipb:
        well.load_liquid(liquid=ipb_liq, volume=(ipb_vol * num_cols) * 0.1)

    rsb = reservoir.columns()[3]
    rsb_res = rsb[0]
    rsb_liq = ctx.define_liquid(name="RSB", description="Resuspension buffer", display_color="#FFFF00")
    for well in rsb:
        well.load_liquid(liquid=rsb_liq, volume=(rsb_vol * num_cols) * 0.1)

    etoh1 = reservoir.columns()[4]
    etoh1_res = etoh1[0]
    etoh_liq = ctx.define_liquid(name="Ethanol 80%", description="Fresh 80% Ethanol", display_color="#FF00FF")
    for well in etoh1:
        well.load_liquid(liquid=etoh_liq, volume=(etoh_vol * num_cols) * 0.1)

    etoh2 = reservoir.columns()[5]
    etoh2_res = etoh2[0]
    for well in etoh2:
        well.load_liquid(liquid=etoh_liq, volume=(etoh_vol * num_cols) * 0.1)

    waste1 = reservoir.columns()[-4]
    waste1_res = waste1[0]

    waste2 = reservoir.columns()[-3]
    waste2_res = waste2[0]

    waste3 = reservoir.columns()[-2]
    waste3_res = waste3[0]

    waste4 = reservoir.columns()[-1]
    waste4_res = waste4[0]

    ################################################################################
    # 					Starting to Create Function Definitions					   #
    ################################################################################

    def tiptrack(rack, reuse_col, reuse=None):
        global tt_50
        global tt_200
        global p50_racks_ondeck
        global p200_racks_ondeck
        global p50_racks_offdeck
        global p200_racks_offdeck
        global p50_rack_count
        global p200_rack_count
        global RemoveEtoh_tip
        global RemoveSup_tip
        global RSB_tip

        if rack == tip50:
            if tt_50 == 0 and reuse == None:  # If this is the first column of tip box and these aren't reused tips
                if len(Available_on_deck_slots) > 0:
                    """
                    If there are open deck slots --> need to add a new tip box before pickup
                    """
                    p50_rack_count += 1
                    tt_50 += 12
                    addtiprack = ctx.load_labware(
                        "opentrons_flex_96_tiprack_50ul", Available_on_deck_slots[0], f"50 ul Tip Rack #{p50_rack_count}"
                    )
                    if report:
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
                    if report:
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
                    if report:
                        ctx.comment(f"Adding 50 ul tip rack #{p50_rack_count}")
                    p50_racks_offdeck.append(addtiprack)  # used in TipSwap, then deleted once it is moved
                    p50.tip_racks.append(addtiprack)  # lets pipette know it can use this rack now
                    TipSwap(50)  # Throw first tip box out and replace with a box from staging area
            # Call where tips will actually be picked up
            if reuse == "RSB" and REUSE_RSB_TIPS:
                p50.pick_up_tip(RSB_tip[reuse_col])
            else:
                tt_50 -= 1
                if report:
                    ctx.comment("Column " + str(12 - tt_50))
                    ctx.comment("Available On Deck Slots:" + str(len(Available_on_deck_slots)))
                    ctx.comment("Available Off Deck Slots:" + str(len(Available_off_deck_slots)))
                p50.pick_up_tip()

        if rack == tip200:
            if tt_200 == 0 and reuse == None:  # If this is the first column of tip box and these aren't reused tips
                if len(Available_on_deck_slots) > 0:
                    """
                    If there are open deck slots --> need to add a new tip box before pickup
                    """
                    p200_rack_count += 1
                    tt_200 += 12
                    addtiprack = ctx.load_labware(
                        "opentrons_flex_96_tiprack_200ul", Available_on_deck_slots[0], f"200 ul Tip Rack #{p200_rack_count}"
                    )
                    if report:
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
                    if report:
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
                    if report:
                        ctx.comment(f"Adding 200 ul tip rack #{p200_rack_count}")
                    p200_racks_offdeck.append(addtiprack)  # used in TipSwap, then deleted once it is moved
                    p200.tip_racks.append(addtiprack)  # lets pipette know it can use this rack now
                    TipSwap(200)  # Throw first tip box out and replace with a box from staging area
            # Call where tips will actually be picked up
            if reuse == "REMOVE" and REUSE_REMOVE_TIPS:
                p200.pick_up_tip(RemoveSup_tip[reuse_col])
            elif reuse == "ETOH" and REUSE_ETOH_TIPS:
                p200.pick_up_tip(RemoveEtoh_tip[reuse_col])
            else:
                tt_200 -= 1
                if report:
                    ctx.comment(
                        "Column " + str(12 - tt_200) + " (may be negative in certain conditions- use 12 as a base [i.e -5 = column 7])"
                    )
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
        if report:
            ctx.comment(f"Threw out: {rack_to_dispose} and placed {rack_to_add} to {deck_slot}")

    def run_tag_profile():
        # Presetting Thermocycler Temps
        ctx.comment("****Starting TAG Profile (41C for 5 minutes with 100C lid)****")
        tc_mod.set_lid_temperature(100)
        tc_mod.set_block_temperature(41)

        if heater_shaker:
            h_s.deactivate_shaker()

        # Move Plate to TC
        ctx.comment("****Moving Plate to Pre-Warmed TC Module Block****")
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, tc_mod if ondeck_thermo else "A1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        tc_mod.close_lid()

        tc_mod.set_block_temperature(temperature=41, hold_time_minutes=5, block_max_volume=50)

        tc_mod.deactivate_block()

        tc_mod.open_lid()

        # #Move Plate to H-S
        ctx.comment("****Moving Plate off of TC****")
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, h_s if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

    def run_elm_profile():
        # get FLP plate out of the way
        ctx.comment("****Moving FLP Plate off TC****")
        ctx.move_labware(FLP_plate, magblock, use_gripper=USE_GRIPPER)

        # Presetting Thermocycler Temps
        ctx.comment("****Starting ELM Profile (37C for 5 minutes, then 50C for 5 minutes with 100C lid)****")
        tc_mod.set_lid_temperature(100)
        tc_mod.set_block_temperature(37)

        # Move Plate to TC
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Moving Sample Plate onto TC****")
        ctx.move_labware(sample_plate, tc_mod if ondeck_thermo else "A1", use_gripper=USE_GRIPPER)

        tc_mod.close_lid()

        tc_mod.set_block_temperature(temperature=37, hold_time_minutes=5, block_max_volume=50)
        tc_mod.set_block_temperature(temperature=50, hold_time_minutes=5, block_max_volume=50)

        tc_mod.deactivate_block()

        tc_mod.open_lid()

        tc_mod.deactivate_lid()

        # Move Plate to H-S
        ctx.comment("****Moving Sample Plate back to H-S****")
        ctx.move_labware(sample_plate, h_s if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        # get FLP plate out of the way
        ctx.comment("****Moving FLP Plate back to TC****")
        ctx.move_labware(FLP_plate, tc_mod if ondeck_thermo else "A1", use_gripper=USE_GRIPPER)

    def mix_beads(pip, res, vol, reps, col):
        """
        pip = which pipette
        res = plate/ reservoir well
        vol = volume of reagent that is used (will be used to calculate mix volume)
        reps = how many pipetting cycles should there be (1 rep = 1 asp/disp cycle + 1 cycle to clear tip)
        col = which column are you entering
        """

        # Multiplier tells
        mix_vol = (num_cols - col) * vol
        if pip == p50:
            if mix_vol >= 50:
                mix_vol = 40
        if pip == p200:
            if mix_vol >= 200:
                mix_vol = 185

        if res == ipb_res:
            width = res.width
        else:
            width = res.diameter
        move = (width / 2) - 1.5

        if report:
            ctx.comment(f"Mix Vol = {mix_vol}")

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
        if reps > 9:
            loc = loc + loc

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
            tiptrack(tip200, column, reuse="REMOVE" if REUSE_REMOVE_TIPS else None)
            p200.aspirate(vol_per_trans / 2, well.bottom(0.4))
            ctx.delay(seconds=1)
            p200.aspirate(vol_per_trans / 2, well.bottom(0.4))
            p200.air_gap(10)
            p200.dispense(p200.current_volume, waste_.top(-5))
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
    # 						First Definition- Tagmentation						   #
    ################################################################################

    def tagmentation():
        global reps
        global threshold
        ctx.comment("-------Starting Tagmentation-------")

        for i in range(num_cols):

            ctx.comment("**** Mixing and Transfering beads to column " + str(i + 1) + " ****")

            tiptrack(tip50, None, reuse=None)
            mix_beads(p50, blt_res, blt_vol, 7 if i == 0 else 2, i)  # 7 reps for first mix in reservoir
            p50.aspirate(blt_vol, blt_res, rate=0.2)
            p50.dispense(p50.current_volume, samples[i], rate=0.2)
            for x in range(reps):
                p50.aspirate(bead_mix_vol, samples[i].bottom(1))
                p50.dispense(p50.current_volume, samples[i].bottom(5))
                p50.aspirate(bead_mix_vol - 10, samples[i].bottom(3), rate=0.2 if x == threshold else 1)
                p50.dispense(p50.current_volume, samples[i].bottom(1), rate=0.2 if x == threshold else 1)
            if trash_tips:
                p50.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(1600)
            ctx.delay(
                minutes=2 if not dry_run else 0.25,
                msg="Please allow 2 minutes to mix beads \
                and tagmentation buffer with the sample. Shaking at 1600 rpm.",
            )
            h_s.deactivate_shaker()
        if ondeck_thermo:
            run_tag_profile()  # Heats TC --> moves plate to TC --> TAG Profile --> removes plate from TC
        else:
            if heater_shaker:
                h_s.open_labware_latch()
            ctx.pause(
                "Place plate on off-deck thermocycler and run pre-programmed TAG profile. Return to Heater-Shaker/ D1 and press resume."
            )
            if heater_shaker:
                h_s.close_labware_latch()

    ################################################################################
    # 							Tagmentation Cleanup							   #
    ################################################################################

    def post_tag_cleanup():
        global reps
        global threshold
        ctx.comment("-------Post-Tagmentation Cleanup-------")

        for i in range(num_cols):
            ctx.comment("**** Adding Stop Solution to Column " + str(i + 1) + " to Stop Tagmentation ****")

            tiptrack(tip50, None, reuse=None)
            p50.aspirate(st2_vol, st2_res.bottom().move(types.Point(x=1.5, y=0, z=0.5)), rate=0.3)
            p50.dispense(st2_vol, samples[i].bottom(1))
            for x in range(reps):
                p50.aspirate(45, samples[i].bottom(1))
                p50.dispense(45, samples[i].bottom(8))
                p50.aspirate(30, samples[i].bottom(3), rate=0.1 if x == threshold else 1)
                p50.dispense(30, samples[i].bottom(1), rate=0.1 if x == threshold else 1)
            p50.air_gap(5)
            p50.flow_rate.aspirate = 150
            p50.flow_rate.dispense = 150
            if trash_tips:
                p50.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(1600)
            ctx.delay(
                minutes=2 if not dry_run else 0.25,
                msg="Please allow 2 minutes for stop solution to mix with sample.\
             Shaking at 1600 rpm.",
            )
            h_s.deactivate_shaker()

        # move elution plate off magnet before moving sample plate there
        ctx.comment("****Moving Elution Plate from Magnet to TC****")
        ctx.move_labware(FLP_plate, tc_mod if ondeck_thermo else "A1", use_gripper=USE_GRIPPER)

        # Move Plate to (now empty) Magnet
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Moving Sample Plate to Magnet****")
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        # Settling time Timer
        for stopi in np.arange(2 if not dry_run else 0.5, 0, -0.5):
            ctx.delay(minutes=0.5, msg="There are " + str(stopi) + " minutes left in this incubation.")

        for col, i in enumerate(samples):
            remove_supernatant(i, 70, waste1_res, col)

        # Return Plate to H-S
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, h_s if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        ctx.comment("-------Adding TWB-------")
        tiptrack(tip200, None, reuse=None)
        for x, i in enumerate(samples):
            if x != 0:
                p200.dispense(20, twb_res.top(-1))
            p200.aspirate(twb1_vol + 10, twb_res, rate=0.3)
            p200.flow_rate.aspirate = 15
            p200.air_gap(10)
            p200.flow_rate.aspirate = 150
            # p200.dispense(p200.current_volume,i.top().move(types.Point(x=(i.diameter/2)-1.5,y=0,z=1.5)),rate=0.5)
            p200.dispense(twb1_vol + 10, i.top(2), rate=0.3)
            ctx.delay(seconds=0.5)
            p200.flow_rate.aspirate = 15
            p200.air_gap(10)
            p200.flow_rate.aspirate = 150
        if heater_shaker:
            if trash_tips:
                p200.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p200.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

            h_s.set_and_wait_for_shake_speed(1200)
            ctx.delay(minutes=2, msg="Shaking for 2 minutes at 1200 rpm.")
            h_s.deactivate_shaker()

        else:
            for n, i in enumerate(samples):
                if n != 0:
                    tiptrack(tip200, None, reuse=None)
                for x in range(10 if not dry_run else 1):
                    p200.aspirate(120, i.bottom(1), rate=0.4 if x == 9 else 1)
                    p200.dispense(120, i.bottom(8), rate=0.4 if x == 9 else 1)
                if trash_tips:
                    p200.drop_tip()
                    ctx.comment("****Dropping Tip in Waste shoot****")
                else:
                    p200.return_tip()
                    ctx.comment("****Dropping Tip Back in Tip Box****")

        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        # Settling Time timer
        for twbi in np.arange(2 if not dry_run else 0.5, 0, -0.5):
            ctx.delay(minutes=0.5, msg="There are " + str(twbi) + " minutes left in this incubation.")

        for col, i in enumerate(samples):
            remove_supernatant(i, 160, waste1_res, col)

        # Return Plate to H-S
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.move_labware(sample_plate, h_s if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

    ################################################################################
    # 								Index Ligation								   #
    ################################################################################

    def index_ligation():
        global reps
        global threshold
        ctx.comment("-------Ligating Indexes-------")
        tiptrack(tip200, None, reuse=None)
        for i, well in enumerate(samples):
            p200.aspirate(elm_vol, elm1_res if i < 3 else elm2_res, rate=0.2)
            p200.dispense(elm_vol, well.top(2), push_out=2, rate=0.2)
            if i == num_cols - 1:
                p200.air_gap(5)
        if trash_tips:
            p200.drop_tip()
            ctx.comment("****Dropping Tip in Waste shoot****")
        else:
            p200.return_tip()
            ctx.comment("****Dropping Tip Back in Tip Box****")

        ctx.comment("-------Adding and Mixing Adapters-------")
        for num, (i, x) in enumerate(zip(samples, adapters)):
            tiptrack(tip50, None, reuse=None)
            p50.aspirate(adapter_vol, x, rate=0.35)
            p50.aspirate(elm_vol - adapter_vol, i.bottom().move(types.Point(x=1, y=0, z=4)), rate=0.25)
            p50.dispense(p50.current_volume, i.bottom().move(types.Point(x=1, y=0, z=4)), rate=0.25)
            for x in range(reps):
                p50.flow_rate.aspirate = 25
                p50.flow_rate.dispense = 25
                p50.aspirate(elm_vol - 10, i)
                p50.dispense(p50.current_volume, i.bottom().move(types.Point(x=1.2, y=0, z=8)))
                p50.aspirate(elm_vol - 10, i.bottom(1))
                p50.dispense(p50.current_volume, i.bottom().move(types.Point(x=-1.2, y=0, z=3)))
            p50.flow_rate.aspirate = 150
            p50.flow_rate.dispense = 150
            if trash_tips:
                p50.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(1350)
            ctx.delay(
                minutes=2 if not dry_run else 0.25,
                msg="Please allow 2 minutes \
                for ELM and Adapters to mix with sample. Shaking at 1600 rpm.",
            )
            h_s.deactivate_shaker()
        if ondeck_thermo:
            run_elm_profile()
        else:
            if heater_shaker:
                h_s.open_labware_latch()
            ctx.pause(
                "Place plate on off-deck thermocycler and run pre-programmed ELM profile. Place FLP plate in A1. Return sample plate to Heater-Shaker/ D1 and press resume."
            )
            if heater_shaker:
                h_s.close_labware_latch()
        """
        Moves FLP plate off TC --> Heats TC --> moves sample plate to TC --> ELM Profile --> removes sample plate from TC --> places FLP plate back on TC
        """

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(1200)
            ctx.delay(minutes=1)
            h_s.deactivate_shaker()
            h_s.open_labware_latch()
        ctx.comment("****Moving Sample Plate to Magnet for Pelleting****")
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        ctx.delay(minutes=2, msg="Please allow 2 minutes for beads to pellet")

        for col, i in enumerate(samples):
            remove_supernatant(i, 60, waste2_res, col)

        # Return Plate to H-S
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Moving Plate back to Heater-Shaker for Wash****")
        ctx.move_labware(sample_plate, h_s if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        # Add Tag Wash Buffer
        ctx.comment("-------Adding TWB-------")
        tiptrack(tip200, None, reuse=None)
        for i in samples:
            p200.dispense(p200.current_volume, twb_res.top(-1))
            p200.aspirate(twb2_vol + 10, twb_res, rate=0.3)
            p200.flow_rate.aspirate = 15
            p200.air_gap(10)
            p200.flow_rate.aspirate = 150
            # p200.dispense(p200.current_volume,i.top().move(types.Point(x=(i.diameter/2)-1.5,y=0,z=1.5)),rate=0.5)
            p200.dispense(twb2_vol + 10, i.top(1), rate=0.3)
            ctx.delay(seconds=0.5)
            p200.flow_rate.aspirate = 15
            p200.air_gap(10)
            p200.flow_rate.aspirate = 150
        if heater_shaker:
            if trash_tips:
                p200.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p200.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")
            h_s.set_and_wait_for_shake_speed(1600)
            ctx.delay(
                minutes=2 if not dry_run else 0.25,
                msg="Please allow 2 minutes for \
                tagmentation wash buffer to mix with sample. Shaking at 1600 rpm.",
            )
            h_s.deactivate_shaker()

        else:
            for n, i in enumerate(samples):
                if n != 0:
                    tiptrack(tip200, None, reuse=None)
                for x in range(10 if not dry_run else 1):
                    p200.aspirate(75, i, rate=0.2 if x == 9 else 1)
                    p200.dispense(75, i.bottom(8), rate=0.2 if x == 9 else 1)
                if trash_tips:
                    p200.drop_tip()
                    ctx.comment("****Dropping Tip in Waste shoot****")
                else:
                    p200.return_tip()
                    ctx.comment("****Dropping Tip Back in Tip Box****")

        # Move Plate to Magnet
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Moving Sample Plate to Magnet for Pelleting****")
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        # Settling Time Timer
        for washi in np.arange(2 if not dry_run else 0.5, 0, -0.5):
            ctx.delay(minutes=0.5, msg="There are " + str(washi) + " minutes left in this incubation.")

        for col, i in enumerate(samples):
            remove_supernatant(i, 80, waste2_res, col)

        ctx.delay(minutes=2, msg="Pause for 2 minutes to allow residual liquid to dry")

        # Return Plate to H-S
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Removing Sample Plate from Magnet****")
        ctx.move_labware(sample_plate, h_s if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        ctx.comment("-------Adding and Mixing HP3-------")
        for i in samples:
            tiptrack(tip50, None, reuse=None)
            p50.aspirate(hp3_vol, hp3_res)
            p50.dispense(p50.current_volume, i)
            for x in range(reps):
                p50.aspirate(35, i)
                p50.dispense(35, i.bottom(8))
                p50.aspirate(30, i.bottom(1), rate=0.25 if x == threshold else 0.5)
                p50.dispense(30, i, rate=0.25 if x == threshold else 0.5)
            if trash_tips:
                p50.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(1600)
        ctx.delay(minutes=2, msg="Incubate for 2 minutes at RT")
        if heater_shaker:
            h_s.deactivate_shaker()

    ################################################################################
    # 								Final Cleanup								   #
    ################################################################################

    def lib_cleanup():
        global reps
        global threshold
        ctx.comment("-------Starting Cleanup-------")
        ctx.comment("-------Adding and Mixing Cleanup Beads-------")

        for x, i in enumerate(samples):
            if standard_input:
                tiptrack(tip200, None, reuse=None)
                mix_beads(
                    p200, ipb_res, 40, 7 if x == 0 else 2, num_cols - 1
                )  # num_cols-1 means there will be no calculation of volume, just use exact volume specified
                p200.aspirate(ipb1_vol, ipb_res, rate=0.3)
                p200.dispense(ipb1_vol, i.bottom(2), push_out=2, rate=0.5)
                mix_beads(p200, i, ipb1_vol, 7 if not dry_run else 1, num_cols - 1)
                if trash_tips:
                    p200.drop_tip()
                    ctx.comment("****Dropping Tip in Waste shoot****")
                else:
                    p200.return_tip()
                    ctx.comment("****Dropping Tip Back in Tip Box****")

            else:
                tiptrack(tip200, None, reuse=None)
                mix_beads(p200, ipb_res, ipb1_vol, 7 if x == 0 else 2, num_cols - 1)
                p200.aspirate(ipb1_vol, ipb_res, rate=0.3)
                p200.dispense(ipb1_vol, i.bottom(2), push_out=2, rate=0.5)
                mix_beads(p200, i, ipb1_vol, 7 if not dry_run else 1, num_cols - 1)
                if trash_tips:
                    p200.drop_tip()
                    ctx.comment("****Dropping Tip in Waste shoot****")
                else:
                    p200.return_tip()
                    ctx.comment("****Dropping Tip Back in Tip Box****")

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(1600)
        ctx.delay(minutes=ipb_inc, msg="Please wait " + str(ipb_inc) + " minutes while samples incubate at RT.")
        if heater_shaker:
            h_s.deactivate_shaker()

        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Moving Labware to Magnet for Pelleting****")
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        if not standard_input:
            pelleting_time = 4.5
        else:
            if num_cols <= 2:
                pelleting_time = 4.5
            elif 2 < num_cols <= 4:
                pelleting_time = 4
            elif 4 < num_cols <= 6:
                pelleting_time = 3.5

        ctx.delay(minutes=pelleting_time, msg="Time for Pelleting")

        if standard_input:
            ctx.comment("-------Mixing Beads and Transferring to LP2 Wells-------")
            # Add beads to LP2 wells
            tiptrack(tip200, None, reuse=None)  # Only 1 tip needed to transfer to clean wells
            for x, i in enumerate(samples_lp2):
                mix_beads(p200, ipb_res, 42, 7 if x == 0 else 1, x)
                p200.aspirate(ipb2_vol, ipb_res, rate=0.5)
                p200.dispense(p200.current_volume, i.bottom(1), push_out=2, rate=0.5)
                ctx.delay(seconds=1)
                p200.blow_out()
                p200.air_gap(5)
            if trash_tips:
                p200.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p200.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

            # Transfer Supernatant to LP2 wells
            for i, (s, l) in enumerate(zip(samples, samples_lp2)):
                tiptrack(tip200, None, reuse=None)
                p200.aspirate(76, s.bottom(0.6), rate=0.15)
                p200.air_gap(10)
                p200.dispense(p200.current_volume, l, rate=0.15)
                p200.air_gap(10)
                if trash_tips:
                    p200.drop_tip()
                    ctx.comment("****Dropping Tip in Waste shoot****")
                else:
                    p200.return_tip()
                    ctx.comment("****Dropping Tip Back in Tip Box****")

            # Move plate off magnet to allow bead mixing
            if heater_shaker:
                h_s.open_labware_latch()
            ctx.move_labware(sample_plate, h_s if heater_shaker else "D1", use_gripper=USE_GRIPPER)
            if heater_shaker:
                h_s.close_labware_latch()
            ctx.comment("-------Mixing Beads in LP2 Wells with LP1 Supernatant-------")
            # Mix beads in new wells with supernatant from first well
            for n, x in enumerate(samples_lp2):
                tiptrack(tip200, None, reuse=None)
                mix_beads(p200, x, 42, 8 if not dry_run else 1, n)
                if trash_tips:
                    p200.drop_tip()
                    ctx.comment("****Dropping Tip in Waste shoot****")
                else:
                    p200.return_tip()
                    ctx.comment("****Dropping Tip Back in Tip Box****")

            if heater_shaker:
                h_s.set_and_wait_for_shake_speed(1600)
            ctx.delay(minutes=2, msg="Allow 2 minutes for samples to incubate at RT")
            if heater_shaker:
                h_s.deactivate_shaker()

            # Move plate back to magnet for pelleting
            if heater_shaker:
                h_s.open_labware_latch()
            ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
            if heater_shaker:
                h_s.close_labware_latch()

            ctx.delay(minutes=5 if not dry_run else 0.25)

            for col, i in enumerate(samples_lp2):
                remove_supernatant(i, 110, waste2_res, col)  # leaving 8 ul to make sure no beads are taken -->
                # the extra will be removed in ethanol wash
            samp_list = samples_lp2

        else:
            ctx.delay(minutes=0.5)
            for col, i in enumerate(samples):
                remove_supernatant(i, 118, waste2_res, col)  # leaving 8 ul to make sure no beads are taken -->
                # the extra will be removed in ethanol wash
            samp_list = samples
        ################################################################################
        # 						Wash 2 x with 80% Ethanol							   #
        ################################################################################
        for y in range(2 if not dry_run else 1):
            ctx.comment(f"-------Wash # {y+1} with Ethanol-------")
            if y == 0:  # First wash
                this_res = etoh1_res
                this_waste_res = waste3_res
            else:  # Second Wash
                this_res = etoh2_res
                this_waste_res = waste4_res
            tiptrack(tip200, None, reuse=None)  # Always multi-dispense with ethanol tips
            for i in samp_list:
                p200.aspirate(10, this_res.top(4))
                p200.aspirate(etoh_vol, this_res, rate=0.3)
                p200.flow_rate.aspirate = 15
                p200.air_gap(10)
                p200.flow_rate.aspirate = 150
                p200.dispense(p200.current_volume, i.top().move(types.Point(x=(i.diameter / 2) - 1.5, y=0, z=3)), rate=0.6)
            p200.drop_tip() if trash_tips else p200.return_tip()

            # Remove the ethanol wash
            for x, i in enumerate(samp_list):
                tiptrack(tip200, x if REUSE_ETOH_TIPS else None, reuse="ETOH" if REUSE_ETOH_TIPS else None)
                p200.aspirate(100, i.bottom(3), rate=0.1)
                ctx.delay(seconds=0.5)
                p200.aspirate(100, i, rate=0.1)
                p200.dispense(p200.current_volume, this_waste_res.top(-1))
                ctx.delay(seconds=0.5)
                p200.blow_out()

                if REUSE_ETOH_TIPS:
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
        p200.flow_rate.dispense = 150

        ################################################################################
        # 				Washes Complete --> Clear liquid + Drying Steps				   #
        ################################################################################

        ctx.delay(minutes=1, msg="Allow 1 minute for ethanol aggregation and drying")

        for i in samp_list:
            tiptrack(tip50, None, reuse=None)
            p50.aspirate(20, i.bottom(0.5), rate=0.1)
            p50.dispense(p50.current_volume, waste4_res)
            if trash_tips:
                p50.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        # Return Plate to H-S from Magnet
        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Moving sample plate off of Magnet****")
        ctx.move_labware(sample_plate, h_s if heater_shaker else "D1", use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        ################################################################################
        # 							Adding RSB and Mixing							   #
        ################################################################################

        for col, i in enumerate(samp_list):
            ctx.comment(f"****Adding RSB to Columns: {col+1}****")
            tiptrack(tip50, col if REUSE_RSB_TIPS else None, reuse="RSB" if REUSE_RSB_TIPS else None)
            p50.aspirate(rsb_vol, rsb_res, rate=0.4)
            p50.dispense(p50.current_volume, i)
            mix_beads(p50, i, elution_vol, reps if not dry_run else 1, num_cols - 1)
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

        if heater_shaker:
            h_s.set_and_wait_for_shake_speed(1600)
        ctx.delay(minutes=2, msg="Allow 2 minutes for (shaking) incubation.")
        if heater_shaker:
            h_s.deactivate_shaker()

        ctx.delay(minutes=1, msg="Allow 1 minute for liquid aggregation.")

        if heater_shaker:
            h_s.open_labware_latch()
        ctx.comment("****Move Samples to Magnet for Pelleting****")
        ctx.move_labware(sample_plate, magblock, use_gripper=USE_GRIPPER)
        if heater_shaker:
            h_s.close_labware_latch()

        ctx.delay(minutes=2, msg="Please allow 2 minutes for beads to pellet.")

        p50.flow_rate.aspirate = 10
        for i, (s, e) in enumerate(zip(samp_list, samples_flp)):
            tiptrack(tip50, i if REUSE_RSB_TIPS else None, reuse="RSB" if REUSE_RSB_TIPS else None)
            p50.aspirate(elution_vol, s)
            p50.air_gap(5)
            p50.dispense(p50.current_volume, e.bottom(1), push_out=2)
            p50.air_gap(5)
            if trash_tips:
                p50.drop_tip()
                ctx.comment("****Dropping Tip in Waste shoot****")
            else:
                p50.return_tip()
                ctx.comment("****Dropping Tip Back in Tip Box****")

        if ondeck_thermo:
            # Set Block Temp for Final Plate
            tc_mod.set_block_temperature(4)

    if tagment:
        tagmentation()
    if tag_cleanup:
        post_tag_cleanup()
    if ligate_indexes and not tag_cleanup:
        ctx.move_labware(FLP_plate, tc_mod if ondeck_thermo else "A1", use_gripper=USE_GRIPPER)
    if ligate_indexes:
        index_ligation()
    if final_cleanup and not ligate_indexes:
        ctx.move_labware(FLP_plate, tc_mod if ondeck_thermo else "A1", use_gripper=USE_GRIPPER)
    if final_cleanup:
        lib_cleanup()
