"""Flex ABR High Volumes."""
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from math import ceil
from typing import Tuple, List, Dict, cast, Literal

from opentrons.types import Point
from opentrons.protocol_api import (
    ProtocolContext,
    ParameterContext,
    Labware,
    InstrumentContext,
    Well,
    HeaterShakerContext,
    AbsorbanceReaderContext,
    LiquidClass,
)
from opentrons.protocols.api_support.definitions import MAX_SUPPORTED_VERSION
from opentrons.hardware_control import SyncHardwareAPI
from opentrons.hardware_control.types import OT3Mount
from opentrons_shared_data.deck import (
    Z_PREP_OFFSET,
    get_calibration_square_position_in_slot,
)


metadata = {"protocolName": "Flex ABR High Volumes"}
requirements = {"robotType": "Flex", "apiLevel": "2.23"}

assert str(MAX_SUPPORTED_VERSION) == requirements["apiLevel"]

SHAKER_MAX_UL = 250
SHAKER_RPM_250ul = 1100  # NOTE: 200ul in well is 1500 rpm
SHAKER_SECONDS = 60

# NOTE: (sigler) tip volume probably never changes from 1000uL
#       because high-volume aspirate are tip priority for this test
TIP_VOLUME = 1000

# hardcoded distances for when pressure-probing the calibration square
PROBE_START_HEIGHT_ABOVE_EXPECTED_MM = 10.0
PROBE_OVERSHOOT_BELOW_EXPECTED_MM = 5.0

DEFAULT_TIP_MENISCUS_TARGET: Literal["start", "end", "dynamic"] = "dynamic"

# NOTE: (sigler) disabling formatter here, b/c spatial deck-maps are nice...
# fmt: off
SLOTS: Dict[str, str] = {
    "tips_2":   "A1",   "tips_3":           "A2",   "reader":           "A3",
    "tips_1":   "B1",   "test_labware":     "B2",   "stack":            "B3",
    "shaker":   "C1",   "empty_0":          "C2",   "stack_end":        "C3",
    "trash":    "D1",   "src_reservoir":    "D2",   "water_reservoir":  "D3",
}
# fmt: on

P1000_MAX_PUSH_OUT_UL = 79.0  # NOTE: (sigler) magic number from hardware limit
DISPENSE_MM_FROM_MENISCUS = 2.0

# operator fills this labware with RED-DYE at protocol start
# ~20-25 mL per destination plate (eg: 5x plates requires 100-125 mL)
LOAD_NAME_SRC_RESERVOIRS: Dict[str, float] = {
    "nest_1_reservoir_290ml": 30000,
    "nest_1_reservoir_195ml": 30000,
    "nest_12_reservoir_15ml": 3000,
    "nest_96_wellplate_2ml_deep": 300,
}

# TODO: (sigler) let's add the Artel (aka Corning?) plate
#       to shared-data in a separate pull-request, and modify the
#       Corning plate to be stackable with it
DST_LABWARE = "stackable_corning_96_wellplate_360ul_flat"
DE_STATIC_LOAD_NAME = "de_static_bar"

LOAD_NAME_SRC_LABWARE_BY_CHANNELS = {
    1: {  # 1ch pipette
        "TUBES_2ML_SCREWCAP": "opentrons_24_tuberack_nest_2ml_screwcap",
        "TUBES_2ML_SNAPCAP": "opentrons_24_tuberack_nest_2ml_snapcap",
        "TUBES_1_5ML_SCREWCAP": "opentrons_24_tuberack_nest_1.5ml_screwcap",
        "TUBES_1_5ML_SNAPCAP": "opentrons_24_tuberack_nest_1.5ml_snapcap",
        "TUBES_15ML": "opentrons_15_tuberack_nest_15ml_conical",
        "TUBES_50ML": "opentrons_6_tuberack_nest_50ml_conical",
        "PLATE_200UL_PCR": "opentrons_96_wellplate_200ul_pcr_full_skirt",  # <200ul dispense
        "PLATE_200UL_FLAT": "nest_96_wellplate_200ul_flat",  # <200ul dispense
        "PLATE_360UL_FLAT": "corning_96_wellplate_360ul_flat",  # <200ul dispense
        "PLATE_2ML_DEEP": "nest_96_wellplate_2ml_deep",
    },
    8: {  # 8ch pipette
        "PLATE_15ML_RESERVOIR": "nest_12_reservoir_15ml",
    },
    96: {  # 96ch pipette
        "PLATE_195ML_RESERVOIR": "nest_1_reservoir_195ml",
        "PLATE_290ML_RESERVOIR": "nest_1_reservoir_290ml",
    },
}


class _AspirateMode(Enum):
    MENISCUS = "meniscus"
    MENISCUS_LLD = "meniscus-lld"


# ASPIRATE-MODES are PRE-CONFIGURED by SOURCE-WELL
M = _AspirateMode.MENISCUS
M_LLD = _AspirateMode.MENISCUS_LLD
# fmt: off
ASPIRATE_MODE_BY_WELL: Dict[int, Dict[str, List[_AspirateMode]]] = {
    1: {
        "A": [M_LLD],
    },
    6: {
        "A": [M_LLD, M_LLD, M_LLD],
        "B": [M, M, M],
    },
    12: {
        "A": [M_LLD, M, M_LLD, M, M_LLD, M, M_LLD, M, M_LLD, M, M_LLD, M],
    },
    15: {
        "A": [M_LLD, M, M_LLD, M, M_LLD],
        "B": [M, M_LLD, M, M_LLD, M],
        "C": [M_LLD, M, M_LLD, M, M_LLD],
    },
    24: {
        "A": [M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD],
        "B": [M, M, M, M, M, M],
        "C": [M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD],
        "D": [M, M, M, M, M, M],
    },
    96: {
        "A": [M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD],
        "B": [M, M, M, M, M, M, M, M, M, M, M, M],
        "C": [M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD],
        "D": [M, M, M, M, M, M, M, M, M, M, M, M],
        "E": [M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD],
        "F": [M, M, M, M, M, M, M, M, M, M, M, M],
        "G": [M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD, M_LLD],
        "H": [M, M, M, M, M, M, M, M, M, M, M, M],
    },
}
# fmt: on


def _get_aspirate_mode_for_well(well: Well) -> _AspirateMode:
    num_wells = len(well.parent.wells())
    well_row = well.well_name[0]
    well_column = int(well.well_name[1:]) - 1  # zero indexed
    return ASPIRATE_MODE_BY_WELL[num_wells][well_row][well_column]


@dataclass
class _TestTrial:
    mode: _AspirateMode
    test_well: Well
    ul_to_add: float
    ul_to_remove: float
    submerge_mm: float
    destination_count: int
    dispense_ul: float

    @classmethod
    def build(
        cls,
        ctx: ProtocolContext,
        pipette: InstrumentContext,
        labware: Labware,
        well_name: str,
    ) -> "_TestTrial":
        """Build."""
        p = ctx.params
        well = labware[well_name]
        mode = _get_aspirate_mode_for_well(well)
        sub_mm_by_mode: Dict[_AspirateMode, float] = {
            M: p.submerge_no_lld,  # type: ignore[attr-defined]
            M_LLD: p.submerge_yes_lld,  # type: ignore[attr-defined]
        }
        clearance: float = p.tip_clearance_at_well_bottom  # type: ignore[attr-defined]
        minimum_liquid_height = abs(sub_mm_by_mode[mode]) + clearance

        # NOTE: error will raise if "tip_clearance_at_well_bottom"
        #       is less than the minimum LLD height of the pipette + tip
        min_vol = _binary_search_liquid_volume_at_height(well, minimum_liquid_height)
        max_vol = _binary_search_liquid_volume_at_height(
            well, well.depth + p.liquid_clearance_at_well_top  # type: ignore[attr-defined]
        )

        # always try to aspirate 1000ul (b/c it creates largest Z travel)
        ul_to_remove = min(max_vol - min_vol, pipette.max_volume)
        ul_to_add = min_vol + ul_to_remove

        # split aspirate ul into 1-4x dispenses
        destination_count: int = int(ceil(ul_to_remove / SHAKER_MAX_UL))
        assert destination_count in [1, 4], (
            f"unable to support multi-dispense (aka: distribute) "
            f"with {destination_count}x dispenses"
        )
        dispense_ul: float = ul_to_remove / destination_count

        return _TestTrial(
            mode=mode,
            test_well=well,
            ul_to_add=ul_to_add,
            ul_to_remove=ul_to_remove,
            submerge_mm=sub_mm_by_mode[mode],
            dispense_ul=dispense_ul,
            destination_count=destination_count,
        )

    def run(
        self,
        ctx: ProtocolContext,
        pipette: InstrumentContext,
        src: Well,
        dst_wells: List[Well],
        add_liquid_class: LiquidClass,
        remove_liquid_class: LiquidClass,
    ) -> None:
        """Run."""
        if not pipette.has_tip:
            _pick_up_tip_and_zero_min_height(ctx, pipette)
        pipette.transfer_liquid(
            add_liquid_class,
            volume=self.ul_to_add,
            source=src,
            dest=self.test_well,
            new_tip="never",
        )
        pipette.drop_tip()
        # REMOVE DYE FROM TEST-LABWARE
        _pick_up_tip_and_zero_min_height(ctx, pipette)
        # NOTE: (sigler) calibrating THIS tip, because the
        #       position is critical to determine if our submerge
        #       depths are reliable or not
        calibrate_tip_overlap(ctx, pipette)
        # NOTE: don't LLD during simulation, so we can rely on load-liquid
        #       to track when wells have ran out of volume (or over-flowed)
        if self.mode == _AspirateMode.MENISCUS_LLD and not ctx.is_simulating():
            pipette.require_liquid_presence(self.test_well)
        # MULTI-DISPENSE TO PLATE
        pipette.distribute_liquid(
            remove_liquid_class,
            volume=self.ul_to_remove / len(dst_wells),
            source=self.test_well,
            dest=dst_wells,
            new_tip="never",
        )
        pipette.drop_tip()


def calibrate_tip_overlap(ctx: ProtocolContext, pipette: InstrumentContext) -> None:
    """Calibrate the currently attached tip's overlap with the pipette nozzle.

    This method will run a pressure (LLD) probe onto the calibration square
    of the "empty" deck slot.

    And "artificial_error" can be added to the overlap, allowing operator
    to simulate different tip-overlaps that could happen in the field.
    """
    if ctx.is_simulating():
        return
    api: SyncHardwareAPI = ctx._core.get_hardware()
    pip_mount = OT3Mount.LEFT if pipette.mount == "left" else OT3Mount.RIGHT
    empty_slot_row_idx = "DCBA".index(SLOTS["empty"][0])
    empty_slot_as_int = (empty_slot_row_idx * 3) + int(SLOTS["empty"][1:])
    expected_probe_position = Point(
        *get_calibration_square_position_in_slot(slot=empty_slot_as_int)
    )
    expected_probe_position += expected_probe_position + Point(
        x=Z_PREP_OFFSET.x, y=Z_PREP_OFFSET.y, z=Z_PREP_OFFSET.z
    )

    # RETRACT and move to above the deck slot
    api.retract(pip_mount)
    current_pos = api.gantry_position(pip_mount)
    api.move_to(
        pip_mount,
        Point(
            x=expected_probe_position.x, y=expected_probe_position.y, z=current_pos.z
        ),
    )
    api.move_to(
        pip_mount,
        expected_probe_position + Point(z=PROBE_START_HEIGHT_ABOVE_EXPECTED_MM),
    )

    # PROBE
    probed_deck_z = api.liquid_probe(
        pip_mount,
        PROBE_START_HEIGHT_ABOVE_EXPECTED_MM + PROBE_OVERSHOOT_BELOW_EXPECTED_MM,
    )
    api.retract(pip_mount)

    # MODIFY current tip length
    old_tip_length = api.hardware_pipettes[pip_mount.to_mount()].current_tip_length
    tip_overlap_error_mm = probed_deck_z - expected_probe_position.z
    # NOTE: (sigler) the artificial error is subtracted from the tip "length"
    #       because a more positive (+) overlap would create a shorter tip
    artificial_tip_length_error = ctx.params.overlap_error * -1.0  # type: ignore[attr-defined]
    new_tip_length = old_tip_length + tip_overlap_error_mm + artificial_tip_length_error
    api.remove_tip(pip_mount)
    api.add_tip(pip_mount, tip_length=new_tip_length)


def _binary_search_liquid_volume_at_height(
    well: Well, height: float, tolerance_mm: float = 0.1, max_iterations: int = 100
) -> float:
    """Binary search to find a close-enough volume for a given height."""
    # FIXME: (sigler) replace with public API method,
    #        something like "Well.estimate_liquid_volume_at_height(mm_from_bottom: float)"
    min_vol = 0.0
    max_vol = well.max_volume
    best_value = 0.0
    best_diff = float("inf")
    for _ in range(max_iterations):
        mid_vol = (min_vol + max_vol) / 2.0
        mid_vol_height = well.estimate_liquid_height_after_pipetting(mid_vol)
        diff_mm = abs(cast(float, mid_vol_height - height))
        if diff_mm < best_diff:
            best_diff = diff_mm
            best_value = mid_vol
        if diff_mm < tolerance_mm:
            break
        if mid_vol_height < height:
            min_vol = mid_vol  # Search in the upper half
        else:
            max_vol = mid_vol  # Search in the lower half
    return best_value


def _pick_up_tip_and_zero_min_height(
    ctx: ProtocolContext, pipette: InstrumentContext
) -> None:
    pipette.pick_up_tip()
    if ctx.params.disable_minimum_lld_height:  # type: ignore[attr-defined]
        pipette_id = pipette._core.pipette_id  # type: ignore[attr-defined]
        if (
            pipette._core._engine_client.state.pipettes.get_config(  # type: ignore[attr-defined]
                pipette_id
            ).lld_settings
            is not None
        ):
            # NOTE: (sigler) Purposefully setting minimum LLD height to 0.0 mm, so we
            #       can test as near the bottoms of the wells as possible, to help determine
            #       how much "factor of safety" our recommendations/defaults have.
            pipette._core._engine_client.state.pipettes.get_config(  # type: ignore[attr-defined]
                pipette_id
            ).lld_settings[
                f"t{TIP_VOLUME}"
            ][
                "minHeight"
            ] = 0.0
            assert pipette.get_minimum_liquid_sense_height() == 0.0


def _shake_then_read(
    ctx: ProtocolContext,
    plate: Labware,
    shaker: HeaterShakerContext,
    reader: AbsorbanceReaderContext,
    just_read: bool = False,
) -> None:
    if not just_read:
        shaker.close_labware_latch()
        shaker.set_and_wait_for_shake_speed(SHAKER_RPM_250ul)
        ctx.delay(seconds=SHAKER_SECONDS)
        shaker.deactivate_shaker()
    shaker.open_labware_latch()
    reader.open_lid()
    ctx.move_labware(plate, new_location=reader, use_gripper=True)
    reader.close_lid()
    reader.read(
        export_filename=f"{ctx.params.test_labware}_{plate}"  # type: ignore[attr-defined]
        f"{datetime.now().strftime('%Y-%m-%d_%H:%M:%S')}"
    )
    reader.open_lid()


def add_parameters(parameters: ParameterContext) -> None:
    """Add parameters."""
    parameters.add_bool(
        display_name="disable_minimum_lld_height",
        variable_name="disable_minimum_lld_height",
        default=True,
    )
    parameters.add_float(
        variable_name="overlap_error",
        display_name="overlap_error",
        default=0.0,
        maximum=2.0,
        minimum=-2.0,
    )
    parameters.add_int(
        display_name="channels",
        variable_name="channels",
        default=min(list(LOAD_NAME_SRC_LABWARE_BY_CHANNELS.keys())),
        choices=[
            {"display_name": str(ch), "value": ch}
            for ch in LOAD_NAME_SRC_LABWARE_BY_CHANNELS.keys()
        ],
    )
    parameters.add_str(
        display_name="reservoir",
        variable_name="reservoir",
        default=list(LOAD_NAME_SRC_RESERVOIRS.keys())[0],
        choices=[
            {"display_name": load_name, "value": load_name}
            for load_name in LOAD_NAME_SRC_RESERVOIRS.keys()
        ],
    )
    parameters.add_str(
        display_name="test_labware",
        variable_name="test_labware",
        default=LOAD_NAME_SRC_LABWARE_BY_CHANNELS[1]["PLATE_2ML_DEEP"],
        choices=[
            {"display_name": label, "value": load_name}
            for info in LOAD_NAME_SRC_LABWARE_BY_CHANNELS.values()
            for label, load_name in info.items()
        ],
    )
    parameters.add_str(
        display_name="mount",
        variable_name="mount",
        default="left",
        choices=[{"display_name": m, "value": m} for m in ["left", "right"]],
    )
    parameters.add_float(
        display_name="submerge_no_lld",
        variable_name="submerge_no_lld",
        default=-1.5,
        minimum=-10.0,
        maximum=0.0,
    )
    parameters.add_float(
        display_name="submerge_yes_lld",
        variable_name="submerge_yes_lld",
        default=-1.5,
        minimum=-10.0,
        maximum=0.0,
    )
    # factor of safety (defined in mm) to guarantee that the tip will not either:
    #   a) submerge BELOW the minimum LLD height of that pipette + tip combination
    #   b) collide with the well's bottom (if minimum LLD height is 0.0)
    parameters.add_float(
        display_name="tip_clearance_at_well_bottom",
        variable_name="tip_clearance_at_well_bottom",
        default=1.0,
        minimum=0.1,  # NOTE: minimum seems to be >=0.05 to pass simulation
        maximum=100.0,
    )
    # NOTE: (sigler) this represents the deformation
    #       observed at the top ~1mm of the PCR well. We assume all labware have
    #       a similar thing going on, so let's stay away (eg: 2mm) from the top.
    parameters.add_float(
        display_name="liquid_clearance_at_well_top",
        variable_name="liquid_clearance_at_well_top",
        default=-2.0,
        minimum=-100.0,
        maximum=0.0,
    )
    parameters.add_int(
        display_name="wavelength",
        variable_name="wavelength",
        default=450,
        choices=[
            {"display_name": "450", "value": 450},
            {"display_name": "562", "value": 562},
            {"display_name": "600", "value": 600},
            {"display_name": "650", "value": 650},
        ],
    )


def _define_liquid_class(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    aspirate_submerge_mm: float,
    multi_touch_tip: bool,
) -> LiquidClass:
    _cls = ctx.define_liquid_class("water")
    _props = _cls.get_for(pipette, pipette.tip_racks[0])
    offset_z_by_action = {
        "aspirate": aspirate_submerge_mm,
        "dispense": DISPENSE_MM_FROM_MENISCUS,
        "multi_dispense": DISPENSE_MM_FROM_MENISCUS,
    }
    for attr, offset_z in offset_z_by_action.items():
        getattr(_props, attr).position_reference = "liquid-meniscus"
        getattr(_props, attr).offset.z = offset_z
    if multi_touch_tip:
        _retract = _props.multi_dispense.retract  # type: ignore[union-attr]
        _retract.touch_tip.enabled = True  # type: ignore[union-attr]
        _retract.touch_tip.speed = 30.0  # type: ignore[union-attr]
        _retract.touch_tip.z_offset = -1.0  # type: ignore[union-attr]
    return _cls


def run(ctx: ProtocolContext) -> None:
    """Run."""
    # LOAD MODULES
    reader_module = cast(
        AbsorbanceReaderContext, ctx.load_module("absorbanceReaderV1", SLOTS["reader"])
    )
    shaker_module = cast(
        HeaterShakerContext, ctx.load_module("heaterShakerModuleV1", SLOTS["shaker"])
    )
    shaker_adapter = shaker_module.load_adapter("opentrons_universal_flat_adapter")

    # SETUP MODULES
    shaker_module.close_labware_latch()
    shaker_module.deactivate_heater()
    shaker_module.deactivate_shaker()
    reader_module.close_lid()
    reader_module.initialize(
        mode="single", wavelengths=[ctx.params.wavelength]  # type: ignore[attr-defined]
    )

    # LOAD PIPETTES
    num_tip_slots = len([s for s in SLOTS.keys() if "tip" in s])
    rack_ln = "opentrons_flex_96_tiprack_1000ul"
    rack_slots = [SLOTS[f"tips_{i + 1}"] for i in range(num_tip_slots)]
    if ctx.params.channels == 96:
        adapter_ln = "opentrons_flex_96_tiprack_adapter"
        tip_racks = [
            ctx.load_adapter(adapter_ln, slot).load_labware(rack_ln)
            for slot in rack_slots
        ]
    else:
        tip_racks = [ctx.load_labware(rack_ln, slot) for slot in rack_slots]
    pipette = ctx.load_instrument(
        instrument_name=f"flex_{ctx.params.channels}"  # type: ignore[attr-defined]
        f"channel_{TIP_VOLUME}",
        mount=ctx.params.mount,  # type: ignore[attr-defined]
        tip_racks=tip_racks,
    )

    # LOAD LABWARE
    ctx.load_trash_bin(SLOTS["trash"])
    src_reservoir = ctx.load_labware(
        ctx.params.reservoir,  # type: ignore[attr-defined]
        SLOTS["src_reservoir"],
        label="dye_reservoir",
    )
    water_reservoir = ctx.load_labware(
        "nest_1_reservoir_195ml", SLOTS["water_reservoir"], label="water_reservoir"
    )
    test_labware = ctx.load_labware(
        ctx.params.test_labware,  # type: ignore[attr-defined]
        SLOTS["test_labware"],
        label="test_labware",
    )
    channels: int = ctx.params.channels  # type: ignore[attr-defined]
    possible_lws = list(LOAD_NAME_SRC_LABWARE_BY_CHANNELS[channels].values())
    err_msg = f"{ctx.params.test_labware} and {channels}ch"  # type: ignore[attr-defined]
    assert ctx.params.test_labware in possible_lws, err_msg  # type: ignore[attr-defined]

    # FIXME: get rid of this "air" liquid once the bug is fixed
    #        where we're not able to estimate-height if well is empty
    air = ctx.define_liquid(name="air", display_color="#FFFFFF")
    test_labware.load_liquid(test_labware.wells(), 0.01, air)  # FIXME

    # PLATE STACK
    stack: List[Labware] = [
        ctx.load_labware(DST_LABWARE, location=SLOTS["stack"], label="plate_water")
    ]
    dispenses_per_aspirate = ceil(pipette.max_volume / SHAKER_MAX_UL)
    total_dst_wells = len(test_labware.wells()) * dispenses_per_aspirate
    total_dst_plates = ceil(total_dst_wells / 96)
    for _ in range(total_dst_plates):
        plate = stack[-1].load_labware(DST_LABWARE, label=f"plate_{len(stack)}")
        stack.append(plate)
    for plate in stack:
        plate.load_liquid(plate.wells(), 0.01, air)  # FIXME

    # TRIALS -> DESTINATION-WELLS
    trials_and_dst_wells: List[Tuple[_TestTrial, List[Well]]] = []
    # NOTE: reversing plates and skipping water plate (bottom)
    remaining_dst_wells = [w for p in stack[-1:0:-1] for w in p.wells()]
    for test_well in test_labware.wells():
        trial = _TestTrial.build(ctx, pipette, test_labware, test_well.well_name)
        dst_wells = [
            remaining_dst_wells.pop(0) for _ in range(trial.destination_count)  # pop!
        ]
        assert (
            len(set([w.parent for w in dst_wells])) == 1
        ), "destination wells must be in same plate"
        trials_and_dst_wells.append((trial, dst_wells))
    unique_dispense_uls = set([t.dispense_ul for t, _ in trials_and_dst_wells])
    assert len(unique_dispense_uls) == 1, (
        f"Every dispense in photo plate must be of identical volume "
        f"(found {unique_dispense_uls})"
    )
    shared_dispense_ul = unique_dispense_uls.pop()

    # LOAD LIQUID
    water_cls = _define_liquid_class(ctx, pipette, -1.5, False)
    cls_by_mode = {
        M: _define_liquid_class(
            ctx, pipette, ctx.params.submerge_no_lld, True  # type: ignore[attr-defined]
        ),
        M_LLD: _define_liquid_class(
            ctx, pipette, ctx.params.submerge_yes_lld, True  # type: ignore[attr-defined]
        ),
    }
    red_dye = ctx.define_liquid(name="red-dye", display_color="#FF0000")
    water = ctx.define_liquid(name="water", display_color="#aaaaFF")
    dye_src_well = src_reservoir["A1"]
    water_src_well = water_reservoir["A1"]
    dead_vol_for_reservoir = LOAD_NAME_SRC_RESERVOIRS[
        ctx.params.reservoir  # type: ignore[attr-defined]
    ]
    dead_vol_for_water = LOAD_NAME_SRC_RESERVOIRS[water_reservoir.load_name]
    total_dye_transferred = sum([t.ul_to_add for t, _ in trials_and_dst_wells])
    min_dye_by_src = {
        dye_src_well: (red_dye, dead_vol_for_reservoir + total_dye_transferred),
        water_src_well: (water, shared_dispense_ul * 96 + dead_vol_for_water),
    }
    for src, (liq, ul) in min_dye_by_src.items():
        src.load_liquid(liq, ul)
        _pick_up_tip_and_zero_min_height(ctx, pipette)
        # NOTE: don't LLD during simulation, so we can rely on load-liquid
        #       to track when wells have ran out of volume (or over-flowed)
        if not ctx.is_simulating():
            pipette.require_liquid_presence(src)
        pipette.drop_tip()
        ul = cast(float, src.current_liquid_volume())
        assert (
            ul >= ul
        ), f"must have >= {int(ul)} uL in {src.parent} (detected {int(ul)} uL)"

    # RUN
    done_stack: List[Labware] = []
    # NOTE: reversing plates and skipping water
    for top_most_plate, next_plate in zip(stack[-1:0:-1], stack[-2::-1]):

        # MOVE TOP PLATE from STACK to DECK-SLOT
        shaker_module.open_labware_latch()
        ctx.move_labware(top_most_plate, new_location=shaker_adapter, use_gripper=True)
        shaker_module.close_labware_latch()

        # RUN TRIALS
        for trial, dst_wells in trials_and_dst_wells:
            if dst_wells[0] in top_most_plate.wells():
                trial.run(
                    ctx,
                    pipette,
                    dye_src_well,
                    dst_wells,
                    water_cls,
                    cls_by_mode[trial.mode],
                )

        # SHAKE, READ, and RE-STACK
        _shake_then_read(ctx, top_most_plate, shaker_module, reader_module)
        new_location = done_stack[-1] if done_stack else SLOTS["stack_end"]
        ctx.move_labware(
            top_most_plate, new_location=new_location, use_gripper=True  # type: ignore[arg-type]
        )
        done_stack.append(top_most_plate)

    # some helpful info for when developing or preparing dye
    full_well_count = sum(
        [
            1
            for p in done_stack
            for w in p.wells()
            if cast(float, w.current_liquid_volume()) > 0
        ]
    )
    total_plates = round(full_well_count / 96, 2)
    # assert total_dst_plates == total_plates, f"{total_plates} != {total_dst_plates}"
    ctx.comment(
        f"after testing {test_labware.load_name} with {shared_dispense_ul} ul, "
        f"all {full_well_count}x wells ({total_plates}x plates) "
        f"hold {shared_dispense_ul} ul"
    )

    # TRANSFER WATER
    water_plate = stack[0]
    water_wells = water_plate.wells()
    ctx.move_labware(water_plate, shaker_adapter, use_gripper=True)
    shaker_module.close_labware_latch()
    _pick_up_tip_and_zero_min_height(ctx, pipette)
    num_dispenses = 1 if test_labware["A1"].max_volume < 500 else 4
    for i in range(0, len(water_wells), num_dispenses):
        pipette.distribute_liquid(
            water_cls,
            volume=shared_dispense_ul,
            source=water_src_well,
            dest=[water_wells[i + n] for n in range(num_dispenses)],
            new_tip="never",
        )
    pipette.drop_tip()
    _shake_then_read(ctx, water_plate, shaker_module, reader_module, just_read=True)
    ctx.move_labware(water_plate, new_location=done_stack[-1], use_gripper=True)
