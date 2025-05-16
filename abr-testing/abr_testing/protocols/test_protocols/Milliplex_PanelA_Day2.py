"""Millipore Protocol: Human Cytokine Panel A Milliplex Protocol - Day 2."""
from opentrons import types
from typing import List
from opentrons.protocol_api import ProtocolContext, ParameterContext, Well
from opentrons.protocol_api.module_contexts import HeaterShakerContext

metadata = {
    "protocolName": "Human Cytokine Panel A Milliplex Protocol - Day 2",
    "author": "Science Team, Opentrons",
}

requirements = {"robotType": "Flex", "apiLevel": "2.23"}


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol."""
    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        description=("All incubation steps skipped and tips returned to tipracks"),
        default=True,
    )
    parameters.add_bool(
        variable_name="seal",
        display_name="Plate Sealing",
        description=("Assay Plate sealed during incubation?"),
        default=False,
    )
    parameters.add_int(
        variable_name="num_sample",
        display_name="Number of Samples",
        description="Number of samples to be processed in duplicate (maximum: 38)",
        default=38,
        minimum=1,
        maximum=38,
    )
    parameters.add_int(
        variable_name="pipet_location",
        display_name="P1000 1-ch Position",
        description="How P1000 single channel pipette is mounted?",
        default=1,
        choices=[
            {"display_name": "on the right", "value": 1},
            {"display_name": "on the left", "value": 2},
        ],
    )


def run(ctx: ProtocolContext) -> None:
    """Run the protocol."""
    # global dry_run
    # global seal
    # global num_sample
    # global pipet_location
    # global col_full
    # global well_in_last_col
    dry_run = ctx.params.dry_run  # type: ignore[attr-defined]
    seal = ctx.params.seal  # type: ignore[attr-defined]
    num_sample = ctx.params.num_sample  # type: ignore[attr-defined]
    pipet_location = ctx.params.pipet_location  # type: ignore[attr-defined]

    col_full = int((20 + (num_sample * 2)) // 8)
    well_in_last_col = int((20 + (num_sample * 2)) % 8)

    if pipet_location == 1:
        p1k_1_loc = "right"
        p1k_8_loc = "left"
    else:
        p1k_1_loc = "left"
        p1k_8_loc = "right"

    # deck layout
    hs: HeaterShakerContext = ctx.load_module(
        "heaterShakerModuleV1", "D1"
    )  # type: ignore[assignment]
    hs_adapter = hs.load_adapter("opentrons_universal_flat_adapter")
    assay_plate = hs_adapter.load_labware(
        "corning_96_wellplate_360ul_flat", "ASSAY PLATE"
    )
    rxn_in_col: List[Well] = assay_plate.rows()[0][:col_full]
    if well_in_last_col > 0:
        rxn_in_well = assay_plate.wells()[
            (col_full * 8) : (col_full * 8 + well_in_last_col)
        ]

    buffer_res = ctx.load_labware("nest_12_reservoir_15ml", "C2", "SHEATH FLUID")
    sf = buffer_res.wells()[10:12]

    buffer_rack = ctx.load_labware(
        "opentrons_10_tuberack_nest_4x50ml_6x15ml_conical", "B1", "ANTIBODIES, SAPE"
    )
    ab_stock = buffer_rack.wells()[1]
    sape_stock = buffer_rack.wells()[2]

    temp_plate = ctx.load_labware("axygen_96_wellplate_500ul", "C1", "WORKING PLATW")
    ab = temp_plate.rows()[0][0]
    sape = temp_plate.rows()[0][1]
    ab_in_well = temp_plate.wells()[0:8]
    sape_in_well = temp_plate.wells()[8:16]

    ctx.load_trash_bin("A3")

    tips_1k = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "C3", "1000uL TIPS")
    tips_200 = [
        ctx.load_labware("opentrons_flex_96_tiprack_200ul", slot, "200uL TIPS")
        for slot in ["B2", "B3"]
    ]

    p1k_1 = ctx.load_instrument("flex_1channel_1000", p1k_1_loc)
    p1k_8 = ctx.load_instrument("flex_8channel_1000", p1k_8_loc)

    # volume info

    vol_info = (25 * (col_full + 1) + 20) * well_in_last_col + (25 * col_full + 20) * (
        8 - well_in_last_col
    )
    def_ab = ctx.define_liquid(
        name="Detection Antibodies", description=" ", display_color="#330000"
    )  # Dark
    def_sape = ctx.define_liquid(
        name="Streptavidin-Phycoerythrin (SAPE)",
        description=" ",
        display_color="#990033",
    )  # Drak
    buffer_rack.wells()[1].load_liquid(liquid=def_ab, volume=vol_info)
    buffer_rack.wells()[2].load_liquid(liquid=def_sape, volume=vol_info)

    num_col = col_full
    if well_in_last_col > 0:
        num_col = num_col + 1

    if num_col > 6:
        vol_sf_1 = 8000
        vol_sf_2 = (num_col - 7) * 150 * 8 + 2000
        def_sf_1 = ctx.define_liquid(
            name="Sheath Fluid", description=" ", display_color="#9966FF"
        )  # light
        def_sf_2 = ctx.define_liquid(
            name="Sheath Fluid", description=" ", display_color="#9966FF"
        )  # light
        buffer_res.wells()[10].load_liquid(liquid=def_sf_1, volume=vol_sf_1)
        buffer_res.wells()[11].load_liquid(liquid=def_sf_2, volume=vol_sf_2)
    else:
        vol_sf_1 = (num_col - 1) * 150 * 8 + 2000
        def_sf_1 = ctx.define_liquid(
            name="Sheath Fluid", description=" ", display_color="#9966FF"
        )  # light
        buffer_res.wells()[1].load_liquid(liquid=def_sf_1, volume=vol_sf_1)

    # protocol

    ctx.pause("Wash Assay Plate off deck")
    hs.open_labware_latch()
    ctx.pause("Load Assay Plate on Shaker")
    hs.close_labware_latch()

    # add detection ab and shake, and then SAPE

    stock = [ab_stock, sape_stock]
    in_well = [ab_in_well, sape_in_well]
    reagent = [ab, sape]
    if dry_run:
        incubation_time = [0.1, 0.1]
    else:
        incubation_time = [60, 30]
    touch_tip = [1, -1]

    for loc_1, loc_2, loc_3, min, touch in zip(
        stock, in_well, reagent, incubation_time, touch_tip
    ):
        p1k_1.tip_racks = [tips_1k]

        p1k_1.pick_up_tip()
        if well_in_last_col > 0:
            for i in range(well_in_last_col):
                vol = 25 * (col_full + 1) + 20
                if i == 0:
                    p1k_1.mix(1, vol, loc_1)
                p1k_1.aspirate(vol, loc_1, rate=0.5)
                ctx.delay(seconds=1)
                p1k_1.dispense(vol, loc_2[i].top(z=-2), rate=0.5)
                ctx.delay(seconds=1)
        for i in range(8 - well_in_last_col):
            vol = 25 * col_full + 20
            if i == 0:
                p1k_1.mix(1, vol, loc_1)
            p1k_1.aspirate(vol, loc_1, rate=0.5)
            ctx.delay(seconds=1)
            p1k_1.dispense(vol, loc_2[well_in_last_col + i].top(z=-2), rate=0.5)
            ctx.delay(seconds=1)
        if dry_run:
            p1k_1.return_tip()
        else:
            p1k_1.drop_tip()

        p1k_8.tip_racks = tips_200

        for col in rxn_in_col:
            p1k_8.pick_up_tip()
            p1k_8.mix(1, 25, loc_3.bottom(z=2))
            p1k_8.aspirate(25, loc_3.bottom(z=1), rate=0.5)
            ctx.delay(seconds=1)
            p1k_8.dispense(25, col.top(z=-5), rate=0.5)
            ctx.delay(seconds=1)
            diameter = (
                col.diameter if col.diameter is not None else 6.86
            )  # Example default value
            p1k_8.move_to(
                col.top(z=-2).move(types.Point(x=touch * (diameter / 2.0 - 0.2)))
            )
            if dry_run:
                p1k_8.return_tip()
            else:
                p1k_8.drop_tip()

        if well_in_last_col > 0:
            p1k_1.tip_racks = tips_200
            for n in range(well_in_last_col):
                p1k_1.pick_up_tip()
                p1k_1.mix(1, 25, loc_2[n].bottom(z=2))
                p1k_1.aspirate(25, loc_2[n].bottom(z=1), rate=0.5)
                ctx.delay(seconds=1)
                p1k_1.dispense(25, rxn_in_well[n].top(z=-5), rate=0.5)
                ctx.delay(seconds=1)
                d = rxn_in_well[n].diameter
                diameter_2: float = d if d is not None else 6.86
                p1k_1.move_to(
                    rxn_in_well[n]
                    .top(z=-2)
                    .move(types.Point(x=touch * (diameter_2 / 2.0 - 0.2)))
                )
                if dry_run:
                    p1k_1.return_tip()
                else:
                    p1k_1.drop_tip()

        if seal:
            hs.open_labware_latch()
            ctx.pause("Seal Assay Plate")
            hs.close_labware_latch()

        hs.set_and_wait_for_shake_speed(rpm=1500)
        ctx.delay(seconds=10)
        hs.set_and_wait_for_shake_speed(rpm=600)
        ctx.delay(minutes=min)
        hs.deactivate_shaker()

        if seal:
            hs.open_labware_latch()
            ctx.pause("Remove plate seal")
            hs.close_labware_latch()

    hs.open_labware_latch()
    ctx.pause("Wash Assay Plate off deck and then load Assay Plate on Shaker")
    hs.close_labware_latch()

    # add sheath fluid and shake

    p1k_8.tip_racks = [tips_1k]
    p1k_8.pick_up_tip()

    if col_full > 6:
        p1k_8.mix(1, 900, sf[0].bottom(z=2))
        p1k_8.aspirate(900, sf[0].bottom(z=1), rate=0.5)
        ctx.delay(seconds=1)
        for col_1 in range(6):
            p1k_8.dispense(150, rxn_in_col[col_1].top(z=-2), rate=0.5)
            ctx.delay(seconds=1)

        p1k_8.mix(1, 150 * (col_full - 6), sf[1].bottom(z=2))
        p1k_8.aspirate(150 * (col_full - 6), sf[1].bottom(z=1), rate=0.5)
        ctx.delay(seconds=1)
        for col_2 in range(col_full - 6):
            p1k_8.dispense(150, rxn_in_col[6 + col_2].top(z=-2), rate=0.5)
            ctx.delay(seconds=1)

    else:
        p1k_8.mix(1, 150 * col_full, sf[0].bottom(z=2))

        p1k_8.aspirate(150 * col_full, sf[0].bottom(z=1), rate=0.5)
        ctx.delay(seconds=1)
        for col_3 in range(col_full):
            p1k_8.dispense(150, rxn_in_col[col_3].top(z=-2), rate=0.5)
            ctx.delay(seconds=1)

    if dry_run:
        p1k_8.return_tip()
    else:
        p1k_8.drop_tip()

    if well_in_last_col > 0:
        p1k_1.tip_racks = [tips_1k]
        p1k_1.pick_up_tip()

        if well_in_last_col > 4:
            p1k_1.mix(1, 600, sf[0].bottom(z=2))
            p1k_1.aspirate(600, sf[0].bottom(z=1), rate=0.5)
            ctx.delay(seconds=1)
            for well in range(4):
                p1k_1.dispense(150, rxn_in_well[well].top(z=-2), rate=0.5)
                ctx.delay(seconds=1)

            p1k_1.mix(1, 150 * (well_in_last_col - 4), sf[1].bottom(z=2))
            p1k_1.aspirate(150 * (well_in_last_col - 4), sf[1].bottom(z=1), rate=0.5)
            ctx.delay(seconds=1)
            for well in range(well_in_last_col - 4):
                p1k_1.dispense(150, rxn_in_well[4 + well].top(z=-2), rate=0.5)
                ctx.delay(seconds=1)

        else:
            p1k_1.mix(1, 150 * well_in_last_col, sf[0].bottom(z=2))

            p1k_1.aspirate(150 * well_in_last_col, sf[0].bottom(z=1), rate=0.5)
            ctx.delay(seconds=1)
            for well in range(well_in_last_col):
                p1k_1.dispense(150, rxn_in_well[well].top(z=-2), rate=0.5)
                ctx.delay(seconds=1)

        if dry_run:
            p1k_1.return_tip()
        else:
            p1k_1.drop_tip()

    hs.set_and_wait_for_shake_speed(rpm=1500)
    ctx.delay(seconds=10)
    hs.set_and_wait_for_shake_speed(rpm=600)
    ctx.delay(minutes=0.1 if dry_run else 5)
    hs.deactivate_shaker()
    hs.open_labware_latch()
