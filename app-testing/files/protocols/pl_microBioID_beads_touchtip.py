def get_values(*names):
    import json

    _all_values = json.loads(
        """{"num_samp":8,"digest_time_hours":12,"bead_incubation":15,"test_mode":false,"p50_mount":"right","m50_mount":"left","protocol_filename":"microBioID_beads_touchtip"}"""
    )
    return [_all_values[n] for n in names]


# flake8: noqa

from opentrons import protocol_api
from opentrons import protocol_engine
from opentrons import types
import random
import math

metadata = {
    "ctx.Name": "microBioID Protocol",
    "author": "Rami Farawi <rami.farawi@opentrons.com",
}
requirements = {"robotType": "OT-3", "apiLevel": "2.16"}


def run(ctx: protocol_api.ProtocolContext):

    [num_samp, digest_time_hours, bead_incubation, test_mode, p50_mount, m50_mount] = get_values(  # noqa: F821
        "num_samp", "digest_time_hours", "bead_incubation", "test_mode", "p50_mount", "m50_mount"
    )

    # num_samp = 96
    # digest_time_hours = 2
    # test_mode = False
    #
    # p50_mount = 'left'
    # m50_mount = 'right'

    num_col = math.ceil(num_samp / 8)

    # DECK SETUP AND LABWARE
    hs = ctx.load_module("heaterShakerModuleV1", "D1")
    hs_plate = hs.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")
    hs.close_labware_latch()

    mag_block = ctx.load_module("magneticBlockV1", "C2")

    tuberack = ctx.load_labware("opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap", "A3")

    start_sample_plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "D2")

    reagent_deep_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", "C3")
    dest_plate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", protocol_api.OFF_DECK)
    reagent_pcr_plate = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", "C1")

    deck_slots = ["B1", "B2", "B3", "A1", "A2"]
    staging_slots = ["A4", "B4", "C4", "D4"]
    tiprack_50 = [ctx.load_labware("opentrons_flex_96_tiprack_50ul", slot) for slot in deck_slots]

    staging_racks = [ctx.load_labware("opentrons_flex_96_tiprack_50ul", slot) for slot in staging_slots]
    chute = ctx.load_waste_chute()

    # LOAD PIPETTES
    p50 = ctx.load_instrument("flex_1channel_50", p50_mount, tip_racks=tiprack_50)
    m50 = ctx.load_instrument("flex_8channel_50", m50_mount, tip_racks=tiprack_50)

    count = 0

    def pick_up(pip):
        nonlocal tiprack_50
        nonlocal staging_racks
        nonlocal count

        try:
            pip.tip_racks = tiprack_50
            pip.pick_up_tip()

        except protocol_api.labware.OutOfTipsError:
            pip.tip_racks = tiprack_50

            # move all tipracks to chute
            for rack in tiprack_50:
                ctx.move_labware(labware=rack, new_location=chute, use_gripper=True)

            # check to see if we have tipracks in staging slots
            try:
                for i, (new_rack, replace_slot) in enumerate(zip(staging_racks, deck_slots)):

                    if ctx.deck[staging_slots[i]]:

                        ctx.move_labware(labware=new_rack, new_location=replace_slot, use_gripper=True)

                tiprack_50 = staging_racks
                pip.tip_racks = tiprack_50
                pip.reset_tipracks()
                pip.pick_up_tip()

            # if not tipracks in staging slot (second iteration), replenish
            except:
                # tiprack_50 = [ctx.load_labware('opentrons_flex_96_tiprack_50ul', protocol_api.OFF_DECK) for _ in range(4)]
                # staging_racks = [ctx.load_labware('opentrons_flex_96_tiprack_50ul', protocol_api.OFF_DECK) for _ in range(4)]
                tiprack_50 = [ctx.load_labware("opentrons_flex_96_tiprack_50ul", slot) for slot in deck_slots]
                staging_racks = [ctx.load_labware("opentrons_flex_96_tiprack_50ul", slot) for slot in staging_slots]
                ctx.pause("Replace tip racks on deck and on expansion slots")
                pip.reset_tipracks()
                pip.tip_racks = tiprack_50
                pick_up(pip)

    # mapping
    beads = reagent_pcr_plate.rows()[0][0]
    nucleases = reagent_pcr_plate.rows()[0][1]
    # trypsin = reagent_pcr_plate.rows()[0][2]
    formic_acid = reagent_pcr_plate.rows()[0][2]
    water = reagent_pcr_plate.rows()[0][3]
    empty_digestion_buff_col = reagent_pcr_plate.columns()[-1]
    digestion_tube = tuberack.wells()[0]

    lysis_buffer = reagent_deep_plate.rows()[0][0]
    tnne = reagent_deep_plate.rows()[0][1]
    abc = reagent_deep_plate.rows()[0][2]
    sds = reagent_deep_plate.rows()[0][3]
    ripa = reagent_deep_plate.rows()[0][4]
    waste = reagent_deep_plate.rows()[0][-1].top()

    samples = hs_plate.rows()[0][:num_col]

    # Assigning Liquid and colors
    beads_liq = ctx.define_liquid(
        name="Beads",
        description="Beads",
        display_color="#7EFF42",
    )
    nucleases_liq = ctx.define_liquid(
        name="Nucleases",
        description="Nucleases",
        display_color="#50D5FF",
    )
    # trypsin_liq = ctx.define_liquid(
    # name="Trypsin",
    # description="Trypsin",
    # display_color="#FF4F4F",
    # )
    formic_acid_liq = ctx.define_liquid(
        name="Formic Acid",
        description="Formic Acid",
        display_color="#B925FF",
    )
    water_liq = ctx.define_liquid(
        name="Water",
        description="Water",
        display_color="#FF9900",
    )
    digestion_liq = ctx.define_liquid(
        name="Digestion",
        description="Digestion",
        display_color="#0019FF",
    )
    lysis_buffer_liq = ctx.define_liquid(
        name="Lysis Buffer",
        description="Lysis Buffer",
        display_color="#007AFF",
    )
    tnne_liq = ctx.define_liquid(
        name="TNNE",
        description="ETHANOL",
        display_color="#FF0076",
    )
    abc_liq = ctx.define_liquid(
        name="ABC",
        description="ABC",
        display_color="#00FFBC",
    )
    sds_liq = ctx.define_liquid(
        name="SDS",
        description="sds",
        display_color="#00AAFF",
    )
    ripa_liq = ctx.define_liquid(
        name="RIPA",
        description="RIPA",
        display_color="#008000",
    )
    samples_liq = ctx.define_liquid(
        name="Samples",
        description="Samples",
        display_color="#008000",
    )

    for well in reagent_pcr_plate.columns()[0]:
        well.load_liquid(liquid=beads_liq, volume=200)
    for well in reagent_pcr_plate.columns()[1]:
        well.load_liquid(liquid=nucleases_liq, volume=200)
    for well in reagent_pcr_plate.columns()[2]:
        well.load_liquid(liquid=formic_acid_liq, volume=200)
    for well in reagent_pcr_plate.columns()[3]:
        well.load_liquid(liquid=water_liq, volume=200)
    tuberack.wells()[0].load_liquid(liquid=digestion_liq, volume=200)

    for well in reagent_deep_plate.columns()[0]:
        well.load_liquid(liquid=lysis_buffer_liq, volume=200)
    for well in reagent_deep_plate.columns()[1]:
        well.load_liquid(liquid=tnne_liq, volume=200)
    for well in reagent_deep_plate.columns()[2]:
        well.load_liquid(liquid=abc_liq, volume=200)
    for well in reagent_deep_plate.columns()[3]:
        well.load_liquid(liquid=sds_liq, volume=200)
    for well in reagent_deep_plate.columns()[4]:
        well.load_liquid(liquid=ripa_liq, volume=200)
    for well in hs_plate.wells()[:num_samp]:
        well.load_liquid(liquid=samples_liq, volume=200)

    ctx.comment("\n---------------LYSING SAMPLES----------------\n\n")
    for starting_sample, dest in zip(start_sample_plate.rows()[0][:num_col], samples):
        pick_up(m50)
        m50.transfer(60, lysis_buffer, starting_sample.top(), new_tip="never")
        m50.mix(10, 30, starting_sample, rate=0.5)
        m50.aspirate(50, starting_sample.bottom(z=0.5))
        m50.dispense(50, dest)
        m50.touch_tip()
        m50.drop_tip() if not test_mode else m50.return_tip()
        ctx.comment("\n")

    ctx.comment("\n---------------ADDING NUCLEASES----------------\n\n")
    nuc_vol = 2
    for col in samples:
        pick_up(m50)
        m50.aspirate(nuc_vol, nucleases)
        m50.dispense(nuc_vol, col)
        m50.mix(3, 30, col, rate=0.5)
        m50.blow_out()
        m50.touch_tip()
        m50.drop_tip() if not test_mode else m50.return_tip()

    if not test_mode:
        hs.set_and_wait_for_shake_speed(1600)
        ctx.delay(minutes=15)
        hs.deactivate_shaker()

    ctx.comment("\n---------------ADDING BEADS----------------\n\n")
    bead_vol = 5
    for i, col in enumerate(samples):
        pick_up(m50)
        if i == 0:
            m50.mix(20, num_col * bead_vol * 0.6 if num_col * bead_vol * 0.6 < 50 else 50, beads, rate=0.3)
        else:
            m50.mix(5, num_col * bead_vol * 0.6 if num_col * bead_vol * 0.6 < 50 else 50, beads, rate=0.5)
        m50.aspirate(bead_vol, beads)
        m50.dispense(bead_vol, col)
        m50.mix(3, 30, col, rate=0.5)
        m50.blow_out()
        m50.touch_tip()
        m50.drop_tip() if not test_mode else m50.return_tip()

    if not test_mode:
        hs.set_and_wait_for_shake_speed(1600)
        ctx.delay(minutes=bead_incubation)
        hs.deactivate_shaker()

    hs.open_labware_latch()

    ctx.move_labware(labware=hs_plate, new_location=mag_block, use_gripper=True)

    ctx.delay(minutes=2 if not test_mode else 0.5)

    ctx.comment("\n---------------REMOVING SUPER----------------\n\n")
    for col in samples:
        pick_up(m50)
        m50.aspirate(35, col, rate=0.5)
        m50.dispense(35, waste)
        m50.blow_out()
        m50.aspirate(35, col.bottom(z=0.6), rate=0.5)
        m50.dispense(35, waste)
        m50.blow_out()
        m50.drop_tip() if not test_mode else m50.return_tip()

    ctx.move_labware(labware=hs_plate, new_location=hs, use_gripper=True)

    hs.close_labware_latch()

    waste = reagent_deep_plate.rows()[0][-2].top()

    ctx.comment("\n---------------4 WASHES----------------\n\n")
    reags = [sds, ripa, ripa, tnne]
    reag_vols = [35, 40, 45, 50]
    for i, (reag, reag_vol) in enumerate(zip(reags, reag_vols)):
        for col in samples:
            pick_up(m50)
            m50.aspirate(reag_vol, reag)
            m50.dispense(reag_vol, col)
            m50.mix(15, 0.8 * reag_vol, col, rate=1.5)
            m50.touch_tip()
            m50.drop_tip() if not test_mode else m50.return_tip()

        hs.open_labware_latch()
        ctx.move_labware(labware=hs_plate, new_location=mag_block, use_gripper=True)
        ctx.delay(minutes=2 if not test_mode else 0.5)

        ctx.comment("\n---------------REMOVING SUPER----------------\n\n")
        for col in samples:
            pick_up(m50)
            if reag_vol < 50:
                m50.aspirate(reag_vol, col, rate=0.5)
                m50.aspirate(5, col.bottom(z=0.6), rate=0.5)  # grab some extra
                m50.dispense(reag_vol + 5, waste)
                m50.blow_out()
            else:
                m50.aspirate(reag_vol, col, rate=0.5)
                m50.dispense(reag_vol, waste)
                m50.blow_out()
                m50.aspirate(5, col.bottom(z=0.6), rate=0.5)  # grab some extra
                m50.dispense(5, waste)
                m50.blow_out()

            m50.drop_tip() if not test_mode else m50.return_tip()

        if i == 1:
            waste = reagent_deep_plate.rows()[0][-3].top()

        if i < 3:
            ctx.move_labware(labware=hs_plate, new_location=hs, use_gripper=True)

            hs.close_labware_latch()

        ctx.comment("\nXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n")

    waste = reagent_deep_plate.rows()[0][-4].top()

    ctx.comment("\n---------------ADDING ABC----------------\n\n")
    abc_vol = 50
    for _ in range(3):
        for col in samples:
            pick_up(m50)
            m50.aspirate(abc_vol, abc)
            m50.dispense(abc_vol, col)
            m50.mix(3, 0.8 * abc_vol, col)
            ctx.delay(seconds=30)
            m50.aspirate(abc_vol, col)
            m50.dispense(abc_vol, waste)
            m50.blow_out()
            m50.touch_tip()
            m50.drop_tip() if not test_mode else m50.return_tip()

    ctx.move_labware(labware=hs_plate, new_location=hs, use_gripper=True)

    hs.close_labware_latch()

    ctx.pause("“Add fresh Trypsin in ABC in 1.5mL tube to A1 4-1 tube rack”")

    ctx.comment("\n---------------ADDING DIGESTION BUFFER----------------\n\n")
    pick_up(p50)
    p50.mix(10, num_col * 10 * 1.1 if num_col * 10 * 1.1 < 50 else 50, digestion_tube)
    digestion_vol_per_well = num_col * 10 * 1.1
    for well in empty_digestion_buff_col:
        p50.transfer(
            digestion_vol_per_well,
            digestion_tube,
            well,
            mix_before=(2, num_col * 10 * 1.1 if num_col * 10 * 1.1 < 50 else 50),
            touch_tip=True,
            new_tip="never",
        )
    p50.drop_tip() if not test_mode else p50.return_tip()

    for col in samples:
        pick_up(m50)
        m50.mix(3, num_col * 10 * 1.1 if num_col * 10 * 1.1 < 50 else 50, empty_digestion_buff_col[0])
        m50.aspirate(10, empty_digestion_buff_col[0])
        m50.dispense(10, col, rate=0.5)
        ctx.delay(3)
        m50.blow_out()
        m50.touch_tip(radius=0.85)
        m50.drop_tip() if not test_mode else m50.return_tip()

    ctx.pause(
        """Add a lid/seal to the pcr plate
                 on the heater shaker before digestion"""
    )

    hs.set_and_wait_for_temperature(37)
    hs.set_and_wait_for_shake_speed(1200)
    ctx.delay(minutes=60 * digest_time_hours if not test_mode else 0.5)
    hs.deactivate_shaker()

    ctx.move_labware(labware=reagent_deep_plate, new_location=protocol_api.OFF_DECK)
    ctx.move_labware(labware=dest_plate, new_location="C3")

    hs.deactivate_heater()

    ctx.comment("\n---------------ADDING FORMIC ACID----------------\n\n")
    for col in samples:
        pick_up(m50)
        m50.aspirate(5, formic_acid)
        m50.dispense(5, col)
        m50.mix(2, 7, col)
        m50.blow_out()
        m50.touch_tip()
        m50.drop_tip() if not test_mode else m50.return_tip()

    hs.open_labware_latch()
    ctx.move_labware(labware=hs_plate, new_location=mag_block, use_gripper=True)
    ctx.delay(minutes=2 if not test_mode else 0.5)

    for s, d in zip(samples, dest_plate.rows()[0][:num_col]):
        pick_up(m50)
        m50.aspirate(15, s.bottom(z=0.8), rate=0.5)
        m50.aspirate(10, s.bottom(z=0.4), rate=0.5)
        m50.dispense(10, d.bottom(z=5))
        m50.dispense(15, d)
        m50.blow_out()
        m50.touch_tip()
        m50.drop_tip() if not test_mode else m50.return_tip()
