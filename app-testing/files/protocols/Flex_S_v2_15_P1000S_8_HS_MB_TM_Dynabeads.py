def get_values(*names):
    import json

    _all_values = json.loads(
        """{"NUM_COL":12,"INCUBATION_ON_DECK":1,"INCUBATION_MIN":60,"READY_FOR_SDSPAGE":1,"protocol_filename":"Dynabeads_IP_Flex_96well_RIT_final"}"""
    )
    return [_all_values[n] for n in names]


metadata = {
    "protocolName": "Immunoprecipitation by Dynabeads - 96-well setting on Opentrons Flex (Reagents in 15 mL tubes)",
    "author": "Boren Lin, Opentrons",
    "description": "The protocol automates immunoprecipitation to isolate a protein of interest from liquid samples (up to 96 samples) by using protein A– or protein G–coupled magnetic beads.",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.15",
}

########################

NUM_COL = 12
INCUBATION_ON_DECK = 1  # Yes:1; No:0
INCUBATION_MIN = 60
READY_FOR_SDSPAGE = 0  # YES:1; NO:0

# if on deck:
INCUBATION_SPEEND = 1000

ASP_HEIGHT = 0.2
MIX_SPEEND = 2000
MIX_SEC = 10

MAG_DELAY_MIN = 1

BEADS_VOL = 50
AB_VOL = 50
SAMPLE_VOL = 200
WASH_TIMES = 3
WASH_VOL = 200
ELUTION_VOL = 50

WASTE_VOL_MAX = 275000

USE_GRIPPER = True

waste_vol_chk = 0

#########################


def run(ctx):

    global NUM_COL
    global INCUBATION_ON_DECK
    global INCUBATION_MIN
    global READY_FOR_SDSPAGE

    try:
        [NUM_COL, INCUBATION_ON_DECK, INCUBATION_MIN, READY_FOR_SDSPAGE] = get_values(
            "NUM_COL", "INCUBATION_ON_DECK", "INCUBATION_MIN", "READY_FOR_SDSPAGE"
        )
    except NameError:
        # get_values is not defined
        pass

    NUM_COL = int(NUM_COL)
    INCUBATION_ON_DECK = int(INCUBATION_ON_DECK)
    INCUBATION_MIN = int(INCUBATION_MIN)
    READY_FOR_SDSPAGE = int(READY_FOR_SDSPAGE)

    if READY_FOR_SDSPAGE == 0 and NUM_COL > 6:
        USE_TRASH_BIN = 0
    else:
        USE_TRASH_BIN = 1

    # load labware
    sample_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", "B2", "samples")
    wash_res = ctx.load_labware("nest_12_reservoir_15ml", "B1", "wash")
    reagent_res = ctx.load_labware("opentrons_15_tuberack_nest_15ml_conical", "C3", "reagents")
    waste_res = ctx.load_labware("nest_1_reservoir_290ml", "D2", "waste")

    tips = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "B3")
    tips_sample = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A2", "sample tips")
    tips_sample_loc = tips_sample.wells()[:95]
    if READY_FOR_SDSPAGE == 0:
        tips_elu = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A1", "elution tips")
        tips_elu_loc = tips_elu.wells()[:95]
    tips_reused = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "C2", "reused tips")
    tips_reused_loc = tips_reused.wells()[:95]
    p1000 = ctx.load_instrument("flex_8channel_1000", "left", tip_racks=[tips])
    p1000_single = ctx.load_instrument("flex_1channel_1000", "right", tip_racks=[tips])
    default_rate = 700
    p1000.flow_rate.aspirate = default_rate
    p1000.flow_rate.dispense = default_rate
    p1000_single.flow_rate.aspirate = default_rate
    p1000_single.flow_rate.dispense = default_rate

    h_s = ctx.load_module("heaterShakerModuleV1", "D1")
    h_s_adapter = h_s.load_adapter("opentrons_96_deep_well_adapter")
    working_plate = h_s_adapter.load_labware("nest_96_wellplate_2ml_deep", "wokring plate")

    if READY_FOR_SDSPAGE == 0:
        temp = ctx.load_module("Temperature Module Gen2", "D3")
        final_plate = temp.load_labware("opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep", "final plate")

    mag = ctx.load_module("magneticBlockV1", "C1")

    # liquids
    beads_vol_stock = (NUM_COL * 8 + 2) * BEADS_VOL
    beads_def = ctx.define_liquid(name="Beads", description="Dynebeads Slurry", display_color="#704848")  ## Brown
    reagent_res.wells()[0].load_liquid(liquid=beads_def, volume=beads_vol_stock)

    ab_vol_stock = (NUM_COL * 8 + 2) * AB_VOL
    ab_def = ctx.define_liquid(name="Antibody", description="Antibody in Solution", display_color="#9ACECB")  ## Blue
    reagent_res.wells()[1].load_liquid(liquid=ab_def, volume=ab_vol_stock)

    elu_vol_stock = (NUM_COL * 8 + 2) * ELUTION_VOL
    elu_def = ctx.define_liquid(name="Elution", description="Elution Buffer", display_color="#00FFF2")  ## Light Blue
    reagent_res.wells()[2].load_liquid(liquid=elu_def, volume=elu_vol_stock)

    sample_vol_stock = SAMPLE_VOL + 50
    sample_def = ctx.define_liquid(name="Samples", description="Sample per well", display_color="#52AAFF")  ## Blue
    for well_count in range(NUM_COL * 8):
        sample_plate.wells()[well_count].load_liquid(liquid=sample_def, volume=sample_vol_stock / (NUM_COL * 8))

    wash_vol_stock = WASH_VOL * (8 + 2) * 3
    wash_def = ctx.define_liquid(name="Wash", description="Wash Buffer per well", display_color="#FF0000")  ## Red
    for col_count in range(NUM_COL):
        wash_res.wells()[col_count].load_liquid(liquid=wash_def, volume=wash_vol_stock / (NUM_COL))

    samples = sample_plate.rows()[0][:NUM_COL]  ## 1
    beads = reagent_res.wells()[0]  ## 2
    ab = reagent_res.wells()[1]  ## 3
    elu = reagent_res.wells()[2]  ## 4
    wash = wash_res.rows()[0][:NUM_COL]  ## 5
    waste = waste_res.wells()[0]
    working_cols = working_plate.rows()[0][:NUM_COL]  ## 6
    working_wells = working_plate.wells()[: NUM_COL * 8]  ## 6
    if READY_FOR_SDSPAGE == 0:
        final_cols = final_plate.rows()[0][:NUM_COL]

    def transfer_plate_to_plate(vol1, start, end, liquid, drop_height=-20):
        for i in range(NUM_COL):
            if liquid == 1:
                p1000.pick_up_tip(tips_sample_loc[i * 8])
            else:
                p1000.pick_up_tip(tips_elu_loc[i * 8])
                p1000.flow_rate.aspirate = 50
            start_loc = start[i]
            end_loc = end[i]
            p1000.aspirate(vol1, start_loc.bottom(z=ASP_HEIGHT))
            p1000.air_gap(10)
            p1000.dispense(vol1 + 10, end_loc.top(z=drop_height))
            p1000.blow_out()
            p1000.touch_tip()
            if USE_TRASH_BIN == 1:
                p1000.drop_tip()
            else:
                p1000.return_tip()

    def transfer_well_to_plate(vol2, start, end, liquid, drop_height=-20):
        if liquid == 5:
            p1000.pick_up_tip()
            for j in range(NUM_COL):
                start_loc = start[j]
                end_loc = end[j]
                p1000.aspirate(vol2, start_loc.bottom(z=ASP_HEIGHT))
                p1000.air_gap(10)
                p1000.dispense(vol2 + 10, end_loc.top(z=drop_height))
                p1000.blow_out()
            p1000.drop_tip()
        else:
            p1000_single.pick_up_tip()
            start_loc = start
            vol = vol2 * 8
            p1000_single.mix(5, vol * 0.75, start_loc.bottom(z=ASP_HEIGHT * 5))
            p1000_single.mix(5, vol * 0.75, start_loc.bottom(z=ASP_HEIGHT * 20))
            for j in range(NUM_COL):
                end_loc_gap = end[j * 8]
                if liquid == 2:
                    p1000_single.mix(2, vol * 0.75, start_loc.bottom(z=ASP_HEIGHT * 5))
                p1000_single.aspirate(vol, start_loc.bottom(z=ASP_HEIGHT * 5))
                p1000_single.air_gap(10)
                p1000_single.dispense(10, end_loc_gap.top(z=-5))
                for jj in range(8):
                    end_loc = end[j * 8 + jj]
                    p1000_single.flow_rate.dispense = 500
                    p1000_single.dispense(vol2, end_loc.bottom(z=10), rate=0.75)
                    p1000_single.flow_rate.dispense = default_rate
                p1000_single.touch_tip()
            p1000_single.blow_out()
            p1000_single.drop_tip()

    def mix(speend, time):
        ctx.comment("\n\n\n~~~~~~~~Shake to mix~~~~~~~~\n")
        h_s.set_and_wait_for_shake_speed(rpm=speend)
        ctx.delay(seconds=time)
        h_s.deactivate_shaker()

    def discard(vol3, start):
        global waste_vol
        global waste_vol_chk
        if waste_vol_chk >= WASTE_VOL_MAX:
            ctx.pause("Empty Liquid Waste")
            waste_vol_chk = 0
        waste_vol = 0
        for k in range(NUM_COL):
            p1000.pick_up_tip(tips_reused_loc[k * 8])
            start_loc = start[k]
            end_loc = waste
            p1000.flow_rate.aspirate = 100
            p1000.aspirate(vol3, start_loc.bottom(z=ASP_HEIGHT))
            p1000.flow_rate.aspirate = default_rate
            p1000.air_gap(10)
            p1000.dispense(vol3 + 10, end_loc.top(z=-5))
            p1000.blow_out()
            p1000.return_tip()
        waste_vol = vol3 * NUM_COL * 8
        waste_vol_chk = waste_vol_chk + waste_vol

    # protocol

    ## Add beads, samples and antibody solution
    h_s.open_labware_latch()
    ctx.pause("Move the Working Plate to the Shaker")
    h_s.close_labware_latch()

    transfer_well_to_plate(BEADS_VOL, beads, working_wells, 2)

    h_s.open_labware_latch()
    # ctx.pause('Move the Working Plate to the Magnet')
    ctx.move_labware(labware=working_plate, new_location=mag, use_gripper=USE_GRIPPER)
    h_s.close_labware_latch()
    ctx.delay(minutes=MAG_DELAY_MIN)
    discard(BEADS_VOL * 1.1, working_cols)

    h_s.open_labware_latch()
    # ctx.pause('Move the Working Plate to the Shaker')
    ctx.move_labware(labware=working_plate, new_location=h_s_adapter, use_gripper=USE_GRIPPER)
    h_s.close_labware_latch()

    transfer_plate_to_plate(SAMPLE_VOL, samples, working_cols, 1)
    transfer_well_to_plate(AB_VOL, ab, working_wells, 3)

    h_s.set_and_wait_for_shake_speed(rpm=MIX_SPEEND)
    ctx.delay(seconds=MIX_SEC)

    if INCUBATION_ON_DECK == 1:
        h_s.set_and_wait_for_shake_speed(rpm=INCUBATION_SPEEND)
        ctx.delay(seconds=INCUBATION_MIN * 60)
        h_s.deactivate_shaker()
        h_s.open_labware_latch()

    else:
        # incubation off deck
        h_s.deactivate_shaker()
        h_s.open_labware_latch()
        ctx.pause("Seal the Plate")
        ctx.pause("Remove the Seal, Move the Plate to Shaker")

    # ctx.pause('Move the Working Plate to the Magnet')
    ctx.move_labware(labware=working_plate, new_location=mag, use_gripper=USE_GRIPPER)
    h_s.close_labware_latch()

    ctx.delay(minutes=MAG_DELAY_MIN)
    vol_total = SAMPLE_VOL + AB_VOL
    discard(vol_total * 1.1, working_cols)

    ## Wash
    for _ in range(WASH_TIMES):
        h_s.open_labware_latch()
        # ctx.pause('Move the Working Plate to the Shaker')
        ctx.move_labware(labware=working_plate, new_location=h_s_adapter, use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()

        transfer_well_to_plate(WASH_VOL, wash, working_cols, 5)
        mix(MIX_SPEEND, MIX_SEC)

        h_s.open_labware_latch()
        # ctx.pause('Move the Working Plate to the Magnet')
        ctx.move_labware(labware=working_plate, new_location=mag, use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()
        ctx.delay(minutes=MAG_DELAY_MIN)
        discard(WASH_VOL * 1.1, working_cols)

    ## Elution
    h_s.open_labware_latch()
    # ctx.pause('Move the Working Plate to the Shaker')
    ctx.move_labware(labware=working_plate, new_location=h_s_adapter, use_gripper=USE_GRIPPER)
    h_s.close_labware_latch()

    transfer_well_to_plate(ELUTION_VOL, elu, working_wells, 4)
    if READY_FOR_SDSPAGE == 1:
        ctx.pause("Seal the Working Plate")
        h_s.set_and_wait_for_temperature(70)
        mix(MIX_SPEEND, MIX_SEC)
        ctx.delay(minutes=10)
        h_s.deactivate_heater()
        h_s.open_labware_latch()
        ctx.pause("Protocol Complete")

    elif READY_FOR_SDSPAGE == 0:
        mix(MIX_SPEEND, MIX_SEC)
        ctx.delay(minutes=2)
        temp.set_temperature(4)

        h_s.open_labware_latch()
        # ctx.pause('Move the Working Plate to the Magnet')
        ctx.move_labware(labware=working_plate, new_location=mag, use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()
        ctx.delay(minutes=MAG_DELAY_MIN)
        transfer_plate_to_plate(ELUTION_VOL * 1.1, working_cols, final_cols, 6, -5)
        ctx.pause("Protocol Complete")
        temp.deactivate()
