"""Opentrons Flex Pipette IQ/OQ."""
from datetime import datetime
from math import ceil, inf
from statistics import stdev
from typing import List, Optional, Tuple, Dict, cast, Any

from opentrons.config import infer_config_base_dir
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Labware,
    Well,
    HeaterShakerContext,
    AbsorbanceReaderContext,
    OFF_DECK,
)
from opentrons.protocol_api._liquid_properties import TransferProperties

from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION


metadata = {"protocolName": "Opentrons Flex Pipette IQ/OQ"}
requirements = {"robotType": "Flex", "apiLevel": "2.24"}

assert (
    str(MAX_SUPPORTED_VERSION) == requirements["apiLevel"]
), (f"API level ({requirements['apiLevel']}) must be "
    f"updated to the latest ({str(MAX_SUPPORTED_VERSION)})")

CSV_SEPARATOR = "\t"

READER_ABSORBANCE = 450

SHAKER_CONFIG_BY_LIQUID: Dict[str, Tuple[int, int]] = {
    "glycerol_50": (1500, 60),
    "water": (1250, 60),
    "ethanol_80": (1000, 60),
}

# TODO: (sigler) test using Buonoy at low volumes
DYE_READER_IDEAL_UL = 200.0
DYE_SHAKER_MAX_UL = 200.0
DYE_CONFIGS = {
    "dye_e": (0.1, 0.99, "#880000"),
    "dye_d": (1.0, 1.99, "#CC0000"),
    "dye_c": (2.0, 9.99, "#FF0000"),
    "dye_b": (10.0, 49.99, "#FF3333"),
    "dye_a": (50.0, 200.0, "#FF6666"),
    "dye_hv": (200.1, inf, "#FF9999"),
    "diluent": (0.1, 200.0, "#6666FF"),
}

DILUENT_RESERVOIR = "nest_1_reservoir_290ml"

DYE_WELL_BY_LABWARE = {
    # 2ml deep can reduce wasted dye, but source wells are needed
    # when testing target volumes >100 uL (assuming 12x trials)
    # and so for this reason we do not default to using this labware
    # (reducing efficiency but improving simplicity)
    "nest_96_wellplate_2ml_deep": {
        "dye_e": "E1",
        "dye_d": "D1",
        "dye_c": "C1",
        "dye_b": "B1",
        "dye_a": "A1",
        "dye_hv": "H1",
    },
    "opentrons_tough_12_reservoir_22ml": {
        "dye_e": "A5",
        "dye_d": "A4",
        "dye_c": "A3",
        "dye_b": "A2",
        "dye_a": "A1",
        "dye_hv": "A8",
    },
    "nest_1_reservoir_290ml": {dye_name: "A1" for dye_name in DYE_CONFIGS.keys()},
}
DYE_RESERVOIRS_BY_CHANNELS_AND_TIP = {
    (1, 50): (1, "opentrons_tough_12_reservoir_22ml", ["dye_d", "dye_b", "dye_a"]),
    (1, 200): (1, "opentrons_tough_12_reservoir_22ml", ["dye_c", "dye_b", "dye_a"]),
    (1, 1000): (1, "opentrons_tough_12_reservoir_22ml", ["dye_b", "dye_a", "dye_hv"]),
    (8, 50): (1, "opentrons_tough_12_reservoir_22ml", ["dye_d", "dye_b", "dye_a"]),
    (8, 200): (1, "opentrons_tough_12_reservoir_22ml", ["dye_c", "dye_b", "dye_a"]),
    (8, 1000): (2, "opentrons_tough_12_reservoir_22ml", ["dye_b", "dye_a", "dye_hv"]),
    (96, 50): (3, "nest_1_reservoir_290ml", ["dye_c", "dye_b", "dye_a"]),
    (96, 200): (3, "nest_1_reservoir_290ml", ["dye_c", "dye_b", "dye_a"]),
    (96, 1000): (3, "nest_1_reservoir_290ml", ["dye_b", "dye_a", "dye_hv"]),
}
CRITICAL_UL_BY_LABWARE = {
    "nest_1_reservoir_290ml": {"dead": 10000, "setup_min": 30000, "setup_max": 200000},
    "opentrons_tough_12_reservoir_22ml": {
        "dead": 1000,
        "setup_min": 3000,
        "setup_max": 21000,
    },
    "nest_96_wellplate_2ml_deep": {"dead": 300, "setup_min": 300, "setup_max": 1700},
}

# NOTE: volumes are clipped at runtime to pipette-tip combination's
#       minimum/maximum volumes (eg: P1000S + T50 will transfer 5ul instead of 1ul)
VOLUMES_BY_TIP_RACK = {
    "opentrons_flex_96_filtertiprack_50ul": [1, 10, 50],
    "opentrons_flex_96_tiprack_50ul": [1, 10, 50],
    "opentrons_flex_96_filtertiprack_200ul": [10, 50, 200],
    "opentrons_flex_96_tiprack_200ul": [10, 50, 200],
    "opentrons_flex_96_filtertiprack_1000ul": [10, 100, 1000],
    "opentrons_flex_96_tiprack_1000ul": [10, 100, 1000],
}
# TODO: increase 96ch trials by loading off-deck labware somehow
TRIALS_BY_PIPETTE_BY_TIP = {
    "flex_1channel_50": {50: [12, 12, 12]},
    "flex_8channel_50": {50: [12, 12, 12]},
    "flex_1channel_1000": {50: [12, 12, 12], 200: [12, 12, 12], 1000: [12, 12, 12]},
    "flex_8channel_1000": {50: [12, 12, 12], 200: [12, 12, 12], 1000: [12, 12, 2]},
    "flex_96channel_1000": {50: [1, 1, 1], 200: [1, 1, 1], 1000: [1, 1, 1]},
}

# FIXME: this protocol isn't setup to use multiple plates per a single test volume
#        this means each test volume must be dispensed entirely to a single plate
#        this needs to be fixed in order it to support more trials for 1000uL dispenses
ENABLE_MULTI_DISPENSE_BY_CHANNELS = {1: True, 8: True, 96: False}

NUM_RACKS_NEEDED_FOR_DYE_BY_CHANNELS = {1: 1, 8: 5, 96: 5}

# NOTE: (sigler) T1000 creates bubbles, even during non-contact dispense
#       likely because of the bore diameter. Bubbles on the surface during
#       non-contact dispense can pop can cause small droplets to spray around.
#       However, contact dispense creates bubbles under the surface, even with T200.
DILUENT_TIP_LOAD_NAME = "opentrons_flex_96_filtertiprack_200ul"

# fmt: off
# TODO: handle more tip-racks from off-deck (eg: stacker)
SLOTS = {
    "tips_diluent": "A1",   "diluent":  "A2",   "reader":   "A3",   "reader_stage": "A4",
    "stack_start":  "B1",   "dye_2":    "B2",   "tips_1":   "B3",   "tips_2":       "B4",
    "stack_end":    "C1",   "dye_1":    "C2",   "tips_0":   "C3",   "tips_3":       "C4",
    "plate":        "D1",   "dye_0":    "D2",   "chute":    "D3",   "tips_4":       "D4",
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
            {"display_name": "glycerol_50", "value": "glycerol_50"},
            {"display_name": "ethanol_80", "value": "ethanol_80"},
        ],
    )
    params.add_bool(
        display_name="just_fill_plate_200ul",
        variable_name="just_fill_plate_200ul",
        default=False,
    )
    params.add_bool(
        display_name="external_reader",
        variable_name="external_reader",
        default=False,
    )
    params.add_bool(
        display_name="pipette_at_liquid_meniscus",
        variable_name="pipette_at_liquid_meniscus",
        default=True,
    )
    params.add_bool(
        display_name="include_baseline",
        variable_name="include_baseline",
        default=False,
    )
    params.add_str(
        display_name="ul_ranges_to_test",
        variable_name="ul_ranges_to_test",
        default="low,mid,high",
        choices=[
            {"display_name": "low,mid,high", "value": "low,mid,high"},
            {"display_name": "low,mid", "value": "low,mid"},
            {"display_name": "low,high", "value": "low,high"},
            {"display_name": "mid,high", "value": "mid,high"},
            {"display_name": "low", "value": "low"},
            {"display_name": "mid", "value": "mid"},
            {"display_name": "high", "value": "high"},
        ]
    )


def split_list_by_ranges(ctx: ProtocolContext, the_list: List[Any]) -> List[Any]:
    ret: List[int] = []
    if "low" in ctx.params.ul_ranges_to_test:
        ret.append(the_list[0])
    if "mid" in ctx.params.ul_ranges_to_test:
        ret.append(the_list[1])
    if "high" in ctx.params.ul_ranges_to_test:
        ret.append(the_list[2])
    return ret


def get_trials(
    ctx: ProtocolContext, pipette: InstrumentContext, tip_ul: float
) -> List[int]:
    if ctx.params.just_fill_plate_200ul:
        return [int(96 / pipette.channels)]

    trials_per_range = TRIALS_BY_PIPETTE_BY_TIP[pipette.name][tip_ul]
    return split_list_by_ranges(ctx, trials_per_range)


def get_volumes(
    ctx: ProtocolContext, pipette: InstrumentContext, tip_ul: float
) -> List[float]:
    if ctx.params.just_fill_plate_200ul:
        return [DYE_READER_IDEAL_UL]

    # NOTE: configuring for MAX tip uL before calculate test volumes
    pipette.configure_for_volume(tip_ul)
    # NOTE: limiting pipettes (eg: 96ch) to only test <=250uL
    #       if there aren't enough on-deck wells to dispense into for 1000ul multi-dispenses
    max_possible_ul = (
        pipette.max_volume
        if ENABLE_MULTI_DISPENSE_BY_CHANNELS[pipette.channels]
        else DYE_SHAKER_MAX_UL
    )
    # NOTE: configuring for MINIMUM tip uL before calculate test volumes
    pipette.configure_for_volume(1)

    volumes_per_range = [
        float(min(max(v, pipette.min_volume), tip_ul, max_possible_ul))
        for v in VOLUMES_BY_TIP_RACK[ctx.params.tips]  # type: ignore[attr-defined]
    ]
    return split_list_by_ranges(ctx, volumes_per_range)


def load_tip_racks(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    diluent_pipette: Optional[InstrumentContext],
    num_racks_needed: int,
) -> List[Labware]:
    """Load tip racks based on supplied pipettes and runtime parameters."""
    available_rack_slot_names = [
        s for n, s in SLOTS.items() for i in range(10) if f"tips_{i}" in n
    ]
    assert num_racks_needed <= len(available_rack_slot_names), (
        f"protocol requires {num_racks_needed} tip-racks, "
        f"but {len(available_rack_slot_names)} are available"
    )
    accessible_rack_slot_names = [s for s in available_rack_slot_names if "4" not in s]
    if pipette.channels == 96:
        rack_ln = "opentrons_flex_96_tiprack_adapter"
        tips_ln = ctx.params.tips  # type: ignore[attr-defined]
        pipette.tip_racks = [
            ctx.load_adapter(rack_ln, s).load_labware(tips_ln)
            for s in accessible_rack_slot_names
        ]
        ctx.load_adapter(rack_ln, SLOTS["tips_diluent"]).load_labware(
            DILUENT_TIP_LOAD_NAME
        )
    else:
        pipette.tip_racks = [
            ctx.load_labware(ctx.params.tips, s)  # type: ignore[attr-defined]
            for s in accessible_rack_slot_names
        ]
        assert diluent_pipette is not None, "diluent_pipette exists when it should not"
        diluent_pipette.tip_racks = [
            ctx.load_labware(DILUENT_TIP_LOAD_NAME, SLOTS["tips_diluent"])
        ]
    inaccessible_racks = [
        ctx.load_labware(ctx.params.tips, SLOTS[f"tips_{i}"])
        for i in range(num_racks_needed)
        if SLOTS[f"tips_{i}"] not in accessible_rack_slot_names
    ]
    return inaccessible_racks


def load_most_labware(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tip_ul: int,
    volumes: List[float],
    trials: List[int],
) -> Tuple[Labware, List[Labware], List[Labware]]:
    """Load and return a diluent reservoir, list of dye reservoirs, list of plates."""
    num_wells_needed = (
        sum([ceil(ul / DYE_SHAKER_MAX_UL) * t for ul, t in zip(volumes, trials)])
        * pipette.channels
    )
    # diluent reservoir
    reservoir_diluent = ctx.load_labware(DILUENT_RESERVOIR, SLOTS["diluent"])
    if len(reservoir_diluent.wells()) > 1:
        raise NotImplementedError(
            "multiple wells in diluent reservoir not yet supported"
        )
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
    num_plates_needed = ceil(num_wells_needed / 96)
    if ctx.params.include_baseline:
        num_plates_needed += 1  # NOTE: 1x extra for baseline
    plates: List[Labware] = []
    for i in range(num_plates_needed):
        if i == 0:
            plate = ctx.load_labware(
                "stackable_corning_96_wellplate_360ul_flat", SLOTS["stack_start"]
            )
        else:
            plate = plates[-1].load_labware("stackable_corning_96_wellplate_360ul_flat")
        plate.load_empty(plate.wells())
        plates.append(plate)
    return reservoir_diluent, reservoirs_dye, plates


def load_liquid_diluent(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    reservoir: Labware,
    volumes: List[float],
    tip_ul: float,
) -> None:
    """Load diluent into wells of reservoir.

    Each supplied volume is matched to a diluent volume, and a total ul for
    all diluent is calculated. The total diluent (plus dead volume)
    is then loaded into consecutive wells in the reservoir.
    """

    def _round_up_to(multiple_of: int = 1, value: int = 1):
        return ((value + (multiple_of - 1)) // multiple_of) * multiple_of

    trials = get_trials(ctx, pipette, tip_ul)
    if pipette.channels == 1:
        trials = [_round_up_to(multiple_of=8, value=t) for t in trials]
    total_diluent_aspirated_ul = sum(
        [
            max(DYE_READER_IDEAL_UL - v, 0) * pipette.channels * t
            for v, t in zip(volumes, trials)
        ]
    )
    # NOTE: adding more for the baseline reading at the end
    if not ctx.params.external_reader and ctx.params.include_baseline:
        total_diluent_aspirated_ul += DYE_READER_IDEAL_UL * 96
    if not total_diluent_aspirated_ul:
        return
    critical_ul = CRITICAL_UL_BY_LABWARE[reservoir.load_name]
    assert (
        total_diluent_aspirated_ul < critical_ul["setup_max"] - critical_ul["dead"]
    ), (
        f"{reservoir.load_name} unable to hold {total_diluent_aspirated_ul} ul "
        f"(min={critical_ul['dead']}, max={critical_ul['setup_max']})"
    )

    diluent = ctx.define_liquid(
        "diluent", "diluent", display_color=DYE_CONFIGS["diluent"][2]
    )
    reservoir["A1"].load_liquid(
        diluent, critical_ul["dead"] + total_diluent_aspirated_ul
    )


def load_liquid_dye(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    reservoirs_dye: List[Labware],
    volumes: List[float],
    tip_ul: int,
) -> Dict[float, Well]:
    """Load dye into wells of reservoir.

    Each supplied volume is matched to a dye type, and a total ul for
    each dye is calculated. The totals per dye type (plus dead volume)
    are loaded into consecutive wells in the reservoir.
    """
    reservoir_cfg = DYE_RESERVOIRS_BY_CHANNELS_AND_TIP[(pipette.channels, tip_ul)]
    trials_list = get_trials(ctx, pipette, tip_ul)
    liquid_and_trials_by_volume = {
        v: (
            ctx.define_liquid(
                name=f"{name}_{min(v, v / ceil(v / DYE_SHAKER_MAX_UL))}ul",
                description=f"{name}_{min(v, DYE_SHAKER_MAX_UL)}ul",
                display_color=cfg[2],
            ),
            t,
        )
        for v, t in zip(volumes, trials_list)
        for name, cfg in DYE_CONFIGS.items()
        if "diluent" not in name and cfg[0] <= v <= cfg[1]
    }

    load_name = reservoirs_dye[0].load_name
    critical_ul = CRITICAL_UL_BY_LABWARE[load_name]
    artel_names_for_dyes = split_list_by_ranges(ctx, reservoir_cfg[2])
    src_well_names: List[str] = [
        DYE_WELL_BY_LABWARE[load_name][d] for d in artel_names_for_dyes
    ]

    if pipette.channels == 96:
        src_wells_by_volume: Dict[float, Well] = {
            ul: reservoir[well_name]
            for ul, well_name, reservoir in zip(volumes, src_well_names, reservoirs_dye)
        }
    else:
        src_wells_by_volume: Dict[float, Well] = {
            ul: reservoirs_dye[0][well_name]
            for ul, well_name in zip(volumes, src_well_names)
        }
    for ul, well in src_wells_by_volume.items():
        liquid, trials = liquid_and_trials_by_volume[ul]
        well_start_ul = critical_ul["dead"] + (ul * trials * pipette.channels)
        src_wells_by_volume[ul].load_liquid(liquid, well_start_ul)
    return src_wells_by_volume


def gather_dest_wells(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    plates: List[Labware],
    volumes: List[float],
    trials: List[int],
) -> Dict[float, List[Well]]:
    # GATHER TARGET WELLS
    if ctx.params.include_baseline:
        plate_to_use = plates[:-1]  # NOTE: first plate is used for baseline
    else:
        plate_to_use = plates
    all_columns = [c for p in reversed(plate_to_use) for c in p.columns()]
    num_wells_by_volumes = {
        ul: ceil(ul / DYE_SHAKER_MAX_UL) * pipette.channels * trials
        for ul, trials in zip(volumes, trials)
    }
    dest_wells_by_volume: Dict[float, List[Well]] = {ul: [] for ul in volumes}
    for ul, num in num_wells_by_volumes.items():
        while len(dest_wells_by_volume[ul]) < num:
            remain = num - len(dest_wells_by_volume[ul])
            next_column = all_columns.pop(0)
            dest_wells_by_volume[ul] += next_column[:remain]
    return dest_wells_by_volume


def shake_and_read_plate(
    ctx: ProtocolContext,
    plate: Labware,
    shaker: HeaterShakerContext,
    reader: AbsorbanceReaderContext,
    filename: str,
) -> Dict[str, float]:

    # SHAKE FOR 60 SECONDS
    shaker.close_labware_latch()
    shake_rpm, shake_seconds = SHAKER_CONFIG_BY_LIQUID[ctx.params.liquid]
    shaker.set_and_wait_for_shake_speed(rpm=shake_rpm)
    ctx.delay(seconds=shake_seconds)
    shaker.deactivate_shaker()
    shaker.open_labware_latch()

    # READ ABSORBANCE
    reader.open_lid()
    ctx.move_labware(plate, new_location=reader, use_gripper=True)
    reader.close_lid()
    result: Dict[str, float] = reader.read(
        export_filename=f"{filename}_{datetime.now().strftime('%Y-%m-%d_%H:%M:%S')}"
    )[READER_ABSORBANCE]
    reader.open_lid()

    # ADD TO STACK
    plate_in_stack: Optional[Labware] = ctx.deck[SLOTS["stack_end"]]
    if not plate_in_stack:
        plate_dest = SLOTS["stack_end"]
    else:
        while plate_in_stack.child:
            plate_in_stack = plate_in_stack.child
        plate_dest = plate_in_stack
    ctx.move_labware(plate, plate_dest, use_gripper=True)

    # NOTE: keep reader closed by default, for sterility
    reader.close_lid()

    return result


def run(ctx: ProtocolContext) -> None:
    """Run."""
    trash = ctx.load_waste_chute()

    # LOAD PIPETTES
    test_pip = ctx.load_instrument(ctx.params.pipette, "left")  # type: ignore[attr-defined]
    diluent_pipette: Optional[InstrumentContext] = None
    if test_pip.channels != 96:
        diluent_pipette = ctx.load_instrument("flex_8channel_1000", "right")
    pip_for_dil: InstrumentContext = diluent_pipette if diluent_pipette else test_pip
    # NOTE: important to store the pipette serial number when testing
    pip_sn = (
        test_pip.hw_pipette["pipette_id"] if not ctx.is_simulating() else "simulation"
    )

    # CREATE TEST-REPORT
    time_str = datetime.now().strftime("%Y-%m-%d_%H:%M:%S")
    results_filename = f"flex_pipette_iq_oq_RESULTS_{time_str}.csv"
    if ctx.is_simulating():
        results_filename = "SIM_" + results_filename
    results_directory = infer_config_base_dir() / "flex_pipette_iq_oq"
    results_filepath = results_directory / results_filename
    results_directory.mkdir(parents=True, exist_ok=True)
    with open(results_filepath, "w+") as file:
        p_name = metadata['protocolName']
        file.write(f"{'=' * len(p_name)}\n")
        file.write(f"{p_name}\n")
        file.write(f"{'=' * len(p_name)}\n")
        file.write(f"simulation{CSV_SEPARATOR}{ctx.is_simulating()}\n")
        file.write(f"time{CSV_SEPARATOR}{time_str}\n")
        file.write(f"pipette_sn{CSV_SEPARATOR}{pip_sn}\n")
        file.write(f"model{CSV_SEPARATOR}{ctx.params.pipette}\n")
        file.write(f"tips{CSV_SEPARATOR}{ctx.params.tips}\n")
        file.write(f"liquid{CSV_SEPARATOR}{ctx.params.liquid}\n")
        file.write(
            f"just_fill_plate_200ul{CSV_SEPARATOR}{ctx.params.just_fill_plate_200ul}\n"
        )
        file.write(f"external_reader{CSV_SEPARATOR}{ctx.params.external_reader}\n")
        file.write(
            f"pipette_at_liquid_meniscus{CSV_SEPARATOR}{ctx.params.pipette_at_liquid_meniscus}\n"
        )
        file.write(f"include_baseline{CSV_SEPARATOR}{ctx.params.include_baseline}\n")

    # LOAD MODULES
    heater_shaker = ctx.load_module("heaterShakerModuleV1", SLOTS["plate"])
    heater_shaker.close_labware_latch()
    heater_shaker.deactivate_shaker()
    heater_shaker.deactivate_heater()
    heater_shaker.open_labware_latch()
    adapter = heater_shaker.load_adapter("opentrons_universal_flat_adapter")
    plate_reader = None
    if not ctx.params.external_reader:
        plate_reader = ctx.load_module("absorbanceReaderV1", SLOTS["reader"])
        plate_reader.close_lid()
        plate_reader.initialize(mode="single", wavelengths=[READER_ABSORBANCE])

    # LOAD LABWARE & TIP-RACKS
    tip_ul = int(str(ctx.params.tips).split("_")[-1].replace("ul", ""))
    trials_list = get_trials(ctx, test_pip, tip_ul)
    volumes = get_volumes(ctx, test_pip, tip_ul)
    reservoir_diluent, reservoirs_dye, plates = load_most_labware(
        ctx, test_pip, tip_ul, volumes, trials_list
    )
    inaccessible_racks = load_tip_racks(
        ctx,
        test_pip,
        diluent_pipette,
        num_racks_needed=NUM_RACKS_NEEDED_FOR_DYE_BY_CHANNELS[test_pip.channels],
    )
    dest_wells_by_volume: Dict[float, List[Well]] = gather_dest_wells(
        ctx, test_pip, plates, volumes, trials_list
    )
    diluent_tips = cast(Labware, ctx.deck[SLOTS["tips_diluent"]])
    if diluent_tips.is_adapter:
        diluent_tips = cast(Labware, diluent_tips.child)

    # LOAD LIQUIDS & LIQUID-CLASS
    dye_well_by_volume = load_liquid_dye(ctx, test_pip, reservoirs_dye, volumes, tip_ul)
    load_liquid_diluent(ctx, test_pip, reservoir_diluent, volumes, tip_ul)
    test_class = ctx.get_liquid_class(ctx.params.liquid)  # type: ignore[attr-defined]
    diluent_class = ctx.get_liquid_class(ctx.params.liquid)  # type: ignore[attr-defined]

    # NOTE: (sigler) contact dispensing creates bubbles sometimes, which is bad for reader
    #       so we can fix this by doing non-contact dispense
    diluent_props = diluent_class.get_for(pip_for_dil, diluent_tips)
    diluent_props.dispense.dispense_position.position_reference = "well-top"
    diluent_props.dispense.dispense_position.offset.z = 0.0
    diluent_props.dispense.submerge.start_position.offset.z = 0.0
    diluent_props.dispense.retract.end_position.offset.z = 0.0
    diluent_props.dispense.retract.blowout.enabled = True  # especially for glycerol

    # ENABLE LIQUID-MENISCUS PIPETTING
    test_props = test_class.get_for(test_pip, test_pip.tip_racks[0])
    if ctx.params.pipette_at_liquid_meniscus:
        # aspirate diluent from meniscus
        diluent_props.aspirate.aspirate_position.position_reference = "liquid-meniscus"
        diluent_props.aspirate.aspirate_position.offset.z = -1.5
        # modify test class (aspirate + dispense)
        test_props.aspirate.aspirate_position.position_reference = "liquid-meniscus"
        test_props.aspirate.aspirate_position.offset.z = -1.5
        test_props.dispense.dispense_position.position_reference = "liquid-meniscus"
        is_eth = bool(
            "ethanol" in test_class.name.lower()
            or "volatile" in test_class.name.lower()
        )
        test_props.dispense.dispense_position.offset.z = -0.5 if is_eth else -1.5

    # VARIABLES TO KEEP TRACK OF TEST STATE
    plate: Optional[Labware] = None
    ul_in_this_plate: List[float] = []
    diluent_probed = False

    def _reader_filename() -> str:
        ul_sub_string = "ul_".join([str(old_ul) for old_ul in ul_in_this_plate])
        return f"{test_pip.name}_t{tip_ul}_{ul_sub_string}ul"

    def _save_to_test_report(test_volume: float, abs_values: Dict[str, float]) -> None:
        if test_volume == 0:  # NOTE: diluent step, so read all wells
            results = abs_values
        else:
            results = {
                w.well_name: abs_values[w.well_name]
                for w in dest_wells_by_volume[test_volume]
            }
        abs_values_at_this_volume: List[float] = list(results.values())
        avg = sum(abs_values_at_this_volume) / len(abs_values_at_this_volume)
        if avg != 0.0:
            cv = (stdev(abs_values_at_this_volume) / avg) * 100.0
        else:
            cv = -1.0  # NOTE: avoid divide-by-zero
        with open(results_filepath, "a") as _f:
            _f.write("==================\n")
            _f.write(f"VOLUME: {test_volume} uL\n")
            _f.write("==================\n")
            cols_as_str = CSV_SEPARATOR.join([str(c + 1) for c in range(12)])
            _f.write(f"{CSV_SEPARATOR}{cols_as_str}\n")
            for col in "ABCDEFGH":
                csv_row = f"{col}"
                for row in range(12):
                    w_name = f"{col}{row + 1}"
                    val_str = str(results[w_name]) if w_name in results else ""
                    csv_row += f"{CSV_SEPARATOR}{val_str}"
                _f.write(csv_row + "\n")
            _f.write(f"CV{CSV_SEPARATOR}{cv}\n")
            _f.write(f"AVG{CSV_SEPARATOR}{avg}\n")

    def _process_the_current_plate() -> None:
        nonlocal plate, ul_in_this_plate
        heater_shaker.open_labware_latch()
        if not plate_reader:
            # REMOVE AND TAKE TO ARTEL READER
            ctx.move_labware(plate, OFF_DECK, use_gripper=False)  # HUMAN
        else:
            _absorbance_values = shake_and_read_plate(
                ctx, plate, heater_shaker, plate_reader, _reader_filename()
            )
            for vol in ul_in_this_plate:
                _save_to_test_report(vol, _absorbance_values)
        plate = None
        ul_in_this_plate = []

    def _hacky_aspirate_meniscus_submerge_retract(props: TransferProperties, well: Well) -> None:
        # NOTE: in lieu of using meniscus-relative submerge/retract (b/c it's buggy)
        #       we can instead update the well-relative offsets each time we aspirate.
        #       This isn't ideal b/c we can't update the position for each aspirate,
        #       But it's better than submerging super slowly from the top of the well
        mm = well.current_liquid_height + 3.0
        props.aspirate.submerge.start_position.offset.z = mm
        props.aspirate.retract.end_position.offset.z = mm

    # BASELINE
    if ctx.params.include_baseline:
        plate = plates.pop(-1)
        ul_in_this_plate.append(0.0)  # NOTE: marking baseline as being 0.0uL
        heater_shaker.open_labware_latch()
        ctx.move_labware(plate, adapter, use_gripper=True)
        heater_shaker.close_labware_latch()
        pip_for_dil.pick_up_tip(diluent_tips)
        if not diluent_probed:
            pip_for_dil.require_liquid_presence(reservoir_diluent["A1"])
            diluent_probed = True
        _hacky_aspirate_meniscus_submerge_retract(diluent_props, reservoir_diluent["A1"])
        pip_for_dil.distribute_with_liquid_class(
            diluent_class,
            DYE_READER_IDEAL_UL,
            reservoir_diluent["A1"],
            plate.columns(),
            new_tip="never",
        )
        pip_for_dil.drop_tip()
        _process_the_current_plate()

    # TEST EACH VOLUME
    for ul_idx, ul in enumerate(volumes):
        dest_wells: List[Well] = dest_wells_by_volume[float(ul)]

        # SHAKE/READ the CURRENT PLATE
        if plate and dest_wells[0] not in plate.wells():
            _process_the_current_plate()

        # REPLACE EMPTY TIP-RACKS
        locations_to_replace_by_hand = []
        for i, old_rack in enumerate(test_pip.tip_racks):
            rack_location = old_rack.parent
            has_tips = bool(old_rack.next_tip(test_pip.channels))
            if not has_tips:
                ctx.move_labware(old_rack, trash, use_gripper=True)
                if inaccessible_racks:
                    new_rack = inaccessible_racks.pop(0)
                    ctx.move_labware(new_rack, rack_location, use_gripper=True)
                    test_pip.tip_racks[i] = new_rack
                else:
                    locations_to_replace_by_hand.append(rack_location)
        if locations_to_replace_by_hand:
            tips_ln = ctx.params.tips  # type: ignore[attr-defined]
            ctx.pause(f"ADD: {tips_ln} to 96ch Adapters on the Deck...")
            test_pip.tip_racks = [
                location.load_labware(tips_ln)
                for location in locations_to_replace_by_hand
            ]

        # GET NEW (EMPTY) PLATE
        if not plate:
            heater_shaker.open_labware_latch()
            plate = plates.pop(-1)
            assert (
                dest_wells[0] in plate.wells()
            ), f"dest well {dest_wells[0]} not in plate for {ul} uL"
            ctx.move_labware(plate, adapter, use_gripper=True)
            heater_shaker.close_labware_latch()

        ul_in_this_plate.append(ul)

        # TRANSFER DILUENT TO PLATE
        dil_ul = DYE_READER_IDEAL_UL - ul
        if dil_ul > 0:
            if pip_for_dil.channels == 96:
                assert dest_wells[0].well_name == "A1"
                diluent_dest = dest_wells[0].parent.wells()
                diluent_src = reservoir_diluent["A1"]
            else:
                diluent_dest = [
                    w.parent.columns_by_name()[w.well_name[1:]]
                    for w in dest_wells
                    if "A" in w.well_name  # new column
                ]
                diluent_src = [reservoir_diluent["A1"]] * len(diluent_dest)
            pip_for_dil.pick_up_tip(diluent_tips)
            if not diluent_probed:
                # FIXME: probing just 1x time means we cannot use >=2 source wells for diluent,
                #        however probing >=2x times requires LLD support in liquid-classes.
                pip_for_dil.require_liquid_presence(reservoir_diluent["A1"])
                diluent_probed = True
            _hacky_aspirate_meniscus_submerge_retract(diluent_props, reservoir_diluent["A1"])
            # FIXME: (sigler) if we don't configure, the transfer-with-liquid-class
            #        command can get stuck in a wrong configuration. Fix API.
            pip_for_dil.configure_for_volume(dil_ul)
            pip_for_dil.transfer_with_liquid_class(
                diluent_class, dil_ul, diluent_src, diluent_dest, new_tip="never"
            )
            if pip_for_dil.channels == 96:
                pip_for_dil.return_tip()
                diluent_tips.reset()
            else:
                pip_for_dil.drop_tip()

        # PROBE DYE
        src_well: Well = dye_well_by_volume[ul]
        test_pip.pick_up_tip()
        test_pip.require_liquid_presence(src_well)
        _hacky_aspirate_meniscus_submerge_retract(test_props, src_well)
        test_pip.drop_tip()

        # ORGANIZE WELLS FOR PIPETTES
        if test_pip.channels == 1:
            dst_wells_organized_by_channel = dest_wells
        elif test_pip.channels == 8:
            dst_wells_organized_by_channel = [
                w.parent.columns_by_name()[w.well_name[1:]]
                for w in dest_wells
                if "A" in w.well_name  # new column
            ]
        else:
            dst_wells_organized_by_channel = [dest_wells]

        # TRANSFER DYE TO PLATE
        if ul <= DYE_SHAKER_MAX_UL:
            list_of_the_same_src_well = [src_well] * len(dst_wells_organized_by_channel)
            # FIXME: (sigler) if we don't configure, the transfer-with-liquid-class
            #        command can get stuck in a wrong configuration. Fix API.
            test_pip.configure_for_volume(ul)
            test_pip.transfer_with_liquid_class(
                test_class,
                ul,
                list_of_the_same_src_well,
                dst_wells_organized_by_channel,
                new_tip="always",
            )
        else:
            # FIXME: (sigler) if we don't configure, the transfer-with-liquid-class
            #        command can get stuck in a wrong configuration. Fix API.
            test_pip.configure_for_volume(tip_ul)
            dist_vol = ul / ceil(ul / DYE_SHAKER_MAX_UL)
            test_pip.distribute_with_liquid_class(
                test_class,
                dist_vol,
                src_well,
                dst_wells_organized_by_channel,
                new_tip="always",
            )

        # Transfer & SHAKE/READ the FINAL PLATE
        if ul_idx == len(volumes) - 1:
            _process_the_current_plate()
