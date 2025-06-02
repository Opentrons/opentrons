"""Opentrons Flex Pipette IQ/OQ."""
from datetime import datetime
from math import ceil, inf
from typing import List, Optional, Tuple, Dict, cast

from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    InstrumentContext,
    Labware,
    Well,
    LiquidClass,
    HeaterShakerContext,
    AbsorbanceReaderContext,
    OFF_DECK,
)
from opentrons.protocol_api.labware import OutOfTipsError

from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION


metadata = {"protocolName": "NEW Opentrons Flex Pipette IQ/OQ"}
requirements = {"robotType": "Flex", "apiLevel": "2.24"}

assert str(MAX_SUPPORTED_VERSION) == requirements["apiLevel"], \
    f"api level: {requirements['apiLevel']}"

# TODO: (sigler) test using Buonoy at low volumes
DYE_READER_IDEAL_UL = 200.0
DYE_SHAKER_MAX_UL = 250.0
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
    "usascientific_12_reservoir_22ml": {
        "dye_e": "A5",
        "dye_d": "A4",
        "dye_c": "A3",
        "dye_b": "A2",
        "dye_a": "A1",
        "dye_hv": "A8",
    },
    "nest_1_reservoir_290ml": {
        dye_name: "A1"
        for dye_name in DYE_CONFIGS.keys()
    },
}
DYE_RESERVOIRS_BY_CHANNELS_AND_TIP = {
    (1, 50): (1, "usascientific_12_reservoir_22ml", ["dye_d", "dye_b", "dye_a"]),
    (1, 200): (1, "usascientific_12_reservoir_22ml", ["dye_c", "dye_b", "dye_a"]),
    (1, 1000): (1, "usascientific_12_reservoir_22ml", ["dye_b", "dye_a", "dye_hv"]),
    (8, 50): (1, "usascientific_12_reservoir_22ml", ["dye_d", "dye_b", "dye_a"]),
    (8, 200): (1, "usascientific_12_reservoir_22ml", ["dye_c", "dye_b", "dye_a"]),
    (8, 1000): (2, "usascientific_12_reservoir_22ml", ["dye_b", "dye_a", "dye_hv"]),
    (96, 50): (3, "nest_1_reservoir_290ml", ["dye_c", "dye_b", "dye_a"]),
    (96, 200): (3, "nest_1_reservoir_290ml", ["dye_c", "dye_b", "dye_a"]),
    (96, 1000): (3, "nest_1_reservoir_290ml", ["dye_b", "dye_a", "dye_hv"]),
}
CRITICAL_UL_BY_LABWARE = {
    "nest_1_reservoir_290ml": {"dead": 10000, "setup_min": 30000, "setup_max": 200000},
    "usascientific_12_reservoir_22ml": {"dead": 1000, "setup_min": 3000, "setup_max": 21000},
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
TRIALS_BY_PIPETTE_BY_TIP = {
    "flex_1channel_50": {50: [12, 12, 12]},
    "flex_8channel_50": {50: [12, 12, 12]},
    "flex_1channel_1000": {50: [12, 12, 12], 200: [12, 12, 12], 1000: [12, 12, 3]},
    "flex_8channel_1000": {50: [12, 12, 12], 200: [12, 12, 12], 1000: [12, 12, 3]},
    "flex_96channel_1000": {50: [1, 1, 1], 200: [1, 1, 1], 1000: [1, 1, 1]},
}

# fmt: off
# FIXME: create plate stack, to reduce number of slots in use (and increase plates)
# TODO: discuss with SW how to handle more tip-racks from off-deck (eg: stacker)
SLOTS = {
    "tips_diluent": "A1",   "diluent":  "A2",   "reader":   "A3",   "reader_stage": "A4",
    "plate":        "B1",   "dye_0":    "B2",   "tips_1":   "B3",   "tips_3":       "B4",
    "stack_end":    "C1",   "dye_1":    "C2",   "tips_0":   "C3",   "tips_2":       "C4",
    "stack_start":  "D1",   "dye_2":    "D2",   "chute":    "D3",   "chute_stage":  "D4",
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
            {"display_name": "legacy", "value": "legacy"},
        ],
    )
    params.add_bool(
        display_name="use_artel",
        variable_name="use_artel",
        default=True,
    )


def get_volumes(ctx: ProtocolContext, pipette: InstrumentContext, tip_ul: float) -> List[float]:
    # NOTE: configuring for MAX tip uL before calculate test volumes
    pipette.configure_for_volume(tip_ul)
    # NOTE: limiting 96ch to only test <=200uL, b/c 1000uL requires too many plates
    max_possible_ul = (
        DYE_SHAKER_MAX_UL if pipette.channels == 96 else pipette.max_volume
    )
    # NOTE: configuring for MINIMUM tip uL before calculate test volumes
    pipette.configure_for_volume(1)
    return [
        min(max(v, pipette.min_volume), tip_ul, max_possible_ul)
        for v in VOLUMES_BY_TIP_RACK[ctx.params.tips]  # type: ignore[attr-defined]
    ]


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
            "opentrons_flex_96_filtertiprack_1000ul"
        )
    else:
        pipette.tip_racks = [
            ctx.load_labware(ctx.params.tips, s)  # type: ignore[attr-defined]
            for s in accessible_rack_slot_names
        ]
        assert diluent_pipette is not None, "diluent_pipette exists when it should not"
        diluent_pipette.tip_racks = [
            ctx.load_labware(
                "opentrons_flex_96_filtertiprack_1000ul", SLOTS["tips_diluent"]
            )
        ]
    inaccessible_racks = [
        ctx.load_labware(ctx.params.tips, SLOTS[f"tips_{i}"])
        for i in range(num_racks_needed)
        if SLOTS[f"tips_{i}"] not in accessible_rack_slot_names
    ]
    return inaccessible_racks


def load_most_labware(
    ctx: ProtocolContext, pipette: InstrumentContext, tip_ul: int, volumes: List[float], trials: List[int],
) -> Tuple[Labware, List[Labware], List[Labware]]:
    """Load and return a diluent reservoir, list of dye reservoirs, list of plates."""
    num_wells_needed = (
        sum(
            [
                ceil(ul / DYE_SHAKER_MAX_UL) * t
                for ul, t in zip(volumes, trials)
            ]
        )
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
    # FIXME: support a stack of plates
    if num_plates_needed > 5:
        raise NotImplementedError(f"plate count of {num_plates_needed} not implemented yet")
    plates: List[Labware] = []
    for i in range(num_plates_needed):
        if i == 0:
            plate = ctx.load_labware("corning_96_wellplate_360ul_flat", SLOTS["stack_start"])
        else:
            plate = plates[-1].load_labware("corning_96_wellplate_360ul_flat")
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

    trials = TRIALS_BY_PIPETTE_BY_TIP[pipette.name][tip_ul]
    if pipette.channels == 1:
        trials = [_round_up_to(multiple_of=8, value=t) for t in trials]
    total_diluent_aspirated_ul = sum(
        [
            max(DYE_READER_IDEAL_UL - v, 0) * pipette.channels * t
            for v, t in zip(volumes, trials)
        ]
    )
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
    trials_list = TRIALS_BY_PIPETTE_BY_TIP[pipette.name][tip_ul]
    liquid_and_trials_by_volume = {
        v: (ctx.define_liquid(
            f"{name}_{v}ul", f"{name}_{v}ul", cfg[2]
        ), t)
        for v, t in zip(volumes, trials_list)
        for name, cfg in DYE_CONFIGS.items()
        if cfg[0] <= v <= cfg[1]
    }

    load_name = reservoirs_dye[0].load_name
    critical_ul = CRITICAL_UL_BY_LABWARE[load_name]
    src_well_names: List[str] = [
        DYE_WELL_BY_LABWARE[load_name][d]
        for d in reservoir_cfg[2]
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
        well_start_ul = critical_ul["dead"] + (ul * trials)
        src_wells_by_volume[ul].load_liquid(liquid, well_start_ul)
    return src_wells_by_volume


def gather_dest_wells(pipette, plates, volumes, trials) -> Dict[float, List[Well]]:
    # GATHER TARGET WELLS
    # NOTE: any volumes greater than 250 will be split between
    #       multiple wells, and since the only high volume we
    #       test is 1000ul, this ends up meaning DEST wells are
    #       either 1x or 4x per aspirate
    all_columns = [c for p in reversed(plates) for c in p.columns()]
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
) -> None:

    # SHAKE FOR 60 SECONDS
    shaker.close_labware_latch()
    shaker.set_and_wait_for_shake_speed(1100)
    ctx.delay(seconds=60)
    shaker.deactivate_shaker()
    shaker.open_labware_latch()

    # READ ABSORBANCE
    reader.open_lid()
    ctx.move_labware(plate, new_location=reader, use_gripper=True)
    reader.close_lid()
    reader.read(
        export_filename=f"{filename}_{datetime.now().strftime('%Y-%m-%d_%H:%M:%S')}"
    )
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


def run(ctx: ProtocolContext) -> None:
    """Run."""
    trash = ctx.load_waste_chute()

    # LOAD MODULES
    heater_shaker = ctx.load_module("heaterShakerModuleV1", SLOTS["plate"])
    heater_shaker.close_labware_latch()
    heater_shaker.deactivate_shaker()
    heater_shaker.deactivate_heater()
    heater_shaker.open_labware_latch()
    adapter = heater_shaker.load_adapter("opentrons_universal_flat_adapter")
    plate_reader = None
    if not ctx.params.use_artel:
        plate_reader = ctx.load_module("absorbanceReaderV1", SLOTS["reader"])
        plate_reader.close_lid()
        plate_reader.initialize(mode="single", wavelengths=[450])

    # LOAD PIPETTES
    test_pip = ctx.load_instrument(ctx.params.pipette, "left")  # type: ignore[attr-defined]
    diluent_pipette: Optional[InstrumentContext] = None
    if test_pip.channels != 96:
        diluent_pipette = ctx.load_instrument("flex_8channel_1000", "right")
    pip_for_dil: InstrumentContext = (
        diluent_pipette if diluent_pipette else test_pip
    )

    # LOAD LABWARE & TIP-RACKS
    tip_ul = int(str(ctx.params.tips).split("_")[-1].replace("ul", ""))
    trials_list = TRIALS_BY_PIPETTE_BY_TIP[test_pip.name][tip_ul]
    volumes = get_volumes(ctx, test_pip, tip_ul)
    reservoir_diluent, reservoirs_dye, plates = load_most_labware(
        ctx, test_pip, tip_ul, volumes, trials_list
    )
    inaccessible_racks = load_tip_racks(
        ctx, test_pip, diluent_pipette, num_racks_needed=1
    )
    dest_wells_by_volume: Dict[float, List[Well]] = gather_dest_wells(
        test_pip, plates, volumes, trials_list
    )
    diluent_tips = cast(Labware, ctx.deck[SLOTS["tips_diluent"]])
    if diluent_tips.is_adapter:
        diluent_tips = cast(Labware, diluent_tips.child)

    # LOAD LIQUIDS & LIQUID-CLASS
    dye_well_by_volume = load_liquid_dye(
        ctx, test_pip, reservoirs_dye, volumes, tip_ul
    )
    load_liquid_diluent(ctx, test_pip, reservoir_diluent, volumes, tip_ul)
    diluent_class = ctx.define_liquid_class("water")
    test_class: Optional[LiquidClass] = None
    if str(ctx.params.liquid) != "legacy":  # type: ignore[attr-defined]
        test_class = ctx.define_liquid_class(ctx.params.liquid)  # type: ignore[attr-defined]

    # PROBE ALL SRC WELLS
    if reservoir_diluent["A1"].current_liquid_volume():
        pip_for_dil.pick_up_tip(diluent_tips)
        pip_for_dil.require_liquid_presence(reservoir_diluent["A1"])
        pip_for_dil.drop_tip()
    for ul in volumes:
        well: Well = dye_well_by_volume[ul]
        test_pip.pick_up_tip()
        test_pip.require_liquid_presence(well)
        test_pip.drop_tip()

    # TEST EACH VOLUME
    plate: Optional[Labware] = None
    ul_in_this_plate: List[float] = []

    def filename() -> str:
        ul_sub_string = "ul_".join([str(old_ul) for old_ul in ul_in_this_plate])
        return f"{test_pip.name}_t{tip_ul}_{ul_sub_string}ul"

    def _on_plate_done():
        heater_shaker.open_labware_latch()
        if not plate_reader:
            # REMOVE AND TAKE TO ARTEL READER
            ctx.move_labware(plate, OFF_DECK, use_gripper=False)  # HUMAN
        else:
            shake_and_read_plate(
                ctx, plate, heater_shaker, plate_reader, filename()
            )

    for ul in volumes:

        # PROCESS FULL PLATE
        dest_wells: List[Well] = dest_wells_by_volume[ul]
        if plate and dest_wells[0] not in plate.wells():
            _on_plate_done()
            plate = None
            ul_in_this_plate = []

        # GET NEW (EMPTY) PLATE
        if not plate:
            heater_shaker.open_labware_latch()
            plate = plates.pop(-1)
            assert dest_wells[0] in plate.wells(), \
                f"dest well {dest_wells[0]} not in {plate} on top of {plate.parent}"
            ul_in_this_plate.append(ul)
            ctx.move_labware(plate, adapter, use_gripper=True)
            heater_shaker.close_labware_latch()

        # TRANSFER DILUENT TO PLATE
        dil_ul = DYE_READER_IDEAL_UL - ul
        if dil_ul > 0:
            pip_for_dil.pick_up_tip(diluent_tips)
            dest_columns = [
                w.parent.columns_by_name()[w.well_name[1:]]
                for w in dest_wells_by_volume[ul]
                if "A" in w.well_name  # new column
            ]
            src_wells = [reservoir_diluent["A1"]] * len(dest_columns)
            pip_for_dil.transfer_with_liquid_class(
                diluent_class, dil_ul, src_wells, dest_columns, new_tip="never"
            )
            pip_for_dil.drop_tip()

        # TRANSFER DYE TO PLATE
        src_well: Well = dye_well_by_volume[ul]
        args = [ul / len(dest_wells), src_well, dest_wells]
        if test_class and len(dest_wells) == 1:
            test_pip.transfer_with_liquid_class(test_class, *args, new_tip="always")
        elif test_class and len(dest_wells) == 4:
            test_pip.distribute_with_liquid_class(test_class, *args, new_tip="always")
        elif not test_class and len(dest_wells) == 1:
            test_pip.transfer(*args, new_tip="always")
        elif not test_class and len(dest_wells) == 4:
            test_pip.distribute(*args, new_tip="always")

        # SWAP INACCESSIBLE TIP-RACKS
        new_racks: List[Labware] = []
        for rack in test_pip.tip_racks:
            if rack.next_tip(test_pip.channels):
                new_racks.append(rack)
                continue
            if not inaccessible_racks:
                raise OutOfTipsError("no more tip-racks to replace the empty ones")
            new_racks.append(inaccessible_racks.pop(0))
            prev_parent = rack.parent
            ctx.move_labware(rack, trash, use_gripper=True)
            ctx.move_labware(new_racks[-1], prev_parent, use_gripper=True)
        test_pip.tip_racks = new_racks

    # don't forget final plate
    _on_plate_done()
