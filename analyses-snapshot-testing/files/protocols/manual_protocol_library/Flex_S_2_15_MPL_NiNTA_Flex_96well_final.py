def get_values(*names):
    import json

    _all_values = json.loads(
        """{"NUM_COL":12,"INCUBATION_ON_DECK":1,"INCUBATION_MIN":60,"ELUTION_TIMES":1,"BEADS_PRELOAD":1,"protocol_filename":"NiNTA_Flex_96well_final"}"""
    )
    return [_all_values[n] for n in names]


metadata = {
    "protocolName": "Immobilized Metal Affinity Chromatography by Ni-NTA Magnetic Agarose Beads - 96-well setting on Opentrons Flex",
    "author": "Boren Lin, Opentrons",
    "description": "The protocol automates immobilized metal affinity chromatography (IMAC) using Ni-NTA magnetic agarose beads to isolate a protein of interest from liquid samples (up to 96 samples).",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.15",
}

########################

NUM_COL = 12
INCUBATION_ON_DECK = 1  # Yes:1; No:0
INCUBATION_MIN = 60
ELUTION_TIMES = 1  # 1 or 2
BEADS_PRELOAD = 0  # Yes: 1; No: 0

# if on deck:
INCUBATION_SPEEND = 1000

ASP_HEIGHT = 0.2
MIX_SPEEND = 2000
MIX_SEC = 10
ELUTION_SPEEND = 1000
ELUTION_MIN = 10

MAG_DELAY_MIN = 2

BEADS_VOL = 100
EQUILIBRATION_VOL1 = 400
EQUILIBRATION_VOL2 = 500
SAMPLE_VOL = 500
WASH_TIMES = 2
WASH_VOL = 500
ELUTION_VOL = 250

WASTE_VOL_MAX = 275000

COOLING_DELAY_MIN = 3

USE_GRIPPER = True

waste_vol_chk = 0

#########################


def run(ctx):

    global NUM_COL
    global INCUBATION_ON_DECK
    global INCUBATION_MIN
    global ELUTION_TIMES
    global BEADS_PRELOAD

    try:
        [NUM_COL, INCUBATION_ON_DECK, INCUBATION_MIN, ELUTION_TIMES, BEADS_PRELOAD] = get_values(
            "NUM_COL", "INCUBATION_ON_DECK", "INCUBATION_MIN", "ELUTION_TIMES", "BEADS_PRELOAD"
        )
    except NameError:
        # get_values is not defined
        pass

    NUM_COL = int(NUM_COL)
    INCUBATION_ON_DECK = int(INCUBATION_ON_DECK)
    INCUBATION_MIN = int(INCUBATION_MIN)
    ELUTION_TIMES = int(ELUTION_TIMES)
    BEADS_PRELOAD = int(BEADS_PRELOAD)

    # load labware
    sample_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", "B3", "samples")
    if BEADS_PRELOAD == 0:
        beads_res = ctx.load_labware("nest_96_wellplate_2ml_deep", "B1", "beads")
    eql_res = ctx.load_labware("nest_96_wellplate_2ml_deep", "B2", "equilibration buffer")
    wash_res = ctx.load_labware("nest_96_wellplate_2ml_deep", "C3", "wash buffer")
    elution_res = ctx.load_labware("nest_96_wellplate_2ml_deep", "A2", "elution buffer")
    waste_res = ctx.load_labware("nest_1_reservoir_290ml", "D2", "waste")

    tips_reused = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "C2")
    tips_reused_loc = tips_reused.wells()[:96]
    tips_elu = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A1", "elution tips")
    tips_elu_loc = tips_elu.wells()[:96]
    p1000 = ctx.load_instrument("flex_8channel_1000", "left")
    default_rate = 700
    p1000.flow_rate.aspirate = default_rate
    p1000.flow_rate.dispense = default_rate

    h_s = ctx.load_module("heaterShakerModuleV1", "D1")
    h_s_adapter = h_s.load_adapter("opentrons_96_deep_well_adapter")
    working_plate = h_s_adapter.load_labware("nest_96_wellplate_2ml_deep", "working plate")

    temp = ctx.load_module("Temperature Module Gen2", "D3")
    final_plate = temp.load_labware("opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep", "final plate")

    mag = ctx.load_module("magneticBlockV1", "C1")

    # liquids
    sample_vol_stock = SAMPLE_VOL + 50
    sample_def = ctx.define_liquid(name="SAMPLES", description="Sample per well", display_color="#52AAFF")  ## Blue
    for well_count in range(NUM_COL * 8):
        sample_plate.wells()[well_count].load_liquid(liquid=sample_def, volume=sample_vol_stock / (NUM_COL * 8))

    eql_vol_res = EQUILIBRATION_VOL1 + EQUILIBRATION_VOL2 + 50
    eql_def = ctx.define_liquid(name="EQUILIBRATION", description="Equilibration Buffer per Well", display_color="#9ACECB")  ## Blue
    for well_count in range(NUM_COL * 8):
        eql_res.wells()[well_count].load_liquid(liquid=eql_def, volume=eql_vol_res / (NUM_COL * 8))

    wash_vol_res = WASH_VOL * WASH_TIMES + 50
    wash_def = ctx.define_liquid(name="WASH", description="Wash Buffer per Well", display_color="#FF0000")  ## Red
    for well_count in range(NUM_COL * 8):
        wash_res.wells()[well_count].load_liquid(liquid=wash_def, volume=wash_vol_res / (NUM_COL * 8))

    elu_vol_res = ELUTION_VOL * ELUTION_TIMES + 50
    elu_def = ctx.define_liquid(name="ELUTION", description="Elution Buffer per Well", display_color="#00FFF2")  ## Light Blue
    for well_count in range(NUM_COL * 8):
        elution_res.wells()[well_count].load_liquid(liquid=elu_def, volume=elu_vol_res / (NUM_COL * 8))

    beads_vol_res = BEADS_VOL + 50
    if BEADS_PRELOAD == 0:
        beads_def = ctx.define_liquid(name="BEADS", description="Ni-NTA Bead Slurry", display_color="#704848")  ## Brown
        for well_count in range(NUM_COL * 8):
            beads_res.wells()[well_count].load_liquid(liquid=beads_def, volume=beads_vol_res / (NUM_COL * 8))
    else:
        beads_def = ctx.define_liquid(name="BEADS", description="Ni-NTA Bead Slurry in Working Plate", display_color="#704848")  ## Brown
        for well_count in range(NUM_COL * 8):
            working_plate.wells()[well_count].load_liquid(liquid=beads_def, volume=beads_vol_res / (NUM_COL * 8))

    samples = sample_plate.rows()[0][:NUM_COL]
    if BEADS_PRELOAD == 0:
        beads = beads_res.rows()[0][:NUM_COL]  # reagent 2
    eql = eql_res.rows()[0][:NUM_COL]
    wash = wash_res.rows()[0][:NUM_COL]
    elu = elution_res.rows()[0][:NUM_COL]  # reagent 1
    waste = waste_res.wells()[0]

    working_cols = working_plate.rows()[0][:NUM_COL]  # reagent 3
    final_cols = final_plate.rows()[0][:NUM_COL]

    def transfer(vol1, start, end, reagent=0):
        for i in range(NUM_COL):
            if reagent == 1 or reagent == 3:
                p1000.pick_up_tip(tips_elu_loc[i * 8])
            else:
                p1000.pick_up_tip(tips_reused_loc[i * 8])
            start_loc = start[i]
            end_loc = end[i]
            if reagent == 2:
                p1000.mix(5, vol1 * 0.75, start_loc.bottom(z=ASP_HEIGHT * 2))
            if reagent == 3:
                p1000.flow_rate.aspirate = 100
                p1000.aspirate(vol1, start_loc.bottom(z=ASP_HEIGHT))
                p1000.flow_rate.aspirate = default_rate
            else:
                p1000.aspirate(vol1, start_loc.bottom(z=ASP_HEIGHT))
            p1000.air_gap(10)
            p1000.dispense(vol1 + 10, end_loc.top(z=-5))
            p1000.touch_tip()
            p1000.blow_out()
            p1000.return_tip()

    def mix(speend, time):
        ctx.comment("\n\n\n~~~~~~~~Shake to mix~~~~~~~~\n")
        h_s.set_and_wait_for_shake_speed(rpm=speend)
        ctx.delay(seconds=time)
        h_s.deactivate_shaker()

    def discard(vol2, start):
        global waste_vol
        global waste_vol_chk
        if waste_vol_chk >= WASTE_VOL_MAX:
            ctx.pause("Empty Liquid Waste")
            waste_vol_chk = 0
        waste_vol = 0
        for j in range(NUM_COL):
            p1000.pick_up_tip(tips_reused_loc[j * 8])
            start_loc = start[j]
            end_loc = waste
            p1000.flow_rate.aspirate = 100
            p1000.aspirate(vol2, start_loc.bottom(z=ASP_HEIGHT))
            p1000.flow_rate.aspirate = default_rate
            p1000.air_gap(10)
            p1000.dispense(vol2 + 10, end_loc.top(z=2))
            p1000.blow_out()
            p1000.return_tip()
        waste_vol = vol2 * NUM_COL * 8
        waste_vol_chk = waste_vol_chk + waste_vol

    # protocol

    ## Equilibration
    h_s.open_labware_latch()
    ctx.pause("Move the Working Plate to the Shaker")
    h_s.close_labware_latch()

    if BEADS_PRELOAD == 0:
        transfer(BEADS_VOL, beads, working_cols, 2)
    transfer(EQUILIBRATION_VOL1, eql, working_cols)
    mix(MIX_SPEEND, MIX_SEC)

    h_s.open_labware_latch()
    # ctx.pause('Move the Working Plate to the Magnet')
    ctx.move_labware(labware=working_plate, new_location=mag, use_gripper=USE_GRIPPER)
    h_s.close_labware_latch()
    ctx.delay(minutes=MAG_DELAY_MIN)
    discard(EQUILIBRATION_VOL1 * 1.1 + BEADS_VOL, working_cols)

    h_s.open_labware_latch()
    # ctx.pause('Move the Working Plate to the Shaker')
    ctx.move_labware(labware=working_plate, new_location=h_s_adapter, use_gripper=USE_GRIPPER)
    h_s.close_labware_latch()

    transfer(EQUILIBRATION_VOL2, eql, working_cols)
    mix(MIX_SPEEND, MIX_SEC)

    h_s.open_labware_latch()
    # ctx.pause('Move the Working Plate to the Magnet')
    ctx.move_labware(labware=working_plate, new_location=mag, use_gripper=USE_GRIPPER)
    h_s.close_labware_latch()
    ctx.delay(minutes=MAG_DELAY_MIN)
    discard(EQUILIBRATION_VOL2 * 1.1, working_cols)

    ## Protein Capture
    h_s.open_labware_latch()
    # ctx.pause('Move the Working Plate to the Shaker')
    ctx.move_labware(labware=working_plate, new_location=h_s_adapter, use_gripper=USE_GRIPPER)
    h_s.close_labware_latch()

    transfer(SAMPLE_VOL, samples, working_cols)
    h_s.set_and_wait_for_shake_speed(rpm=MIX_SPEEND)
    ctx.delay(seconds=MIX_SEC)

    if INCUBATION_ON_DECK == 1:
        mix(INCUBATION_SPEEND, INCUBATION_MIN * 60)
        h_s.open_labware_latch()

    else:
        # incubation off deck
        h_s.deactivate_shaker()
        h_s.open_labware_latch()
        ctx.pause("Seal the Plate")
        ctx.pause("Remove the Seal, Move the Plate back to Shaker")

    # ctx.pause('Move the Working Plate to the Magnet')
    ctx.move_labware(labware=working_plate, new_location=mag, use_gripper=USE_GRIPPER)
    h_s.close_labware_latch()

    ctx.delay(minutes=MAG_DELAY_MIN)
    discard(SAMPLE_VOL * 1.1, working_cols)

    ## Wash
    for _ in range(WASH_TIMES):
        h_s.open_labware_latch()
        # ctx.pause('Move the Working Plate to the Shaker')
        ctx.move_labware(labware=working_plate, new_location=h_s_adapter, use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()

        transfer(WASH_VOL, wash, working_cols)
        mix(MIX_SPEEND, MIX_SEC)

        h_s.open_labware_latch()
        # ctx.pause('Move the Working Plate to the Magnet')
        ctx.move_labware(labware=working_plate, new_location=mag, use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()
        ctx.delay(minutes=MAG_DELAY_MIN)
        discard(WASH_VOL * 1.1, working_cols)

    ## Elution
    for j in range(ELUTION_TIMES):
        h_s.open_labware_latch()
        # ctx.pause('Move the Working Plate to the Shaker')
        ctx.move_labware(labware=working_plate, new_location=h_s_adapter, use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()

        transfer(ELUTION_VOL, elu, working_cols, 1)
        h_s.set_and_wait_for_shake_speed(rpm=MIX_SPEEND)
        ctx.delay(seconds=MIX_SEC)
        h_s.set_and_wait_for_shake_speed(rpm=ELUTION_SPEEND)
        if j == 0:
            temp.set_temperature(4)
            delay = ELUTION_MIN - COOLING_DELAY_MIN
            ctx.delay(seconds=delay * 60)
        else:
            delay = ELUTION_MIN
            ctx.delay(seconds=delay * 60)
        h_s.deactivate_shaker()

        h_s.open_labware_latch()
        # ctx.pause('Move the Working Plate to the Magnet')
        ctx.move_labware(labware=working_plate, new_location=mag, use_gripper=USE_GRIPPER)
        h_s.close_labware_latch()
        ctx.delay(minutes=MAG_DELAY_MIN)
        transfer(ELUTION_VOL * 1.1, working_cols, final_cols, 3)

    ctx.pause("Protocol Complete")
    temp.deactivate()
