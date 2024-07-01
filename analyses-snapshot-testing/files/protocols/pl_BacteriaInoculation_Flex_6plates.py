def get_values(*names):
    import json

    _all_values = json.loads("""{"DILUTION_PREP_ON_DECK":1,"NUM_SAMPLES":6,"protocol_filename":"BacteriaInoculation_Flex_6plates"}""")
    return [_all_values[n] for n in names]


from opentrons import types

metadata = {
    "protocolName": "Bacteria Inoculation for Colony-Forming Unit Measurement on Flex - up to 6 culture plates",
    "author": "Boren Lin, Opentrons",
    "source": "",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16",
}

NUM_SAMPLES = 6
## max. 6 samples and 6 plates
## from each sample, 6 10-fold dilutions are prepared plus 2 negative controls (medium only)
## on each plate, 1 set of above (6 dilutions + 2 controls) is inoculated

DILUTION_PREP_ON_DECK = 1
## Yes: 1; No: 0

SLOT_ADAPTER = "C2"
SLOT_STACKE = "B3"
SLOT_RESTACK = "D3"
VOL_INOCULATION = 10
TIME_SPREAD = 25


def run(ctx):

    global DILUTION_PREP_ON_DECK
    global NUM_SAMPLES

    try:
        [NUM_SAMPLES, DILUTION_PREP_ON_DECK] = get_values("NUM_SAMPLES", "DILUTION_PREP_ON_DECK")
    except NameError:
        # get_values is not defined
        pass

    NUM_SAMPLES = int(NUM_SAMPLES)
    DILUTION_PREP_ON_DECK = int(DILUTION_PREP_ON_DECK)

    # deck layout
    if DILUTION_PREP_ON_DECK == 1:
        sample_prep_stock = ctx.load_labware("opentrons_10_tuberack_nest_4x50ml_6x15ml_conical", "C1", "SAMPLES & MEDIUM")
        culture_stock = sample_prep_stock.wells()[:6]
        medium_stock = sample_prep_stock.wells()[9]

    hs = ctx.load_module("heaterShakerModuleV1", "D1")
    sample_prep_dilutions = hs.load_labware("nest_96_wellplate_2ml_deep", "DILUTION PLATE")
    dilution_plate = sample_prep_dilutions.rows()[:8][:12]

    ctx.load_trash_bin("A3")

    # liquids
    if DILUTION_PREP_ON_DECK == 1:
        medium_def = ctx.define_liquid(
            name="MEDIUM", description="Bacterial culture medium (e.g., LB broth)", display_color="#704848"
        )  ## Brown
        sample_prep_stock.wells()[9].load_liquid(liquid=medium_def, volume=25000)

        sample_def = ctx.define_liquid(name="SAMPLES", description="Samples to be assayed, per tube", display_color="#FF0000")  ## Red
        for count in range(NUM_SAMPLES):
            sample_prep_stock.wells()[count].load_liquid(liquid=sample_def, volume=1000 / NUM_SAMPLES)
    else:
        dilution_def = ctx.define_liquid(
            name="DILUTIONS", description="Serial 10-fold dilutions of each sample, per well", display_color="#00FFF2"
        )  ## Light Blue
        control_def = ctx.define_liquid(name="CONTROLS", description="Controls (medium only), per well", display_color="#52AAFF")  ## Blue
        for count in range(NUM_SAMPLES):
            sample_prep_dilutions.rows()[0][count].load_liquid(liquid=control_def, volume=450 / (NUM_SAMPLES * 2))
            sample_prep_dilutions.rows()[7][count].load_liquid(liquid=control_def, volume=450 / (NUM_SAMPLES * 2))
            for row in range(6):
                sample_prep_dilutions.rows()[row + 1][count].load_liquid(liquid=dilution_def, volume=450 / (NUM_SAMPLES * 6))

    # pipet settings
    if DILUTION_PREP_ON_DECK == 1:
        tiprack_1000 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A2")
        p1k_1 = ctx.load_instrument("flex_1channel_1000", "right", tip_racks=[tiprack_1000])
    else:
        p1k_1 = ctx.load_instrument("flex_1channel_1000", "right")

    tiprack_50 = ctx.load_labware("opentrons_flex_96_tiprack_50ul", "B2")
    p50_8 = ctx.load_instrument("flex_8channel_50", "left", tip_racks=[tiprack_50])

    # tilt function
    def tilt(slot, position):
        if position == "flat":
            x = 88.5
            y = 87.5
            z_upper = 150
            z_lower = 73
            p1k_1.move_to(ctx.deck.position_for(slot).move(types.Point(x=x, y=y, z=z_upper)))
            p1k_1.move_to(ctx.deck.position_for(slot).move(types.Point(x=x, y=y, z=z_lower)))

        elif position == "tilt":
            x = 13.5
            y = 87.5
            z_upper = 105
            z_lower = 52
            p1k_1.move_to(ctx.deck.position_for(slot).move(types.Point(x=x, y=y, z=z_upper)))
            p1k_1.move_to(ctx.deck.position_for(slot).move(types.Point(x=x, y=y, z=z_lower)))

    # protocol
    hs.open_labware_latch()
    ctx.pause("Load the Dilution Plate on the Heater Shaker")
    hs.close_labware_latch()

    ## dilution prep
    if DILUTION_PREP_ON_DECK == 1:
        for i in range(NUM_SAMPLES):
            p1k_1.pick_up_tip()
            start_medium = medium_stock
            end_0 = dilution_plate[0][i]
            p1k_1.aspirate(450, start_medium.bottom(z=2))
            p1k_1.air_gap(20)
            p1k_1.dispense(20, end_0.top(z=2))
            p1k_1.dispense(450, end_0.top(z=-10))
            for j in range(3):
                p1k_1.aspirate(900, start_medium.bottom(z=2))
                p1k_1.air_gap(20)
                p1k_1.dispense(20, end_0.top(z=2))
                for k in range(2):
                    end = dilution_plate[(j + 1) * 2 + k][i]
                    p1k_1.dispense(450, end.top(z=-10))
                p1k_1.blow_out()

            start_sample = culture_stock[i]
            end_1 = dilution_plate[1][i]
            p1k_1.mix(5, 500, start_sample.bottom(z=5))
            p1k_1.mix(5, 500, start_sample.bottom(z=10))
            p1k_1.blow_out(start_sample.top(z=-10))
            p1k_1.aspirate(500, start_sample.bottom(z=2))
            p1k_1.air_gap(20)
            p1k_1.dispense(520, end_1.top(z=-10))
            p1k_1.blow_out()
            for l in range(5):
                dilute_start = dilution_plate[l + 1][i]
                dilute_end = dilution_plate[l + 2][i]
                p1k_1.aspirate(50, dilute_start.bottom(z=2))
                p1k_1.dispense(50, dilute_end.top(z=-10))
                p1k_1.mix(5, 250, dilute_end.bottom(z=2))
                p1k_1.blow_out()
            p1k_1.air_gap(20)
            p1k_1.drop_tip()

    ## inoculation
    for plate_count in range(NUM_SAMPLES):
        working_plate = ctx.load_labware("omintray_1well_plate", SLOT_STACKE, "STACKED AGAR PLATES")
        ctx.move_labware(
            labware=working_plate,
            new_location=SLOT_ADAPTER,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 16 * (NUM_SAMPLES - 1 - plate_count) - 2},
            drop_offset={"x": 0, "y": 0, "z": 59},
        )

        ctx.move_labware(
            labware=working_plate,
            new_location="C3",
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 67},
            drop_offset={"x": 0, "y": 0, "z": 0},
        )

        tilt_plate = ctx.load_labware("omni_plate_tilt_adapter", SLOT_ADAPTER, "TILT ADAPTER")
        working_plate_tilt = tilt_plate.rows()[:8][:12]

        hs.set_and_wait_for_shake_speed(2000)
        ctx.delay(seconds=3)
        hs.deactivate_shaker()
        start = dilution_plate[0][plate_count]
        end = working_plate_tilt[0][11]
        p50_8.pick_up_tip()
        p50_8.mix(2, 40, start.bottom(z=2))
        p50_8.aspirate(VOL_INOCULATION, start.bottom(z=2))
        ctx.delay(seconds=3)
        p50_8.air_gap(5)
        p50_8.dispense(5, end.top(z=0))
        p50_8.dispense(VOL_INOCULATION, end.top(z=-5))
        ctx.delay(seconds=3)
        p50_8.air_gap(10)
        p50_8.drop_tip()

        tilt(SLOT_ADAPTER, "tilt")
        ctx.delay(seconds=TIME_SPREAD)
        tilt(SLOT_ADAPTER, "flat")
        ctx.delay(seconds=10)

        del ctx.deck[SLOT_ADAPTER]

        ctx.move_labware(
            labware=working_plate,
            new_location=SLOT_ADAPTER,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 0},
            drop_offset={"x": 0, "y": 0, "z": 68},
        )

        ctx.move_labware(
            labware=working_plate,
            new_location=SLOT_RESTACK,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": 57},
            drop_offset={"x": 0, "y": 0, "z": 16 * plate_count - 2},
        )

        del ctx.deck[SLOT_RESTACK]

    hs.open_labware_latch()
    ctx.pause("Move Plates to Incubator")
