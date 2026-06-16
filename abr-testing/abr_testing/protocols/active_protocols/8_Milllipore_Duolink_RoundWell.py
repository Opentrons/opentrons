"""Duolink PLA Combined Day 1 & Day 2 Protocol."""
from opentrons.types import Point
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    Well,
    Labware,
    InstrumentContext,
)
from opentrons.protocol_api.module_contexts import (
    HeaterShakerContext,
    TemperatureModuleContext,
)
from typing import List, Union

metadata = {
    "protocolName": "Duolink PLA for Microscopy - Combined Day 1 & Day 2 NOABRFOLDER",
    "author": "Opentrons Science Team",
}

requirements = {
    "robotType": "Flex",
    "apiLevel": "2.29",
}

# ----------------------------
# Constants
# ----------------------------
VOL_BLOCK = 40
VOL_AB = 40
VOL_PROBE = 40
VOL_LIGATION = 40
VOL_AMP = 40
VOL_DAPI = 40
VOL_AF = 40
VOL_WASH = 200

MIN_BLOCK = 60
MIN_PROBE = 60
MIN_LIGATION = 30
MIN_AMP = 100
MIN_DAPI = 15
MIN_WASH_A = 5

DEFAULT_RATE = 700
SLOW = 100
H_DISCARD = 0.8
D_1K = -2.3
D_200 = -2.1

# ----------------------------
# Parameters
# ----------------------------


def add_parameters(parameters: ParameterContext) -> None:
    """Add protocol parameters."""
    parameters.add_int(
        variable_name="num_sample",
        display_name="Number of Samples",
        description="Number of samples (up to 96)",
        default=96,
        minimum=1,
        maximum=96,
    )
    parameters.add_bool(
        variable_name="heat_on_deck",
        display_name="Incubation on Deck",
        description="Use Heater-Shaker Module?",
        default=True,
    )
    parameters.add_bool(
        variable_name="use_lid",
        display_name="Use Plate Lid",
        description="Cover plate during incubation?",
        default=True,
    )
    parameters.add_bool(
        variable_name="use_temp",
        display_name="Use Temperature Module",
        description="Keep reagents cold?",
        default=True,
    )
    parameters.add_int(
        variable_name="error_capture_duration",
        display_name="Error Capture Duration",
        description="Length of video clip to capture on error (in seconds).",
        default=30,
        minimum=5,
        maximum=6000,
        unit="seconds",
    )


# ----------------------------
# Helper functions
# ----------------------------
def cover_plate(ctx: ProtocolContext, lid_slot: str, plate: Labware) -> None:
    """Cover plate."""
    ctx.move_lid(lid_slot, plate, use_gripper=True)


def remove_lid(ctx: ProtocolContext, lid_slot: str, plate: Labware) -> None:
    """Remove lid from plate."""
    ctx.move_lid(plate, lid_slot, use_gripper=True)


def heat_plate(
    hs: HeaterShakerContext,
    ctx: ProtocolContext,
    plate: Labware,
    adapter: Labware,
    minutes: float,
) -> None:
    """Heat plate on Heater-Shaker Module."""
    hs.set_and_wait_for_temperature(37)
    hs.open_labware_latch()
    ctx.move_labware(
        plate,
        adapter,
        use_gripper=True,
        pick_up_offset={"x": 0, "y": 0, "z": -7},
        drop_offset={"x": 0, "y": 0, "z": -7},
    )
    hs.close_labware_latch()
    ctx.delay(minutes=minutes)
    hs.open_labware_latch()
    ctx.move_labware(
        plate,
        "C2",
        use_gripper=True,
        pick_up_offset={"x": 0, "y": 0, "z": -7},
        drop_offset={"x": 0, "y": 0, "z": -7},
    )


# constants used in original code
D_1K = -2.3
SLOW = 100
DEFAULT_RATE = 700


def transfer(
    pip: InstrumentContext,
    start: Union[Well, List[Well]],
    dest_wells: List[Well],
    vol: float,
) -> None:
    """Transfer volume `vol` from `start` to each well in `dest_wells`.

    - If `start` is a single Well: aspirate vol * len(dest_wells) once and
      dispense vol into each destination (good for an 8-channel aspirating from a 1ch reservoir).
    - If `start` is a list of Wells (same length as dest_wells): perform pairwise
      transfers (safe when each destination has a unique source well).
    """
    pip.flow_rate.dispense = DEFAULT_RATE  # ensure baseline
    # CASE A: start is a list -> do safe pairwise transfers
    if isinstance(start, list):
        for src, dst in zip(start, dest_wells):
            pip.pick_up_tip()
            pip.aspirate(vol, src)
            pip.air_gap(10)
            pip.flow_rate.dispense = SLOW
            pip.dispense(10, dst.top(z=0))
            pip.dispense(vol, dst.top(z=-2).move(Point(x=D_1K, y=D_1K)))
            pip.blow_out()

            pip.return_tip()

        pip.flow_rate.dispense = DEFAULT_RATE
        return

    # CASE B: start is a single Well -> aspirate pool then dispense to each dest
    if isinstance(start, Well):
        if not dest_wells:
            return
        pip.pick_up_tip()
        total_asp = vol * len(dest_wells)
        pip.aspirate(total_asp, start)
        pip.air_gap(10)
        pip.flow_rate.dispense = SLOW
        pip.dispense(10, dest_wells[0].top(z=0))
        for dst in dest_wells:
            pip.move_to(dst.top(z=0))
            pip.dispense(vol, dst.top(z=-2).move(Point(x=D_1K, y=D_1K)))
            pip.move_to(dst.top(z=0))
        pip.blow_out()
        pip.return_tip()
        pip.flow_rate.dispense = DEFAULT_RATE
        return


def discard(
    ctx: ProtocolContext,
    pip: InstrumentContext,
    wells: List[Well],
    vol: float,
    waste: Well,
) -> None:
    """Discard liquid."""
    for well in wells:
        pip.pick_up_tip()
        pip.flow_rate.aspirate = SLOW
        pip.aspirate(vol + 20, well.bottom(z=H_DISCARD).move(Point(x=D_200, y=D_200)))
        ctx.delay(seconds=2)
        pip.flow_rate.aspirate = DEFAULT_RATE
        pip.dispense(vol + 20, waste.top(z=-5))
        pip.blow_out()
        pip.return_tip()

    pip.reset_tipracks()


# ----------------------------
# Run protocol
# ----------------------------
def run(ctx: ProtocolContext) -> None:
    """Run the protocol."""
    num_sample = ctx.params.num_sample  # type: ignore[attr-defined]
    length = ctx.params.error_capture_duration  # type: ignore[attr-defined]
    heat_on_deck = ctx.params.heat_on_deck  # type: ignore[attr-defined]
    use_lid = ctx.params.use_lid  # type: ignore[attr-defined]
    use_temp = ctx.params.use_temp  # type: ignore[attr-defined]
    
    ctx.comment("Protocol Version: 01")
    ctx.capture_image(filename="start_of_run")
    
    num_col_full = num_sample // 8
    num_well_last_col = num_sample % 8
    num_col_total = num_col_full + (1 if num_well_last_col > 0 else 0)

    # ----------------------------
    # Load labware
    # ----------------------------
    working_plate = ctx.load_labware(
        "milliplex_r_96_well_microtiter_plate", "C2", "ASSAY PLATE"
    )
    waste_res = ctx.load_labware("nest_1_reservoir_290ml", "D2", "LIQUID WASTE")
    waste = waste_res.wells()[0]
    ctx.load_trash_bin("A3")
    ctx.load_lid_stack("opentrons_tough_universal_lid", "C4", 1)

    if use_temp:
        temp_mod: TemperatureModuleContext = ctx.load_module(
            "temperature module gen2", "C1"
        )  # type: ignore[assignment]
        temp_adapter = temp_mod.load_adapter(
            "opentrons_96_deep_well_temp_mod_adapter"
        )
        reagent_plate = temp_adapter.load_labware(
            "nest_96_wellplate_2ml_deep", "Reagent Plate"
        )
    else:
        reagent_plate = ctx.load_labware(
            "nest_96_wellplate_2ml_deep", "C1", "REAGENTS"
        )

    hs: HeaterShakerContext = ctx.load_module(
        "heaterShakerModuleV1", "D1"
    )  # type: ignore[assignment]
    hs_adapter = hs.load_adapter("opentrons_universal_flat_adapter_type_b")

    # ---- LOAD TIPRACKS INTO VARIABLES (important) ----
    tips_1k = [
        ctx.load_labware("opentrons_flex_96_tiprack_1000ul", slot, "1000uL TIPS")
        for slot in ["B3", "B2"]
    ]  # << CHANGED: store refs
    tips_200 = [
        ctx.load_labware("opentrons_flex_96_tiprack_200ul", slot, "200uL TIPS")
        for slot in ["B1", "A2", "A1"]
    ]  # << CHANGED: store refs

    p1k_8 = ctx.load_instrument("flex_8channel_1000", "left")
    p1k_1 = ctx.load_instrument("flex_1channel_1000", "right")
    for p in [p1k_8, p1k_1]:
        p.flow_rate.aspirate = DEFAULT_RATE
        p.flow_rate.dispense = DEFAULT_RATE

    # ---- ASSIGN TIPRACKS TO PIPETTES ----
    p1k_8.tip_racks = tips_1k
    p1k_1.tip_racks = tips_1k

    # ----------------------------
    # Define wells
    # ----------------------------
    rxn_total = working_plate.rows()[0][:num_col_total]
    rxn_full = working_plate.rows()[0][:num_col_full]
    rxn_remainder = (
        working_plate.wells()[
            num_col_full * 8 : num_col_full * 8 + num_well_last_col
        ]
        if num_well_last_col > 0
        else []
    )
    # ----------------------------
    # Define liquids
    # ----------------------------
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
    # Day 1: Blocking and Primary Ab
    # ----------------------------
    block = reagent_plate.rows()[0][1]
    ab = reagent_plate.rows()[0][0]

    # transfer blocking (uses 1000uL tips we already assigned)
    transfer(p1k_8, block, rxn_full, VOL_BLOCK)
    if num_well_last_col:
        # pairwise remainder: p1k_1 is assigned 1k tipracks too
        transfer(p1k_1, [block] * len(rxn_remainder), rxn_remainder, VOL_BLOCK)

    if use_lid:
        cover_plate(ctx, "C4", working_plate)
    if heat_on_deck:
        heat_plate(hs, ctx, working_plate, hs_adapter, MIN_BLOCK)
    if use_lid:
        remove_lid(ctx, "C4", working_plate)

    # BEFORE discarding, switch the 8-channel pipette to 200 uL tipracks
    p1k_8.tip_racks = tips_200  # << CHANGED: switch to 200 uL tips for discard
    discard(ctx, p1k_8, rxn_total, VOL_BLOCK, waste)

    # restore 1000 uL tipracks for transfers
    p1k_8.tip_racks = tips_1k  # << CHANGED
    p1k_1.tip_racks = tips_1k  # ensure 1ch still set

    transfer(p1k_8, ab, rxn_full, VOL_AB)
    if num_well_last_col:
        transfer(p1k_1, [ab] * len(rxn_remainder), rxn_remainder, VOL_AB)

    # ----------------------------
    # Day 2: PLA Probe, Ligation, Amplification, DAPI, AF
    # ----------------------------
    reagents_day2 = reagent_plate.rows()[0][:5]
    vols_day2 = [VOL_PROBE, VOL_LIGATION, VOL_AMP, VOL_DAPI, VOL_AF]
    mins_day2 = [MIN_PROBE, MIN_LIGATION, MIN_AMP, MIN_DAPI, 0]

    for reagent, vol, min_incub in zip(reagents_day2, vols_day2, mins_day2):
        # transfer reagent -> use 1k tipracks
        p1k_8.tip_racks = tips_1k
        p1k_1.tip_racks = tips_1k
        transfer(p1k_8, reagent, rxn_full, vol)
        if num_well_last_col:
            transfer(p1k_1, [reagent] * len(rxn_remainder), rxn_remainder, vol)

        if use_lid:
            cover_plate(ctx, "C4", working_plate)
        if heat_on_deck:
            heat_plate(hs, ctx, working_plate, hs_adapter, min_incub)
        if use_lid:
            remove_lid(ctx, "C4", working_plate)

        # discard uses 200uL tips
        p1k_8.tip_racks = tips_200
        discard(ctx, p1k_8, rxn_total, vol, waste)
        
    ctx.capture_image(filename="end_of_run")
