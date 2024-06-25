def get_values(*names):
    import json

    _all_values = json.loads(
        """{"num_samp":8,"num_pcr_cycles":15,"real_mode":true,"m50_mount":"left","m200_mount":"right","protocol_filename":"langone_pt2_ribo"}"""
    )
    return [_all_values[n] for n in names]


# flake8: noqa
import math

from opentrons import protocol_api
from opentrons import types
import random
import math

metadata = {
    "ctx.Name": "RNA seq RiboZero Plus - Part 2",
    "author": "Rami Farawi <ndiehl@opentrons.com",
}
requirements = {"robotType": "OT-3", "apiLevel": "2.15"}


def run(ctx: protocol_api.ProtocolContext):

    # real_mode = True
    # m50_mount = 'left'
    # m200_mount = 'right'
    # num_samp = 96

    # num_pcr_cycles = 13

    [num_samp, num_pcr_cycles, real_mode, m50_mount, m200_mount] = get_values(  # noqa: F821
        "num_samp", "num_pcr_cycles", "real_mode", "m50_mount", "m200_mount"
    )

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

    cold_reagent_plate = temp_mod.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt", adapter="opentrons_96_well_aluminum_block")

    # index plate
    index_plate = ctx.load_labware("biorad_96_wellplate_200ul_pcr", 2)

    # magnetic module
    mag_block = ctx.load_module("magneticBlockV1", 6)

    # labware
    hs_mod = ctx.load_module("heaterShakerModuleV1", 1)
    deck_reagent_plate = hs_mod.load_labware("nest_96_wellplate_2ml_deep")
    hs_mod.close_labware_latch()

    trash = ctx.load_labware("nest_12_reservoir_15ml", 11)["A1"].top(z=-3)

    tiprack_50 = [ctx.load_labware("opentrons_flex_96_tiprack_50ul", slot) for slot in [4, 5]]
    tiprack_200 = [ctx.load_labware("opentrons_flex_96_tiprack_200ul", slot) for slot in [8, 9]]

    # LOAD PIPETTES
    m50 = ctx.load_instrument("flex_8channel_50", m50_mount, tip_racks=tiprack_50)
    m200 = ctx.load_instrument("flex_8channel_1000", m200_mount, tip_racks=tiprack_200)

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
    atl4_liq = ctx.define_liquid(
        name="ATL4",
        description="ATL4",
        display_color="#7EFF42",
    )
    ligation_mmx_liq = ctx.define_liquid(
        name="LIGATION MASTERMIX",
        description="LIGATION MASTERMIX",
        display_color="#50D5FF",
    )
    stl_liq = ctx.define_liquid(
        name="STL",
        description="STL",
        display_color="#FF4F4F",
    )
    epm_liq = ctx.define_liquid(
        name="EPM",
        description="EPM",
        display_color="#B925FF",
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
        well.load_liquid(liquid=atl4_liq, volume=200)
    for well in cold_reagent_plate.columns()[1]:
        well.load_liquid(liquid=ligation_mmx_liq, volume=200)
    for well in cold_reagent_plate.columns()[2]:
        well.load_liquid(liquid=stl_liq, volume=200)
    for well in cold_reagent_plate.columns()[3]:
        well.load_liquid(liquid=epm_liq, volume=200)
    for well in deck_reagent_plate.columns()[0]:
        well.load_liquid(liquid=beads_liq, volume=200)
    for well in deck_reagent_plate.columns()[1]:
        well.load_liquid(liquid=ethanol_liq, volume=200)
    for well in deck_reagent_plate.columns()[2]:
        well.load_liquid(liquid=ethanol_liq, volume=200)
    for well in deck_reagent_plate.columns()[5]:
        well.load_liquid(liquid=rsb_liq, volume=200)
    for well in dest_plate.wells():
        well.load_liquid(liquid=sample_liq, volume=200)

    # cold armadillo plate
    atl4 = cold_reagent_plate["A1"]
    ligation_mmx = cold_reagent_plate["A2"]
    stl = cold_reagent_plate["A3"]
    epm = cold_reagent_plate["A4"]

    # warm deepwell plate
    beads = deck_reagent_plate["A1"]
    ethanol = deck_reagent_plate["A2"]
    ethanol2 = deck_reagent_plate["A3"]
    rsb = deck_reagent_plate["A4"]

    if real_mode:
        temp_mod.set_temperature(4)
    if real_mode:
        tc_mod.set_lid_temperature(100)

    sample_wells = dest_plate.rows()[0][:num_col]
    fresh_sample_wells = fresh_dest.rows()[0][:num_col]
    final_sample_wells = final_dest.rows()[0][:num_col]

    ctx.comment("\n\n----------ADDING ATL4----------\n")
    for col in sample_wells:
        pick_up(m50)
        m50.aspirate(12.5, atl4)
        m50.dispense(12.5, col)
        m50.mix(5, 20, col)
        m50.move_to(col.top())
        ctx.delay(seconds=1)
        m50.blow_out(col.top())
        m50.touch_tip()
        m50.drop_tip() if real_mode else m50.return_tip()

    if real_mode:

        profile1 = [
            {"temperature": 37, "hold_time_minutes": 30},
            {"temperature": 70, "hold_time_minutes": 5},
        ]

        tc_mod.close_lid()
        tc_mod.execute_profile(steps=profile1, repetitions=1, block_max_volume=30)
        tc_mod.set_block_temperature(4)
        tc_mod.open_lid()

    ctx.comment("\n\n----------ADDING LIGATION MASTERMIX----------\n")
    for col in sample_wells:
        pick_up(m50)
        m50.aspirate(7.5, ligation_mmx)
        m50.dispense(7.5, col)
        m50.mix(5, 24, col)
        m50.move_to(col.top())
        ctx.delay(seconds=1)
        m50.blow_out(col.top())
        m50.touch_tip()
        m50.drop_tip() if real_mode else m50.return_tip()

    if real_mode:

        profile1 = [
            {"temperature": 30, "hold_time_minutes": 10},
        ]

        tc_mod.close_lid()
        tc_mod.execute_profile(steps=profile1, repetitions=1, block_max_volume=37.5)
        tc_mod.set_block_temperature(4)
        tc_mod.open_lid()

    ctx.comment("\n\n----------ADDING STL----------\n")
    for col in sample_wells:
        pick_up(m50)
        m50.aspirate(5, stl)
        m50.dispense(5, col)
        m50.mix(5, 32, col)
        m50.move_to(col.top())
        ctx.delay(seconds=1)
        m50.blow_out(col.top())
        m50.touch_tip()
        m50.drop_tip() if real_mode else m50.return_tip()

    # # -- Move the plate to empty slot.
    # ctx.move_labware(
    #     labware=dest_plate,
    #     new_location=2,
    #     use_gripper=True
    # )

    tc_mod.set_block_temperature(21)  # ambient

    # ctx.move_labware(labware=fresh_dest, new_location=tc_mod)

    # BEADS AND WASH - 4
    ctx.comment("\n\n----------ADDING BEADS----------\n")
    pick_up(m200)
    m200.mix(20, 200, beads)
    for col in sample_wells:
        if not m200.has_tip:
            pick_up(m200)

        m200.aspirate(34, beads)
        slow_tip_withdrawal(m200, beads)
        m200.dispense(34, col)
        m200.mix(10, 60, col)
        remove_liq(m200, col)
        m200.drop_tip() if real_mode else m200.return_tip()

    ctx.delay(minutes=5 if real_mode else 0.5)

    # -- Move the plate to empty slot.
    ctx.move_labware(labware=dest_plate, new_location=mag_block, use_gripper=True)

    ctx.delay(minutes=3 if real_mode else 0.5)
    ctx.comment("\n\n----------REMOVE SUPER----------\n")
    super_vol = 75
    extra = 10
    for col in sample_wells:
        pick_up(m200)
        m200.aspirate(super_vol, col, rate=0.15)
        m200.aspirate(extra, col.bottom(z=0.5), rate=0.15)
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
            m200.aspirate(extra, col.bottom(z=0.5), rate=0.15)
            slow_tip_withdrawal(m200, col)
            m200.dispense(super_vol + extra, trash)
            ctx.delay(seconds=2)
            m200.blow_out()
            m200.drop_tip() if real_mode else m200.return_tip()

    ctx.delay(minutes=2 if real_mode else 0.5)

    ctx.comment("\n\n----------ADDING RSB----------\n")
    # -- Move the plate to empty slot.
    ctx.move_labware(labware=dest_plate, new_location=tc_mod, use_gripper=True)

    for col in sample_wells:
        pick_up(m50)
        m50.aspirate(22, rsb)
        m50.dispense(22, col)
        for _ in range(7):  # resuspend beads
            m50.aspirate(7, col.bottom(z=0.5))
            m50.dispense(7, col.bottom(z=6), rate=2)
        m50.mix(5, 7, col.bottom(z=0.7), rate=1.5)
        m50.move_to(col.top())
        ctx.delay(seconds=1)
        m50.blow_out(col.top())
        m50.touch_tip()
        m50.drop_tip() if real_mode else m50.return_tip()

    ctx.move_labware(labware=dest_plate, new_location=mag_block, use_gripper=True)

    ctx.delay(minutes=2 if real_mode else 0.5)

    ctx.move_labware(labware=fresh_dest, new_location=tc_mod)

    ctx.comment("\n\n----------TRANSFERRING ELUTE----------\n")

    for s, d in zip(sample_wells, fresh_sample_wells):
        pick_up(m50)
        m50.aspirate(20, s.bottom(z=0.5), rate=0.2)
        m50.dispense(20, d)
        m50.move_to(col.top())
        m50.blow_out(col.top())
        m50.drop_tip() if real_mode else m50.return_tip()

    ctx.move_labware(labware=dest_plate, new_location=protocol_api.OFF_DECK)

    ctx.comment("\n\n----------TRANSFERRING INDEX----------\n")
    for s, d in zip(index_plate.rows()[0], fresh_sample_wells):
        pick_up(m50)
        m50.aspirate(10, s.bottom(z=0.5), rate=0.2)
        m50.dispense(10, d)
        m50.move_to(s.top())
        m50.blow_out(d.top())
        m50.drop_tip() if real_mode else m50.return_tip()

    ctx.comment("\n\n----------ADDING EPM----------\n")
    for col in fresh_sample_wells:
        pick_up(m50)
        m50.aspirate(20, epm)
        m50.dispense(20, col)
        m50.mix(5, 15, col)
        m50.move_to(col.top())
        ctx.delay(seconds=1)
        m50.blow_out(col.top())
        m50.touch_tip()
        m50.drop_tip() if real_mode else m50.return_tip()

    if real_mode:

        profile1 = [{"temperature": 98, "hold_time_seconds": 30}]
        profile2 = [
            {"temperature": 98, "hold_time_seconds": 10},
            {"temperature": 60, "hold_time_seconds": 30},
            {"temperature": 72, "hold_time_seconds": 30},
        ]
        profile3 = [{"temperature": 72, "hold_time_minutes": 5}]

        tc_mod.close_lid()
        tc_mod.execute_profile(steps=profile1, repetitions=1, block_max_volume=50)
        tc_mod.execute_profile(steps=profile2, repetitions=num_pcr_cycles, block_max_volume=50)
        tc_mod.execute_profile(steps=profile3, repetitions=1, block_max_volume=50)
        tc_mod.set_block_temperature(4)
        tc_mod.open_lid()

    ctx.pause("Thermocycler complete, please check samples.")

    tc_mod.set_block_temperature(21)  # ambient

    # ctx.move_labware(labware=fresh_dest, new_location=tc_mod)

    # BEADS AND WASH - 4
    ctx.comment("\n\n----------ADDING BEADS----------\n")
    pick_up(m200)
    m200.mix(20, 200, beads)
    for col in fresh_sample_wells:
        if not m200.has_tip:
            pick_up(m200)

        m200.aspirate(50, beads)
        slow_tip_withdrawal(m200, beads)
        m200.dispense(50, col)
        m200.mix(10, 75, col)
        remove_liq(m200, col)
        m200.drop_tip() if real_mode else m200.return_tip()

    ctx.delay(minutes=5 if real_mode else 0.5)

    # -- Move the plate to empty slot.
    ctx.move_labware(labware=fresh_dest, new_location=mag_block, use_gripper=True)

    ctx.delay(minutes=3 if real_mode else 0.5)
    ctx.comment("\n\n----------REMOVE SUPER----------\n")
    super_vol = 100
    extra = 10
    for col in fresh_sample_wells:
        pick_up(m200)
        m200.aspirate(super_vol, col, rate=0.15)
        m200.aspirate(extra, col.bottom(z=0.5), rate=0.15)
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
            m200.aspirate(extra, col.bottom(z=0.5), rate=0.15)
            slow_tip_withdrawal(m200, col)
            m200.dispense(super_vol + extra, trash)
            ctx.delay(seconds=2)

            m200.drop_tip() if real_mode else m200.return_tip()

    ctx.delay(minutes=2 if real_mode else 0.5)

    ctx.comment("\n\n----------ADDING RSB----------\n")
    # -- Move the plate to empty slot.
    ctx.move_labware(labware=fresh_dest, new_location=tc_mod, use_gripper=True)

    for col in fresh_sample_wells:
        pick_up(m50)
        m50.aspirate(17, rsb)
        m50.dispense(17, col)
        for _ in range(7):  # resuspend beads
            m50.aspirate(13, col.bottom(z=0.5))
            m50.dispense(13, col.bottom(z=6), rate=2)
        m50.mix(5, 13, col.bottom(z=0.7), rate=1.5)
        m50.move_to(col.top())
        ctx.delay(seconds=1)
        m50.blow_out(col.top())
        m50.touch_tip()
        m50.drop_tip() if real_mode else m50.return_tip()

    ctx.move_labware(labware=fresh_dest, new_location=mag_block, use_gripper=True)

    ctx.delay(minutes=2 if real_mode else 0.5)

    ctx.move_labware(labware=final_dest, new_location=tc_mod)

    ctx.comment("\n\n----------TRANSFERRING ELUTE----------\n")

    for s, d in zip(fresh_sample_wells, final_sample_wells):
        pick_up(m50)
        m50.aspirate(17, s.bottom(z=0.5), rate=0.2)
        m50.dispense(17, d)
        m50.move_to(col.top())
        m50.blow_out(col.top())
        m50.drop_tip() if real_mode else m50.return_tip()
