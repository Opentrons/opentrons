"""Opentrons Flex Pipette IQ/OQ."""
from math import ceil
from typing import List, Optional, Tuple

from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Labware,
    Well,
)

from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION


metadata = {"protocolName": "Opentrons Flex Pipette IQ/OQ"}
requirements = {"robotType": "Flex", "apiLevel": "2.23"}

assert str(MAX_SUPPORTED_VERSION) == requirements["apiLevel"]

DYE_READER_IDEAL_UL = 200.0
DYE_SHAKER_MAX_UL = 250.0
DYE_CONFIGS = {
    "dye_e": (0.1, 0.99, "#880000"),
    "dye_d": (1.0, 1.99, "#CC0000"),
    "dye_c": (2.0, 9.99, "#FF0000"),
    "dye_b": (10.0, 49.99, "#FF3333"),
    "dye_a": (50.0, 200.0, "#FF6666"),
    "dye_hv": (200.1, 250.0, "#FF9999"),
    "diluent": (0.1, 200.0, "#6666FF"),
}

DILUENT_RESERVOIR_BY_CHANNELS = {
    1: "nest_12_reservoir_15ml",
    8: "nest_12_reservoir_15ml",
    96: "nest_1_reservoir_290ml",
}
DYE_RESERVOIRS_BY_CHANNELS_AND_TIP = {
    (1, 50): (1, "nest_96_wellplate_2ml_deep"),
    (1, 200): (1, "nest_96_wellplate_2ml_deep"),
    (1, 1000): (1, "nest_12_reservoir_15ml"),
    (8, 50): (1, "nest_12_reservoir_15ml"),
    (8, 200): (1, "nest_12_reservoir_15ml"),
    (8, 1000): (2, "nest_12_reservoir_15ml"),
    (96, 50): (3, "nest_1_reservoir_290ml"),
    (96, 200): (3, "nest_1_reservoir_290ml"),
    (96, 1000): (3, "nest_1_reservoir_290ml"),
}
CRITICAL_UL_BY_LABWARE = {
    "nest_1_reservoir_290ml": {"dead": 10000, "setup_min": 30000, "setup_max": 200000},
    "nest_12_reservoir_15ml": {"dead": 3000, "setup_min": 3000, "setup_max": 12000},
    "nest_96_wellplate_2ml_deep": {"dead": 300, "setup_min": 300, "setup_max": 1700},
}

# NOTE: volumes are clipped at runtime to pipette-tip combination's
#       minimum/maximum volumes (eg: P1000S + T50 will transfer 5ul instead of 1ul)
VOLUMES_BY_TIP_RACK = {
    "opentrons_flex_96_filtertiprack_50ul": [1, 10, 50],
    "opentrons_flex_96_tiprack_50ul": [1, 10, 50],
    "opentrons_flex_96_filtertiprack_200ul": [5, 50, 200],
    "opentrons_flex_96_tiprack_200ul": [5, 50, 200],
    "opentrons_flex_96_filtertiprack_1000ul": [10, 100, 1000],
    "opentrons_flex_96_tiprack_1000ul": [10, 100, 1000],
}
# FIXME: increase 96ch trials by loading off-deck labware somehow
TRIALS_BY_PIPETTE = {
    "flex_1channel_50": [12, 12, 12],
    "flex_8channel_50": [12, 12, 12],
    "flex_1channel_1000": [12, 12, 12],
    "flex_8channel_1000": [12, 12, 12],
    "flex_96channel_1000": [1, 1, 1],
}

# fmt: off
SLOTS = {
    "tips_diluent": "A1",   "diluent":  "A2",   "tips_2":   "A3",
    "plate_0":      "B1",   "dye_0":    "B2",   "tips_1":   "B3",
    "plate_1":      "C1",   "dye_1":    "C2",   "tips_0":   "C3",
    "plate_2":      "D1",   "dye_2":    "D2",   "trash":    "D3",
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
            {
                "display_name": "T1000F",
                "value": "opentrons_flex_96_filtertiprack_1000ul",
            },
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
    red_dyes = [d for d in DYE_CONFIGS.keys() if d != "diluent"]
    for column, dye in enumerate(red_dyes, start=1):
        params.add_str(
            display_name=f"{dye}_well",
            variable_name=f"{dye}_well",
            default=f"A{column}",
            choices=[{"display_name": w, "value": w} for w in well_choices],
        )


def load_tip_racks(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    diluent_pipette: Optional[InstrumentContext],
) -> int:
    num_tips_needed = sum(TRIALS_BY_PIPETTE[pipette.name]) * pipette.channels
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
            "opentrons_flex_96_filtertiprack_200ul", SLOTS["tips_diluent"]
        )
    tip_ul = int(ctx.params.tips.split("_")[-1].replace("ul", ""))
    return tip_ul


def load_labware(
    ctx: ProtocolContext, pipette: InstrumentContext, volumes: List[float], tip_ul: int
) -> Tuple[Labware, List[Labware], List[Labware]]:

    # diluent reservoir
    load_name_diluent_reservoir = DILUENT_RESERVOIR_BY_CHANNELS[pipette.channels]
    reservoir_diluent = ctx.load_labware(load_name_diluent_reservoir, SLOTS["diluent"])
    reservoir_diluent.load_empty(reservoir_diluent.wells())

    # dye reservoir(s)
    reservoir_cfg = DYE_RESERVOIRS_BY_CHANNELS_AND_TIP[(pipette.channels, tip_ul)]
    reservoirs_dye = [
        ctx.load_labware(reservoir_cfg[1], SLOTS[f"dye_{i}"])
        for i in range(reservoir_cfg[0])
    ]
    for res in reservoirs_dye:
        res.load_empty(res.wells())

    # empty plates
    num_wells_needed = sum(
        [
            ceil(ul / DYE_SHAKER_MAX_UL) * trials
            for ul, trials in zip(volumes, TRIALS_BY_PIPETTE[pipette.name])
        ]
    )
    num_plates_needed = ceil(num_wells_needed / 96)
    plates = [
        ctx.load_labware("corning_96_wellplate_360ul_flat", SLOTS[f"plate_{i}"])
        for i in range(int(num_plates_needed))
    ]
    for plate in plates:
        plate.load_empty(plate.wells())

    return reservoir_diluent, reservoirs_dye, plates


def load_liquid_diluent(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    reservoir: Labware,
    volumes: List[float],
) -> None:
    diluent_volumes = [max(DYE_READER_IDEAL_UL - ul, 0) for ul in volumes]
    num_dst_wells = sum([pipette.channels * t for t in TRIALS_BY_PIPETTE[pipette.name]])
    total_to_transfer_ul = sum(diluent_volumes) * num_dst_wells
    diluent = ctx.define_liquid(
        "diluent", "diluent", display_color=DYE_CONFIGS["diluent"][2]
    )
    critical_ul = CRITICAL_UL_BY_LABWARE[reservoir.load_name]
    well_working_ul = critical_ul["setup_max"] - critical_ul["dead"]
    for well in reservoir.wells():
        if total_to_transfer_ul <= 0.0:
            break
        usable_ul = min(total_to_transfer_ul, well_working_ul)
        total_to_transfer_ul -= usable_ul
        well.load_liquid(diluent, critical_ul["dead"] + usable_ul)


def load_liquid_dye(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    reservoirs_dye: List[Labware],
    volumes: List[float],
) -> None:
    liquid_by_volume = {
        v: ctx.define_liquid(name, name, cfg[2])
        for v in volumes
        for name, cfg in DYE_CONFIGS.items()
        if cfg[0] <= v <= cfg[1]
    }
    critical_ul = CRITICAL_UL_BY_LABWARE[reservoirs_dye[0].load_name]
    well_working_ul = critical_ul["setup_max"] - critical_ul["dead"]
    all_wells: List[Well] = [w for r in reservoirs_dye for w in r.wells()]
    for ul, liquid in liquid_by_volume.items():
        ul_needed = ul * pipette.channels
        ul_accounted_for_in_a_well = 0.0
        while ul_accounted_for_in_a_well < ul_needed:
            current_well = all_wells.pop(0)
            ul_we_can_aspirate = min(ul_needed, well_working_ul)
            current_well.load_liquid(liquid, critical_ul["dead"] + ul_we_can_aspirate)
            ul_needed -= ul_we_can_aspirate


def run(ctx: ProtocolContext) -> None:
    ctx.load_trash_bin(SLOTS["trash"])
    pipette = ctx.load_instrument(ctx.params.pipette, "left")
    if pipette.channels == 96:
        diluent_pipette = None
    else:
        diluent_pipette = ctx.load_instrument("flex_8channel_1000", "right")
    tip_ul = load_tip_racks(ctx, pipette, diluent_pipette)
    volumes = [
        min(max(v, pipette.min_volume), tip_ul)
        for v in VOLUMES_BY_TIP_RACK[ctx.params.tips]
    ]
    reservoir_diluent, reservoirs_dye, plates = load_labware(
        ctx, pipette, volumes, tip_ul
    )
    load_liquid_diluent(ctx, pipette, reservoir_diluent, volumes)
    load_liquid_dye(ctx, pipette, reservoirs_dye, volumes)
    liquid_class = ctx.define_liquid_class(ctx.params.liquid)
    for ul, plate in zip(volumes, plates):
        # TODO: transfer DILUENT
        # TODO: transfer DYE
        pass
