"""Opentrons Flex Pipette IQ/OQ."""
from math import ceil
from typing import List, Optional, Tuple, Dict, Any

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
# TODO: increase 96ch trials by loading off-deck labware somehow
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
    """Add parameters."""
    _pipettes = [
        "flex_1channel_1000",
        "flex_1channel_50",
        "flex_8channel_1000",
        "flex_8channel_50",
        "flex_96channel_1000",
    ]
    params.add_str(
        display_name="pipette",
        variable_name="pipette",
        default=_pipettes[0],
        choices=[
            {"display_name": p.replace("flex_", ""), "value": p} for p in _pipettes
        ],
    )
    _racks = [
        "opentrons_flex_96_filtertiprack_50ul",
        "opentrons_flex_96_filtertiprack_200ul",
        "opentrons_flex_96_filtertiprack_1000ul",
        "opentrons_flex_96_tiprack_50ul",
        "opentrons_flex_96_tiprack_200ul",
        "opentrons_flex_96_tiprack_1000ul",
    ]
    params.add_str(
        display_name="tips",
        variable_name="tips",
        default=_racks[0],
        choices=[
            {"display_name": r.replace("opentrons_flex_96_", ""), "value": r}
            for r in _racks
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
    """Load tip racks based on supplied pipettes and runtime parameters."""
    num_tips_needed = sum(TRIALS_BY_PIPETTE[pipette.name]) * pipette.channels
    if pipette.channels == 96:
        rack_ln = "opentrons_flex_96_tiprack_adapter"
        tips_ln = ctx.params.tips  # type: ignore[attr-defined]
        pipette.tip_racks = [
            ctx.load_adapter(rack_ln, SLOTS[f"tips_{i}"]).load_labware(tips_ln)
            for i in range(ceil(num_tips_needed / 96))
        ]
    else:
        pipette.tip_racks = [
            ctx.load_labware(ctx.params.tips, SLOTS[f"tips_{i}"])  # type: ignore[attr-defined]
            for i in range(ceil(num_tips_needed / 96))
        ]
        assert diluent_pipette is not None
        diluent_pipette.tip_racks = [
            ctx.load_labware(
                "opentrons_flex_96_filtertiprack_200ul", SLOTS["tips_diluent"]
            )
        ]
    tip_ul = int(ctx.params.tips.split("_")[-1].replace("ul", ""))  # type: ignore[attr-defined]
    return tip_ul


def load_labware(
    ctx: ProtocolContext, pipette: InstrumentContext, volumes: List[float], tip_ul: int
) -> Tuple[Labware, List[Labware], List[Labware]]:
    """Load and return a diluent reservoir, list of dye reservoirs, list of plates."""
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
) -> Dict[float, List[Well]]:
    """Load diluent into wells of reservoir.

    Each supplied volume is matched to a diluent volume, and a total ul for
    all diluent is calculated. The total diluent (plus dead volume)
    is then loaded into consecutive wells in the reservoir.
    """
    dil_wells_by_test_ul: Dict[float, List[Well]] = {v: [] for v in volumes}
    diluent = ctx.define_liquid(
        "diluent", "diluent", display_color=DYE_CONFIGS["diluent"][2]
    )
    diluent_pip_ch = 96 if pipette.channels == 96 else 8
    reservoir_wells = reservoir.wells()
    critical_ul = CRITICAL_UL_BY_LABWARE[reservoir.load_name]
    well_working_ul = critical_ul["setup_max"] - critical_ul["dead"]
    num_aspirates_per_plate = 1 if diluent_pip_ch == 96 else 12

    # count how much diluent is needed in each well before loading
    dil_ul_by_reservoir_well: Dict[Well, float] = {w: 0.0 for w in reservoir_wells}
    current_well = reservoir_wells.pop(0)
    for plate_ul in dil_wells_by_test_ul.keys():
        diluent_per_well = max(DYE_READER_IDEAL_UL - plate_ul, 0)
        diluent_per_aspirate = diluent_per_well * diluent_pip_ch
        assert diluent_per_aspirate <= well_working_ul, (
            f"diluent aspirate of {diluent_per_aspirate} ul "
            f"is greater than well working volume {well_working_ul}"
        )
        max_ul_in_well = critical_ul["setup_max"] - diluent_per_aspirate
        for _ in range(num_aspirates_per_plate):
            if dil_ul_by_reservoir_well[current_well] > max_ul_in_well:
                current_well = reservoir_wells.pop(0)
            dil_ul_by_reservoir_well[current_well] += diluent_per_aspirate
            dil_wells_by_test_ul[plate_ul].append(current_well)
    for well, ul in dil_ul_by_reservoir_well.items():
        well.load_liquid(diluent, ul + critical_ul["dead"])

    return dil_wells_by_test_ul


def load_liquid_dye(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    reservoirs_dye: List[Labware],
    volumes: List[float],
) -> Dict[float, List[Well]]:
    """Load dye into wells of reservoir.

    Each supplied volume is matched to a dye type, and a total ul for
    each dye is calculated. The totals per dye type (plus dead volume)
    are loaded into consecutive wells in the reservoir.
    """
    dye_wells_by_volume: Dict[float, List[Well]] = {v: [] for v in volumes}

    liquid_by_volume = {
        v: ctx.define_liquid(name, name, cfg[2])
        for v in volumes
        for name, cfg in DYE_CONFIGS.items()
        if cfg[0] <= v <= cfg[1]
    }
    critical_ul = CRITICAL_UL_BY_LABWARE[reservoirs_dye[0].load_name]
    well_working_ul = critical_ul["setup_max"] - critical_ul["dead"]
    src_wells: List[Well] = [w for r in reservoirs_dye for w in r.wells()]
    num_trials_by_volume = {
        v: TRIALS_BY_PIPETTE[pipette.name][i] for i, v in enumerate(volumes)
    }
    current_src_well = src_wells.pop(0)  # initial pop!
    for test_ul, liquid in liquid_by_volume.items():
        ul_per_aspirate = test_ul * pipette.channels
        total_ul_aspirated_per_test_ul = 0.0

        def _load_liquid_and_pop_to_next_well() -> None:
            nonlocal total_ul_aspirated_per_test_ul, current_src_well
            assert total_ul_aspirated_per_test_ul > 0
            ul_in_well = critical_ul["dead"] + total_ul_aspirated_per_test_ul
            current_src_well.load_liquid(liquid, ul_in_well)
            total_ul_aspirated_per_test_ul = 0.0
            if len(src_wells):
                current_src_well = src_wells.pop(0)  # pop!

        for _ in range(num_trials_by_volume[test_ul]):
            if total_ul_aspirated_per_test_ul + ul_per_aspirate > well_working_ul:
                _load_liquid_and_pop_to_next_well()
            dye_wells_by_volume[test_ul].append(current_src_well)
            total_ul_aspirated_per_test_ul += ul_per_aspirate
        _load_liquid_and_pop_to_next_well()
    return dye_wells_by_volume


def run(ctx: ProtocolContext) -> None:
    """Run."""
    ctx.load_trash_bin(SLOTS["trash"])

    # PIPETTES
    test_pipette = ctx.load_instrument(ctx.params.pipette, "left")  # type: ignore[attr-defined]
    diluent_pipette: Optional[InstrumentContext] = None
    if test_pipette.channels != 96:
        diluent_pipette = ctx.load_instrument("flex_8channel_1000", "right")

    # LABWARE
    tip_ul = load_tip_racks(ctx, test_pipette, diluent_pipette)
    volumes = [
        min(max(v, test_pipette.min_volume), tip_ul)
        for v in VOLUMES_BY_TIP_RACK[ctx.params.tips]  # type: ignore[attr-defined]
    ]
    reservoir_diluent, reservoirs_dye, plates = load_labware(
        ctx, test_pipette, volumes, tip_ul
    )

    # LOAD LIQUID
    dye_wells_by_volume = load_liquid_dye(ctx, test_pipette, reservoirs_dye, volumes)
    diluent_wells_by_volume = load_liquid_diluent(
        ctx, test_pipette, reservoir_diluent, volumes
    )
    # liquid-classes
    diluent_class = ctx.define_liquid_class("water")
    test_class = ctx.define_liquid_class(ctx.params.liquid)  # type: ignore[attr-defined]

    # GATHER TARGET WELLS
    trials = TRIALS_BY_PIPETTE[test_pipette.name]
    dest_well_by_plate_by_ch: Dict[Labware, Dict[int, Any]] = {
        plate: {
            1: plate.wells()[:trials],
            8: plate.columns()[:trials],
            96: [plate.wells()],
        }
        for ul, plate, trials in zip(volumes, plates, trials)
    }

    # TRANSFER DILUENT
    pip_for_dil: InstrumentContext = (
        diluent_pipette if diluent_pipette else test_pipette
    )
    pip_for_dil.pick_up_tip()
    for ul, plate in zip(volumes, plates):
        if ul < DYE_READER_IDEAL_UL:
            pip_for_dil.transfer_liquid(
                liquid_class=diluent_class,
                volume=DYE_READER_IDEAL_UL - ul,
                source=diluent_wells_by_volume[ul],
                dest=dest_well_by_plate_by_ch[plate][pip_for_dil.channels],
                new_tip="never",
            )
    pip_for_dil.drop_tip()

    # TRANSFER DYE
    for ul, plate in zip(volumes, plates):
        test_pipette.transfer_liquid(
            liquid_class=test_class,
            volume=ul,
            source=dye_wells_by_volume[ul],
            dest=dest_well_by_plate_by_ch[plate][test_pipette.channels],
            new_tip="always",
        )
