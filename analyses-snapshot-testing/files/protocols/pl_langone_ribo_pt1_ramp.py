def get_values(*names):
    import json

    _all_values = json.loads(
        """{"num_samp":8,"real_mode":true,"m50_mount":"left","m200_mount":"right","protocol_filename":"langone_ribo_pt1_ramp"}"""
    )
    return [_all_values[n] for n in names]


# flake8: noqa
import math

from opentrons import protocol_api
from opentrons import types
import random
import math

metadata = {
    "ctx.Name": "RNA seq RiboZero Plus - Part 1",
    "author": "Rami Farawi <ndiehl@opentrons.com",
}
requirements = {"robotType": "OT-3", "apiLevel": "2.15"}


def run(ctx: protocol_api.ProtocolContext):
    #
    # real_mode = True
    # m50_mount = 'left'
    # m200_mount = 'right'
    # num_samp = 96

    [num_samp, real_mode, m50_mount, m200_mount] = get_values("num_samp", "real_mode", "m50_mount", "m200_mount")  # noqa: F821

    num_col = math.ceil(num_samp / 8)

    # thermocycler module
    tc_mod = ctx.load_module("thermocyclerModuleV2")
    tc_mod.open_lid()
    dest_plate = tc_mod.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")
    fresh_dest = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", protocol_api.OFF_DECK)
    final_dest = ctx.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", protocol_api.OFF_DECK)
    if real_mode:
        tc_mod.set_lid_temperature(100)

    # temperature module
    temp_mod = ctx.load_module("temperature module gen2", 3)
    cold_reagent_plate = temp_mod.load_labware("nest_96_wellplate_2ml_deep")

    # magnetic module
    mag_block = ctx.load_module("magneticBlockV1", 6)

    # labware
    hs_mod = ctx.load_module("heaterShakerModuleV1", 1)
    deck_reagent_plate = hs_mod.load_labware("nest_96_wellplate_2ml_deep", 8)
    hs_mod.close_labware_latch()
    trash = ctx.load_labware("nest_12_reservoir_15ml", 11)["A1"].top(z=-3)

    tiprack_50 = [ctx.load_labware("opentrons_flex_96_tiprack_50ul", slot) for slot in [4, 5]]
    tiprack_200 = [ctx.load_labware("opentrons_flex_96_tiprack_200ul", slot) for slot in [8, 9]]

    # LOAD PIPETTES
    m50 = ctx.load_instrument("flex_8channel_50", m50_mount, tip_racks=tiprack_50)
    m200 = ctx.load_instrument("flex_8channel_1000", m200_mount, tip_racks=tiprack_200)

    # mmx_liq = ctx.define_liquid(name="Mastermix", description='Mastermix', display_color='#008000')
    # water_liq = ctx.define_liquid(name="Water", description='Water', display_color='#A52A2A')
    # dna_liq = ctx.define_liquid(name="DNA", description='DNA', display_color='#A52A2A')

    def pick_up(pip):
        try:
            pip.pick_up_tip()
        except protocol_api.labware.OutOfTipsError:
            ctx.pause(f"Replace empty tip rack for {pip}")
            pip.reset_tipracks()
            pip.pick_up_tip()

    def slow_tip_withdrawal(pipette, well):
        factor_slow = 40
        pipette.default_speed /= factor_slow
        pipette.move_to(well.top(-3))
        pipette.default_speed *= factor_slow

    def remove_liq(pipette, well):
        factor_slow = 40
        pipette.default_speed /= factor_slow
        pipette.move_to(well.top(-3))
        pipette.default_speed *= factor_slow
        ctx.delay(seconds=2)
        pipette.blow_out()

    # Assigning Liquid and colors
    db1_liq = ctx.define_liquid(
        name="DB1/DP1",
        description="DB1/DP1",
        display_color="#7EFF42",
    )
    rdb_liq = ctx.define_liquid(
        name="RDB/RDE",
        description="RDB/RDE",
        display_color="#50D5FF",
    )
    prb_liq = ctx.define_liquid(
        name="PRB/PRE",
        description="PRB/PRE",
        display_color="#FF4F4F",
    )
    eph3_liq = ctx.define_liquid(
        name="EPH3",
        description="EPH3",
        display_color="#B925FF",
    )
    fsa_liq = ctx.define_liquid(
        name="FSA/RVT",
        description="FSA/RVT",
        display_color="#FF9900",
    )
    smm_liq = ctx.define_liquid(
        name="SMM",
        description="SMM",
        display_color="#0019FF",
    )
    beads_liq = ctx.define_liquid(
        name="BEADS",
        description="BEADS",
        display_color="#007AFF",
    )
    ethanol_liq = ctx.define_liquid(
        name="ETHANOL",
        description="ETHANOL",
        display_color="#FF0076",
    )
    elution_buff_liq = ctx.define_liquid(
        name="ELUTION BUFFER",
        description="ELUTION BUFFER",
        display_color="#00FFBC",
    )
    rsb_liq = ctx.define_liquid(
        name="RSB",
        description="RSB",
        display_color="#00AAFF",
    )
    sample_liq = ctx.define_liquid(
        name="Sample",
        description="Sample",
        display_color="#008000",
    )

    for well in cold_reagent_plate.columns()[0]:
        well.load_liquid(liquid=db1_liq, volume=200)
    for well in cold_reagent_plate.columns()[1]:
        well.load_liquid(liquid=rdb_liq, volume=200)
    for well in cold_reagent_plate.columns()[2]:
        well.load_liquid(liquid=prb_liq, volume=200)
    for well in cold_reagent_plate.columns()[3]:
        well.load_liquid(liquid=eph3_liq, volume=200)
    for well in cold_reagent_plate.columns()[4]:
        well.load_liquid(liquid=fsa_liq, volume=200)
    for well in cold_reagent_plate.columns()[5]:
        well.load_liquid(liquid=smm_liq, volume=200)
    for well in deck_reagent_plate.columns()[0]:
        well.load_liquid(liquid=beads_liq, volume=200)
    for well in deck_reagent_plate.columns()[1]:
        well.load_liquid(liquid=ethanol_liq, volume=200)
    for well in deck_reagent_plate.columns()[2]:
        well.load_liquid(liquid=ethanol_liq, volume=200)
    for well in deck_reagent_plate.columns()[3]:
        well.load_liquid(liquid=elution_buff_liq, volume=200)
    for well in deck_reagent_plate.columns()[4]:
        well.load_liquid(liquid=beads_liq, volume=200)
    for well in deck_reagent_plate.columns()[5]:
        well.load_liquid(liquid=rsb_liq, volume=200)
    for well in dest_plate.wells():
        well.load_liquid(liquid=sample_liq, volume=200)

    # cold deepwell plate
    db1 = cold_reagent_plate["A1"]
    rdb = cold_reagent_plate["A2"]
    prb = cold_reagent_plate["A3"]
    eph3 = cold_reagent_plate["A4"]
    fsa = cold_reagent_plate["A5"]
    smm = cold_reagent_plate["A6"]

    mmx_liq = ctx.define_liquid(name="Mastermix", description="Mastermix", display_color="#008000")
    water_liq = ctx.define_liquid(name="Water", description="Water", display_color="#A52A2A")
    dna_liq = ctx.define_liquid(name="DNA", description="DNA", display_color="#A52A2A")

    # warm deepwell plate
    beads = deck_reagent_plate["A1"]
    ethanol = deck_reagent_plate["A2"]
    ethanol2 = deck_reagent_plate["A3"]
    elution_buff = deck_reagent_plate["A4"]
    beads2 = deck_reagent_plate["A5"]  # diff beads
    rsb = deck_reagent_plate["A6"]

    if real_mode:
        temp_mod.set_temperature(4)
    if real_mode:
        tc_mod.set_lid_temperature(100)

    sample_wells = dest_plate.rows()[0][:num_col]
    fresh_sample_wells = fresh_dest.rows()[0][:num_col]
    final_sample_wells = final_dest.rows()[0][:num_col]

    # HYBRIDIZE PROBES - 1
    ctx.comment("\n\n----------ADDING DB1----------\n")
    for col in sample_wells:
        pick_up(m50)
        m50.configure_for_volume(4)
        m50.aspirate(4, db1)
        m50.dispense(4, col)
        m50.mix(5, 10, col)
        m50.move_to(col.top())
        ctx.delay(seconds=1)
        m50.blow_out(col.top())
        m50.touch_tip()
        m50.drop_tip() if real_mode else m50.return_tip()

    if real_mode:

        profile1 = [
            {"temperature": 95, "hold_time_minutes": 2},
        ]

        tc_mod.close_lid()
        tc_mod.execute_profile(steps=profile1, repetitions=1, block_max_volume=15)

        start_temp = 95
        temp = start_temp
        while temp > 37:
            tc_mod.set_block_temperature(temp)
            ctx.delay(seconds=10)
            temp -= 1
        tc_mod.open_lid()

    # DEPLETE RNA - 2
    ctx.comment("\n\n----------ADDING RDB----------\n")
    for col in sample_wells:
        pick_up(m50)
        m50.configure_for_volume(5)
        m50.aspirate(5, rdb)
        m50.dispense(5, col)
        m50.mix(5, 15, col)
        m50.move_to(col.top())
        ctx.delay(seconds=1)
        m50.blow_out(col.top())
        m50.touch_tip()
        m50.drop_tip() if real_mode else m50.return_tip()

    if real_mode:

        profile1 = [
            {"temperature": 37, "hold_time_minutes": 15},
        ]

        tc_mod.close_lid()
        tc_mod.execute_profile(steps=profile1, repetitions=1, block_max_volume=20)
        tc_mod.set_block_temperature(4)
        tc_mod.open_lid()

    # REMOVE PROBES - 3
    ctx.comment("\n\n----------ADDING PRB----------\n")
    for col in sample_wells:
        pick_up(m50)
        m50.aspirate(10, prb)
        m50.dispense(10, col)
        m50.mix(5, 20, col)
        m50.move_to(col.top())
        ctx.delay(seconds=1)
        m50.blow_out(col.top())
        m50.touch_tip()
        m50.drop_tip() if real_mode else m50.return_tip()

    if real_mode:

        profile1 = [{"temperature": 37, "hold_time_minutes": 15}, {"temperature": 70, "hold_time_minutes": 15}]

        tc_mod.close_lid()
        tc_mod.execute_profile(steps=profile1, repetitions=1, block_max_volume=30)
        tc_mod.set_block_temperature(4)
        tc_mod.open_lid()

    # -- Move the plate to empty slot.
    ctx.move_labware(labware=dest_plate, new_location=2, use_gripper=True)

    tc_mod.set_block_temperature(21)  # ambient

    ctx.move_labware(labware=fresh_dest, new_location=tc_mod, use_gripper=False)

    # BEADS AND WASH - 4
    ctx.comment("\n\n----------ADDING BEADS----------\n")
    pick_up(m200)
    m200.mix(20, 200, beads)
    for col in sample_wells:
        if not m200.has_tip:
            pick_up(m200)

        m200.aspirate(60, beads)
        slow_tip_withdrawal(m200, beads)
        m200.dispense(60, col)
        m200.mix(10, 70, col)
        remove_liq(m200, col)
        m200.drop_tip() if real_mode else m200.return_tip()

    ctx.delay(minutes=5 if real_mode else 0.5)

    # -- Move the plate to empty slot.
    ctx.move_labware(labware=dest_plate, new_location=mag_block, use_gripper=True)

    ctx.delay(minutes=3 if real_mode else 0.5)
    ctx.comment("\n\n----------REMOVE SUPER----------\n")
    super_vol = 90
    extra = 10
    for col in sample_wells:
        pick_up(m200)
        m200.aspirate(super_vol, col, rate=0.15)
        m200.aspirate(extra, col.bottom(z=0.8), rate=0.15)
        slow_tip_withdrawal(m200, col)
        m200.dispense(super_vol + extra, trash)
        ctx.delay(seconds=2)
        m200.blow_out()
        m200.drop_tip() if real_mode else m200.return_tip()

    ctx.comment("\n\n----------TWO WASHES----------\n")
    super_vol = 150
    extra = 10
    for _ in range(2):
        pick_up(m200)
        for col in sample_wells:
            m200.aspirate(150, ethanol)
            slow_tip_withdrawal(m200, ethanol)
            m200.dispense(150, col.top())
        m200.move_to(dest_plate.wells()[0].top(z=20))
        ctx.delay(seconds=30)
        for col in sample_wells:
            if not m200.has_tip:
                pick_up(m200)

            m200.aspirate(super_vol, col, rate=0.15)
            m200.aspirate(extra, col.bottom(z=0.8), rate=0.15)
            slow_tip_withdrawal(m200, col)
            m200.dispense(super_vol + extra, trash)
            ctx.delay(seconds=2)
            m200.blow_out()
            m200.drop_tip() if real_mode else m200.return_tip()

    ctx.delay(minutes=2 if real_mode else 0.5)

    ctx.comment("\n\n----------ADDING ELUTION BUFFER----------\n")
    # -- Move the plate to empty slot.
    ctx.move_labware(labware=dest_plate, new_location=2, use_gripper=True)

    for col in sample_wells:
        pick_up(m50)
        m50.aspirate(10.5, elution_buff)
        m50.dispense(10.5, col)
        for _ in range(7):  # resuspend beads
            m50.aspirate(7, col.bottom(z=0.8))
            m50.dispense(7, col.bottom(z=6), rate=2)
        m50.mix(5, 7, col.bottom(z=0.7), rate=1.5)
        m50.move_to(col.top())
        ctx.delay(seconds=1)
        m50.blow_out(col.top())
        m50.touch_tip()
        m50.drop_tip() if real_mode else m50.return_tip()

    # -- Move the plate to empty slot.
    ctx.move_labware(labware=dest_plate, new_location=mag_block, use_gripper=True)

    ctx.delay(minutes=1.5 if real_mode else 0.5)

    ctx.comment("\n\n----------ADDING EPH3----------\n")
    pick_up(m50)
    for col in fresh_sample_wells:
        m50.aspirate(8.5, eph3)
        m50.dispense(8.5, col)
        m50.move_to(col.top())
        m50.blow_out(col.top())
    m50.drop_tip() if real_mode else m50.return_tip()

    ctx.comment("\n\n----------TRANSFERRING ELUTE----------\n")

    for s, d in zip(sample_wells, fresh_sample_wells):
        pick_up(m50)
        m50.aspirate(8.5, s.bottom(z=0.8), rate=0.2)
        m50.dispense(8.5, d)
        m50.move_to(s.top())
        m50.blow_out(d.top())
        m50.drop_tip() if real_mode else m50.return_tip()

    ctx.move_labware(labware=dest_plate, new_location=protocol_api.OFF_DECK, use_gripper=False)

    if real_mode:

        profile1 = [
            {"temperature": 94, "hold_time_minutes": 1},
        ]

        tc_mod.close_lid()
        tc_mod.execute_profile(steps=profile1, repetitions=1, block_max_volume=17)
        tc_mod.set_block_temperature(4)
        tc_mod.open_lid()

    ctx.comment("\n\n----------ADDING FSA----------\n")
    for col in fresh_sample_wells:
        pick_up(m50)
        m50.aspirate(8, fsa)
        m50.dispense(8, col)
        m50.mix(5, 19, col)
        m50.move_to(col.top())
        ctx.delay(seconds=1)
        m50.blow_out(col.top())
        m50.touch_tip()
        m50.drop_tip() if real_mode else m50.return_tip()

    if real_mode:

        profile1 = [
            {"temperature": 25, "hold_time_minutes": 10},
            {"temperature": 42, "hold_time_minutes": 15},
            {"temperature": 70, "hold_time_minutes": 15},
        ]

        tc_mod.close_lid()
        tc_mod.execute_profile(steps=profile1, repetitions=1, block_max_volume=25)
        tc_mod.set_block_temperature(4)
        tc_mod.open_lid()

    ctx.comment("\n\n----------ADDING SMM----------\n")
    for col in fresh_sample_wells:
        pick_up(m50)
        m50.aspirate(25, smm)
        m50.dispense(25, col)
        m50.mix(5, 40, col)
        m50.move_to(col.top())
        ctx.delay(seconds=1)
        m50.blow_out(col.top())
        m50.touch_tip()
        m50.drop_tip() if real_mode else m50.return_tip()

    if real_mode:
        tc_mod.set_lid_temperature(40)

        profile1 = [{"temperature": 16, "hold_time_minutes": 60}]

        tc_mod.close_lid()
        tc_mod.execute_profile(steps=profile1, repetitions=1, block_max_volume=50)
        tc_mod.set_block_temperature(4)
        tc_mod.open_lid()

    # -- Move the plate to empty slot.
    ctx.move_labware(labware=fresh_dest, new_location=2, use_gripper=True)

    tc_mod.set_block_temperature(21)  # ambient

    ctx.move_labware(labware=final_dest, new_location=tc_mod, use_gripper=False)

    # BEADS AND WASH - 4
    ctx.comment("\n\n----------ADDING BEADS----------\n")
    pick_up(m200)
    m200.mix(20, 200, beads2)
    for col in fresh_sample_wells:
        if not m200.has_tip:
            pick_up(m200)

        m200.aspirate(90, beads2)
        slow_tip_withdrawal(m200, beads2)
        m200.dispense(90, col)
        m200.mix(10, 100, col)
        remove_liq(m200, col)
        m200.drop_tip() if real_mode else m200.return_tip()

    ctx.delay(minutes=5 if real_mode else 0.5)

    # -- Move the plate to empty slot.
    ctx.move_labware(labware=fresh_dest, new_location=mag_block, use_gripper=True)

    ctx.delay(minutes=3 if real_mode else 0.5)
    ctx.comment("\n\n----------REMOVE SUPER----------\n")
    super_vol = 140
    extra = 10
    for col in fresh_sample_wells:
        pick_up(m200)
        m200.aspirate(super_vol, col, rate=0.15)
        m200.aspirate(extra, col.bottom(z=0.8), rate=0.15)
        slow_tip_withdrawal(m200, col)
        m200.dispense(super_vol + extra, trash)
        ctx.delay(seconds=2)
        m200.blow_out()
        m200.drop_tip() if real_mode else m200.return_tip()

    ctx.comment("\n\n----------TWO WASHES----------\n")
    super_vol = 150
    extra = 10
    for _ in range(2):
        pick_up(m200)
        for col in fresh_sample_wells:
            m200.aspirate(150, ethanol2)
            slow_tip_withdrawal(m200, ethanol2)
            m200.dispense(150, col.top())
        m200.move_to(fresh_dest.wells()[0].top(z=20))
        ctx.delay(seconds=30)
        for col in fresh_sample_wells:
            if not m200.has_tip:
                pick_up(m200)

            m200.aspirate(super_vol, col, rate=0.15)
            m200.aspirate(extra, col.bottom(z=0.8), rate=0.15)
            slow_tip_withdrawal(m200, col)
            m200.dispense(super_vol + extra, trash)
            ctx.delay(seconds=2)
            m200.blow_out()
            m200.drop_tip() if real_mode else m200.return_tip()

    ctx.delay(minutes=2 if real_mode else 0.5)

    ctx.comment("\n\n----------ADDING ELUTION BUFFER----------\n")
    # -- Move the plate to empty slot.
    ctx.move_labware(labware=fresh_dest, new_location=2, use_gripper=True)

    for col in fresh_sample_wells:
        pick_up(m50)
        m50.aspirate(19.5, rsb)
        m50.dispense(19.5, col)
        for _ in range(7):  # resuspend beads
            m50.aspirate(15, col.bottom(z=0.8))
            m50.dispense(15, col.bottom(z=6), rate=2)
        m50.mix(5, 14, col.bottom(z=0.7), rate=1.5)
        m50.move_to(col.top())
        ctx.delay(seconds=1)
        m50.blow_out(col.top())
        m50.touch_tip()
        m50.drop_tip() if real_mode else m50.return_tip()

    # -- Move the plate to empty slot.
    ctx.move_labware(labware=fresh_dest, new_location=mag_block, use_gripper=True)

    ctx.delay(minutes=2 if real_mode else 0.5)

    ctx.comment("\n\n----------TRANSFERRING ELUTE----------\n")

    for s, d in zip(fresh_sample_wells, final_sample_wells):
        pick_up(m50)
        m50.aspirate(17.5, s.bottom(z=0.8), rate=0.2)
        m50.dispense(17.5, d)
        m50.move_to(s.top())
        m50.blow_out(d.top())
        m50.drop_tip() if real_mode else m50.return_tip()
