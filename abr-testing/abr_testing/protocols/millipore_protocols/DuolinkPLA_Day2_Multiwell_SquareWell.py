"""Duolink Day 1 Multiwell Square Well Protocol."""

from opentrons.types import Point
from opentrons.protocol_api import ProtocolContext, ParameterContext, Well, Labware
from typing import List
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    TemperatureModuleContext,
)

metadata = {
    "protocolName": """Duolink PLA for Microscopy
    (Multiwell Plate Assay with 96 Square Well Culture Plate) - Day 2""",
    "author": "Opentrons Science Team",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23",
}


VOL_AB = 80
VOL_PROBE = 80
VOL_LIGATION = 80
VOL_AMP = 80
VOL_DAPI = 80  # new LM
VOL_AF = 80  # new LM

VOL_WASH = 200

MIN_PROBE = 60
MIN_LIGATION = 30
MIN_AMP = 100
MIN_DAPI = 15  # New LM, not sure needed

MIN_WASH_A = 5
MIN_WASH_B = 10
MIN_WASH_B_DILUTED = 1
MIN_WASH_PBS = 0.5


DEFAULT_RATE = 700
SLOW = 100  # speed up

H_DISCARD = 0.65
D_1K = -3.2
D_200 = -2.1


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters to the protocol context."""
    parameters.add_int(
        variable_name="num_sample",
        display_name="Number of Samples",
        description="Number of samples to be processed (up to 96)",
        default=96,
        minimum=1,
        maximum=96,
    )
    parameters.add_bool(
        variable_name="dry_run",
        display_name="Dry Run",
        description="All incubation steps skipped and tips returned to tipracks",
        default=False,
    )
    parameters.add_bool(
        variable_name="heat_on_deck",
        display_name="Incubation on Deck",
        description="Use Heater-Shaker Module for 37 degree C incubation?",
        default=True,
    )
    parameters.add_bool(
        variable_name="use_lid",
        display_name="Use Plate Lid",
        description="Use a lid to cover assay plate during incubation?",
        default=True,
    )
    parameters.add_bool(
        variable_name="use_temp",
        display_name="Use Temperature Module",
        description="Use a Temperature Module to keep reagents cold?",
        default=True,
    )


def run(ctx: ProtocolContext) -> None:
    """Run the protocol."""
    num_sample = ctx.params.num_sample  # type: ignore[attr-defined]
    dry_run = ctx.params.dry_run  # type: ignore[attr-defined]
    heat_on_deck = ctx.params.heat_on_deck  # type: ignore[attr-defined]
    use_lid = ctx.params.use_lid  # type: ignore[attr-defined]
    use_temp = ctx.params.use_temp  # type: ignore[attr-defined]

    num_col_full = int(num_sample // 8)
    num_well_last_col = num_sample % 8
    if num_well_last_col > 0:
        num_col_total = num_col_full + 1
    else:
        num_col_total = num_col_full

    # deck layout
    if use_temp:
        temp_mod: TemperatureModuleContext = ctx.load_module(
            "temperature module gen2", "C1"
        )  # type: ignore[assignment]
        temp_adapter = temp_mod.load_adapter("opentrons_96_deep_well_temp_mod_adapter")
        reagent_plate = temp_adapter.load_labware(
            "nest_96_wellplate_2ml_deep", "Reagent Plate"
        )

    else:
        reagent_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", "C1", "REAGENTS")

    hs: HeaterShakerContext = ctx.load_module(
        "heaterShakerModuleV1", "D1"
    )  # type: ignore[assignment]
    hs_adapter = hs.load_adapter("opentrons_universal_flat_adapter")

    working_plate = ctx.load_labware(
        "ibidi_96_square_well_plate_300ul", "C2", "ASSAY PLATE"
    )

    wash_a_plate = ctx.load_labware("nest_1_reservoir_290ml", "C3", "WASH BUFFER A")
    wash_other_plate = ctx.load_labware(
        "nest_12_reservoir_15ml", "D3", "WASH BUFFER B, B(0.01x), and PBS"
    )
    waste_res = ctx.load_labware("nest_1_reservoir_290ml", "D2", "LIQUID WASTE")

    ctx.load_trash_bin("A3")

    tips_1k = [
        ctx.load_labware("opentrons_flex_96_tiprack_1000ul", slot, "1000uL TIPS")
        for slot in ["B3", "B2"]
    ]

    tips_200_reuse = [
        ctx.load_labware("opentrons_flex_96_tiprack_200ul", slot, "200uL TIPS REUSE")
        for slot in ["B1", "A2", "A1"]
    ]

    p1k_8 = ctx.load_instrument("flex_8channel_1000", "left")
    p1k_1 = ctx.load_instrument("flex_1channel_1000", "right")

    p1k_8.flow_rate.aspirate = DEFAULT_RATE
    p1k_8.flow_rate.dispense = DEFAULT_RATE
    p1k_1.flow_rate.aspirate = DEFAULT_RATE
    p1k_1.flow_rate.dispense = DEFAULT_RATE

    # liquid location
    rxn_total = working_plate.rows()[0][:num_col_total]
    rxn_full = working_plate.rows()[0][:num_col_full]
    if num_well_last_col > 0:
        rxn_remainder = working_plate.wells()[
            num_col_full * 8 : num_col_full * 8 + num_well_last_col
        ]

    probe = reagent_plate.rows()[0][0]
    probe_remainder = reagent_plate.wells()[:num_well_last_col]
    lig = reagent_plate.rows()[0][1]
    lig_remainder = reagent_plate.wells()[8 : 8 + num_well_last_col]
    amp = reagent_plate.rows()[0][2]
    amp_remainder = reagent_plate.wells()[16 : 16 + num_well_last_col]
    dapi = reagent_plate.rows()[0][3]
    dapi_remainder = reagent_plate.wells()[24 : 24 + num_well_last_col]
    af = reagent_plate.rows()[0][4]
    af_remainder = reagent_plate.wells()[32 : 32 + num_well_last_col]

    wash_a = wash_a_plate.wells()[0]

    wash_b_1 = wash_other_plate.wells()[:2]
    wash_b_2 = wash_other_plate.wells()[2:4]
    wash_b_diluted = wash_other_plate.wells()[4:6]
    wash_pbs = wash_other_plate.wells()[6:8]

    waste = waste_res.wells()[0]

    # volume info
    name_re = [
        "PLA PROBE SOLUTION",
        "LIGATION SOLUTION",
        "AMPLIFICATION SOLUTION",
        "DAPI",
        "ANTI-FADE BUFFER",
    ]
    color_re = [
        "#FF5733",
        "#f39c12",
        "#52be80",
        "#a569bd",
        "#aeb6bf",
    ]  # Red, Yellow, Green, Purple, Gray
    vol_re_dark = 80 * (num_col_full + 1) + 80
    vol_re_light = 80 * num_col_full + 80

    for col, (name_info, color_info) in enumerate(zip(name_re, color_re)):
        def_re = ctx.define_liquid(
            name=name_info, description=" ", display_color=color_info
        )
        [
            reagent_plate.rows()[row][col].load_liquid(
                liquid=def_re, volume=vol_re_dark
            )
            for row in range(num_well_last_col)
        ]
        def_re = ctx.define_liquid(
            name=name_info, description=" ", display_color=color_info
        )
        [
            reagent_plate.rows()[row][col].load_liquid(
                liquid=def_re, volume=vol_re_light
            )
            for row in range(num_well_last_col, 8)
        ]

    vol_wa_a = VOL_WASH * 6 * num_sample + 24000
    def_wa_a = ctx.define_liquid(
        name="WASH BUFFER A", description=" ", display_color="#0080bf"
    )  # Blue
    wash_a_plate.wells()[0].load_liquid(liquid=def_wa_a, volume=vol_wa_a)

    def_wa_b = ctx.define_liquid(
        name="WASH BUFFER B", description=" ", display_color="#00acdf"
    )  # Blue
    if num_col_total > 6:
        vol_wa_b = [
            VOL_WASH * (6 - 1) * 8 + 2000,
            VOL_WASH * (num_col_total - 6 - 1) * 8 + 2000,
        ]
        [
            wash_other_plate.wells()[n].load_liquid(liquid=def_wa_b, volume=vol_wa_b[n])
            for n in [0, 1]
        ]
        [
            wash_other_plate.wells()[n].load_liquid(
                liquid=def_wa_b, volume=vol_wa_b[n - 2]
            )
            for n in [2, 3]
        ]
    else:
        vol_wa_b_one = VOL_WASH * (num_col_total - 1) * 8 + 2000
        [
            wash_other_plate.wells()[n].load_liquid(
                liquid=def_wa_b, volume=vol_wa_b_one
            )
            for n in [0, 2]
        ]

    def_wa_b_diluted = ctx.define_liquid(
        name="WASH BUFEER B (0.01x)", description=" ", display_color="#7ce8ff"
    )  # Blue
    if num_col_total > 6:
        vol_wa_b_diluted = [
            VOL_WASH * (6 - 1) * 8 + 2000,
            VOL_WASH * (num_col_total - 6 - 1) * 8 + 2000,
        ]
        [
            wash_other_plate.wells()[n].load_liquid(
                liquid=def_wa_b_diluted, volume=vol_wa_b_diluted[n - 4]
            )
            for n in [4, 5]
        ]
    else:
        vol_wa_b_diluted_one = VOL_WASH * (num_col_total - 1) * 8 + 2000
        wash_other_plate.wells()[4].load_liquid(
            liquid=def_wa_b_diluted, volume=vol_wa_b_diluted_one
        )

    def_wa_pbs = ctx.define_liquid(
        name="PBS", description=" ", display_color="#ccf9ff"
    )  # Blue
    if num_col_total > 6:
        vol_wa_pbs = [
            VOL_WASH * (6 - 1) * 8 + 2000,
            VOL_WASH * (num_col_total - 6 - 1) * 8 + 2000,
        ]
        [
            wash_other_plate.wells()[n].load_liquid(
                liquid=def_wa_pbs, volume=vol_wa_pbs[n - 6]
            )
            for n in [6, 7]
        ]
    else:
        vol_wa_pbs_one = VOL_WASH * (num_col_total - 1) * 8 + 2000
        wash_other_plate.wells()[6].load_liquid(
            liquid=def_wa_pbs, volume=vol_wa_pbs_one
        )

    vol_from_day1 = VOL_AB
    def_from_day1 = ctx.define_liquid(
        name="FROM DAY 1", description=" ", display_color="#fff9d8"
    )  # Light Yellow
    [
        working_plate.wells()[n].load_liquid(liquid=def_from_day1, volume=vol_from_day1)
        for n in range(num_sample)
    ]

    if use_lid:

        ctx.load_lid_stack("ibidi_96_square_well_plate_300ul_lid", "C4", 1)

        def cover_plate() -> None:
            """Cover the plate with a lid."""
            ctx.move_lid(
                "C4",
                working_plate,
                use_gripper=True,
                pick_up_offset={"x": 0, "y": 0, "z": 0},
                drop_offset={"x": 0, "y": 0, "z": 0},
            )

        def remove_lid() -> None:
            """Remove the lid from the plate."""
            ctx.move_lid(
                working_plate,
                "C4",
                use_gripper=True,
                pick_up_offset={"x": 0, "y": 0, "z": 0},
                drop_offset={"x": 0, "y": 0, "z": 0},
            )

    def heat(min: float) -> None:
        """Heat the plate to 37 degrees Celsius."""
        hs.set_and_wait_for_temperature(37)
        hs.open_labware_latch()
        ctx.move_labware(
            labware=working_plate, new_location=hs_adapter, use_gripper=True
        )

        hs.close_labware_latch()
        hs.open_labware_latch()

        ctx.delay(minutes=min)

        ctx.move_labware(labware=working_plate, new_location="C2", use_gripper=True)

    def transfer(start: Well, vol: float) -> None:
        """Transfer liquid from start wells to reaction wells."""
        p1k_8.tip_racks = tips_1k
        p1k_8.pick_up_tip()
        p1k_8.aspirate(vol * len(rxn_full), start)
        p1k_8.air_gap(10)
        p1k_8.dispense(10, rxn_full[0].top(z=0))
        p1k_8.flow_rate.dispense = SLOW
        for col in rxn_full:
            p1k_8.move_to(col.top(z=0))
            p1k_8.dispense(vol, col.top(z=-2).move(Point(x=D_1K, y=D_1K)))
            p1k_8.move_to(col.top(z=0))
        p1k_8.blow_out()
        if dry_run:
            p1k_8.return_tip()
        else:
            p1k_8.drop_tip()
        p1k_8.flow_rate.dispense = DEFAULT_RATE

    def transfer_remainder(start: List[Well], vol: float) -> None:
        """Transfer liquid from start wells to reaction remainder wells."""
        p1k_1.tip_racks = tips_1k
        p1k_1.pick_up_tip()
        for well_start in start:
            p1k_1.aspirate(vol, well_start)
        p1k_1.air_gap(10)
        p1k_1.dispense(10, rxn_remainder[0].top(z=0))
        p1k_1.flow_rate.dispense = SLOW
        for well_end in rxn_remainder:
            p1k_1.move_to(well_end.top(z=0))
            p1k_1.dispense(vol, well_end.top(z=-2).move(Point(x=D_1K, y=D_1K)))
            p1k_1.move_to(well_end.top(z=0))
        p1k_1.blow_out()
        if dry_run:
            p1k_1.return_tip()
        else:
            p1k_1.drop_tip()
        p1k_1.flow_rate.dispense = DEFAULT_RATE

    def discard(vol: float, tips: Labware) -> None:
        """Discard liquid from reaction wells."""
        p1k_8.tip_racks = [tips]
        for i in range(num_col_total):
            p1k_8.pick_up_tip()
            p1k_8.flow_rate.aspirate = SLOW
            p1k_8.move_to(rxn_total[i].top(z=0))
            p1k_8.aspirate(
                vol + 20, rxn_total[i].bottom(z=H_DISCARD).move(Point(x=D_200, y=D_200))
            )
            ctx.delay(seconds=2)
            p1k_8.move_to(rxn_total[i].top(z=0))
            p1k_8.flow_rate.aspirate = DEFAULT_RATE
            p1k_8.dispense(vol + 20, waste.top(z=-5))
            p1k_8.blow_out()
            p1k_8.return_tip()
        p1k_8.reset_tipracks()

    def wash(run: int, min: float, tips: Labware) -> None:
        """Wash reaction wells with Wash Buffer A."""
        hs.open_labware_latch()
        ctx.move_labware(
            labware=working_plate, new_location=hs_adapter, use_gripper=True
        )
        hs.close_labware_latch()

        for n in range(run):
            p1k_8.tip_racks = tips_1k
            p1k_8.pick_up_tip()

            m = int(num_col_total // 4)
            leftover = num_col_total % 4

            for mm in range(m):
                p1k_8.aspirate(
                    VOL_WASH * 4,
                    wash_a.bottom(z=1).move(Point(x=(n * 6 + mm) * 9 - 49.5)),
                )
                ctx.delay(seconds=1)
                p1k_8.air_gap(10)
                p1k_8.flow_rate.dispense = 80
                p1k_8.dispense(10, rxn_total[mm * 4].top(z=0))
                for j in range(4):
                    p1k_8.move_to(rxn_total[mm * 4 + j].top(z=0))
                    p1k_8.dispense(
                        VOL_WASH - 10,
                        rxn_total[mm * 4 + j].top(z=-2).move(Point(x=D_1K, y=D_1K)),
                    )
                    p1k_8.move_to(rxn_total[mm * 4 + j].top(z=0))
                    ctx.delay(seconds=1)
            if leftover > 0:
                p1k_8.aspirate(
                    VOL_WASH * leftover,
                    wash_a.bottom(z=1).move(Point(x=(m + 1) * 9 - 49.5)),
                )
                ctx.delay(seconds=1)
                p1k_8.air_gap(10)
                p1k_8.flow_rate.dispense = 80
                p1k_8.dispense(10, rxn_total[m * 4].top(z=0))
                for j in range(leftover):
                    p1k_8.move_to(rxn_total[m * 4 + j].top(z=0))
                    p1k_8.dispense(
                        VOL_WASH - 10,
                        rxn_total[m * 4 + j].top(z=-2).move(Point(x=D_1K, y=D_1K)),
                    )
                    p1k_8.move_to(rxn_total[m * 4 + j].top(z=0))
                    ctx.delay(seconds=1)

            if dry_run:
                p1k_8.return_tip()
            else:
                p1k_8.drop_tip()
            p1k_8.flow_rate.dispense = DEFAULT_RATE

            hs.set_and_wait_for_shake_speed(500)
            ctx.delay(minutes=min)
            hs.deactivate_shaker()

            p1k_8.flow_rate.aspirate = SLOW

            p1k_8.tip_racks = [tips]
            for k in range(num_col_total):
                p1k_8.pick_up_tip()
                p1k_8.move_to(rxn_total[k].top(z=0))
                p1k_8.aspirate(
                    VOL_WASH, rxn_total[k].bottom(z=0.8).move(Point(x=D_200, y=D_200))
                )
                ctx.delay(seconds=2)
                p1k_8.move_to(rxn_total[k].top(z=0))
                p1k_8.dispense(VOL_WASH, waste.top(z=-5))
                p1k_8.blow_out()
                p1k_8.return_tip()
            p1k_8.reset_tipracks()
            p1k_8.flow_rate.aspirate = DEFAULT_RATE

        hs.open_labware_latch()
        ctx.move_labware(labware=working_plate, new_location="C2", use_gripper=True)

    def wash_2(buffer_wash: List[Well], min: float, tips: Labware) -> None:
        """Wash reaction wells with Wash Buffer B."""
        p1k_8.tip_racks = tips_1k
        p1k_8.pick_up_tip()

        vol_half = VOL_WASH / 2

        for _ in range(2):

            if num_col_total > 6:
                p1k_8.aspirate(vol_half * 6, buffer_wash[0])
                ctx.delay(seconds=1)
                p1k_8.air_gap(10)
                p1k_8.flow_rate.dispense = 80
                p1k_8.dispense(10, rxn_total[0].top(z=0))
                for j in range(6):
                    p1k_8.move_to(rxn_total[j].top(z=0))
                    p1k_8.dispense(
                        vol_half - 10,
                        rxn_total[j].top(z=-2).move(Point(x=D_1K, y=D_1K)),
                    )
                    p1k_8.move_to(rxn_total[j].top(z=0))
                    ctx.delay(seconds=1)

                p1k_8.aspirate(vol_half * (num_col_total - 6), buffer_wash[1])
                ctx.delay(seconds=1)
                p1k_8.air_gap(10)
                p1k_8.flow_rate.dispense = 80
                p1k_8.dispense(10, rxn_total[6].top(z=0))
                for j in range(num_col_total - 6):
                    p1k_8.move_to(rxn_total[6 + j].top(z=0))
                    p1k_8.dispense(
                        vol_half - 10,
                        rxn_total[6 + j].top(z=-2).move(Point(x=D_1K, y=D_1K)),
                    )
                    p1k_8.move_to(rxn_total[6 + j].top(z=0))
                    ctx.delay(seconds=1)
            else:
                p1k_8.aspirate(vol_half * num_col_total, buffer_wash[0])
                ctx.delay(seconds=1)
                p1k_8.air_gap(10)
                p1k_8.flow_rate.dispense = 80
                p1k_8.dispense(10, rxn_total[0].top(z=0))
                for j in range(num_col_total):
                    p1k_8.move_to(rxn_total[j].top(z=0))
                    p1k_8.dispense(
                        vol_half, rxn_total[j].top(z=-2).move(Point(x=D_1K, y=D_1K))
                    )
                    p1k_8.move_to(rxn_total[j].top(z=0))
                    ctx.delay(seconds=1)

        if dry_run:
            p1k_8.return_tip()
        else:
            p1k_8.drop_tip()
        p1k_8.flow_rate.dispense = DEFAULT_RATE

        hs.set_and_wait_for_shake_speed(500)
        ctx.delay(minutes=min)
        hs.deactivate_shaker()

        p1k_8.flow_rate.aspirate = SLOW

        p1k_8.tip_racks = [tips]
        for col_rxn in rxn_total:
            p1k_8.pick_up_tip()
            p1k_8.move_to(col_rxn.top(z=0))
            p1k_8.aspirate(
                VOL_WASH, col_rxn.bottom(z=0.8).move(Point(x=D_200, y=D_200))
            )
            ctx.delay(seconds=2)
            p1k_8.move_to(col_rxn.top(z=0))
            p1k_8.dispense(VOL_WASH, waste.top(z=-5))
            p1k_8.blow_out()
            p1k_8.return_tip()

        p1k_8.reset_tipracks()
        p1k_8.flow_rate.aspirate = DEFAULT_RATE

    # protocol

    if not use_temp:
        ctx.pause(
            """Make sure to reset any tips that were used during the first day.
            Ensure sufficient PLA Probe Solution is already added to each well
            of column 1 in the reagent plate."""
        )
    if use_temp:
        ctx.pause(
            """Make sure to reset any tips that were used during the first day.
            Ensure sufficient reagents are added to corresponding wells of columns
            1-5 in the reagent plate on the Temperature Module."""
        )

    if use_temp:
        temp_mod.set_temperature(4)

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("        Discarding Antibody        ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    discard(VOL_AB, tips_200_reuse[0])
    wash(2 if not dry_run else 1, MIN_WASH_A if not dry_run else 0.1, tips_200_reuse[0])

    ctx.comment("                                                  ")
    ctx.comment("**************************************************")
    ctx.comment("  Transferring PLA Probe Solution and Incubating  ")
    ctx.comment("**************************************************")
    ctx.comment("                                                  ")

    transfer(probe, VOL_PROBE)
    if num_well_last_col > 0:
        transfer_remainder(probe_remainder, VOL_PROBE)

    if use_lid:
        cover_plate()
    else:
        ctx.pause("Please place seal on plate.")

    if heat_on_deck:
        heat(MIN_PROBE if not dry_run else 0.1)
    else:
        ctx.pause(
            "Incubation at 37 degree C for 1 hour - remove seal and return plate to slot C2"
        )

    if use_lid:
        remove_lid()

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("      Removing Probe Solution      ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    discard(VOL_PROBE, tips_200_reuse[0])
    wash(2 if not dry_run else 1, MIN_WASH_A if not dry_run else 0.1, tips_200_reuse[0])

    ctx.comment("                                                  ")
    ctx.comment("**************************************************")
    ctx.comment("  Transferring Ligation Solution and Incubating   ")
    ctx.comment("**************************************************")
    ctx.comment("                                                  ")

    if not use_temp:
        ctx.pause(
            "Please add sufficient Ligation Solution to each well of column 2 in the reagent plate."
        )

    transfer(lig, VOL_LIGATION)
    if num_well_last_col > 0:
        transfer_remainder(lig_remainder, VOL_LIGATION)

    if use_lid:
        cover_plate()
    else:
        ctx.pause("Please place seal on plate.")

    if heat_on_deck:
        heat(MIN_LIGATION if not dry_run else 0.1)
    else:
        ctx.pause(
            "Incubation at 37 degree C for 30 min - remove seal and return plate to slot C2"
        )

    if use_lid:
        remove_lid()

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("    Removing Ligation Solution     ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    discard(VOL_LIGATION, tips_200_reuse[1])
    wash(2 if not dry_run else 1, MIN_WASH_A if not dry_run else 0.1, tips_200_reuse[1])

    ctx.comment("                                                      ")
    ctx.comment("******************************************************")
    ctx.comment("  Transferring Amplification Solution and Incubating  ")
    ctx.comment("******************************************************")
    ctx.comment("                                                      ")

    if not use_temp:
        ctx.pause(
            """Please add sufficient Amplification Solution to
            each well of column 3 in the reagent plate."""
        )

    transfer(amp, VOL_AMP)
    if num_well_last_col > 0:
        transfer_remainder(amp_remainder, VOL_AMP)

    if use_lid:
        cover_plate()
    else:
        ctx.pause("Please place seal on plate.")

    if heat_on_deck:
        heat(MIN_AMP if not dry_run else 0.25)
    else:
        ctx.pause(
            "Incubation at 37 degree C for 100 min - remove seal and return plate to slot C2"
        )

    if use_lid:
        remove_lid()

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment(" Discarding Amplification Solution ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    discard(VOL_AMP, tips_200_reuse[1])

    ctx.comment(
        "                                                                          "
    )
    ctx.comment(
        "**************************************************************************"
    )
    ctx.comment(
        " Performing Final Washes, Adding DAPI, Washing again and Adding Anti-fade "
    )
    ctx.comment(
        "**************************************************************************"
    )
    ctx.comment(
        "                                                                          "
    )

    hs.open_labware_latch()
    ctx.move_labware(labware=working_plate, new_location=hs_adapter, use_gripper=True)
    hs.close_labware_latch()

    wash_2(wash_b_1, MIN_WASH_B if not dry_run else 0.1, tips_200_reuse[1])
    wash_2(wash_b_2, MIN_WASH_B if not dry_run else 0.1, tips_200_reuse[1])
    wash_2(
        wash_b_diluted, MIN_WASH_B_DILUTED if not dry_run else 0.1, tips_200_reuse[2]
    )

    if not use_temp:
        ctx.pause(
            """Please add sufficient DAPI and anti-fade to
            each well of column 4 and 5 in the reagent plate."""
        )

    transfer(dapi, VOL_DAPI)
    if num_well_last_col > 0:
        transfer_remainder(dapi_remainder, VOL_DAPI)

    hs.set_and_wait_for_shake_speed(500)
    ctx.delay(minutes=MIN_DAPI if not dry_run else 0.1)
    hs.deactivate_shaker()

    discard(VOL_DAPI, tips_200_reuse[2])
    wash_2(wash_pbs, MIN_WASH_PBS if not dry_run else 0.1, tips_200_reuse[2])

    transfer(af, VOL_AF)
    if num_well_last_col > 0:
        transfer_remainder(af_remainder, VOL_AF)

    hs.open_labware_latch()
    ctx.move_labware(labware=working_plate, new_location="C2", use_gripper=True)

    if use_lid:
        cover_plate()
