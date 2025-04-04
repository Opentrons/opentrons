"""Opentrons Flex Pipette IQ/OQ."""
from math import ceil
from typing import List, Optional, Tuple

from opentrons.protocol_api import ProtocolContext, ParameterContext, InstrumentContext, Labware, Well

from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION


metadata = {"protocolName": "Opentrons Flex Pipette IQ/OQ"}
requirements = {"robotType": "Flex", "apiLevel": "2.23"}

assert str(MAX_SUPPORTED_VERSION) == requirements["apiLevel"]

READER_IDEAL_UL = 200.0
SHAKER_MAX_UL = 250.0
DYES = {
    "dye_e": (0.1, 0.99, "#880000"),
    "dye_d": (1.0, 1.99, "#CC0000"),
    "dye_c": (2.0, 9.99, "#FF0000"),
    "dye_b": (10.0, 49.99, "#FF3333"),
    "dye_a": (50.0, 200.0, "#FF6666"),
    "dye_hv": (200.1, 250.0, "#FF9999"),
    "diluent": (0.1, 200.0, "#6666FF"),
}
VOLUMES = {
    "opentrons_flex_96_filtertiprack_50ul": [1, 10, 50],
    "opentrons_flex_96_tiprack_50ul": [1, 10, 50],
    "opentrons_flex_96_filtertiprack_200ul": [5, 50, 200],
    "opentrons_flex_96_tiprack_200ul": [5, 50, 200],
    "opentrons_flex_96_filtertiprack_1000ul": [10, 100, 1000],
    "opentrons_flex_96_tiprack_1000ul": [10, 100, 1000],
}
TRIALS = {
    "flex_1channel_50": [12, 12, 12],
    "flex_8channel_50": [12, 12, 12],
    "flex_1channel_1000": [12, 12, 12],
    "flex_8channel_1000": [12, 12, 12],
    "flex_96channel_1000": [1, 1, 1],
}
DILUENT_UL_BY_LABWARE = {
    "nest_1_reservoir_290ml": {"dead": 10000, "setup_min": 30000, "setup_max": 200000},
    "nest_12_reservoir_15ml": {"dead": 3000, "setup_min": 3000, "setup_max": 12000},
}
# fmt: off
SLOTS = {
    "A1":   "tips_diluent", "A2":   "diluent",  "A3":   "tips_2",
    "B1":   "plate_0",      "B2":   "dye_0",    "B3":   "tips_1",
    "C1":   "plate_1",      "C2":   "dye_1",    "C3":   "tips_0",
    "D1":   "plate_2",      "D2":   "dye_2",    "D3":   "trash",
}
# fmt: on


def add_parameters(params: ParameterContext) -> None:
    params.add_str(
        display_name="pipette",
        variable_name="pipette",
        default="flex_1channel_1000",
        choices=[
            {"display_name": "P50S", "value": "flex_1channel_50"},
            {"display_name": "P50M", "value": "flex_8channel_50"},
            {"display_name": "P1000S", "value": "flex_1channel_1000"},
            {"display_name": "P1000M", "value": "flex_8channel_1000"},
            {"display_name": "P1000H", "value": "flex_96channel_1000"},
        ],
    )
    params.add_str(
        display_name="tips",
        variable_name="tips",
        default="opentrons_flex_96_filtertiprack_50ul",
        choices=[
            {"display_name": "T50F", "value": "opentrons_flex_96_filtertiprack_50ul"},
            {"display_name": "T50", "value": "opentrons_flex_96_tiprack_50ul"},
            {"display_name": "T200F", "value": "opentrons_flex_96_filtertiprack_200ul"},
            {"display_name": "T200", "value": "opentrons_flex_96_tiprack_200ul"},
            {"display_name": "T1000F", "value": "opentrons_flex_96_filtertiprack_1000ul"},
            {"display_name": "T1000", "value": "opentrons_flex_96_tiprack_1000ul"},
        ],
    )
    params.add_str(
        display_name="liquid",
        variable_name="liquid",
        default="water",
        choices=[
            {"display_name": "water", "value": "water"},
            {"display_name": "glycerol-50", "value": "glycerol-50"},
            {"display_name": "ethanol-80", "value": "ethanol-80"},
        ],
    )
    params.add_bool(
        display_name="use_gripper",
        variable_name="use_gripper",
        default=False,
    )

    well_choices = [f"{r}{c}" for c in range(1, 13) for r in "ABCDEFGH"]
    red_dyes = [d for d in DYES.keys() if d != "diluent"]
    for column, dye in enumerate(red_dyes, start=1):
        params.add_str(
            display_name=f"{dye}_well",
            variable_name=f"{dye}_well",
            default=f"A{column}",
            choices=[{"display_name": w, "value": w} for w in well_choices],
        )


def _load_tip_racks(
        ctx: ProtocolContext, pipette: InstrumentContext, diluent_pipette: Optional[InstrumentContext]
) -> int:
    num_tips_needed = sum(TRIALS[pipette.name]) * pipette.channels
    if pipette.channels == 96:
        pipette.tip_racks = [
            ctx.load_adapter(
                "opentrons_flex_96_tiprack_adapter", SLOTS[f"tips_{i}"]
            ).load_labware(ctx.params.tips)
            for i in range(ceil(num_tips_needed / 96))
        ]
    else:
        pipette.tip_racks = [
            ctx.load_labware(ctx.params.tips, SLOTS[f"tips_{i}"])
            for i in range(ceil(num_tips_needed / 96))
        ]
        diluent_pipette.tip_racks = ctx.load_labware(
            "opentrons_flex_96_filtertiprack_200ul",
            SLOTS["tips_diluent"]
        )
    tip_ul = int(ctx.params.tips.split("_")[-1].replace("ul", ""))
    return tip_ul


def _load_plates(
        ctx: ProtocolContext, pipette: InstrumentContext, volumes: List[float]
) -> List[Labware]:
    num_wells_needed = sum([
        int(ceil(ul / SHAKER_MAX_UL) * trials)
        for ul, trials in zip(volumes, TRIALS[pipette.name])
    ])
    plates = [
        ctx.load_labware("corning_96_wellplate_360ul_flat", SLOTS[f"plate_{i}"])
        for i in range(ceil(num_wells_needed / 96))
    ]
    for plate in plates:
        plate.load_empty(plate.wells())
    return plates


def _load_liquid_diluent(
        ctx: ProtocolContext,
        pipette: InstrumentContext,
        reservoir: Labware,
        volumes: List[float]
) -> None:
    critical_ul = DILUENT_UL_BY_LABWARE[reservoir.load_name]
    well_working_ul = critical_ul["setup_max"] - critical_ul["dead"]
    diluent_volumes = [max(READER_IDEAL_UL - ul, 0) for ul in volumes]
    diluent_transferred_ul = sum([
        (dil_ul * pipette.channels * trials)
        for dil_ul, trials in zip(diluent_volumes, TRIALS[pipette.name])
    ])
    diluent = ctx.define_liquid("diluent", "diluent", display_color=DYES["diluent"][-1])
    _ul_remaining = float(diluent_transferred_ul)
    for well in reservoir.wells():
        if _ul_remaining <= well_working_ul:
            this_well_ul = max(critical_ul["dead"] + _ul_remaining, critical_ul["setup_min"])
            _ul_remaining = 0
        else:
            this_well_ul = critical_ul["setup_max"]
            _ul_remaining -= well_working_ul
        well.load_liquid(diluent, this_well_ul)
        _ul_remaining -= min(well_working_ul, _ul_remaining)
        if _ul_remaining <= 0.0:
            break
    assert not _ul_remaining, \
        f"reservoir cannot hold {diluent_transferred_ul} ul of diluent " \
        f"(dead volume is {critical_ul['dead']} ul)"


def _load_liquids(
        ctx: ProtocolContext,
        pipette: InstrumentContext,
        reservoirs: List[Labware],
        plates: List[Labware],
        volumes: List[float]
) -> None:
    diluent_res = reservoirs[0]
    _load_liquid_diluent(ctx, pipette, diluent_res, volumes)
    # TODO: load red dye in "dye" labwares


def _load_labware(
        ctx: ProtocolContext, pipette: InstrumentContext, volumes: List[float]
) -> Tuple[Labware, List[Labware], List[Labware]]:
    # reservoirs for diluent and dye
    if pipette.channels == 96:
        reservoir_diluent = ctx.load_labware("nest_1_reservoir_290ml", SLOTS["diluent"])
        reservoirs_dye = [
            ctx.load_labware("nest_1_reservoir_290ml", SLOTS["dye_0"]),
            ctx.load_labware("nest_1_reservoir_290ml", SLOTS["dye_1"]),
            ctx.load_labware("nest_1_reservoir_290ml", SLOTS["dye_2"]),
        ]
    else:
        reservoir_diluent = ctx.load_labware("nest_12_reservoir_15ml", SLOTS["diluent"])
        reservoirs_dye = [ctx.load_labware("nest_96_wellplate_2ml_deep", SLOTS["dye_0"])]
    reservoir_diluent.load_empty(reservoir_diluent.wells())
    for res in reservoirs_dye:
        res.load_empty(res.wells())
    # plates
    plates = _load_plates(ctx, pipette, volumes)
    return reservoir_diluent, reservoirs_dye, plates


def run(ctx: ProtocolContext) -> None:
    ctx.load_trash_bin(SLOTS["trash"])
    pipette = ctx.load_instrument(ctx.params.pipette, "left")
    if pipette.channels == 96:
        diluent_pipette = None
    else:
        diluent_pipette = ctx.load_instrument("flex_8channel_1000", "right")
    tip_ul = _load_tip_racks(ctx, pipette, diluent_pipette)
    volumes = [
        min(max(v, pipette.min_volume), tip_ul)
        for v in VOLUMES[ctx.params.tips]
    ]
    reservoirs, plates = _load_labware(ctx, pipette, volumes)
    liquid = ctx.define_liquid_class(ctx.params.liquid)
    for ul, plate in zip(volumes, plates):
        # TODO: transfer DILUENT
        # TODO: transfer DYE
        pass
