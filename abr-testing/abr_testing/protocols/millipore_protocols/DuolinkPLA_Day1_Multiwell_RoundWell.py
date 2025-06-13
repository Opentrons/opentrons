"""Duolink Day 1 Multiwell Round Well Protocol."""
from opentrons.types import Point
from opentrons.protocol_api import ProtocolContext, ParameterContext, Well
from typing import List
from opentrons.protocol_api.module_contexts import HeaterShakerContext


metadata = {
    "protocolName": """Duolink PLA for Microscopy (Multiwell Plate Assay with
    96 Round Well Culture Plate) - Day 1""",
    "author": "Opentrons Science Team",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.23",
}

VOL_BLOCK = 40
VOL_AB = 40

MIN_BLOCK = 60

H_DISCARD = 0.7
D_1K = -2.3
D_200 = -2.3

DEFAULT_RATE = 700
SLOW = 100  # speed up


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


def run(ctx: ProtocolContext) -> None:
    """Run the protocol."""
    num_sample = ctx.params.num_sample  # type: ignore[attr-defined]
    dry_run = ctx.params.dry_run  # type: ignore[attr-defined]
    heat_on_deck = ctx.params.heat_on_deck  # type: ignore[attr-defined]
    use_lid = ctx.params.use_lid  # type: ignore[attr-defined]

    num_col_full = int(num_sample // 8)
    num_well_last_col = num_sample % 8
    if num_well_last_col > 0:
        num_col_total = num_col_full + 1
    else:
        num_col_total = num_col_full

    # deck layout
    if heat_on_deck:
        hs: HeaterShakerContext = ctx.load_module(
            "heaterShakerModuleV1", "D1"
        )  # type: ignore[assignment]
        hs_adapter = hs.load_adapter("opentrons_universal_flat_adapter")

    working_plate = ctx.load_labware(
        "corning_96_wellplate_360ul_flat", "C2", "ASSAY PLATE"
    )

    reagent_plate = ctx.load_labware("nest_96_wellplate_2ml_deep", "C1", "REAGENTS")
    waste_res = ctx.load_labware("nest_1_reservoir_290ml", "D2", "LIQUID WASTE")
    waste = waste_res.wells()[0]

    ctx.load_trash_bin("D3")

    tips_1k = ctx.load_labware("opentrons_flex_96_tiprack_1000ul", "B3", "1000uL TIPS")
    tips_200 = ctx.load_labware("opentrons_flex_96_tiprack_200ul", "B2", "200uL TIPS")

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

    ab = reagent_plate.rows()[0][0]
    ab_remainder = reagent_plate.wells()[:num_well_last_col]
    block = reagent_plate.rows()[0][1]
    block_remainder = reagent_plate.wells()[8 : 8 + num_well_last_col]

    # volume info
    vol_ab = 40 * num_col_full + 40
    vol_ab_plus_one = 40 * (num_col_full + 1) + 40
    def_ab = ctx.define_liquid(
        name="ANTIBODY SOLUTION", description="", display_color="#98FB98"
    )  # green
    if num_well_last_col > 0:
        [
            reagent_plate.rows()[row][0].load_liquid(
                liquid=def_ab, volume=vol_ab_plus_one
            )
            for row in range(num_well_last_col)
        ]
    [
        reagent_plate.rows()[row][0].load_liquid(liquid=def_ab, volume=vol_ab)
        for row in range(num_well_last_col, 8)
    ]

    vol_re = 40 * num_col_total + 40
    def_block = ctx.define_liquid(
        name="BLOCKING SOLUTION", description="", display_color="#FFC300"
    )  # yellow
    [
        reagent_plate.rows()[row][1].load_liquid(liquid=def_block, volume=vol_re)
        for row in range(8)
    ]

    if use_lid:

        ctx.load_lid_stack("corning_96_wellplate_360ul_lid", "C4", 1)

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
        """Heat the plate on the Heater-Shaker."""
        hs.set_and_wait_for_temperature(37)
        hs.open_labware_latch()
        ctx.move_labware(
            labware=working_plate,
            new_location=hs_adapter,
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": -7},
            drop_offset={"x": 0, "y": 0, "z": -7},
        )

        hs.close_labware_latch()
        hs.open_labware_latch()

        ctx.delay(minutes=min)

        ctx.move_labware(
            labware=working_plate,
            new_location="C2",
            use_gripper=True,
            pick_up_offset={"x": 0, "y": 0, "z": -7},
            drop_offset={"x": 0, "y": 0, "z": -7},
        )

    def transfer(start: Well, vol: float) -> None:
        """Transfer liquid from start wells to reaction wells."""
        p1k_8.tip_racks = [tips_1k]
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
        """Transfer remaining liquid from start wells to reaction wells."""
        p1k_1.tip_racks = [tips_1k]
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

    def discard(vol: float) -> None:
        """Discard liquid from reaction wells."""
        for col in rxn_total:
            p1k_8.tip_racks = [tips_200]
            p1k_8.pick_up_tip()
            p1k_8.flow_rate.aspirate = SLOW
            p1k_8.move_to(col.top(z=0))
            p1k_8.aspirate(
                vol + 20, col.bottom(z=H_DISCARD).move(Point(x=D_200, y=D_200))
            )
            ctx.delay(seconds=2)
            p1k_8.move_to(col.top(z=0))
            p1k_8.flow_rate.aspirate = DEFAULT_RATE
            p1k_8.dispense(vol + 20, waste.top(z=-5))
            p1k_8.blow_out()
            if dry_run:
                p1k_8.return_tip()
            else:
                p1k_8.drop_tip()

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("  Transferring Blocking Solution   ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    transfer(block, VOL_BLOCK)
    if num_well_last_col > 0:
        transfer_remainder(block_remainder, VOL_BLOCK)

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("  Incubating on the Heater-Shaker  ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    if use_lid:
        cover_plate()
    else:
        ctx.pause("Please place seal on plate.")

    if heat_on_deck:
        heat(MIN_BLOCK if not dry_run else 0.1)
    else:
        ctx.pause(
            "Incubation at 37 degree C for 1 hour - remove seal and return plate to slot C2"
        )

    if use_lid:
        remove_lid()

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("    Removing Blocking Solution     ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    discard(VOL_BLOCK)

    ctx.comment("                                   ")
    ctx.comment("***********************************")
    ctx.comment("  Transferring Primary Antibody    ")
    ctx.comment("***********************************")
    ctx.comment("                                   ")

    transfer(ab, VOL_AB)
    if num_well_last_col > 0:
        transfer_remainder(ab_remainder, VOL_AB)

    if use_lid:
        cover_plate()
    else:
        ctx.pause("Please place seal on plate and incubate at 4 degree C overnight")
