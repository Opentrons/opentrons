def get_values(*names):
    import json

    _all_values = json.loads("""{"NUM_SAMPLES":96,"PIPET_LOCATION":1,"protocol_filename":"SamplePrep_MS_Cleanup_Flex_upto96"}""")
    return [_all_values[n] for n in names]


from opentrons.types import Point

metadata = {"protocolName": "Digested Sample Clean-up for LC/MS - Flex w/ Thermal Cycler", "author": "Boren Lin, Opentrons", "source": ""}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.16",
}

########################

NUM_SAMPLES = 96
# max. 96

CLEANUP_VOL = 55
SP3_VOL = 10
ACN_VOL_1 = 1292
ACN_VOL_2 = 1000
DMSO_VOL = 80

PIPET_LOCATION = 1
# P1000 8-ch at Left: 1; Right :2

USE_GRIPPER = True

#########################

try:
    [NUM_SAMPLES, PIPET_LOCATION] = get_values("NUM_SAMPLES", "PIPET_LOCATION")

except NameError:
    # get_values is not defined, so proceed with defaults
    pass

global num_col
global m1000_loc

num_col = int(NUM_SAMPLES // 8)
if NUM_SAMPLES % 8 != 0:
    num_col = num_col + 1

if PIPET_LOCATION == 1:
    m1000_loc = "Left"
else:
    m1000_loc = "Right"


def run(ctx):

    # load labware
    tc = ctx.load_module("thermocycler module gen2")
    sample_digested_plate = tc.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "DIGESTED SAMPLES")

    hs = ctx.load_module("heaterShakerModuleV1", "D1")
    hs_adapter = hs.load_adapter("opentrons_96_deep_well_adapter")
    working_plate = hs_adapter.load_labware("nest_96_wellplate_2ml_deep", "WORKING PLATE - CLEAN-UP")

    acn_stock = ctx.load_labware("nest_1_reservoir_290ml", "C1", "ACN")
    waste_res = ctx.load_labware("nest_1_reservoir_290ml", "D2", "LIQUID WASTE")
    mag = ctx.load_module("magneticBlockV1", "C2")
    reagent_res = ctx.load_labware("nest_96_wellplate_2ml_deep", "C3", "REAGENTS")
    # beads, DMSO 2%
    final_plate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "D3", "FINAL PRODUCTS")

    tips_200_sample = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "B3", "200uL TIPS")
    tip_loc_sample = tips_200_sample.wells()[:96]
    tips_200_elution = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "C4", "200uL TIPS")
    tip_loc_elution = tips_200_elution.wells()[:96]

    tips_200_reagent = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "A3", "200uL TIPS")
    tip_loc_reagent = tips_200_reagent.wells()[:96]

    tips_1000_wash1 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "B2", "1000uL TIPS")
    tip_loc_wash1 = tips_1000_wash1.wells()[:96]
    tips_1000_wash2 = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "A2", "1000uL TIPS")
    tip_loc_wash2 = tips_1000_wash2.wells()[:96]

    m1000 = ctx.load_instrument("flex_8channel_1000", m1000_loc)

    # assign locations
    sample_digested = sample_digested_plate.rows()[0][:num_col]

    sp3 = reagent_res.rows()[0][0]
    dmso = reagent_res.rows()[0][1]
    acn = acn_stock.wells()[0]
    waste = waste_res.wells()[0]
    working = working_plate.rows()[0][:num_col]
    final = final_plate.rows()[0][:NUM_SAMPLES]

    # liquid info and deck payout
    vol_sample = 130
    def_sample = ctx.define_liquid(
        name="DIGESTED SAMPLES", description="Digested Protein samples, volume per well", display_color="#FF0000"
    )  ## Red
    for p in range(NUM_SAMPLES):
        sample_digested_plate.wells()[p].load_liquid(liquid=def_sample, volume=vol_sample / NUM_SAMPLES)

    vol_sp3 = (SP3_VOL * num_col) + 20
    vol_dmso = (DMSO_VOL * num_col) + 20
    def_sp3 = ctx.define_liquid(
        name="BEAD SLURRY", description="50 ug/uL Magnetic Beads for SP3 in MS grade water, volume per well", display_color="#0000FF"
    )  ## Blue
    def_dmso = ctx.define_liquid(name="DMSO", description="2% DMSO in MS grade water, volume per well", display_color="#FFB6C1")  ## Pink
    for p in range(8):
        reagent_res.rows()[p][0].load_liquid(liquid=def_sp3, volume=vol_sp3 / 8)
        reagent_res.rows()[p][1].load_liquid(liquid=def_dmso, volume=vol_dmso / 8)

    vol_acn = (ACN_VOL_1 + ACN_VOL_2) * num_col * 8 + 24000
    def_acn = ctx.define_liquid(name="ACN", description="MS grade Acetonitrile", display_color="#E5E4E2")  ## Gray
    acn_stock.wells()[0].load_liquid(liquid=def_acn, volume=vol_acn)

    # protocol

    tc.open_lid()

    ctx.pause("Place WORKING PLATE - DIGESTION in Thermal Cycler")
    ctx.pause("Load ACN Reservoir on Slot C1 and Reagent Plate on Slot C3")

    hs.open_labware_latch()
    ctx.pause("Load WORKING PLATE - CLEAN-UP on Heater Shaker")
    hs.close_labware_latch()

    ## prepare samples for SP3 clean-up
    for n in range(num_col):
        start = sample_digested[n]
        end = working[n]
        m1000.pick_up_tip(tip_loc_sample[n * 8])
        m1000.mix(3, CLEANUP_VOL * 0.75, start.bottom(z=0.2))
        m1000.aspirate(CLEANUP_VOL, start.bottom(z=0.2))
        ctx.delay(seconds=3)
        m1000.air_gap(10)
        m1000.dispense(10, end.top(z=0))
        m1000.dispense(CLEANUP_VOL, end.bottom(z=10))
        ctx.delay(seconds=3)
        m1000.blow_out()
        m1000.return_tip()

    ctx.move_labware(
        labware=tips_200_sample,
        new_location="B4",
        use_gripper=USE_GRIPPER,
    )

    ctx.move_labware(
        labware=tips_200_elution,
        new_location="B3",
        use_gripper=USE_GRIPPER,
    )

    ## add SP3
    total_vol = CLEANUP_VOL

    m1000.pick_up_tip(tip_loc_reagent[0])
    for n in range(num_col):
        end_loc = working[n]
        m1000.mix(5, SP3_VOL * (num_col - n), sp3.bottom(z=0.2))
        m1000.aspirate(SP3_VOL, sp3.bottom(z=0.2))
        ctx.delay(seconds=3)
        m1000.air_gap(10)
        m1000.dispense(10, end_loc.top(z=0))
        m1000.dispense(SP3_VOL, end_loc.top(z=-5))
        m1000.blow_out()
    m1000.return_tip()

    total_vol = total_vol + SP3_VOL

    ## add ACN and discard
    acn_vol = [ACN_VOL_1, ACN_VOL_2]
    for wash in range(2):
        x = int(acn_vol[wash] // 750)
        if wash == 0:
            m1000.pick_up_tip(tip_loc_wash1[0])
        else:
            m1000.pick_up_tip(tip_loc_wash2[0])
        for _ in range(x):
            for n in range(num_col):
                start_loc = acn.bottom(z=0.2).move(Point(x=n * 9 - 49.5))
                end_loc = working[n]
                m1000.aspirate(750, start_loc)
                m1000.air_gap(20)
                m1000.dispense(750 + 20, end_loc.top(z=-5))
                m1000.blow_out()
            if acn_vol[wash] % 750 != 0:
                for n in range(num_col):
                    start_loc = acn.bottom(z=0.2).move(Point(x=n * 9 - 49.5))
                    end_loc = working[n]
                    m1000.aspirate(acn_vol[wash] - (750 * x), start_loc)
                    m1000.air_gap(20)
                    m1000.dispense(acn_vol[wash] - (750 * x) + 20, end_loc.top(z=-5))
        m1000.return_tip()

        hs.set_and_wait_for_shake_speed(rpm=500)
        ctx.delay(seconds=10)
        hs.set_and_wait_for_shake_speed(rpm=1500)
        ctx.delay(seconds=10)
        hs.set_and_wait_for_shake_speed(rpm=750)
        ctx.delay(seconds=40)
        hs.deactivate_shaker()

        hs.open_labware_latch()
        ctx.move_labware(
            labware=working_plate,
            new_location=mag,
            use_gripper=USE_GRIPPER,
        )
        ctx.delay(minutes=3)

        total_vol = total_vol + acn_vol[wash]

        x = int(total_vol // 750)
        if total_vol % 750 != 0:
            x = x + 1
        for _ in range(x):
            for n in range(num_col):
                if wash == 0:
                    m1000.pick_up_tip(tip_loc_wash1[n * 8])
                else:
                    m1000.pick_up_tip(tip_loc_wash2[n * 8])
                start_loc = working[n]
                m1000.aspirate(750, start_loc.bottom(z=0.2))
                m1000.air_gap(20)
                m1000.dispense(750 + 20, waste.top(z=-5))
                m1000.blow_out()
                m1000.return_tip()

        total_vol = 0

        ctx.move_labware(labware=working_plate, new_location=hs_adapter, use_gripper=USE_GRIPPER)
        hs.close_labware_latch()

    ctx.delay(minutes=2)

    ## add 2% DMSO
    m1000.pick_up_tip(tip_loc_reagent[8])
    for n in range(num_col):
        end_loc = working[n]
        m1000.aspirate(DMSO_VOL, dmso.bottom(z=0.2))
        ctx.delay(seconds=3)
        m1000.air_gap(10)
        m1000.dispense(DMSO_VOL + 10, end_loc.bottom(z=20))
        m1000.blow_out()
    m1000.return_tip()

    hs.set_and_wait_for_shake_speed(rpm=2000)
    ctx.delay(seconds=60)
    hs.deactivate_shaker()

    ## transfer final product
    hs.open_labware_latch()
    ctx.move_labware(labware=working_plate, new_location=mag, use_gripper=USE_GRIPPER)
    ctx.delay(minutes=3)

    for n in range(num_col):
        start = working[n]
        end = final[n]
        m1000.pick_up_tip(tip_loc_elution[n * 8])
        m1000.aspirate(DMSO_VOL * 1.1, start.bottom(z=0.2))
        ctx.delay(seconds=3)
        m1000.air_gap(10)
        m1000.dispense(DMSO_VOL * 1.1 + 10, end.top(z=0))
        m1000.return_tip()
