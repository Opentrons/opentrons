"""Pipette motions."""
from math import pi
from dataclasses import dataclass
from typing import Optional, Callable, Tuple

from opentrons.config.defaults_ot3 import (
    DEFAULT_ACCELERATIONS,
    DEFAULT_MAX_SPEED_DISCONTINUITY,
)
from opentrons.protocol_api import InstrumentContext, ProtocolContext
from opentrons.protocol_api.labware import Well

from hardware_testing.opentrons_api.types import OT3AxisKind
from hardware_testing.gravimetric import config
from hardware_testing.gravimetric.liquid_height.height import LiquidTracker
from hardware_testing.opentrons_api.types import OT3Mount, Point

from .definition import LiquidClassSettings
from .defaults import get_liquid_class


@dataclass
class LiquidSurfaceHeights:
    """Liquid Surface Heights."""

    above: float
    below: float


@dataclass
class PipettingHeights:
    """Pipetting heights."""

    start: LiquidSurfaceHeights
    end: LiquidSurfaceHeights


def _get_heights_in_well(
    height_before: float,
    height_after: float,
    submerge: float,
    retract: float,
) -> Tuple[float, float, float]:
    pipetting_heights = PipettingHeights(
        start=LiquidSurfaceHeights(
            above=max(height_before + retract, config.LABWARE_BOTTOM_CLEARANCE),
            below=max(height_before - submerge, config.LABWARE_BOTTOM_CLEARANCE),
        ),
        end=LiquidSurfaceHeights(
            above=max(height_after + retract, config.LABWARE_BOTTOM_CLEARANCE),
            below=max(height_after - submerge, config.LABWARE_BOTTOM_CLEARANCE),
        ),
    )
    approach = max(pipetting_heights.start.above, pipetting_heights.end.below)
    submerge = pipetting_heights.end.below
    retract = pipetting_heights.end.above
    return approach, submerge, retract


@dataclass
class PipettingCallbacks:
    """Pipetting callbacks."""

    on_submerging: Callable
    on_mixing: Callable
    on_aspirating: Callable
    on_dispensing: Callable
    on_retracting: Callable
    on_blowing_out: Callable
    on_exiting: Callable


def _check_aspirate_dispense_args(
    aspirate: Optional[float], dispense: Optional[float]
) -> None:
    if aspirate is None and dispense is None:
        raise ValueError("either a aspirate or dispense volume must be set")
    if aspirate and dispense:
        raise ValueError("both aspirate and dispense volumes cannot be set together")


def _get_approach_submerge_retract_heights(
    well: Well,
    liquid_tracker: LiquidTracker,
    liquid_class: LiquidClassSettings,
    aspirate: Optional[float],
    dispense: Optional[float],
    blank: bool,
    channel_count: int,
) -> Tuple[float, float, float]:
    liquid_before, liquid_after = liquid_tracker.get_before_and_after_heights(
        well,
        aspirate=aspirate,
        dispense=dispense,
        channels=channel_count,
    )
    if blank:
        # force the pipette to move above the well
        liquid_before = well.depth + (well.depth - liquid_before)
        liquid_after = well.depth + (well.depth - liquid_after)
    if aspirate:
        liq_submerge = liquid_class.aspirate.z_submerge_depth
        liq_retract = liquid_class.aspirate.z_retract_height
    else:
        liq_submerge = liquid_class.dispense.z_submerge_depth
        liq_retract = liquid_class.dispense.z_retract_height
    approach_mm, submerge_mm, retract_mm = _get_heights_in_well(
        liquid_before, liquid_after, liq_submerge, liq_retract
    )
    return approach_mm, submerge_mm, retract_mm


def _submerge(
    pipette: InstrumentContext,
    well: Well,
    height: float,
    channel_offset: Point,
    speed: float,
) -> None:
    pipette.move_to(
        well.bottom(height).move(channel_offset),
        speed=speed,
    )


def _retract(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    well: Well,
    channel_offset: Point,
    mm_above_well_bottom: float,
    speed: float,
    z_discontinuity: float,
) -> None:
    # change discontinuity per the liquid-class settings
    hw_api = ctx._core.get_hardware()
    if pipette.channels == 96:
        hw_api.config.motion_settings.max_speed_discontinuity.high_throughput[
            OT3AxisKind.Z
        ] = z_discontinuity
    else:
        hw_api.config.motion_settings.max_speed_discontinuity.low_throughput[
            OT3AxisKind.Z
        ] = z_discontinuity
    # NOTE: re-setting the gantry-load will reset the move-manager's per-axis constraints
    hw_api.set_gantry_load(hw_api.gantry_load)
    # retract out of the liquid (not out of the well
    pipette.move_to(well.top(mm_above_well_bottom).move(channel_offset), speed=speed)
    # reset discontinuity back to default
    if pipette.channels == 96:
        hw_api.config.motion_settings.max_speed_discontinuity.high_throughput[
            OT3AxisKind.Z
        ] = DEFAULT_MAX_SPEED_DISCONTINUITY.high_throughput[OT3AxisKind.Z]
    else:
        hw_api.config.motion_settings.max_speed_discontinuity.low_throughput[
            OT3AxisKind.Z
        ] = DEFAULT_MAX_SPEED_DISCONTINUITY.low_throughput[OT3AxisKind.Z]
    # NOTE: re-setting the gantry-load will reset the move-manager's per-axis constraints
    hw_api.set_gantry_load(hw_api.gantry_load)


def _change_plunger_acceleration(
    ctx: ProtocolContext, pipette: InstrumentContext, ul_per_sec_per_sec: float
) -> None:
    hw_api = ctx._core.get_hardware()
    # NOTE: set plunger accelerations by converting ul/sec/sec to mm/sec/sec,
    #       making sure to use the nominal ul/mm to convert so that the
    #       mm/sec/sec we move is constant regardless of changes to the function
    if "p50" in pipette.name:
        shaft_diameter_mm = 1.0
    else:
        shaft_diameter_mm = 4.5
    nominal_ul_per_mm = pi * pow(shaft_diameter_mm * 0.5, 2)
    p_accel = ul_per_sec_per_sec / nominal_ul_per_mm
    if pipette.channels == 96:
        hw_api.config.motion_settings.acceleration.high_throughput[
            OT3AxisKind.P
        ] = p_accel
    else:
        hw_api.config.motion_settings.acceleration.low_throughput[
            OT3AxisKind.P
        ] = p_accel
    # NOTE: re-setting the gantry-load will reset the move-manager's per-axis constraints
    hw_api.set_gantry_load(hw_api.gantry_load)


def _reset_plunger_acceleration(
    ctx: ProtocolContext, pipette: InstrumentContext
) -> None:
    hw_api = ctx._core.get_hardware()
    if pipette.channels == 96:
        p_accel = DEFAULT_ACCELERATIONS.high_throughput[OT3AxisKind.P]
        hw_api.config.motion_settings.acceleration.high_throughput[
            OT3AxisKind.P
        ] = p_accel
    else:
        p_accel = DEFAULT_ACCELERATIONS.low_throughput[OT3AxisKind.P]
        hw_api.config.motion_settings.acceleration.low_throughput[
            OT3AxisKind.P
        ] = p_accel
    # NOTE: re-setting the gantry-load will reset the move-manager's per-axis constraints
    hw_api.set_gantry_load(hw_api.gantry_load)


def _pipette_with_liquid_settings(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    liquid_class: LiquidClassSettings,
    well: Well,
    channel_offset: Point,
    channel_count: int,
    liquid_tracker: LiquidTracker,
    callbacks: PipettingCallbacks,
    aspirate: Optional[float] = None,
    dispense: Optional[float] = None,
    blank: bool = True,
    inspect: bool = False,
    mix: bool = False,
    added_blow_out: bool = True,
    touch_tip: bool = False,
) -> None:
    """Run a pipette given some Pipetting Liquid Settings."""
    # FIXME: stop using hwapi, and get those functions into core software
    hw_api = ctx._core.get_hardware()
    hw_mount = OT3Mount.LEFT if pipette.mount == "left" else OT3Mount.RIGHT
    _check_aspirate_dispense_args(aspirate, dispense)

    def _dispense_with_added_blow_out() -> None:
        # dispense all liquid, plus some air by calling `pipette.blow_out(location, volume)`
        # FIXME: this is a hack, until there's an equivalent `pipette.blow_out(location, volume)`
        hw_api.blow_out(hw_mount, liquid_class.dispense.leading_air_gap)

    # ASPIRATE/DISPENSE SEQUENCE HAS THREE PHASES:
    #  1. APPROACH
    #  2. SUBMERGE
    #  3. RETRACT

    # CALCULATE TIP HEIGHTS FOR EACH PHASE
    approach_mm, submerge_mm, retract_mm = _get_approach_submerge_retract_heights(
        well,
        liquid_tracker,
        liquid_class,
        aspirate,
        dispense,
        blank,
        channel_count,
    )

    # SET Z SPEEDS DURING SUBMERGE/RETRACT
    if aspirate:
        submerge_speed = config.TIP_SPEED_WHILE_SUBMERGING_ASPIRATE
        retract_speed = config.TIP_SPEED_WHILE_RETRACTING_ASPIRATE
    else:
        submerge_speed = config.TIP_SPEED_WHILE_SUBMERGING_DISPENSE
        retract_speed = config.TIP_SPEED_WHILE_RETRACTING_DISPENSE

    # CREATE CALLBACKS FOR EACH PHASE
    def _aspirate_on_approach() -> None:
        pass

    def _aspirate_on_submerge() -> None:
        # TODO: re-implement mixing once we have a real use for it
        #       and once the rest of the script settles down
        if mix:
            raise NotImplementedError("mixing is not currently implemented")
        # aspirate specified volume
        callbacks.on_aspirating()
        pipette.aspirate(aspirate)
        # update liquid-height tracker
        liquid_tracker.update_affected_wells(
            well, aspirate=aspirate, channels=channel_count
        )
        # delay
        ctx.delay(liquid_class.aspirate.delay)

    def _aspirate_on_retract() -> None:
        # add trailing-air-gap
        pipette.aspirate(liquid_class.aspirate.trailing_air_gap)

    def _dispense_on_approach() -> None:
        # remove trailing-air-gap
        pipette.dispense(liquid_class.aspirate.trailing_air_gap)

    def _dispense_on_submerge() -> None:
        callbacks.on_dispensing()
        if added_blow_out:
            _dispense_with_added_blow_out()
        else:
            pipette.dispense(dispense)
        # update liquid-height tracker
        liquid_tracker.update_affected_wells(
            well, dispense=dispense, channels=channel_count
        )
        # delay
        ctx.delay(liquid_class.dispense.delay)

    def _dispense_on_retract() -> None:
        if pipette.current_volume <= 0 and added_blow_out:
            # blow-out any remaining air in pipette (any reason why not?)
            callbacks.on_blowing_out()
            # FIXME: using the HW-API to specify that we want to blow-out the full
            #        available blow-out volume
            # NOTE: calculated using blow-out distance (mm) and the nominal ul-per-mm
            max_blow_out_volume = 79.5 if pipette.max_volume >= 1000 else 3.9
            hw_api.blow_out(hw_mount, max_blow_out_volume)
            hw_api.prepare_for_aspirate(hw_mount)
        if touch_tip:
            pipette.touch_tip(speed=config.TOUCH_TIP_SPEED)
        # NOTE: always do a trailing-air-gap, regardless of if tip is empty or not
        #       to avoid droplets from forming and falling off the tip
        pipette.aspirate(liquid_class.aspirate.trailing_air_gap)

    # PHASE 1: APPROACH
    pipette.flow_rate.aspirate = liquid_class.aspirate.plunger_flow_rate
    pipette.flow_rate.dispense = liquid_class.dispense.plunger_flow_rate
    pipette.flow_rate.blow_out = liquid_class.dispense.plunger_flow_rate
    _change_plunger_acceleration(
        ctx, pipette, liquid_class.dispense.plunger_acceleration
    )
    pipette.move_to(well.bottom(approach_mm).move(channel_offset))
    _aspirate_on_approach() if aspirate else _dispense_on_approach()

    # PHASE 2: SUBMERGE
    callbacks.on_submerging()
    _submerge(pipette, well, submerge_mm, channel_offset, submerge_speed)
    _aspirate_on_submerge() if aspirate else _dispense_on_submerge()

    # PHASE 3: RETRACT
    callbacks.on_retracting()
    if aspirate:
        _z_disc = liquid_class.aspirate.z_retract_discontinuity
    else:
        _z_disc = liquid_class.dispense.z_retract_discontinuity
    _retract(ctx, pipette, well, channel_offset, retract_mm, retract_speed, _z_disc)
    _aspirate_on_retract() if aspirate else _dispense_on_retract()

    # EXIT
    callbacks.on_exiting()
    hw_api.retract(hw_mount)
    _reset_plunger_acceleration(ctx, pipette)


def aspirate_with_liquid_class(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tip_volume: int,
    aspirate_volume: float,
    well: Well,
    channel_offset: Point,
    channel_count: int,
    liquid_tracker: LiquidTracker,
    callbacks: PipettingCallbacks,
    blank: bool = False,
    inspect: bool = False,
    mix: bool = False,
    touch_tip: bool = False,
) -> None:
    """Aspirate with liquid class."""
    liquid_class = get_liquid_class(
        int(pipette.max_volume), pipette.channels, tip_volume, int(aspirate_volume)
    )
    _pipette_with_liquid_settings(
        ctx,
        pipette,
        liquid_class,
        well,
        channel_offset,
        channel_count,
        liquid_tracker,
        callbacks,
        aspirate=aspirate_volume,
        blank=blank,
        inspect=inspect,
        mix=mix,
        touch_tip=touch_tip,
    )


def dispense_with_liquid_class(
    ctx: ProtocolContext,
    pipette: InstrumentContext,
    tip_volume: int,
    dispense_volume: float,
    well: Well,
    channel_offset: Point,
    channel_count: int,
    liquid_tracker: LiquidTracker,
    callbacks: PipettingCallbacks,
    blank: bool = False,
    inspect: bool = False,
    mix: bool = False,
    added_blow_out: bool = True,
    touch_tip: bool = False,
) -> None:
    """Dispense with liquid class."""
    liquid_class = get_liquid_class(
        int(pipette.max_volume), pipette.channels, tip_volume, int(dispense_volume)
    )
    _pipette_with_liquid_settings(
        ctx,
        pipette,
        liquid_class,
        well,
        channel_offset,
        channel_count,
        liquid_tracker,
        callbacks,
        dispense=dispense_volume,
        blank=blank,
        inspect=inspect,
        mix=mix,
        added_blow_out=added_blow_out,
        touch_tip=touch_tip,
    )
