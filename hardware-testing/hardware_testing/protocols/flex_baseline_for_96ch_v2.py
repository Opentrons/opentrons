"""Flex: Baseline for 96ch."""
from math import pi
from typing import List, Optional, Dict, Tuple

from opentrons.protocol_api import (
    ProtocolContext,
    InstrumentContext,
    Labware,
    LiquidClass,
    Well,
)
from opentrons.protocol_api._liquid_properties import TransferProperties
from opentrons.protocol_api.core.engine import (
    transfer_components_executor as tx_comps_executor,
)
from opentrons_shared_data.liquid_classes.liquid_class_definition import (
    Coordinate,
    PositionReference,
)

##############################################
#                EDIT - START                #
##############################################

# FIXME: make these variables configurable through RUNTIME-VARIABLES

metadata = {"protocolName": "Flex: Baseline for 96ch v3"}
requirements = {"robotType": "Flex", "apiLevel": "2.26"}

RETURN_TIP = True
FILL_MULTIPLE_PLATES = False

LIQUID_NAME = "Baseline"
LIQUID_DESCRIPTION = "Artel MVS Baseline"
LIQUID_COLOR = "#00FF00"

TARGET_VOLUME = 200
TARGET_PUSH_OUT = 3.5
DISPENSE_FLOW_RATE = 22
BLOWOUT_FLOW_RATE = 22
SOURCE_WELL = "A1"
DESTINATION_WELL = "A1"
MIN_REQUIRED_BASELINE_UL = 41000

##############################################
#                 EDIT - END                 #
##############################################

SUBMERGE_MM = {
    "aspirate": 3.0,
    "dispense": 1.0,
}
RETRACT_MM = 1.5
MIN_MM_FROM_BOTTOM = 1.0

TOUCH_TIP_SPEED = 30
TOUCH_TIP_DEPTH = -1

DELAY_ASPIRATE = 1.0
DELAY_DISPENSE = 0.5
SAFE_MOVE_CLEARANCE_MM = 15.0
ASPIRATE_SUBMERGE_DEPTH_MM = 3.0
DISPENSE_SUBMERGE_DEPTH_MM = 1.0
ASPIRATE_SUBMERGE_SPEED = 50
DISPENSE_SUBMERGE_SPEED = 50
ASPIRATE_EXIT_SPEED = 50
DISPENSE_EXIT_SPEED = 50

MIN_VOL_SRC = {
    "nest_96_wellplate_2ml_deep": 500,
    "nest_12_reservoir_15ml": 3000,
    "nest_1_reservoir_195ml": 30000,
}
RESERVOIR_LENGTH_MM = 107.30
RESERVOIR_WIDTH_MM = 71.30
RESERVOIR_MAX_HEIGHT_MM = 26.85


class _LiquidHeightInFlatBottomWell:
    def __init__(
        self,
        bottom_diameter: float,
        top_diameter: float,
        height: float,
        resolution_mm: float = 0.1,
    ) -> None:
        self._bottom_radius = bottom_diameter / 2
        self._top_radius = top_diameter / 2
        self._height = height
        self._resolution_mm = resolution_mm

    def _volume_of_frustum(self, surface_height: float, surface_radius: float) -> float:
        """Calculate the volume of a frustum given its height and radii."""
        a = pi * self._bottom_radius * surface_radius
        b = pi * surface_radius**2
        c = pi * self._bottom_radius**2
        return (a + b + c) * (surface_height / 3)

    def height_from_volume(self, volume: float) -> float:
        """Given the volume, compute the height of the liquid in the well."""
        _rad_diff = self._top_radius - self._bottom_radius
        low, high = 0.0, self._height
        while high - low > self._resolution_mm:
            mid = (low + high) / 2
            r_mid = self._bottom_radius + (mid / self._height) * _rad_diff
            if self._volume_of_frustum(mid, r_mid) < volume:
                low = mid
            else:
                high = mid
        return (low + high) / 2

    def volume_from_height(self, height: float) -> float:
        """Given the height, compute the volume of the liquid in the well."""
        _rel_height = height / self._height
        _rad_diff = self._top_radius - self._bottom_radius
        surface_radius = self._bottom_radius + _rad_diff * _rel_height
        return self._volume_of_frustum(height, surface_radius)


LIQUID_HEIGHT_LOOKUP: Dict[str, List[Tuple[float, float]]] = {
    "nest_1_reservoir_195ml": [
        (0, 0.0),
        (20000, 1.71),
        (30000, 3.31),
        (40000, 4.61),
        (50000, 5.82),
        (60000, 7.31),
        (70000, 8.51),
        (80000, 9.82),
        (100000, 12.32),
        (120000, 15.11),
        (140000, 17.71),
        (160000, 20.32),
        (180000, 22.91),
        (195000, 25.0),
    ],
    "nest_12_reservoir_15ml": [
        (0, 0),
        (3000, 6.0),
        (3500, 7.0),
        (4000, 8.0),
        (5500, 10.5),
        (8000, 14.7),
        (10000, 18.0),
        (12600, 22.5),
        (15000, 26.85),  # full depth of well
    ],
}


def _convert_ul_in_well_to_height_in_well(load_name: str, ul: float) -> float:
    if load_name in LIQUID_HEIGHT_LOOKUP:
        lookup = LIQUID_HEIGHT_LOOKUP[load_name]
        for i in range(len(lookup) - 1):
            low = lookup[i]
            high = lookup[i + 1]
            if low[0] <= ul <= high[0]:
                ul_scale = (ul - low[0]) / (high[0] - low[0])
                return (ul_scale * (high[1] - low[1])) + low[1]
    elif load_name == "corning_96_wellplate_360ul_flat":
        well = _LiquidHeightInFlatBottomWell(
            bottom_diameter=6.35, top_diameter=6.858, height=10.668
        )
        return well.height_from_volume(ul)
    raise ValueError(f"unable to find height of {ul} ul in {load_name}")


def _start_volumes_per_trial(
    volume: float, load_name: str, channels: int, trials: int
) -> List[float]:
    ul_per_aspirate = volume * channels
    ul_per_run = ul_per_aspirate * trials
    ul_at_start = ul_per_run + MIN_VOL_SRC[load_name]
    return [ul_at_start - (ul_per_aspirate * i) for i in range(trials)]


def _end_volumes_per_trial(
    volume: float, load_name: str, channels: int, trials: int
) -> List[float]:
    return [
        ul - (volume * channels)
        for ul in _start_volumes_per_trial(volume, load_name, channels, trials)
    ]


def _ul_per_plate(volume: float, channels: int) -> float:
    return volume * channels


def _starting_source_volume(
    volume: float, load_name: str, channels: int, plates: int
) -> float:
    return _start_volumes_per_trial(volume, load_name, channels, plates)[0]


def _remaining_source_volume_after_plate(
    starting_volume_ul: float, volume: float, channels: int, plate_index: int
) -> float:
    return starting_volume_ul - (_ul_per_plate(volume, channels) * (plate_index + 1))


def _format_ml(volume_ul: float) -> str:
    return f"{volume_ul / 1000:.2f} mL"


def _convert_height_in_well_to_ul_in_well(load_name: str, height_mm: float) -> float:
    if load_name in LIQUID_HEIGHT_LOOKUP:
        lookup = LIQUID_HEIGHT_LOOKUP[load_name]
        for i in range(len(lookup) - 1):
            low = lookup[i]
            high = lookup[i + 1]
            if low[1] <= height_mm <= high[1]:
                height_scale = (height_mm - low[1]) / (high[1] - low[1])
                return (height_scale * (high[0] - low[0])) + low[0]
        if height_mm <= lookup[0][1]:
            return lookup[0][0]
        if height_mm >= lookup[-1][1]:
            return lookup[-1][0]
    raise ValueError(f"unable to find volume at {height_mm} mm in {load_name}")


def _probe_source_volume(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    probe_tips: Labware,
    reservoir: Labware,
    assumed_volume_ul: float,
) -> float:
    source_well = reservoir[SOURCE_WELL]
    if not pipette.has_tip:
        pipette.pick_up_tip(probe_tips.wells_by_name()["A1"])
    try:
        if not ctx.is_simulating():
            hwapi = ctx._core.get_hardware()
            pipette.move_to(
                source_well.top(z=SAFE_MOVE_CLEARANCE_MM),
                minimum_z_height=source_well.top().point.z + SAFE_MOVE_CLEARANCE_MM,
                publish=False,
            )
            pipette.move_to(source_well.top(), publish=False)
            probed_z = hwapi.liquid_probe(pipette._core.get_mount(), source_well.depth)
            liquid_height_mm = max(
                min(probed_z - source_well.bottom().point.z, source_well.depth),
                0.0,
            )
            if abs(liquid_height_mm - source_well.depth) < 0.01:
                measured_volume_ul = 0.0
            else:
                measured_volume_ul = _convert_height_in_well_to_ul_in_well(
                    reservoir.load_name, liquid_height_mm
                )
        else:
            measured_volume_ul = assumed_volume_ul
    finally:
        pipette._retract()

    if measured_volume_ul > 0:
        ctx.comment(
            f"Detected liquid in {source_well.display_name}. "
            f"Measured {_format_ml(measured_volume_ul)} from liquid probing."
        )
    else:
        ctx.comment(f"No liquid detected in {source_well.display_name}.")
    return measured_volume_ul


def _assign_starting_volumes(
    ctx: ProtocolContext,
    reservoir: Labware,
    starting_volume_ul: float,
) -> None:
    liquid = ctx.define_liquid(
        name=LIQUID_NAME,
        description=LIQUID_DESCRIPTION,
        display_color=LIQUID_COLOR,
    )
    reservoir[SOURCE_WELL].load_liquid(liquid, starting_volume_ul)


def _prime_destination_plate(ctx: ProtocolContext, plate: Labware) -> None:
    """Initialize destination liquid tracking so meniscus-based dispense is allowed."""
    liquid = ctx.define_liquid(
        name=LIQUID_NAME,
        description=LIQUID_DESCRIPTION,
        display_color=LIQUID_COLOR,
    )
    # Match universal_photometric.py by loading destination wells before
    # meniscus-referenced liquid-class dispense, even when the starting volume is 0.
    plate.load_liquid(plate.wells(), 1, liquid)


def _verify_source_volume(
    ctx: ProtocolContext,
    measured_volume_ul: float,
    minimum_required_volume_ul: float,
    plate_count: int,
) -> bool:
    if measured_volume_ul < minimum_required_volume_ul:
        ctx.pause(
            f"Detected liquid height is below the minimum needed to run {plate_count} plates. "
            f"Need at least {_format_ml(minimum_required_volume_ul)} of {LIQUID_NAME}, "
            f"but the measured volume from liquid-height probing was only {_format_ml(measured_volume_ul)}. "
            f"Refill reservoir {SOURCE_WELL} and resume."
        )
        return False
    return True


def _aspirate_with_liquid_class(
    pipette: InstrumentContext,
    volume: float,
    transfer_properties: TransferProperties,
    transfer_type: tx_comps_executor.TransferType,
    source: Well,
) -> List[tx_comps_executor.LiquidAndAirGapPair]:
    """Aspirate using the same liquid-class mechanism as universal_photometric.py."""
    return pipette._core.aspirate_liquid_class(  # type: ignore[attr-defined]
        volume=volume,
        source=(source.top(), source._core),
        transfer_properties=transfer_properties,
        transfer_type=transfer_type,
        tip_contents=[
            tx_comps_executor.LiquidAndAirGapPair(
                liquid=0,
                air_gap=0,
            )
        ],
        volume_for_pipette_mode_configuration=None,
    )


def _dispense_with_liquid_class(
    pipette: InstrumentContext,
    volume: float,
    transfer_properties: TransferProperties,
    transfer_type: tx_comps_executor.TransferType,
    dest: Well,
    contents: List[tx_comps_executor.LiquidAndAirGapPair],
) -> List[tx_comps_executor.LiquidAndAirGapPair]:
    """Dispense using the same liquid-class mechanism as universal_photometric.py."""
    return pipette._core.dispense_liquid_class(  # type: ignore[attr-defined]
        volume=volume,
        dest=(dest.top(), dest._core),
        source=None,
        transfer_properties=transfer_properties,
        transfer_type=transfer_type,
        tip_contents=contents,
        add_final_air_gap=True,
        trash_location=pipette.trash_container,
    )


def _get_transfer_settings(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tiprack: Labware,
    target_volume: float,
) -> LiquidClass:
    """Create liquid-class settings aligned with universal_photometric.py."""
    liquid_class = ctx.get_liquid_class("water")
    transfer_properties = liquid_class.get_for(pipette, tiprack)

    asp_offset = Coordinate(x=0, y=0, z=-1 * ASPIRATE_SUBMERGE_DEPTH_MM)
    disp_offset = Coordinate(x=0, y=0, z=-1 * DISPENSE_SUBMERGE_DEPTH_MM)

    transfer_properties.aspirate.submerge.start_position.offset = Coordinate(
        x=0, y=0, z=RETRACT_MM
    )
    transfer_properties.aspirate.aspirate_position.offset = asp_offset
    transfer_properties.aspirate.retract.end_position.offset = Coordinate(
        x=0, y=0, z=RETRACT_MM
    )
    transfer_properties.aspirate.aspirate_position.position_reference = (
        PositionReference.LIQUID_MENISCUS
    )

    transfer_properties.dispense.submerge.start_position.offset = Coordinate(
        x=0, y=0, z=RETRACT_MM
    )
    transfer_properties.dispense.dispense_position.offset = disp_offset
    transfer_properties.dispense.retract.end_position.offset = Coordinate(
        x=0, y=0, z=RETRACT_MM
    )
    transfer_properties.dispense.dispense_position.position_reference = (
        PositionReference.LIQUID_MENISCUS
    )

    transfer_properties.aspirate.flow_rate_by_volume.set_for_volume(
        target_volume, DISPENSE_FLOW_RATE
    )
    transfer_properties.aspirate.submerge.speed = ASPIRATE_SUBMERGE_SPEED
    transfer_properties.aspirate.retract.speed = ASPIRATE_EXIT_SPEED

    transfer_properties.dispense.push_out_by_volume.set_for_volume(
        target_volume, TARGET_PUSH_OUT
    )
    transfer_properties.dispense.flow_rate_by_volume.set_for_volume(
        target_volume, DISPENSE_FLOW_RATE
    )
    transfer_properties.dispense.retract.blowout.flow_rate = BLOWOUT_FLOW_RATE
    transfer_properties.dispense.submerge.speed = DISPENSE_SUBMERGE_SPEED
    transfer_properties.dispense.retract.speed = DISPENSE_EXIT_SPEED

    liquid_class.update_for(pipette, tiprack, transfer_properties)
    return liquid_class


def _transfer(
    ctx: ProtocolContext,
    volume: float,
    pipette: InstrumentContext,
    liquid_class: LiquidClass,
    tiprack: Labware,
    reservoir: Labware,
    plate: Labware,
    source: str,
    destinations: List[str],
    source_remaining_ul: float,
    push_out: Optional[float] = None,
    touch_tip: bool = False,
    volume_already_in_plate: float = 0,
) -> None:
    del source_remaining_ul
    transfer_type = tx_comps_executor.TransferType.ONE_TO_ONE
    for dst_name in destinations:
        pipette.move_to(
            reservoir[source].top(z=SAFE_MOVE_CLEARANCE_MM),
            minimum_z_height=reservoir[source].top().point.z + SAFE_MOVE_CLEARANCE_MM,
            publish=False,
        )
        if pipette.current_volume > 0:
            pipette.dispense(pipette.current_volume, reservoir[source].top())
        transfer_properties = liquid_class.get_for(pipette, tiprack)
        contents = _aspirate_with_liquid_class(
            pipette,
            volume,
            transfer_properties,
            transfer_type,
            reservoir[source],
        )
        ctx.delay(seconds=DELAY_ASPIRATE)
        volume_in_plate = volume + volume_already_in_plate
        dst_height = _convert_ul_in_well_to_height_in_well(plate.load_name, volume_in_plate)
        dispense_pos = plate[dst_name].bottom(
            max(dst_height - SUBMERGE_MM["dispense"], MIN_MM_FROM_BOTTOM)
        )
        blow_out_pos = plate[dst_name].bottom(
            max(dst_height + RETRACT_MM, MIN_MM_FROM_BOTTOM)
        )
        pipette.dispense(volume, dispense_pos)
        ctx.delay(seconds=DELAY_DISPENSE)
        pipette.blow_out(blow_out_pos)
        if touch_tip:
            pipette.touch_tip(speed=TOUCH_TIP_SPEED, v_offset=TOUCH_TIP_DEPTH)
        pipette.aspirate(1, blow_out_pos)  # trailing air-gap to avoid droplets


def run(ctx: ProtocolContext) -> None:
    """Run."""
    plate_count = 12 if FILL_MULTIPLE_PLATES else 1
    probe_tips = ctx.load_labware(
        "opentrons_flex_96_tiprack_200uL",
        "D1",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    run_tips = ctx.load_labware(
        "opentrons_flex_96_tiprack_200uL",
        "C1",
        adapter="opentrons_flex_96_tiprack_adapter",
    )
    reservoir = ctx.load_labware("nest_1_reservoir_195ml", "D2")
    plate = ctx.load_labware("corning_96_wellplate_360ul_flat", "D3")
    trash = ctx.load_trash_bin("A3")
    pipette = ctx.load_instrument("flex_96channel_200", "left", tip_racks=[run_tips])
    pipette.trash_container = trash
    recommended_starting_volume_ul = _starting_source_volume(
        TARGET_VOLUME,
        reservoir.load_name,
        pipette.channels,
        plate_count,
    )
    minimum_required_volume_ul = max(
        _ul_per_plate(TARGET_VOLUME, pipette.channels) * plate_count,
        MIN_REQUIRED_BASELINE_UL,
    )
    ctx.comment(
        "Liquid-height probe will be used first to measure the source volume. "
        "Recommended starting volume: "
        f"{_format_ml(recommended_starting_volume_ul)} of {LIQUID_NAME} in reservoir {SOURCE_WELL}. "
        f"Minimum required to run {plate_count} plates: {_format_ml(minimum_required_volume_ul)}."
    )
    ctx.pause(
        f"Add {_format_ml(recommended_starting_volume_ul)} of {LIQUID_NAME} to reservoir {SOURCE_WELL} "
        f"(minimum {_format_ml(minimum_required_volume_ul)} required), place a probe tiprack in B1, "
        "a run tiprack in D1, and place the first plate in C1. "
        "The protocol will probe liquid height first and then decide whether the liquid is sufficient."
    )
    while True:
        measured_starting_volume_ul = _probe_source_volume(
            ctx, pipette, probe_tips, reservoir, recommended_starting_volume_ul
        )
        if _verify_source_volume(
            ctx,
            measured_starting_volume_ul,
            minimum_required_volume_ul,
            plate_count,
        ):
            break
    if pipette.has_tip:
        pipette.drop_tip()
    _assign_starting_volumes(ctx, reservoir, measured_starting_volume_ul)
    _prime_destination_plate(ctx, plate)
    liquid_class = _get_transfer_settings(ctx, pipette, run_tips, TARGET_VOLUME)

    for i in range(plate_count):
        pipette.configure_for_volume(TARGET_VOLUME)
        pipette.pick_up_tip()
        source_remaining_ul = _remaining_source_volume_after_plate(
            measured_starting_volume_ul,
            TARGET_VOLUME,
            pipette.channels,
            i,
        )
        _transfer(
            ctx,
            TARGET_VOLUME,
            pipette,
            liquid_class,
            run_tips,
            reservoir,
            plate,
            SOURCE_WELL,
            [DESTINATION_WELL],
            source_remaining_ul=source_remaining_ul,
            push_out=TARGET_PUSH_OUT,
            touch_tip=True,
            volume_already_in_plate=0,
        )
        if RETURN_TIP:
            pipette.return_tip()
        else:
            pipette.drop_tip()
        if i < plate_count - 1:
            pipette.reset_tipracks()
            ctx.pause("Replace the used 96-tiprack in C1, add a new plate in D3, and resume.")
