def get_values(*names):
    import json

    _all_values = json.loads(
        """{"csv_samp":"Destination Well,Water Transfer Volume (ul),DNA Transfer Volume (ul),Mastermix Volume (ul),Mastermix Source Tube\\nA1,3,7,40,A1\\nB1,3,7,40,A1\\nC1,3,7,40,A1\\n","temp_mod_on":true,"rxn_vol":50,"p50_mount":"right","protocol_filename":"Normalization_with_PCR"}"""
    )
    return [_all_values[n] for n in names]


# flake8: noqa

from opentrons import protocol_api
from opentrons import types
import random
import math

metadata = {
    "ctx.Name": "PCR Protocol",
    "author": "Rami Farawi <ndiehl@opentrons.com",
}
requirements = {"robotType": "OT-3", "apiLevel": "2.15"}


def run(ctx: protocol_api.ProtocolContext):

    temp_mod_on = False
    p50_mount = "right"
    real_mode = False
    rxn_vol = 50

    [csv_samp, temp_mod_on, rxn_vol, p50_mount] = get_values("csv_samp", "temp_mod_on", "rxn_vol", "p50_mount")  # noqa: F821

    #     csv_samp = """
    # Destination Well,Water Transfer Volume (ul),DNA Transfer Volume (ul),Mastermix Volume (ul),Mastermix Source Tube
    # A1,3,7,40,A1
    # B1,x,10,40,A1
    # C1,10,x,40,A1
    # D1,3,7,40,A1
    # E1,2,8,40,A2
    # F1,1,9,40,A2
    # G1,5,5,40,A2
    # H1,3,7,40,A3
    # """
    # # A2,3,7,40,A3
    # # B2,3,7,40,A3
    # # C2,3,7,40,A3
    # # D2,3,7,40,A3
    # # E2,3,7,40,A3
    # # F2,3,7,40,A3
    # # G2,3,7,40,A3
    # # H2,3,7,40,A3
    # # A3,3,7,40,A3
    # # B3,3,7,40,A3
    # # C3,3,7,45,A3
    # # D3,3,7,45,A3
    # # E3,3,5,45,A3
    # # F3,3,5,45,A3
    # # G3,3,5,45,A6
    # # H3,3,4,45,A5
    # # A4,0,0,0,A1
    # # B4,0,0,0,A1
    # # C4,0,0,0,A1
    # # D4,0,0,0,A1
    # # E4,0,0,0,A1
    # # F4,0,0,0,A1
    # # G4,0,0,0,A1
    # # H4,0,0,0,A1
    # # A5,0,0,0,A1
    # # B5,0,0,0,A1
    # # C5,0,0,0,A1
    # # D5,0,0,0,A1
    # # E5,0,0,0,A1
    # # F5,0,0,0,A1
    # # G5,0,0,0,A1
    # # H5,0,0,0,A1
    # # A6,0,0,0,A1
    # # B6,0,0,0,A1
    # # C6,0,0,0,A1
    # # D6,0,0,0,A1
    # # E6,0,0,0,A1
    # # F6,0,0,0,A1
    # # G6,0,0,0,A1
    # # H6,0,0,0,A1
    # # A7,0,0,0,A1
    # # B7,0,0,0,A1
    # # C7,0,0,0,A1
    # # D7,0,0,0,A1
    # # E7,0,0,0,A1
    # # F7,0,0,0,A1
    # # G7,0,0,0,A1
    # # H7,0,0,0,A1
    # # A8,0,0,0,A1
    # # B8,0,0,0,A1
    # # C8,0,0,0,A1
    # # D8,0,0,0,A1
    # # E8,0,0,0,A1
    # # F8,0,0,0,A1
    # # G8,0,0,0,A1
    # # H8,0,0,0,A1
    # # A9,0,0,0,A1
    # # B9,0,0,0,A1
    # # C9,0,0,0,A1
    # # D9,0,0,0,A1
    # # E9,0,0,0,A1
    # # F9,0,0,0,A1
    # # G9,0,0,0,A1
    # # H9,0,0,0,A1
    # # A10,0,0,0,A1
    # # B10,0,0,0,A1
    # # C10,0,0,0,A1
    # # D10,0,0,0,A1
    # # E10,0,0,0,A1
    # # F10,0,0,0,A1
    # # G10,0,0,0,A1
    # # H10,0,0,0,A1
    # # A11,0,0,0,A1
    # # B11,0,0,0,A1
    # # C11,0,0,0,A1
    # # D11,0,0,0,A1
    # # E11,0,0,0,A1
    # # F11,0,0,0,A1
    # # G11,0,0,0,A1
    # # H11,0,0,0,A1
    # # A12,0,0,0,A1
    # # B12,0,0,0,A1
    # # C12,0,0,0,A1
    # # D12,0,0,0,A1
    # # E12,0,0,0,A1
    # # F12,0,0,0,A1
    # # G12,0,0,0,A1
    # # H12,0,0,0,A1
    # # """

    # DECK SETUP AND LABWARE

    tc_mod = ctx.load_module("thermocyclerModuleV2")
    tc_mod.open_lid()
    if real_mode:
        tc_mod.set_lid_temperature(105)

    temp_mod = ctx.load_module("temperature module gen2", "1")
    reagent_rack = temp_mod.load_labware("opentrons_24_aluminumblock_nest_1.5ml_snapcap")  # check if 2mL

    dest_plate = tc_mod.load_labware("opentrons_96_wellplate_200ul_pcr_full_skirt")  # do I change this to tough plate if they run pcr?

    source_plate = ctx.load_labware("axygen_96_wellplate_200ul", 3)  # do I change this to their plate?

    tiprack_50 = [ctx.load_labware("opentrons_flex_96_tiprack_50ul", slot) for slot in [8, 9]]

    # LOAD PIPETTES
    p50 = ctx.load_instrument("flex_1channel_50", p50_mount, tip_racks=tiprack_50)

    # mmx_liq = ctx.define_liquid(name="Mastermix", description='Mastermix', display_color='#008000')
    # water_liq = ctx.define_liquid(name="Water", description='Water', display_color='#A52A2A')
    # dna_liq = ctx.define_liquid(name="DNA", description='DNA', display_color='#A52A2A')

    # mapping
    csv_lines = [[val.strip() for val in line.split(",")] for line in csv_samp.splitlines() if line.split(",")[0].strip()][1:]

    if temp_mod_on:
        temp_mod.set_temperature(4)

    water = reagent_rack["B1"]
    # water.load_liquid(liquid=water_liq, volume=1500)
    #
    # mmx_pic = reagent_rack.rows()[0]
    # for mmx_well in mmx_pic:
    #     mmx_well.load_liquid(liquid=mmx_liq, volume=1500)
    #
    # dna_pic = source_plate.wells()
    # for dna_well in dna_pic:
    #     dna_well.load_liquid(liquid=dna_liq, volume=50)

    # adding water
    ctx.comment("\n\n----------ADDING WATER----------\n")
    p50.pick_up_tip()
    # p50.aspirate(40, water) # prewet
    # p50.dispense(40, water)
    for row in csv_lines:
        water_vol = row[1]
        if water_vol.lower() == "x":
            continue
        water_vol = int(row[1])
        dest_well = row[0]
        if water_vol == 0:
            break

        p50.configure_for_volume(water_vol)
        p50.aspirate(water_vol, water)
        p50.dispense(water_vol, dest_plate[dest_well], rate=0.5)
        p50.configure_for_volume(50)

        # p50.blow_out()
    p50.drop_tip() if real_mode else p50.return_tip()

    # adding Mastermix
    ctx.comment("\n\n----------ADDING MASTERMIX----------\n")
    p50.pick_up_tip()
    for i, row in enumerate(csv_lines):
        mmx_vol = row[3]
        if mmx_vol.lower() == "x":
            continue

        if i == 0:
            mmx_tube = row[4]
        mmx_tube_check = mmx_tube
        mmx_tube = row[4]
        if mmx_tube_check != mmx_tube:

            p50.drop_tip() if real_mode else p50.return_tip()
            p50.pick_up_tip()

        if not p50.has_tip:
            p50.pick_up_tip()

        mmx_vol = int(row[3])
        dest_well = row[0]

        if mmx_vol == 0:
            break
        p50.configure_for_volume(mmx_vol)
        p50.aspirate(mmx_vol, reagent_rack[mmx_tube])
        p50.dispense(mmx_vol, dest_plate[dest_well].top())
        ctx.delay(seconds=2)
        p50.blow_out()
        p50.touch_tip()
        p50.configure_for_volume(50)

    if p50.has_tip:
        p50.drop_tip() if real_mode else p50.return_tip()

    # adding DNA
    ctx.comment("\n\n----------ADDING DNA----------\n")
    for row in csv_lines:

        dna_vol = row[2]
        if dna_vol.lower() == "x":
            continue

        p50.pick_up_tip()

        dna_vol = int(row[2])
        dest_and_source_well = row[0]

        if dna_vol == 0:
            break
        p50.configure_for_volume(dna_vol)
        p50.aspirate(dna_vol, source_plate[dest_and_source_well])
        p50.dispense(dna_vol, dest_plate[dest_and_source_well], rate=0.5)

        p50.mix(10, 0.7 * rxn_vol if 0.7 * rxn_vol < 30 else 30, dest_plate[dest_and_source_well])
        p50.drop_tip() if real_mode else p50.return_tip() if real_mode else p50.return_tip()
        p50.configure_for_volume(50)

    ctx.comment("\n\n-----------Running PCR------------\n")

    if real_mode:

        profile1 = [
            {"temperature": 95, "hold_time_minutes": 2},
        ]

        profile2 = [
            {"temperature": 98, "hold_time_seconds": 10},
            {"temperature": 58, "hold_time_seconds": 10},
            {"temperature": 72, "hold_time_seconds": 30},
        ]

        profile3 = [{"temperature": 72, "hold_time_minutes": 5}]

        tc_mod.close_lid()
        tc_mod.execute_profile(steps=profile1, repetitions=1, block_max_volume=50)
        tc_mod.execute_profile(steps=profile2, repetitions=30, block_max_volume=50)
        tc_mod.execute_profile(steps=profile3, repetitions=1, block_max_volume=50)
        tc_mod.set_block_temperature(4)

    tc_mod.open_lid()
